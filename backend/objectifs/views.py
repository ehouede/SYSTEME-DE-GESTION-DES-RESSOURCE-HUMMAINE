from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db import models
from .models import Objectif
from .serializers import ObjectifSerializer
from accounts.permissions import EstRH, EstManagerOuPlus, EstProprietaireOuRH

class ObjectifViewSet(viewsets.ModelViewSet):
    serializer_class = ObjectifSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['RH', 'ADMIN']:
            return Objectif.objects.all()
        elif user.role == 'MANAGER':
            return Objectif.objects.filter(
                models.Q(employe__user=user) | 
                models.Q(employe__service__manager=user)
            ).distinct()
        try:
            return Objectif.objects.filter(employe__user=user)
        except AttributeError:
            return Objectif.objects.none()

    def perform_create(self, serializer):
        serializer.save(cree_par=self.request.user)

    def update(self, request, *args, **kwargs):
        # Restriction pour les employés simples : ils ne peuvent modifier QUE le champ 'progression'
        user = request.user
        instance = self.get_object()
        
        if user.role not in ['RH', 'ADMIN', 'MANAGER']:
            # C'est un employé simple
            if instance.employe.user != user:
                return Response(
                    {"detail": "Vous ne pouvez pas modifier cet objectif."}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Permettre uniquement la modification de la progression
            progression = request.data.get('progression')
            if progression is not None:
                instance.progression = int(progression)
                instance.save()
                return Response(ObjectifSerializer(instance).data)
            else:
                return Response(
                    {"detail": "Vous pouvez uniquement mettre à jour la progression (0-100%)."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        return super().update(request, *args, **kwargs)
