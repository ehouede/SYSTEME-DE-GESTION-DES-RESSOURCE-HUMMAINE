from django.db import models
import datetime

class Pointage(models.Model):
    STATUT_CHOICES = (
        ('PRESENT', 'Présent'),
        ('EN_RETARD', 'En retard'),
        ('ABSENT', 'Absent'),
    )
    
    employe = models.ForeignKey(
        'personnel.Employe', 
        on_delete=models.CASCADE, 
        related_name='pointages'
    )
    date = models.DateField(default=datetime.date.today)
    heure_arrivee = models.TimeField(null=True, blank=True)
    heure_depart = models.TimeField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='ABSENT')

    class Meta:
        unique_together = ('employe', 'date')
        ordering = ['-date']

    def save(self, *args, **kwargs):
        if self.heure_arrivee:
            limite_heure = datetime.time(8, 0, 0)
            if self.heure_arrivee <= limite_heure:
                self.statut = 'PRESENT'
            else:
                self.statut = 'EN_RETARD'
        else:
            self.statut = 'ABSENT'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Pointage {self.employe.user.last_name} du {self.date} ({self.get_statut_display()})"
