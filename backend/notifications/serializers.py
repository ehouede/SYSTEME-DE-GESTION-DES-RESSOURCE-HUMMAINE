from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'destinataire', 'message', 'date_envoi', 'lue')
        read_only_fields = ('destinataire', 'date_envoi')
