import uuid
from django.db import models
from django.conf import settings
from apps.organizations.models import Organization
from apps.dashboards.models import Dashboard

class Report(models.Model):
    FORMAT_CHOICES = (
        ("PDF", "PDF Document"),
        ("EXCEL", "Excel Spreadsheet"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="reports")
    dashboard = models.ForeignKey(Dashboard, on_delete=models.CASCADE, null=True, blank=True, related_name="reports")
    name = models.CharField(max_length=255)
    schedule_cron = models.CharField(max_length=100, blank=True, null=True)  # Cron syntax, e.g. '0 9 * * 1'
    format = models.CharField(max_length=20, choices=FORMAT_CHOICES)
    recipients = models.TextField()  # JSON-encoded array of email strings
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="created_reports")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "reports"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class ReportHistory(models.Model):
    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("RUNNING", "Running"),
        ("COMPLETED", "Completed"),
        ("FAILED", "Failed"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name="history")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="PENDING")
    file_path = models.CharField(max_length=500, blank=True, null=True)  # Path to generated file in media/
    error_message = models.TextField(blank=True, null=True)
    run_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "report_histories"
        ordering = ["-run_at"]

    def __str__(self):
        return f"{self.report.name} - {self.run_at} ({self.status})"
