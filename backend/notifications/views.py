from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # L'utilisateur connecté ne voit que ses propres notifications
        return Notification.objects.filter(destinataire=self.request.user)

    @action(detail=True, methods=['patch'], url_path='lire')
    def lire(self, request, pk=None):
        notification = self.get_object()
        notification.lue = True
        notification.save()
        return Response(
            {
                "detail": "Notification marquée comme lue.",
                "notification": NotificationSerializer(notification).data
            }, 
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'], url_path='lire-tout')
    def lire_tout(self, request):
        notifications = self.get_queryset().filter(lue=False)
        count = notifications.update(lue=True)
        return Response(
            {"detail": f"{count} notifications marquées comme lues."},
            status=status.HTTP_200_OK
        )
