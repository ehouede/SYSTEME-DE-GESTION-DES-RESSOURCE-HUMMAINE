from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction, models
from .models import TypeConge, SoldeConge, DemandeConge
from .serializers import TypeCongeSerializer, SoldeCongeSerializer, DemandeCongeSerializer
from accounts.permissions import EstRH, EstManagerOuPlus, EstProprietaireOuRH

class TypeCongeViewSet(viewsets.ModelViewSet):
    queryset = TypeConge.objects.all()
    serializer_class = TypeCongeSerializer
    
    def get_permissions(self):
        # Allow anonymous read access to types (useful for public frontend forms)
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), EstRH()]
        return [permissions.IsAuthenticated()]

class SoldeCongeViewSet(viewsets.ModelViewSet):
    serializer_class = SoldeCongeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['RH', 'ADMIN']:
            return SoldeConge.objects.all()
        elif user.role == 'MANAGER':
            # Voir ses propres soldes + les soldes des employés de ses services managés
            return SoldeConge.objects.filter(
                models.Q(employe__user=user) | 
                models.Q(employe__service__manager=user)
            ).distinct()
        try:
            return SoldeConge.objects.filter(employe__user=user)
        except AttributeError:
            return SoldeConge.objects.none()

class DemandeCongeViewSet(viewsets.ModelViewSet):
    serializer_class = DemandeCongeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['RH', 'ADMIN']:
            return DemandeConge.objects.all()
        elif user.role == 'MANAGER':
            # Voir ses propres demandes + celles des employés sous sa responsabilité (N1)
            return DemandeConge.objects.filter(
                models.Q(employe__user=user) | 
                models.Q(employe__service__manager=user)
            ).distinct()
        try:
            return DemandeConge.objects.filter(employe__user=user)
        except AttributeError:
            return DemandeConge.objects.none()

    @action(detail=True, methods=['post'], url_path='soumettre')
    def soumettre(self, request, pk=None):
        demande = self.get_object()
        if demande.statut != 'BROUILLON':
            return Response(
                {"detail": "Seules les demandes en statut Brouillon peuvent être soumises."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Re-vérifier le solde de congés avant de soumettre si le type de congé l'exige
        requires_check = getattr(demande.type_conge, 'verifier_solde', True)
        if requires_check:
            solde, _ = SoldeConge.objects.get_or_create(
                employe=demande.employe,
                type_conge=demande.type_conge,
                defaults={'jours_acquis': 0.0, 'jours_pris': 0.0}
            )
            if solde.jours_restants < demande.duree_jours:
                return Response(
                    {"detail": f"Solde insuffisant. Restant : {solde.jours_restants}j, Demandé : {demande.duree_jours}j."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        demande.statut = 'SOUMIS'
        demande.save()
        return Response(
            {"detail": "Demande soumise avec succès !", "demande": DemandeCongeSerializer(demande).data}, 
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='valider')
    @transaction.atomic
    def valider(self, request, pk=None):
        demande = self.get_object()
        user = request.user

        if user.role not in ['MANAGER', 'RH', 'ADMIN']:
            return Response(
                {"detail": "Permissions insuffisantes pour valider une demande."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # 1. Validation Manager (N1)
        if user.role == 'MANAGER':
            if demande.statut != 'SOUMIS':
                return Response(
                    {"detail": "La demande doit être en statut Soumis pour validation N1."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            # S'assurer que le manager gère bien le service de l'employé
            if demande.employe.service.manager != user:
                return Response(
                    {"detail": "Vous n'êtes pas le manager de cet employé."}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            demande.statut = 'VALIDE_N1'
            demande.valide_par_n1 = user
            demande.save()
            return Response(
                {"detail": "Demande validée par le manager (N1).", "demande": DemandeCongeSerializer(demande).data}, 
                status=status.HTTP_200_OK
            )

        # 2. Validation RH ou Administrateur
        if user.role in ['RH', 'ADMIN']:
            # Permettre de valider si c'est SOUMIS ou VALIDE_N1 (les RH peuvent valider directement)
            if demande.statut not in ['SOUMIS', 'VALIDE_N1']:
                return Response(
                    {"detail": "La demande doit être en statut Soumis ou Validé N1 pour la validation RH."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            demande.statut = 'VALIDE_RH'
            demande.valide_par_rh = user
            demande.save()

            # Déduire les jours du solde
            solde, created = SoldeConge.objects.get_or_create(
                employe=demande.employe,
                type_conge=demande.type_conge,
                defaults={'jours_acquis': 0.0, 'jours_pris': 0.0}
            )
            solde.jours_pris += demande.duree_jours
            solde.save()

            return Response(
                {"detail": "Demande validée définitivement par les RH. Solde mis à jour.", "demande": DemandeCongeSerializer(demande).data}, 
                status=status.HTTP_200_OK
            )

    @action(detail=True, methods=['post'], url_path='refuser')
    def refuser(self, request, pk=None):
        demande = self.get_object()
        user = request.user

        if user.role not in ['MANAGER', 'RH', 'ADMIN']:
            return Response(
                {"detail": "Permissions insuffisantes pour refuser une demande."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        if demande.statut in ['VALIDE_RH', 'REFUSE']:
            return Response(
                {"detail": "Cette demande a déjà été traitée de manière définitive."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Si manager, vérifier qu'il est bien le manager de l'employé
        if user.role == 'MANAGER' and demande.employe.service.manager != user:
            return Response(
                {"detail": "Vous n'êtes pas le manager de cet employé."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        demande.statut = 'REFUSE'
        # On peut stocker qui a refusé dans un champ de log ou de commentaire si souhaité
        demande.save()
        return Response(
            {"detail": "Demande de congé refusée.", "demande": DemandeCongeSerializer(demande).data}, 
            status=status.HTTP_200_OK
        )
