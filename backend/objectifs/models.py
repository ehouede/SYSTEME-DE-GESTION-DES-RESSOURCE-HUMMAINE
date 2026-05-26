from django.db import models
from django.conf import settings
from personnel.models import Employe

class Objectif(models.Model):
    STATUT_CHOICES = (
        ('NON_COMMENCE', 'Non commencé'),
        ('EN_COURS', 'En cours'),
        ('TERMINE', 'Terminé'),
        ('ANNULE', 'Annulé'),
    )

    employe = models.ForeignKey(
        Employe, 
        on_delete=models.CASCADE, 
        related_name='objectifs'
    )
    titre = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    date_limite = models.DateField()
    progression = models.IntegerField(default=0)  # De 0 à 100
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='NON_COMMENCE')
    
    cree_par = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='objectifs_crees'
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Mettre à jour automatiquement le statut en fonction de la progression
        if self.progression >= 100:
            self.statut = 'TERMINE'
            self.progression = 100
        elif self.progression > 0 and self.statut == 'NON_COMMENCE':
            self.statut = 'EN_COURS'
        elif self.progression == 0 and self.statut == 'EN_COURS':
            self.statut = 'NON_COMMENCE'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.titre} - {self.employe.user.last_name} ({self.progression}%)"
