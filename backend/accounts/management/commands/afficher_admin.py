from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = "Affiche les coordonnées de l'administrateur"

    def handle(self, *args, **options):
        admins = User.objects.filter(role='ADMIN')
        
        if not admins.exists():
            self.stdout.write(
                self.style.WARNING('Aucun administrateur trouvé dans la base de données.')
            )
            return

        self.stdout.write(
            self.style.SUCCESS('=== COORDONNÉES DES ADMINISTRATEURS ===\n')
        )
        
        for admin in admins:
            self.stdout.write(
                self.style.SUCCESS(f"ID: {admin.id}")
            )
            self.stdout.write(f"Username: {admin.username}")
            self.stdout.write(f"Nom complet: {admin.first_name} {admin.last_name}")
            self.stdout.write(f"Email: {admin.email}")
            self.stdout.write(f"Téléphone: {admin.telephone or 'Non renseigné'}")
            self.stdout.write(f"Rôle: {admin.get_role_display()}")
            self.stdout.write(f"Actif: {'Oui' if admin.is_active else 'Non'}")
            self.stdout.write(f"Superuser: {'Oui' if admin.is_superuser else 'Non'}")
            self.stdout.write(f"Date de création: {admin.date_joined}")
            self.stdout.write("-" * 50)
