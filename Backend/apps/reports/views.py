from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.reports.models import Report, ReportHistory
from apps.reports.serializers import ReportSerializer, ReportHistorySerializer
from apps.reports.tasks import compile_report_task
from core.permissions import HasTenantContext, IsViewer, IsAnalyst
from core.exceptions import NotFoundException, ValidationException, PermissionDeniedException

class ReportListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), HasTenantContext(), IsAnalyst()]
        return [IsAuthenticated(), HasTenantContext(), IsViewer()]

    def get(self, request):
        reports = Report.objects.filter(organization=request.tenant)
        serializer = ReportSerializer(reports, many=True)
        return Response({"success": True, "results": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        dashboard = serializer.validated_data.get("dashboard")
        if dashboard and dashboard.organization != request.tenant:
            raise ValidationException("The specified dashboard does not belong to this organization.")

        report = serializer.save(
            organization=request.tenant,
            created_by=request.user
        )

        return Response(
            {
                "success": True,
                "message": "Report schedule created successfully.",
                "data": ReportSerializer(report).data
            },
            status=status.HTTP_201_CREATED
        )


class ReportDetailView(APIView):
    def get_permissions(self):
        if self.request.method in ["PUT", "DELETE"]:
            return [IsAuthenticated(), HasTenantContext(), IsAnalyst()]
        return [IsAuthenticated(), HasTenantContext(), IsViewer()]

    def _get_report(self, report_id, tenant):
        try:
            return Report.objects.get(id=report_id, organization=tenant)
        except Report.DoesNotExist:
            raise NotFoundException("Report schedule not found.")

    def get(self, request, report_id):
        report = self._get_report(report_id, request.tenant)
        serializer = ReportSerializer(report)
        return Response({"success": True, "data": serializer.data}, status=status.HTTP_200_OK)

    def put(self, request, report_id):
        report = self._get_report(report_id, request.tenant)
        
        # Enforce report schedule ownership
        if request.user_org_role not in ["SUPER_ADMIN", "ORG_ADMIN"] and report.created_by != request.user:
            raise PermissionDeniedException("You do not have permission to modify this report schedule.")
            
        serializer = ReportSerializer(report, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        if "dashboard" in serializer.validated_data:
            dashboard = serializer.validated_data["dashboard"]
            if dashboard and dashboard.organization != request.tenant:
                raise ValidationException("The specified dashboard does not belong to this organization.")

        serializer.save()
        return Response(
            {
                "success": True,
                "message": "Report schedule updated successfully.",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )

    def delete(self, request, report_id):
        report = self._get_report(report_id, request.tenant)
        
        # Enforce report schedule ownership
        if request.user_org_role not in ["SUPER_ADMIN", "ORG_ADMIN"] and report.created_by != request.user:
            raise PermissionDeniedException("You do not have permission to delete this report schedule.")
            
        report.delete()
        return Response(
            {
                "success": True,
                "message": "Report schedule deleted successfully."
            },
            status=status.HTTP_200_OK
        )


class ReportHistoryListView(APIView):
    permission_classes = [IsAuthenticated, HasTenantContext, IsViewer]

    def get(self, request):
        histories = ReportHistory.objects.filter(
            report__organization=request.tenant
        ).select_related("report")
        
        serializer = ReportHistorySerializer(histories, many=True)
        return Response({"success": True, "results": serializer.data}, status=status.HTTP_200_OK)


class ReportRunView(APIView):
    permission_classes = [IsAuthenticated, HasTenantContext, IsAnalyst]

    def post(self, request, report_id):
        try:
            report = Report.objects.get(id=report_id, organization=request.tenant)
        except Report.DoesNotExist:
            raise NotFoundException("Report schedule not found.")

        # Enforce report schedule ownership
        if request.user_org_role not in ["SUPER_ADMIN", "ORG_ADMIN"] and report.created_by != request.user:
            raise PermissionDeniedException("You do not have permission to run this report schedule.")

        # Trigger compile report Celery task
        compile_report_task.delay(str(report.id))

        return Response(
            {
                "success": True,
                "message": "Report generation task triggered successfully."
            },
            status=status.HTTP_200_OK
        )
