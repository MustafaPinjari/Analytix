from rest_framework import serializers
from apps.users.models import User, UserOrganizationRole

class UserSerializer(serializers.ModelSerializer):
    organizations = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "is_verified", "organizations", "created_at")
        read_only_fields = ("id", "email", "is_verified", "created_at")

    def get_organizations(self, obj):
        return [
            {
                "id": str(mapping.organization.id),
                "name": mapping.organization.name,
                "role": mapping.role
            }
            for mapping in obj.org_roles.select_related("organization")
        ]


class UserOrgRoleSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserOrganizationRole
        fields = ("id", "user", "role", "created_at")
        read_only_fields = ("id", "user", "role", "created_at")
