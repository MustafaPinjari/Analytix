from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer
from core.exceptions import NotFoundException

class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user)
        serializer = NotificationSerializer(notifications, many=True)
        return Response({"success": True, "results": serializer.data}, status=status.HTTP_200_OK)


class NotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        try:
            notification = Notification.objects.get(id=notification_id, user=request.user)
        except Notification.DoesNotExist:
            raise NotFoundException("Notification not found.")

        notification.is_read = True
        notification.save()
        
        return Response(
            {
                "success": True,
                "message": "Notification marked as read.",
                "data": NotificationSerializer(notification).data
            },
            status=status.HTTP_200_OK
        )
