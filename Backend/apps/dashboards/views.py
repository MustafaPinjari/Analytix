from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.dashboards.models import Dashboard
from apps.dashboards.serializers import DashboardSerializer
from core.permissions import HasTenantContext, IsViewer, IsAnalyst
from core.exceptions import NotFoundException

class DashboardListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), HasTenantContext(), IsAnalyst()]
        return [IsAuthenticated(), HasTenantContext(), IsViewer()]

    def get(self, request):
        dashboards = Dashboard.objects.filter(organization=request.tenant)
        serializer = DashboardSerializer(dashboards, many=True)
        return Response({"success": True, "results": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = DashboardSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        dashboard = serializer.save(
            organization=request.tenant,
            created_by=request.user
        )
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
        serializer = DashboardSerializer(dashboard)
        return Response({"success": True, "data": serializer.data}, status=status.HTTP_200_OK)

    def put(self, request, dashboard_id):
        dashboard = self._get_dashboard(dashboard_id, request.tenant)
        serializer = DashboardSerializer(dashboard, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
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
        dashboard.delete()
        return Response(
            {
                "success": True,
                "message": "Dashboard deleted successfully."
            },
            status=status.HTTP_200_OK
        )
