from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = "Crée ou réinitialise l'administrateur avec admin/admin123456"

    def handle(self, *args, **options):
        username = 'admin'
        password = 'admin123456'
        email = 'admin@grh.local'
        
        # Vérifier si l'admin existe
        admin_user = User.objects.filter(username=username).first()
        
        if admin_user:
            self.stdout.write(
                self.style.WARNING(f'Admin "{username}" existe déjà. Réinitialisation...')
            )
            admin_user.set_password(password)
            admin_user.email = email
            admin_user.is_active = True
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.role = 'ADMIN'
            admin_user.save()
            self.stdout.write(
                self.style.SUCCESS(f'✓ Mot de passe réinitialisé pour {username}')
            )
        else:
            self.stdout.write(f'Création du nouvel administrateur "{username}"...')
            admin_user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name='Administrateur',
                last_name='Système',
                role='ADMIN',
                is_active=True,
                is_staff=True,
                is_superuser=True
            )
            self.stdout.write(
                self.style.SUCCESS(f'✓ Administrateur "{username}" créé avec succès')
            )
        
        # Afficher les informations
        self.stdout.write(
            self.style.SUCCESS('\n=== INFORMATIONS DE CONNEXION ===')
        )
        self.stdout.write(f'Identifiant: {username}')
        self.stdout.write(f'Mot de passe: {password}')
        self.stdout.write(f'Email: {email}')
        self.stdout.write(f'Rôle: ADMIN')
        self.stdout.write(f'Statut: Actif')
        self.stdout.write(
            self.style.SUCCESS('\n✓ Prêt à se connecter!')
        )
