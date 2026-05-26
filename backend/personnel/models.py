from django.db import models
from django.conf import settings

class Service(models.Model):
    nom = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='managed_services'
    )

    def __str__(self):
        return self.nom

class Employe(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='employe_profile'
    )
    matricule = models.CharField(max_length=50, unique=True)
    date_naissance = models.DateField()
    telephone = models.CharField(max_length=20)
    adresse = models.TextField()
    ifu = models.CharField(max_length=20, blank=True, null=True, verbose_name="Numéro IFU")
    service = models.ForeignKey(
        Service, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='employes'
    )
    poste = models.CharField(max_length=100)
    date_embauche = models.DateField()
    salaire_base_saisi = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} ({self.matricule})"

class Contrat(models.Model):
    TYPE_CONTRAT_CHOICES = (
        ('CDI', 'Contrat à Durée Indéterminée'),
        ('CDD', 'Contrat à Durée Déterminée'),
        ('STAGE', 'Contrat de Stage'),
        ('PESS', 'Prestation de Services'),
    )
    
    STATUT_CONTRAT_CHOICES = (
        ('ACTIF', 'Actif'),
        ('TERMINE', 'Terminé'),
    )

    employe = models.ForeignKey(
        Employe, 
        on_delete=models.CASCADE, 
        related_name='contrats'
    )
    type_contrat = models.CharField(max_length=20, choices=TYPE_CONTRAT_CHOICES, default='CDI')
    date_debut = models.DateField()
    date_fin = models.DateField(blank=True, null=True)
    salaire_base = models.DecimalField(max_digits=12, decimal_places=2)
    statut = models.CharField(max_length=20, choices=STATUT_CONTRAT_CHOICES, default='ACTIF')
    fichier_pdf = models.FileField(upload_to='contrats/', blank=True, null=True)

    def __str__(self):
        return f"Contrat {self.type_contrat} - {self.employe.user.last_name} ({self.statut})"
