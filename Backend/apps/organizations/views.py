from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.organizations.models import Organization
from apps.organizations.serializers import OrganizationSerializer, InviteUserSerializer
from apps.organizations.repositories.django_orm import DjangoOrganizationRepository
from apps.users.repositories.django_orm import DjangoUserRepository
from apps.organizations.services.use_cases import CreateOrganizationUseCase, InviteUserToOrganizationUseCase
from core.permissions import IsOrgAdmin, HasTenantContext

class OrganizationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.is_superuser:
            orgs = Organization.objects.all()
        else:
            orgs = Organization.objects.filter(user_roles__user=request.user)

        serializer = OrganizationSerializer(orgs, many=True, context={"request": request})
        return Response({"success": True, "results": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = OrganizationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        org_repo = DjangoOrganizationRepository()
        use_case = CreateOrganizationUseCase(org_repo)
        
        result = use_case.execute(
            name=serializer.validated_data["name"],
            user=request.user
        )

        return Response(
            {
                "success": True,
                "message": "Organization created successfully.",
                "data": OrganizationSerializer(result["organization"]).data
            },
            status=status.HTTP_201_CREATED
        )


class InviteUserView(APIView):
    permission_classes = [IsAuthenticated, HasTenantContext, IsOrgAdmin]

    def post(self, request, org_id):
        if str(request.tenant.id) != str(org_id):
            return Response(
                {
                    "success": False, 
                    "error": {
                        "code": "TenantMismatch", 
                        "message": "X-Organization-Id header does not match path parameters.",
                        "details": {}
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = InviteUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        org_repo = DjangoOrganizationRepository()
        user_repo = DjangoUserRepository()
        use_case = InviteUserToOrganizationUseCase(org_repo, user_repo)

        result = use_case.execute(
            org_id=request.tenant.id,
            email=serializer.validated_data["email"],
            role=serializer.validated_data["role"],
            actor_role=request.user_org_role
        )

        try:
            from apps.audit_logs.utils import log_activity
            log_activity(request, "USER_INVITE", payload={"email": result['user'].email, "role": result['role']})
        except Exception:
            pass

        return Response(
            {
                "success": True,
                "message": f"Successfully invited {result['user'].email} to organization.",
                "data": {
                    "email": result["user"].email,
                    "role": result["role"],
                    "created_new_user": result["created_new_user"]
                }
            },
            status=status.HTTP_201_CREATED
        )


from core.exceptions import NotFoundException, ValidationException
from apps.users.models import UserOrganizationRole

class OrganizationUserDetailView(APIView):
    permission_classes = [IsAuthenticated, HasTenantContext, IsOrgAdmin]

    def put(self, request, org_id, user_id):
        if str(request.tenant.id) != str(org_id):
            raise ValidationException("X-Organization-Id header does not match path parameters.")
        
        role = request.data.get("role")
        if role not in ["SUPER_ADMIN", "ORG_ADMIN", "ANALYST", "VIEWER"]:
            raise ValidationException("Invalid role specified.")
            
        try:
            membership = UserOrganizationRole.objects.get(organization=request.tenant, user_id=user_id)
        except UserOrganizationRole.DoesNotExist:
            raise NotFoundException("User is not a member of this organization.")
            
        membership.role = role
        membership.save()
        try:
            from apps.audit_logs.utils import log_activity
            log_activity(request, "USER_ROLE_UPDATE", payload={"user_id": str(user_id), "role": role, "email": membership.user.email})
        except Exception:
            pass
        return Response({"success": True, "message": "User role updated successfully."}, status=status.HTTP_200_OK)

    def delete(self, request, org_id, user_id):
        if str(request.tenant.id) != str(org_id):
            raise ValidationException("X-Organization-Id header does not match path parameters.")
            
        try:
            membership = UserOrganizationRole.objects.get(organization=request.tenant, user_id=user_id)
        except UserOrganizationRole.DoesNotExist:
            raise NotFoundException("User is not a member of this organization.")
            
        if membership.user == request.user:
            raise ValidationException("You cannot remove yourself from the organization.")
            
        user_email = membership.user.email
        membership.delete()
        try:
            from apps.audit_logs.utils import log_activity
            log_activity(request, "USER_REMOVE", payload={"user_id": str(user_id), "email": user_email})
        except Exception:
            pass
        return Response({"success": True, "message": "User removed from organization successfully."}, status=status.HTTP_200_OK)
