from django.urls import path
from apps.users.views import UserProfileView, UserListView

urlpatterns = [
    path("", UserListView.as_view(), name="user_list"),
    path("me/", UserProfileView.as_view(), name="user_profile"),
]
