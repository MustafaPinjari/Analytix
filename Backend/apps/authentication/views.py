from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.users.repositories.django_orm import DjangoUserRepository
from apps.authentication.services.use_cases import (
    RegisterUserUseCase,
    VerifyEmailUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
)
from apps.authentication.serializers import (
    RegisterSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    CustomTokenObtainPairSerializer,
)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            refresh_token = response.data.get("refresh")
            if refresh_token:
                response.set_cookie(
                    key="refresh_token",
                    value=refresh_token,
                    httponly=True,
                    samesite="Lax",
                    secure=False,
                    max_age=7 * 24 * 60 * 60,  # 7 days
                )
            try:
                from django.contrib.auth import get_user_model
                from apps.audit_logs.utils import log_activity
                User = get_user_model()
                user = User.objects.get(email=request.data.get("email"))
                request.user = user
                org_roles = user.org_roles.all()
                if org_roles.exists():
                    request.tenant = org_roles.first().organization
                log_activity(request, "USER_LOGIN", payload={"email": user.email})
            except Exception:
                pass
        return response


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_repo = DjangoUserRepository()
        use_case = RegisterUserUseCase(user_repo)
        
        result = use_case.execute(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
            first_name=serializer.validated_data["first_name"],
            last_name=serializer.validated_data["last_name"],
            org_name=serializer.validated_data["org_name"]
        )

        try:
            from apps.audit_logs.utils import log_activity
            request.user = result["user"]
            request.tenant = result["organization"]
            log_activity(request, "USER_REGISTER", payload={"email": result["user"].email, "org_name": serializer.validated_data["org_name"]})
        except Exception:
            pass

        return Response(
            {
                "success": True,
                "message": "User registered successfully. A verification email has been sent.",
                "data": {
                    "user_id": str(result["user"].id),
                    "org_id": str(result["organization"].id) if result["organization"] else None,
                    "verification_token": result["verification_token"]
                }
            },
            status=status.HTTP_201_CREATED
        )


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.query_params.get("token")
        if not token:
            return Response(
                {"success": False, "error": {"code": "MissingToken", "message": "Verification token is required.", "details": {}}},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_repo = DjangoUserRepository()
        use_case = VerifyEmailUseCase(user_repo)
        
        result = use_case.execute(token=token)
        try:
            from apps.audit_logs.utils import log_activity
            user = result.get("user")
            if user:
                request.user = user
                org_roles = user.org_roles.all()
                if org_roles.exists():
                    request.tenant = org_roles.first().organization
            log_activity(request, "USER_VERIFY_EMAIL")
        except Exception:
            pass
        return Response({"success": True, "message": result["message"]}, status=status.HTTP_200_OK)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_repo = DjangoUserRepository()
        use_case = ForgotPasswordUseCase(user_repo)
        
        result = use_case.execute(email=serializer.validated_data["email"])
        response_data = {"success": True, "message": result["message"]}
        if "reset_token" in result:
            response_data["reset_token"] = result["reset_token"]
            
        return Response(response_data, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_repo = DjangoUserRepository()
        use_case = ResetPasswordUseCase(user_repo)
        
        result = use_case.execute(
            token=serializer.validated_data["token"],
            new_password=serializer.validated_data["password"]
        )

        return Response({"success": True, "message": result["message"]}, status=status.HTTP_200_OK)


import urllib.parse
import requests
from django.conf import settings
from django.shortcuts import redirect
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from apps.organizations.models import Organization
from apps.users.models import UserOrganizationRole

User = get_user_model()

class SSOAuthorizeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        provider = request.query_params.get("provider", "google")
        redirect_uri = request.build_absolute_uri("/api/v1/auth/sso/callback/")
        state = provider

        if provider == "google":
            client_id = settings.GOOGLE_CLIENT_ID
            if not client_id:
                return redirect(f"/api/v1/auth/sso/callback/?code=mock_google_code&state=google")
            
            auth_url = "https://accounts.google.com/o/oauth2/v2/auth"
            params = {
                "client_id": client_id,
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": "openid email profile",
                "state": state,
            }
            url = f"{auth_url}?{urllib.parse.urlencode(params)}"
            return redirect(url)

        elif provider == "okta":
            client_id = settings.OKTA_CLIENT_ID
            if not client_id:
                return redirect(f"/api/v1/auth/sso/callback/?code=mock_okta_code&state=okta")
            
            auth_url = f"https://{settings.OKTA_DOMAIN}/oauth2/v1/authorize"
            params = {
                "client_id": client_id,
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": "openid email profile",
                "state": state,
            }
            url = f"{auth_url}?{urllib.parse.urlencode(params)}"
            return redirect(url)

        elif provider == "azure":
            client_id = settings.AZURE_CLIENT_ID
            if not client_id:
                return redirect(f"/api/v1/auth/sso/callback/?code=mock_azure_code&state=azure")
            
            auth_url = f"https://login.microsoftonline.com/{settings.AZURE_TENANT_ID}/oauth2/v2.0/authorize"
            params = {
                "client_id": client_id,
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": "openid email profile",
                "state": state,
            }
            url = f"{auth_url}?{urllib.parse.urlencode(params)}"
            return redirect(url)

        return Response({"error": "Unknown SSO provider"}, status=400)


class SSOCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.query_params.get("code")
        state = request.query_params.get("state")
        if not code:
            return redirect("http://localhost:5173/login?error=no_code")

        email = ""
        first_name = ""
        last_name = ""

        if code.startswith("mock_"):
            email = f"sso_{state}@enterprise.com"
            first_name = "SSO"
            last_name = state.capitalize()
        else:
            try:
                redirect_uri = request.build_absolute_uri("/api/v1/auth/sso/callback/")
                if state == "google":
                    token_res = requests.post("https://oauth2.googleapis.com/token", data={
                        "code": code,
                        "client_id": settings.GOOGLE_CLIENT_ID,
                        "client_secret": settings.GOOGLE_CLIENT_SECRET,
                        "redirect_uri": redirect_uri,
                        "grant_type": "authorization_code"
                    }, timeout=5)
                    tokens = token_res.json()
                    access_token = tokens.get("access_token")
                    
                    user_res = requests.get("https://openidconnect.googleapis.com/v1/userinfo", headers={
                        "Authorization": f"Bearer {access_token}"
                    }, timeout=5)
                    user_data = user_res.json()
                    email = user_data.get("email")
                    first_name = user_data.get("given_name", "")
                    last_name = user_data.get("family_name", "")

                elif state == "okta":
                    token_res = requests.post(f"https://{settings.OKTA_DOMAIN}/oauth2/v1/token", data={
                        "code": code,
                        "client_id": settings.OKTA_CLIENT_ID,
                        "client_secret": settings.OKTA_CLIENT_SECRET,
                        "redirect_uri": redirect_uri,
                        "grant_type": "authorization_code"
                    }, timeout=5)
                    tokens = token_res.json()
                    access_token = tokens.get("access_token")
                    
                    user_res = requests.get(f"https://{settings.OKTA_DOMAIN}/oauth2/v1/userinfo", headers={
                        "Authorization": f"Bearer {access_token}"
                    }, timeout=5)
                    user_data = user_res.json()
                    email = user_data.get("email")
                    first_name = user_data.get("given_name", "")
                    last_name = user_data.get("family_name", "")

                elif state == "azure":
                    token_res = requests.post(f"https://login.microsoftonline.com/{settings.AZURE_TENANT_ID}/oauth2/v2.0/token", data={
                        "code": code,
                        "client_id": settings.AZURE_CLIENT_ID,
                        "client_secret": settings.AZURE_CLIENT_SECRET,
                        "redirect_uri": redirect_uri,
                        "grant_type": "authorization_code"
                    }, timeout=5)
                    tokens = token_res.json()
                    access_token = tokens.get("access_token")
                    
                    user_res = requests.get("https://graph.microsoft.com/oidc/userinfo", headers={
                        "Authorization": f"Bearer {access_token}"
                    }, timeout=5)
                    user_data = user_res.json()
                    email = user_data.get("email")
                    first_name = user_data.get("given_name") or user_data.get("name", "").split(" ")[0]
                    last_name = user_data.get("family_name") or ""
            except Exception as e:
                return redirect(f"http://localhost:5173/login?error=exchange_failed&detail={urllib.parse.quote(str(e))}")

        if not email:
            return redirect("http://localhost:5173/login?error=no_email")

        try:
            user = User.objects.filter(email=email).first()
            if not user:
                user = User.objects.create(
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    is_active=True,
                    is_verified=True
                )
                user.set_unusable_password()
                user.save()
                
                org_name = f"{state.upper()} SSO Org"
                org, created = Organization.objects.get_or_create(name=org_name)
                
                role = "SUPER_ADMIN" if created else "VIEWER"
                UserOrganizationRole.objects.create(
                    user=user,
                    organization=org,
                    role=role
                )
        except Exception as e:
            return redirect(f"http://localhost:5173/login?error=user_creation_failed&detail={urllib.parse.quote(str(e))}")

        try:
            from apps.audit_logs.utils import log_activity
            request.user = user
            org_roles = user.org_roles.all()
            if org_roles.exists():
                request.tenant = org_roles.first().organization
            log_activity(request, "USER_SSO_LOGIN", payload={"email": email, "provider": state})
        except Exception:
            pass

        refresh = RefreshToken.for_user(user)
        
        frontend_callback = "http://localhost:5173/sso-callback"
        params = {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }
        response = redirect(f"{frontend_callback}?{urllib.parse.urlencode(params)}")
        response.set_cookie(
            key="refresh_token",
            value=str(refresh),
            httponly=True,
            samesite="Lax",
            secure=False,
            max_age=7 * 24 * 60 * 60,  # 7 days
        )
        return response


from rest_framework_simplejwt.serializers import TokenRefreshSerializer

class CustomTokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")
        if not refresh_token:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "MissingRefreshToken",
                        "message": "Refresh token is missing from cookies.",
                        "details": {}
                    }
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Extract user_id from token BEFORE validating/blacklisting it
        user_id = None
        try:
            refresh = RefreshToken(refresh_token)
            user_id = refresh.payload.get("user_id")
        except Exception:
            pass

        serializer = TokenRefreshSerializer(data={"refresh": refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "InvalidRefreshToken",
                        "message": "Refresh token is invalid or expired.",
                        "details": {}
                    }
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        new_access_token = serializer.validated_data["access"]
        new_refresh_token = serializer.validated_data.get("refresh")

        if not user_id:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "InvalidTokenPayload",
                        "message": "User ID not found in token payload.",
                        "details": {}
                    }
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(id=user_id)
        except Exception:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "UserNotFound",
                        "message": "User associated with this token does not exist.",
                        "details": {}
                    }
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Map user info to the format expected by the frontend
        is_superuser = user.is_superuser
        orgs = list(user.org_roles.select_related("organization"))
        backend_role = orgs[0].role if orgs else "VIEWER"

        if is_superuser or backend_role in ["SUPER_ADMIN", "ORG_ADMIN"]:
            frontend_role = "admin"
        elif backend_role == "ANALYST":
            frontend_role = "editor"
        else:
            frontend_role = "viewer"

        user_data = {
            "id": str(user.id),
            "name": f"{user.first_name} {user.last_name}".strip() or user.email,
            "email": user.email,
            "role": frontend_role,
            "organizationId": str(orgs[0].organization.id) if orgs else "",
            "is_superuser": is_superuser
        }

        response = Response(
            {
                "success": True,
                "data": {
                    "accessToken": new_access_token,
                    "user": user_data
                }
            },
            status=status.HTTP_200_OK
        )

        # If refresh token was rotated, set the new refresh token in cookie
        if new_refresh_token:
            response.set_cookie(
                key="refresh_token",
                value=new_refresh_token,
                httponly=True,
                samesite="Lax",
                secure=False,
                max_age=7 * 24 * 60 * 60,  # 7 days
            )

        return response
