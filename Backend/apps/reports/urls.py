from django.urls import path
from apps.reports.views import ReportListCreateView, ReportDetailView, ReportHistoryListView

urlpatterns = [
    path("", ReportListCreateView.as_view(), name="report_list_create"),
    path("history/", ReportHistoryListView.as_view(), name="report_history_list"),
    path("<uuid:report_id>/", ReportDetailView.as_view(), name="report_detail"),
]
