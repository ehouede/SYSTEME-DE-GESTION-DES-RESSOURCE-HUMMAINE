from celery import shared_task
from django.core.management import call_command

@shared_task
def mark_absences_task():
    """Task wrapper to run the management command that marks absences."""
    # Call the management command without args to process today (it will respect 18:30 cutoff)
    call_command('mark_absences')
