from django.test import TestCase
from django.contrib.auth import get_user_model
from personnel.models import Service, Employe
from pointage.models import Pointage
import datetime

User = get_user_model()

class PointageTest(TestCase):
    def setUp(self):
        self.rh = User.objects.create_user(username='diane', role='RH')
        self.emp_user = User.objects.create_user(username='fatima', role='EMPLOYE')
        
        self.service = Service.objects.create(nom="Technique", manager=self.rh)
        self.employe = Employe.objects.create(
            user=self.emp_user,
            matricule='EMP-001',
            date_naissance=datetime.date(1995, 6, 15),
            telephone='+22997123456',
            adresse='Cotonou',
            service=self.service,
            poste='Développeur',
            date_embauche=datetime.date(2022, 1, 15),
            salaire_base_saisi=350000.00
        )

    def test_pointage_present(self):
        # Arrivée à 7h45 (PRESENT)
        p = Pointage.objects.create(
            employe=self.employe,
            date=datetime.date.today(),
            heure_arrivee=datetime.time(7, 45, 0)
        )
        self.assertEqual(p.statut, 'PRESENT')

    def test_pointage_en_retard(self):
        # Arrivée à 8h15 (EN_RETARD)
        p = Pointage.objects.create(
            employe=self.employe,
            date=datetime.date.today(),
            heure_arrivee=datetime.time(8, 15, 0)
        )
        self.assertEqual(p.statut, 'EN_RETARD')
