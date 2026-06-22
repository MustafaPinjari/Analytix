import uuid
from django.db import models
from django.conf import settings
from apps.organizations.models import Organization

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True, related_name="audit_logs")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="audit_logs")
    action = models.CharField(max_length=100)  # e.g., 'USER_LOGIN', 'DATASET_UPLOAD', etc.
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.CharField(max_length=500, blank=True, null=True)
    payload = models.TextField(blank=True, null=True)  # JSON representation of transaction contextual details
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "audit_logs"
        ordering = ["-created_at"]

    def __str__(self):
        actor = self.user.email if self.user else "Anonymous"
        return f"{actor} performed {self.action} at {self.created_at}"
