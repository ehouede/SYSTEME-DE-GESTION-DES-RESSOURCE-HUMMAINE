from celery import shared_task
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from django.conf import settings
from .models import Notification

User = get_user_model()

@shared_task
def envoyer_notification_email_task(user_id, sujet, message_text):
    """
    Tâche Celery pour envoyer un email et enregistrer une notification en base.
    """
    try:
        user = User.objects.get(id=user_id)
        # 1. Enregistrement en base de données
        Notification.objects.create(
            destinataire=user,
            message=message_text
        )
        
        # 2. Envoi d'email
        if user.email:
            send_mail(
                subject=sujet,
                message=message_text,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True
            )
            print(f"Email de notification envoyé avec succès à {user.email}")
        return True
    except User.DoesNotExist:
        print(f"Utilisateur {user_id} introuvable pour envoi de notification.")
        return False

@shared_task
def notifier_soumission_conge(demande_id_str):
    # Tâche pouvant être déclenchée après soumission
    pass
