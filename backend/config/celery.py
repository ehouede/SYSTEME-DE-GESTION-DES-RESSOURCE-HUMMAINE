import os
from celery import Celery

# Définir le module de configuration par défaut pour le programme celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('config')

# Lire la configuration de celery dans settings.py avec le préfixe CELERY_
app.config_from_object('django.conf:settings', namespace='CELERY')

# Charger les tâches de tous les modules enregistrés
app.autodiscover_tasks()
