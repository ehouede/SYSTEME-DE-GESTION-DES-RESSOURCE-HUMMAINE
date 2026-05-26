from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
import datetime
from .models import Pointage
from personnel.models import Employe
from .serializers import PointageSerializer

class PointageViewSet(viewsets.ModelViewSet):
    serializer_class = PointageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['RH', 'ADMIN', 'MANAGER']:
            return Pointage.objects.all()
        # L'employé voit uniquement ses propres pointages
        return Pointage.objects.filter(employe__user=user)

    @action(detail=False, methods=['post'], url_path='pointer')
    def pointer(self, request):
        user = request.user
        try:
            employe = user.employe_profile
        except AttributeError:
            return Response(
                {"detail": "Cet utilisateur n'a pas de profil Employé associé."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        aujourd_hui = timezone.localtime(timezone.now()).date()
        heure_actuelle = timezone.localtime(timezone.now()).time()

        pointage, created = Pointage.objects.get_or_create(
            employe=employe,
            date=aujourd_hui,
            defaults={'heure_arrivee': heure_actuelle}
        )

        if created:
            return Response(
                {
                    "detail": "Pointage d'arrivée enregistré avec succès.",
                    "pointage": PointageSerializer(pointage).data
                }, 
                status=status.HTTP_201_CREATED
            )
        else:
            if not pointage.heure_depart:
                pointage.heure_depart = heure_actuelle
                pointage.save()
                return Response(
                    {
                        "detail": "Pointage de départ enregistré avec succès.",
                        "pointage": PointageSerializer(pointage).data
                    }, 
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {
                        "detail": "Vous avez déjà pointé l'arrivée et le départ pour aujourd'hui.",
                        "pointage": PointageSerializer(pointage).data
                    }, 
                    status=status.HTTP_400_BAD_REQUEST
                )
