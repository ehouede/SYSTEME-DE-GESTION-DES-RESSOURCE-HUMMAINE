from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.db import transaction
from decimal import Decimal
import os
from .models import BulletinPaie
from personnel.models import Employe
from .serializers import BulletinPaieSerializer
from .pdf import generer_bulletin_pdf
from django.core.files.base import ContentFile
from accounts.permissions import EstRH, EstProprietaireOuRH

class BulletinPaieViewSet(viewsets.ModelViewSet):
    serializer_class = BulletinPaieSerializer

    def get_permissions(self):
        if self.action in ['generer', 'destroy']:
            return [permissions.IsAuthenticated(), EstRH()]
        return [permissions.IsAuthenticated(), EstProprietaireOuRH()]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['RH', 'ADMIN']:
            return BulletinPaie.objects.all()
        try:
            return BulletinPaie.objects.filter(employe__user=user)
        except AttributeError:
            return BulletinPaie.objects.none()

    @action(detail=False, methods=['post'], url_path='generer')
    @transaction.atomic
    def generer(self, request):
        employe_id = request.data.get('employe')
        mois = request.data.get('mois')
        annee = request.data.get('annee')

        if not all([employe_id, mois, annee]):
            return Response(
                {"detail": "Veuillez fournir employe, mois et annee."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            mois = int(mois)
            annee = int(annee)
            if not (1 <= mois <= 12):
                raise ValueError("Mois invalide")
        except ValueError:
            return Response(
                {"detail": "Mois ou année invalide."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        employe = get_object_or_404(Employe, id=employe_id)

        # Vérifier si un bulletin existe déjà pour ce mois et cette année
        if BulletinPaie.objects.filter(employe=employe, mois=mois, annee=annee).exists():
            return Response(
                {"detail": f"Un bulletin de paie existe déjà pour cet employé pour la période {mois}/{annee}."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # CALCULS DE PAIE CONFORMES AU CODE DU TRAVAIL BÉNINOIS
        salaire_base = employe.salaire_base_saisi
        prime_transport = Decimal('25000.00')  # Forfaitaire
        
        # Prime d'ancienneté : 1% par année d'ancienneté
        anciennete_annees = max(0, annee - employe.date_embauche.year)
        taux_anciennete = Decimal(anciennete_annees) * Decimal('0.01')
        prime_anciennete = salaire_base * taux_anciennete

        # Total Brut
        total_brut = salaire_base + prime_transport + prime_anciennete

        # Cotisations CNSS
        cotisation_cnss_salariale = total_brut * Decimal('0.036')  # 3.6% part salariale
        cotisation_cnss_patronale = total_brut * Decimal('0.064')  # 6.4% part patronale

        # Net à Payer
        net_a_payer = total_brut - cotisation_cnss_salariale

        # Création de l'objet BulletinPaie (sans fichier PDF d'abord)
        bulletin = BulletinPaie(
            employe=employe,
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
        bulletin.save()

        # Génération du PDF
        filename, file_bytes = generer_bulletin_pdf(bulletin)
        bulletin.fichier_pdf.save(filename, ContentFile(file_bytes), save=True)

        return Response(
            {
                "detail": "Bulletin de paie généré avec succès.",
                "bulletin": BulletinPaieSerializer(bulletin).data
            }, 
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['get'], url_path='pdf')
    def telecharger_pdf(self, request, pk=None):
        bulletin = self.get_object()
        if not bulletin.fichier_pdf:
            return Response(
                {"detail": "Aucun fichier associé à ce bulletin de paie."}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
        file_path = bulletin.fichier_pdf.path
        if not os.path.exists(file_path):
            # Régénérer en cas de disparition du fichier
            filename, file_bytes = generer_bulletin_pdf(bulletin)
            bulletin.fichier_pdf.save(filename, ContentFile(file_bytes), save=True)
            file_path = bulletin.fichier_pdf.path

        with open(file_path, 'rb') as f:
            pdf_data = f.read()

        content_type = 'application/pdf' if file_path.endswith('.pdf') else 'text/html'
        
        response = HttpResponse(pdf_data, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_path)}"'
        return response

from django.shortcuts import get_object_or_404 # S'assurer de l'import
