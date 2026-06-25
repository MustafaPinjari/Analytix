from django.urls import path
from apps.analytics.views import PythonSandboxView

app_name = "analytics"

urlpatterns = [
    path("sandbox/", PythonSandboxView.as_view(), name="sandbox"),
]
