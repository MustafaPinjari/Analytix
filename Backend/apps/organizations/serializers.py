from rest_framework import serializers
from apps.organizations.models import Organization

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ("id", "name", "slug", "created_at", "updated_at")
        read_only_fields = ("id", "slug", "created_at", "updated_at")


class InviteUserSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)
    role = serializers.ChoiceField(choices=(
        ("ORG_ADMIN", "Organization Admin"),
        ("ANALYST", "Analyst"),
        ("VIEWER", "Viewer"),
    ))
