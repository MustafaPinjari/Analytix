from django.urls import path
from apps.notifications.views import NotificationListView, NotificationReadView

urlpatterns = [
    path("", NotificationListView.as_view(), name="notification_list"),
    path("<uuid:notification_id>/read/", NotificationReadView.as_view(), name="notification_read"),
]
