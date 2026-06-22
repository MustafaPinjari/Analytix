from django.urls import path
from apps.dashboards.views import DashboardListCreateView, DashboardDetailView
from apps.widgets.views import WidgetListCreateView, WidgetDetailView

urlpatterns = [
    path("", DashboardListCreateView.as_view(), name="dashboard_list_create"),
    path("<uuid:dashboard_id>/", DashboardDetailView.as_view(), name="dashboard_detail"),
    path("<uuid:dashboard_id>/widgets/", WidgetListCreateView.as_view(), name="widget_list_create"),
    path("<uuid:dashboard_id>/widgets/<uuid:widget_id>/", WidgetDetailView.as_view(), name="widget_detail"),
]
