from django.urls import path
from apps.organizations.views import OrganizationListCreateView, InviteUserView, OrganizationUserDetailView

urlpatterns = [
    path("", OrganizationListCreateView.as_view(), name="organization_list_create"),
    path("<uuid:org_id>/invite/", InviteUserView.as_view(), name="organization_invite"),
    path("<uuid:org_id>/users/<uuid:user_id>/", OrganizationUserDetailView.as_view(), name="organization_user_detail"),
]
