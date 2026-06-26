from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.dashboards.models import Dashboard
from apps.dashboards.serializers import DashboardSerializer
from core.permissions import HasTenantContext, IsViewer, IsAnalyst
from core.exceptions import NotFoundException, PermissionDeniedException

class DashboardListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), HasTenantContext(), IsAnalyst()]
        return [IsAuthenticated(), HasTenantContext(), IsViewer()]

    def get(self, request):
        dashboards = Dashboard.objects.filter(organization=request.tenant)
        
        # If the user is not SUPER_ADMIN or ORG_ADMIN, filter by ownership or sharing settings
        if request.user_org_role not in ["SUPER_ADMIN", "ORG_ADMIN"]:
            filtered_dashboards = []
            for d in dashboards:
                # Owner has access
                if d.created_by == request.user:
                    filtered_dashboards.append(d)
                # Globally shared dashboard
                elif d.is_shared:
                    filtered_dashboards.append(d)
                else:
                    # Check explicit shared list [ { "email": "..." } ]
                    shared_emails = [item.get("email") for item in d.shared_with if isinstance(item, dict)]
                    if request.user.email in shared_emails:
                        filtered_dashboards.append(d)
            dashboards = filtered_dashboards

        serializer = DashboardSerializer(dashboards, many=True)
        return Response({"success": True, "results": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = DashboardSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        dashboard = serializer.save(
            organization=request.tenant,
            created_by=request.user
        )
        try:
            from apps.audit_logs.utils import log_activity
            log_activity(request, "DASHBOARD_CREATE", payload={"dashboard_id": str(dashboard.id), "name": dashboard.name})
        except Exception:
            pass
        return Response(
            {
                "success": True,
                "message": "Dashboard created successfully.",
                "data": DashboardSerializer(dashboard).data
            },
            status=status.HTTP_201_CREATED
        )


class DashboardDetailView(APIView):
    def get_permissions(self):
        if self.request.method in ["PUT", "DELETE"]:
            return [IsAuthenticated(), HasTenantContext(), IsAnalyst()]
        return [IsAuthenticated(), HasTenantContext(), IsViewer()]

    def _get_dashboard(self, dashboard_id, tenant):
        try:
            return Dashboard.objects.get(id=dashboard_id, organization=tenant)
        except Dashboard.DoesNotExist:
            raise NotFoundException("Dashboard not found.")

    def get(self, request, dashboard_id):
        dashboard = self._get_dashboard(dashboard_id, request.tenant)
        
        # Enforce view access check
        if request.user_org_role not in ["SUPER_ADMIN", "ORG_ADMIN"] and dashboard.created_by != request.user:
            # Check if globally shared, or explicitly shared with request.user
            shared_emails = [item.get("email") for item in dashboard.shared_with if isinstance(item, dict)]
            if not (dashboard.is_shared or request.user.email in shared_emails):
                raise PermissionDeniedException("You do not have permission to access this dashboard.")
                
        serializer = DashboardSerializer(dashboard)
        return Response({"success": True, "data": serializer.data}, status=status.HTTP_200_OK)

    def put(self, request, dashboard_id):
        dashboard = self._get_dashboard(dashboard_id, request.tenant)
        
        # Enforce resource ownership checks and shared editor check
        if request.user_org_role not in ["SUPER_ADMIN", "ORG_ADMIN"] and dashboard.created_by != request.user:
            # Check if explicitly shared with request.user as an editor
            user_shared_role = next((item.get("role") for item in dashboard.shared_with if isinstance(item, dict) and item.get("email") == request.user.email), None)
            if user_shared_role != "editor":
                raise PermissionDeniedException("You do not have permission to modify this dashboard.")
            
        serializer = DashboardSerializer(dashboard, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        try:
            from apps.audit_logs.utils import log_activity
            log_activity(request, "DASHBOARD_UPDATE", payload={"dashboard_id": str(dashboard.id), "name": dashboard.name})
        except Exception:
            pass
        return Response(
            {
                "success": True,
                "message": "Dashboard updated successfully.",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )

    def delete(self, request, dashboard_id):
        dashboard = self._get_dashboard(dashboard_id, request.tenant)
        
        # Enforce resource ownership checks (editors can't delete, only creators or admins can)
        if request.user_org_role not in ["SUPER_ADMIN", "ORG_ADMIN"] and dashboard.created_by != request.user:
            raise PermissionDeniedException("You do not have permission to delete this dashboard.")
            
        dashboard.delete()
        try:
            from apps.audit_logs.utils import log_activity
            log_activity(request, "DASHBOARD_DELETE", payload={"dashboard_id": str(dashboard.id), "name": dashboard.name})
        except Exception:
            pass
        return Response(
            {
                "success": True,
                "message": "Dashboard deleted successfully."
            }
        )
