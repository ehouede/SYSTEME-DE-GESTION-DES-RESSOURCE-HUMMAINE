from django.db import models
from personnel.models import Employe

class BulletinPaie(models.Model):
    employe = models.ForeignKey(
        Employe, 
        on_delete=models.CASCADE, 
        related_name='bulletins'
    )
    mois = models.IntegerField()  # 1 à 12
    annee = models.IntegerField()
    salaire_base = models.DecimalField(max_digits=12, decimal_places=2)
    prime_transport = models.DecimalField(max_digits=12, decimal_places=2, default=25000)
    prime_anciennete = models.DecimalField(max_digits=12, decimal_places=2)
    total_brut = models.DecimalField(max_digits=12, decimal_places=2)
    cotisation_cnss_salariale = models.DecimalField(max_digits=12, decimal_places=2)
    cotisation_cnss_patronale = models.DecimalField(max_digits=12, decimal_places=2)
    net_a_payer = models.DecimalField(max_digits=12, decimal_places=2)
    date_generation = models.DateTimeField(auto_now_add=True)
    fichier_pdf = models.FileField(upload_to='bulletins/', blank=True, null=True)

    class Meta:
        unique_together = ['employe', 'mois', 'annee']
        ordering = ['-annee', '-mois']

    def __str__(self):
        return f"Bulletin {self.mois}/{self.annee} - {self.employe.user.last_name}"
