from django.urls import path
from apps.datasets.views import (
    DatasetListCreateView, 
    DatasetVersionListView, 
    DatasetUploadView, 
    DatasetQueryView,
    DatabaseConnectionListCreateView,
    DatabaseConnectionTestView,
    DatasetSQLCopilotView
)

urlpatterns = [
    path("", DatasetListCreateView.as_view(), name="dataset_list_create"),
    path("connections/", DatabaseConnectionListCreateView.as_view(), name="db_connection_list_create"),
    path("connections/test/", DatabaseConnectionTestView.as_view(), name="db_connection_test"),
    path("<uuid:dataset_id>/versions/", DatasetVersionListView.as_view(), name="dataset_version_list"),
    path("<uuid:dataset_id>/upload/", DatasetUploadView.as_view(), name="dataset_upload"),
    path("<uuid:dataset_id>/query/", DatasetQueryView.as_view(), name="dataset_query"),
    path("<uuid:dataset_id>/sql-copilot/", DatasetSQLCopilotView.as_view(), name="dataset_sql_copilot"),
]

