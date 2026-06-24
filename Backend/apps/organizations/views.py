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
