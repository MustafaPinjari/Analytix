from django.urls import path
from apps.organizations.views import OrganizationListCreateView, InviteUserView

urlpatterns = [
    path("", OrganizationListCreateView.as_view(), name="organization_list_create"),
    path("<uuid:org_id>/invite/", InviteUserView.as_view(), name="organization_invite"),
]
