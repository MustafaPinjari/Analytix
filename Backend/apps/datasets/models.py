import uuid
from django.db import models
from django.conf import settings
from apps.organizations.models import Organization

class DatabaseConnection(models.Model):
    CONNECTION_CHOICES = [
        ("postgresql", "PostgreSQL"),
        ("mysql", "MySQL"),
        ("sqlite", "SQLite"),
        ("bigquery", "Google BigQuery"),
        ("gsheets", "Google Sheets"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="database_connections")
    name = models.CharField(max_length=255)
    connection_type = models.CharField(max_length=20, choices=CONNECTION_CHOICES)
    host = models.CharField(max_length=255, blank=True, null=True)
    port = models.IntegerField(blank=True, null=True)
    database_name = models.CharField(max_length=255, blank=True, null=True)
    username = models.CharField(max_length=255, blank=True, null=True)
    password = models.CharField(max_length=255, blank=True, null=True)
    credentials_json = models.TextField(blank=True, null=True)
    spreadsheet_url = models.CharField(max_length=500, blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="created_connections")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "database_connections"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.get_connection_type_display()})"


class Dataset(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="datasets")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    db_connection = models.ForeignKey(DatabaseConnection, on_delete=models.SET_NULL, null=True, blank=True, related_name="datasets")
    sql_query = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="created_datasets")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "datasets"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class DatasetVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, related_name="versions")
    version_number = models.IntegerField()
    file_path = models.CharField(max_length=500)  # Path to raw file
    storage_path = models.CharField(max_length=500)  # Path to parquet file
    file_size = models.BigIntegerField()
    file_type = models.CharField(max_length=10)  # 'CSV' or 'XLSX'
    metadata_json = models.TextField()  # JSON listing columns, data types
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="created_dataset_versions")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "dataset_versions"
        unique_together = ("dataset", "version_number")
        ordering = ["-version_number"]

    def __str__(self):
        return f"{self.dataset.name} - v{self.version_number}"
