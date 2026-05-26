from rest_framework import serializers
from .models import BulletinPaie
from personnel.serializers import EmployeSerializer

class BulletinPaieSerializer(serializers.ModelSerializer):
    employe_detail = EmployeSerializer(source='employe', read_only=True)
    mois_display = serializers.SerializerMethodField()

    class Meta:
        model = BulletinPaie
        fields = ('id', 'employe', 'employe_detail', 'mois', 'mois_display', 'annee', 
                  'salaire_base', 'prime_transport', 'prime_anciennete', 'total_brut', 
                  'cotisation_cnss_salariale', 'cotisation_cnss_patronale', 'net_a_payer', 
                  'date_generation', 'fichier_pdf')
        read_only_fields = ('prime_anciennete', 'total_brut', 'cotisation_cnss_salariale', 
                            'cotisation_cnss_patronale', 'net_a_payer', 'fichier_pdf')

    def get_mois_display(self, obj):
        mois_list = [
            "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
            "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
        ]
        if 1 <= obj.mois <= 12:
            return mois_list[obj.mois - 1]
        return str(obj.mois)
