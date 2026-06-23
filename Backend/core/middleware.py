from django.utils.deprecation import MiddlewareMixin
from rest_framework import status
from django.http import JsonResponse
from apps.organizations.models import Organization
from apps.users.models import UserOrganizationRole
import uuid

class TenantMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.tenant = None
        request.user_org_role = None

        # Try to authenticate user via JWT since DRF authentication runs after middleware
        if not (request.user and request.user.is_authenticated):
            try:
                from rest_framework_simplejwt.authentication import JWTAuthentication
                authenticator = JWTAuthentication()
                auth_result = authenticator.authenticate(request)
                if auth_result:
                    user, token = auth_result
                    request.user = user
            except Exception:
                pass

        org_id_str = request.headers.get("X-Organization-Id")

        if org_id_str:
            try:
                org_uuid = uuid.UUID(org_id_str)
                organization = Organization.objects.get(id=org_uuid)
                request.tenant = organization
            except (ValueError, Organization.DoesNotExist):
                return JsonResponse(
                    {
                        "success": False,
                        "error": {
                            "code": "InvalidTenant",
                            "message": "The organization ID provided is invalid or does not exist.",
                            "details": {}
                        }
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check role mapping if user is authenticated
            if request.user and request.user.is_authenticated:
                if request.user.is_superuser:
                    request.user_org_role = "SUPER_ADMIN"
                else:
                    try:
                        role_mapping = UserOrganizationRole.objects.get(
                            user=request.user,
                            organization=organization
                        )
                        request.user_org_role = role_mapping.role
                    except UserOrganizationRole.DoesNotExist:
                        # User has no role in this organization
                        request.user_org_role = None
        elif request.user and request.user.is_authenticated:
            # Fallback if no org header is provided, check if superuser
            if request.user.is_superuser:
                request.user_org_role = "SUPER_ADMIN"
