from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from .models import Service, Employe, Contrat
from .serializers import (
    ServiceSerializer, 
    EmployeSerializer, 
    EmployeCreateSerializer, 
    ContratSerializer
)
from accounts.permissions import EstRH, EstManagerOuPlus, EstProprietaireOuRH

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), EstRH()]
        return [permissions.IsAuthenticated()]

class EmployeViewSet(viewsets.ModelViewSet):
    queryset = Employe.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return EmployeCreateSerializer
        return EmployeSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        if self.action == 'destroy':
            return [permissions.IsAuthenticated(), EstRH()]
        return [permissions.IsAuthenticated(), EstProprietaireOuRH()]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['RH', 'ADMIN']:
            return Employe.objects.all()
        # Les employés ne voient que leur propre fiche
        return Employe.objects.filter(user=user)

    @action(detail=True, methods=['get'], url_path='contrat_pdf')
    def contrat_pdf(self, request, pk=None):
        employe = self.get_object()
        contrat = employe.contrats.filter(statut='ACTIF').first()
        if not contrat or not contrat.fichier_pdf:
            return Response(
                {"detail": "Aucun contrat actif ou PDF trouvé pour cet employé."}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
        file_path = contrat.fichier_pdf.path
        if not os.path.exists(file_path):
            # Recréer le fichier s'il a disparu
            from .pdf import generer_contrat_pdf
            from django.core.files.base import ContentFile
            filename, pdf_content = generer_contrat_pdf(employe, contrat)
            contrat.fichier_pdf.save(filename, ContentFile(pdf_content), save=True)
            file_path = contrat.fichier_pdf.path
            
        with open(file_path, 'rb') as f:
            pdf_data = f.read()
            
        # Déterminer le content_type selon le fichier généré (HTML ou PDF)
        content_type = 'application/pdf' if file_path.endswith('.pdf') else 'text/html'
        
        response = HttpResponse(pdf_data, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_path)}"'
        return response

import os # Pour s'assurer que l'import est là
