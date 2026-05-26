from django.db import models
from django.conf import settings

class Notification(models.Model):
    destinataire = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='notifications'
    )
    message = models.TextField()
    date_envoi = models.DateTimeField(auto_now_add=True)
    lue = models.BooleanField(default=False)

    class Meta:
        ordering = ['-date_envoi']

    def __str__(self):
        return f"Notification pour {self.destinataire.username} (Lue: {self.lue})"
