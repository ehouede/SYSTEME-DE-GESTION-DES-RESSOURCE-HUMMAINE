from django.test import TestCase
from django.contrib.auth import get_user_model
from personnel.models import Service, Employe, Contrat
from paie.models import BulletinPaie
import datetime
from decimal import Decimal

User = get_user_model()

class PaieCalculationsTest(TestCase):
    def setUp(self):
        # Créer les utilisateurs
        self.rh_user = User.objects.create_user(
            username='diane',
            email='diane@grhsuite.bj',
            password='password123',
            role='RH'
        )
        self.emp_user = User.objects.create_user(
            username='fatima',
            email='fatima@grhsuite.bj',
            password='password123',
            role='EMPLOYE'
        )
        
        # Créer service
        self.service = Service.objects.create(
            nom="Technique",
            manager=self.rh_user
        )
        
        # Créer employé embauché en 2022 (pour tester ancienneté de 4 ans en 2026)
        self.employe = Employe.objects.create(
            user=self.emp_user,
            matricule='EMP-001',
            date_naissance=datetime.date(1995, 6, 15),
            telephone='+22997123456',
            adresse='Cotonou',
            service=self.service,
            poste='Développeur',
            date_embauche=datetime.date(2022, 1, 15),
            salaire_base_saisi=Decimal('350000.00')
        )
        
        self.contrat = Contrat.objects.create(
            employe=self.employe,
            type_contrat='CDI',
            date_debut=datetime.date(2022, 1, 15),
            salaire_base=Decimal('350000.00'),
            statut='ACTIF'
        )

    def test_bulletin_generation_calculations(self):
        # Simuler génération pour Mai 2026 (Ancienneté = 2026 - 2022 = 4 ans)
        annee = 2026
        mois = 5
        
        salaire_base = self.employe.salaire_base_saisi
        prime_transport = Decimal('25000.00')
        
        anciennete = annee - self.employe.date_embauche.year
        self.assertEqual(anciennete, 4)
        
        prime_anciennete = salaire_base * Decimal(anciennete) * Decimal('0.01')
        self.assertEqual(prime_anciennete, Decimal('14000.00')) # 350000 * 0.04 = 14000
        
        total_brut = salaire_base + prime_transport + prime_anciennete
        self.assertEqual(total_brut, Decimal('389000.00')) # 350000 + 25000 + 14000 = 389000
        
        cotisation_cnss_salariale = total_brut * Decimal('0.036')
        self.assertEqual(cotisation_cnss_salariale, Decimal('14004.00')) # 389000 * 0.036 = 14004
        
        cotisation_cnss_patronale = total_brut * Decimal('0.064')
        self.assertEqual(cotisation_cnss_patronale, Decimal('24896.00')) # 389000 * 0.064 = 24896
        
        net_a_payer = total_brut - cotisation_cnss_salariale
        self.assertEqual(net_a_payer, Decimal('374996.00')) # 389000 - 14004 = 374996
        
        # Enregistrer et tester
        bulletin = BulletinPaie.objects.create(
            employe=self.employe,
            mois=mois,
            annee=annee,
            salaire_base=salaire_base,
            prime_transport=prime_transport,
            prime_anciennete=prime_anciennete,
            total_brut=total_brut,
            cotisation_cnss_salariale=cotisation_cnss_salariale,
            cotisation_cnss_patronale=cotisation_cnss_patronale,
            net_a_payer=net_a_payer
        )
        
        self.assertIsNotNone(bulletin.id)
        self.assertEqual(bulletin.net_a_payer, Decimal('374996.00'))
