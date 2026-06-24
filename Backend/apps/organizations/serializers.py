from rest_framework import serializers
from apps.organizations.models import Organization

class OrganizationSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ("id", "name", "slug", "role", "created_at", "updated_at")
        read_only_fields = ("id", "slug", "role", "created_at", "updated_at")

    def get_role(self, obj):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            if request.user.is_superuser:
                return "SUPER_ADMIN"
            try:
                from apps.users.models import UserOrganizationRole
                mapping = UserOrganizationRole.objects.get(user=request.user, organization=obj)
                return mapping.role
            except UserOrganizationRole.DoesNotExist:
                return "VIEWER"
        return "VIEWER"



class InviteUserSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)
    role = serializers.ChoiceField(choices=(
        ("ORG_ADMIN", "Organization Admin"),
        ("ANALYST", "Analyst"),
        ("VIEWER", "Viewer"),
    ))
