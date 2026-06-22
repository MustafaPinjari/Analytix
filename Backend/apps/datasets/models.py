import uuid
from django.db import models
from django.conf import settings
from apps.organizations.models import Organization

class Dataset(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="datasets")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
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
