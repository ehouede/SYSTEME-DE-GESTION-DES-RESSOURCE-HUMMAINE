from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from datetime import datetime, timedelta

from personnel.models import Employe
from pointage.models import Pointage
from notifications.models import Notification
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Mark employees without a pointage for a given date as absent (non justified)'

    def add_arguments(self, parser):
        parser.add_argument('--start', type=str, help='Start date (YYYY-MM-DD). Defaults to today.')
        parser.add_argument('--end', type=str, help='End date (YYYY-MM-DD). Defaults to today.')

    def handle(self, *args, **options):
        start_str = options.get('start')
        end_str = options.get('end')

        try:
            if start_str:
                start_date = datetime.strptime(start_str, '%Y-%m-%d').date()
            else:
                start_date = timezone.localdate()
            if end_str:
                end_date = datetime.strptime(end_str, '%Y-%m-%d').date()
            else:
                end_date = timezone.localdate()
        except ValueError:
            self.stderr.write('Dates must be in YYYY-MM-DD format')
            return

        if start_date > end_date:
            self.stderr.write('Start date must be <= end date')
            return

        # If no explicit start/end provided and we're processing today,
        # only run the marking for today when local time is at or after 18:30.
        if not start_str and not end_str and start_date == timezone.localdate():
            now = timezone.localtime()
            cutoff = now.replace(hour=18, minute=30, second=0, microsecond=0)
            if now < cutoff:
                self.stdout.write('It is before 18:30 local time; skipping absence marking for today.')
                return

        self.stdout.write(f'Processing absences from {start_date} to {end_date}')

        employees = Employe.objects.select_related('user').all()
        created = 0
        skipped = 0
        skipped_leave = 0
        skipped_hire = 0
        with transaction.atomic():
            cur = start_date
            while cur <= end_date:
                for emp in employees:
                    # Skip inactive users
                    if hasattr(emp.user, 'is_active') and not emp.user.is_active:
                        skipped += 1
                        continue

                    # Skip if employee was hired after this date
                    if getattr(emp, 'date_embauche', None) and emp.date_embauche > cur:
                        skipped_hire += 1
                        continue

                    # Skip if there's an approved leave covering this date
                    from conges.models import DemandeConge
                    on_leave = DemandeConge.objects.filter(
                        employe=emp,
                        date_debut__lte=cur,
                        date_fin__gte=cur,
                        statut__in=['VALIDE_N1', 'VALIDE_RH']
                    ).exists()
                    if on_leave:
                        skipped_leave += 1
                        continue

                    exists = Pointage.objects.filter(employe=emp, date=cur).exists()
                    if not exists:
                        p = Pointage(employe=emp, date=cur, heure_arrivee=None, heure_depart=None, statut='ABSENT', justifie=False)
                        p.save()
                        created += 1
                        # Create notifications for manager and RH/Admin to signal the absence
                        try:
                            User = get_user_model()
                            message = f"{emp} est absent le {cur}."
                            manager = getattr(getattr(emp, 'service', None), 'manager', None)
                            if manager:
                                Notification.objects.create(destinataire=manager, message=message)
                            # Notify the employee themselves
                            try:
                                if getattr(emp, 'user', None):
                                    Notification.objects.create(destinataire=emp.user, message=f"Vous êtes marqué(e) absent(e) le {cur}.")
                            except Exception:
                                pass
                            rh_users = User.objects.filter(role__in=['RH', 'ADMIN'])
                            for u in rh_users:
                                Notification.objects.create(destinataire=u, message=message)
                        except Exception:
                            pass
                cur = cur + timedelta(days=1)

        self.stdout.write(self.style.SUCCESS(
            f'Created {created} absent records; skipped {skipped} inactive, {skipped_hire} hired-after-date, {skipped_leave} on-leave'))
