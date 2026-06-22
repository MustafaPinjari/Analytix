import json
from rest_framework import serializers
from apps.reports.models import Report, ReportHistory

class ReportSerializer(serializers.ModelSerializer):
    recipients = serializers.JSONField()

    class Meta:
        model = Report
        fields = (
            "id",
            "dashboard",
            "name",
            "schedule_cron",
            "format",
            "recipients",
            "is_active",
            "created_by",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_by", "created_at", "updated_at")

    def validate_recipients(self, value):
        if not isinstance(value, list) or len(value) == 0:
            raise serializers.ValidationError("recipients must be a list containing at least one email address.")
        for email in value:
            if not isinstance(email, str) or "@" not in email:
                raise serializers.ValidationError(f"Invalid email: {email}")
        return value

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
