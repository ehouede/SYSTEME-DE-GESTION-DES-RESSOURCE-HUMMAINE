from rest_framework import serializers
from .models import Objectif

class ObjectifSerializer(serializers.ModelSerializer):
    employe_name = serializers.ReadOnlyField(source='employe.user.get_full_name')
    cree_par_name = serializers.ReadOnlyField(source='cree_par.get_full_name')
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model = Objectif
        fields = ('id', 'employe', 'employe_name', 'titre', 'description', 
                  'date_limite', 'progression', 'statut', 'statut_display', 
                  'cree_par', 'cree_par_name', 'date_creation')
        read_only_fields = ('cree_par', 'date_creation')
