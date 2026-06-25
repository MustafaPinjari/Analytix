from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.dashboards.models import Dashboard
from apps.widgets.models import Widget
from apps.datasets.models import Dataset
from apps.widgets.serializers import WidgetSerializer
from core.permissions import HasTenantContext, IsViewer, IsAnalyst
from core.exceptions import NotFoundException, ValidationException, PermissionDeniedException

class WidgetListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), HasTenantContext(), IsAnalyst()]
        return [IsAuthenticated(), HasTenantContext(), IsViewer()]

    def _get_dashboard(self, dashboard_id, tenant):
        try:
            return Dashboard.objects.get(id=dashboard_id, organization=tenant)
        except Dashboard.DoesNotExist:
            raise NotFoundException("Dashboard not found in this organization.")

    def get(self, request, dashboard_id):
        dashboard = self._get_dashboard(dashboard_id, request.tenant)
        widgets = Widget.objects.filter(dashboard=dashboard)
        serializer = WidgetSerializer(widgets, many=True)
        return Response({"success": True, "results": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request, dashboard_id):
        dashboard = self._get_dashboard(dashboard_id, request.tenant)
        
        # Enforce parent dashboard ownership
        if request.user_org_role not in ["SUPER_ADMIN", "ORG_ADMIN"] and dashboard.created_by != request.user:
            raise PermissionDeniedException("You do not have permission to modify widgets on this dashboard.")
            
        serializer = WidgetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        dataset = serializer.validated_data["dataset"]
        if dataset.organization != request.tenant:
            raise ValidationException("The specified dataset does not belong to this organization.")

        widget = serializer.save(dashboard=dashboard)
        return Response(
            {
                "success": True,
                "message": "Widget added successfully.",
                "data": WidgetSerializer(widget).data
            },
            status=status.HTTP_201_CREATED
        )


class WidgetDetailView(APIView):
    def get_permissions(self):
        if self.request.method in ["PUT", "DELETE"]:
            return [IsAuthenticated(), HasTenantContext(), IsAnalyst()]
        return [IsAuthenticated(), HasTenantContext(), IsViewer()]

    def _get_widget(self, dashboard_id, widget_id, tenant):
        try:
            return Widget.objects.get(
                id=widget_id,
                dashboard_id=dashboard_id,
                dashboard__organization=tenant
            )
        except Widget.DoesNotExist:
            raise NotFoundException("Widget not found in this dashboard.")

    def get(self, request, dashboard_id, widget_id):
        widget = self._get_widget(dashboard_id, widget_id, request.tenant)
        serializer = WidgetSerializer(widget)
        return Response({"success": True, "data": serializer.data}, status=status.HTTP_200_OK)

    def put(self, request, dashboard_id, widget_id):
        widget = self._get_widget(dashboard_id, widget_id, request.tenant)
        
        # Enforce parent dashboard ownership
        if request.user_org_role not in ["SUPER_ADMIN", "ORG_ADMIN"] and widget.dashboard.created_by != request.user:
            raise PermissionDeniedException("You do not have permission to modify widgets on this dashboard.")
            
        serializer = WidgetSerializer(widget, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        if "dataset" in serializer.validated_data:
            dataset = serializer.validated_data["dataset"]
            if dataset.organization != request.tenant:
                raise ValidationException("The specified dataset does not belong to this organization.")

        serializer.save()
        return Response(
            {
                "success": True,
                "message": "Widget updated successfully.",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )

    def delete(self, request, dashboard_id, widget_id):
        widget = self._get_widget(dashboard_id, widget_id, request.tenant)
        
        # Enforce parent dashboard ownership
        if request.user_org_role not in ["SUPER_ADMIN", "ORG_ADMIN"] and widget.dashboard.created_by != request.user:
            raise PermissionDeniedException("You do not have permission to modify widgets on this dashboard.")
            
        widget.delete()
        return Response(
            {
                "success": True,
                "message": "Widget deleted successfully."
            },
            status=status.HTTP_200_OK
        )
