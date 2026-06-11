from rest_framework import serializers
from .models import Pointage

class PointageSerializer(serializers.ModelSerializer):
    employe_name = serializers.ReadOnlyField(source='employe.user.get_full_name')
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model = Pointage
        fields = ('id', 'employe', 'employe_name', 'date', 'heure_arrivee', 'heure_depart', 'statut', 'statut_display', 'justifie')
        read_only_fields = ('employe', 'date', 'statut')
