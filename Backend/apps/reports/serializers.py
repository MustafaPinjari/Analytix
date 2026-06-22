import json
from rest_framework import serializers
from apps.reports.models import Report, ReportHistory

class ReportSerializer(serializers.ModelSerializer):
    recipients = serializers.JSONField()
    dashboard_name = serializers.ReadOnlyField(source="dashboard.name")
    last_run = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = (
            "id",
            "dashboard",
            "dashboard_name",
            "name",
            "schedule_cron",
            "format",
            "recipients",
            "is_active",
            "last_run",
            "created_by",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "dashboard_name", "last_run", "created_by", "created_at", "updated_at")

    def validate_recipients(self, value):
        if not isinstance(value, list) or len(value) == 0:
            raise serializers.ValidationError("recipients must be a list containing at least one email address.")
        for email in value:
            if not isinstance(email, str) or "@" not in email:
                raise serializers.ValidationError(f"Invalid email: {email}")
        return value

    def get_last_run(self, obj):
        last = obj.history.order_by("-run_at").first()
        if last:
            return {
                "status": "success" if last.status == "COMPLETED" else "failed" if last.status == "FAILED" else "pending",
                "run_at": last.run_at.isoformat()
            }
        return None

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if isinstance(instance.recipients, str):
            try:
                ret["recipients"] = json.loads(instance.recipients)
            except Exception:
                ret["recipients"] = []
        return ret

    def to_internal_value(self, data):
        ret = super().to_internal_value(data)
        if "recipients" in ret:
            ret["recipients"] = json.dumps(ret["recipients"])
        return ret


class ReportHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportHistory
        fields = ("id", "report", "status", "file_path", "error_message", "run_at")
        read_only_fields = ("id", "report", "status", "file_path", "error_message", "run_at")
