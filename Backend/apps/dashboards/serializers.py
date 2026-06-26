from rest_framework import serializers
from apps.dashboards.models import Dashboard
from apps.widgets.serializers import WidgetSerializer

class DashboardSerializer(serializers.ModelSerializer):
    widgets = WidgetSerializer(many=True, read_only=True)
    owner_id = serializers.ReadOnlyField(source="created_by.id")
    owner_name = serializers.SerializerMethodField()

    class Meta:
        model = Dashboard
        fields = ("id", "name", "description", "widgets", "owner_id", "owner_name", "is_shared", "shared_with", "created_at", "updated_at")
        read_only_fields = ("id", "owner_id", "owner_name", "created_at", "updated_at")

    def get_owner_name(self, obj):
        if obj.created_by:
            name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
            return name if name else obj.created_by.email
        return "Unknown"
