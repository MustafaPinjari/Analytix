from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.audit_logs.models import AuditLog
from apps.audit_logs.serializers import AuditLogSerializer
from core.permissions import HasTenantContext, IsOrgAdmin

class AuditLogListView(APIView):
    permission_classes = [IsAuthenticated, HasTenantContext, IsOrgAdmin]

    def get(self, request):
        logs = AuditLog.objects.filter(organization=request.tenant).select_related("user")
        serializer = AuditLogSerializer(logs, many=True)
        return Response({"success": True, "results": serializer.data}, status=status.HTTP_200_OK)
