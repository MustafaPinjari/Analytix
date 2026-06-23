import uuid
from django.db import models
from apps.dashboards.models import Dashboard
from apps.datasets.models import Dataset

class Widget(models.Model):
    WIDGET_TYPES = (
        ("BAR", "Bar Chart"),
        ("LINE", "Line Chart"),
        ("PIE", "Pie Chart"),
        ("KPI", "Key Performance Indicator"),
        ("TABLE", "Data Table"),
        ("AREA", "Area Chart"),
        ("DONUT", "Donut Chart"),
        ("RADAR", "Radar Chart"),
        ("SCATTER", "Scatter Chart"),
        ("GAUGE", "Gauge Chart"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dashboard = models.ForeignKey(Dashboard, on_delete=models.CASCADE, related_name="widgets")
    dataset = models.ForeignKey(Dataset, on_delete=models.RESTRICT, related_name="widgets")
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=WIDGET_TYPES)
    query_config = models.TextField()  # JSON formatted parameters: dimensions, measures, filters
    position_x = models.IntegerField(default=0)
    position_y = models.IntegerField(default=0)
    width = models.IntegerField(default=4)
    height = models.IntegerField(default=3)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "widgets"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.name} ({self.type})"
