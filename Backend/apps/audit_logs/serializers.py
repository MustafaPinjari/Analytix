from rest_framework import serializers
from apps.audit_logs.models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ("id", "user", "action", "ip_address", "user_agent", "payload", "created_at")
        read_only_fields = ("id", "user", "action", "ip_address", "user_agent", "payload", "created_at")
