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
