from django.urls import re_path
from apps.dashboards import consumers

websocket_urlpatterns = [
    re_path(r'ws/dashboards/(?P<dashboard_id>[^/]+)/$', consumers.DashboardConsumer.as_asgi()),
]
