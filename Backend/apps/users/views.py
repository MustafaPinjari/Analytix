from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.users.models import UserOrganizationRole
from apps.users.serializers import UserSerializer, UserOrgRoleSerializer
from core.permissions import HasTenantContext, IsViewer, IsOrgAdmin

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({"success": True, "data": serializer.data}, status=status.HTTP_200_OK)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {
                "success": True,
                "message": "Profile updated successfully.",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )


class UserListView(APIView):
    permission_classes = [IsAuthenticated, HasTenantContext, IsOrgAdmin]

    def get(self, request):
        memberships = UserOrganizationRole.objects.filter(
            organization=request.tenant
        ).select_related("user")
        
        serializer = UserOrgRoleSerializer(memberships, many=True)
        return Response({"success": True, "results": serializer.data}, status=status.HTTP_200_OK)
