from django.db import models
from django.conf import settings
from personnel.models import Employe

class TypeConge(models.Model):
    nom = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)
    duree_standard = models.IntegerField(default=30)  # par an en jours
    verifier_solde = models.BooleanField(default=True, help_text="Si False, la soumission n'exige pas de solde disponible")

    def __str__(self):
        return f"{self.nom} ({self.code})"

class SoldeConge(models.Model):
    employe = models.ForeignKey(
        Employe, 
        on_delete=models.CASCADE, 
        related_name='soldes_conge'
    )
    type_conge = models.ForeignKey(
        TypeConge, 
        on_delete=models.CASCADE
    )
    jours_acquis = models.DecimalField(max_digits=5, decimal_places=1, default=0.0)
    jours_pris = models.DecimalField(max_digits=5, decimal_places=1, default=0.0)

    class Meta:
        unique_together = ('employe', 'type_conge')

    @property
    def jours_restants(self):
        return self.jours_acquis - self.jours_pris

    def __str__(self):
        return f"Solde {self.type_conge.code} - {self.employe.user.last_name} : {self.jours_restants}j"

class DemandeConge(models.Model):
    STATUT_CHOICES = (
        ('BROUILLON', 'Brouillon'),
        ('SOUMIS', 'Soumis'),
        ('VALIDE_N1', 'Validé par Manager'),
        ('VALIDE_RH', 'Validé par RH'),
        ('REFUSE', 'Refusé'),
    )

    employe = models.ForeignKey(
        Employe, 
        on_delete=models.CASCADE, 
        related_name='demandes_conge'
    )
    type_conge = models.ForeignKey(
        TypeConge, 
        on_delete=models.CASCADE
    )
    date_debut = models.DateField()
    date_fin = models.DateField()
    motif = models.TextField(blank=True, null=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='BROUILLON')
    date_demande = models.DateTimeField(auto_now_add=True)
    
    valide_par_n1 = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='validations_n1'
    )
    valide_par_rh = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='validations_rh'
    )

    @property
    def duree_jours(self):
        # Durée brute en jours calendaires
        return (self.date_fin - self.date_debut).days + 1

    def __str__(self):
        return f"Demande {self.type_conge.code} du {self.date_debut} au {self.date_fin} ({self.get_statut_display()})"
