from rest_framework import serializers
from apps.users.models import User, UserOrganizationRole

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "is_verified", "created_at")
        read_only_fields = ("id", "email", "is_verified", "created_at")


class UserOrgRoleSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserOrganizationRole
        fields = ("id", "user", "role", "created_at")
        read_only_fields = ("id", "user", "role", "created_at")
