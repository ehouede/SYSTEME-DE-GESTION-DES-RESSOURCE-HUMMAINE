from rest_framework import serializers
from .models import TypeConge, SoldeConge, DemandeConge
from personnel.serializers import EmployeSerializer

class TypeCongeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeConge
        fields = '__all__'

class SoldeCongeSerializer(serializers.ModelSerializer):
    type_conge_detail = TypeCongeSerializer(source='type_conge', read_only=True)
    employe_name = serializers.ReadOnlyField(source='employe.user.get_full_name')
    jours_restants = serializers.ReadOnlyField()

    class Meta:
        model = SoldeConge
        fields = ('id', 'employe', 'employe_name', 'type_conge', 'type_conge_detail', 
                  'jours_acquis', 'jours_pris', 'jours_restants')

class DemandeCongeSerializer(serializers.ModelSerializer):
    employe_detail = EmployeSerializer(source='employe', read_only=True)
    type_conge_detail = TypeCongeSerializer(source='type_conge', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    duree_jours = serializers.ReadOnlyField()

    class Meta:
        model = DemandeConge
        fields = ('id', 'employe', 'employe_detail', 'type_conge', 'type_conge_detail', 
                  'date_debut', 'date_fin', 'motif', 'statut', 'statut_display', 
                  'date_demande', 'valide_par_n1', 'valide_par_rh', 'duree_jours')
        read_only_fields = ('employe', 'statut', 'valide_par_n1', 'valide_par_rh')

    def validate(self, attrs):
        date_debut = attrs.get('date_debut')
        date_fin = attrs.get('date_fin')
        
        if date_debut > date_fin:
            raise serializers.ValidationError("La date de début doit être antérieure ou égale à la date de fin.")
            
        request = self.context.get('request')
        if not request or not request.user:
            raise serializers.ValidationError("Utilisateur non authentifié.")
            
        try:
            employe = request.user.employe_profile
        except AttributeError:
            raise serializers.ValidationError("L'utilisateur connecté n'a pas de profil Employé.")
            
        type_conge = attrs.get('type_conge')
        duree = (date_fin - date_debut).days + 1
        
        # Trouver ou créer le solde de congés
        solde, created = SoldeConge.objects.get_or_create(
            employe=employe,
            type_conge=type_conge,
            defaults={'jours_acquis': 0.0, 'jours_pris': 0.0}
        )
        
        # On vérifie le solde uniquement si le type de congé l'exige et que la demande est soumise
        statut = attrs.get('statut', 'BROUILLON')
        type_conge = attrs.get('type_conge')
        requires_check = True
        if type_conge is not None:
            # certain types (ex: congé sans solde, exceptionnel) peuvent ne pas exiger de solde
            requires_check = getattr(type_conge, 'verifier_solde', True)

        if statut == 'SOUMIS' and requires_check and solde.jours_restants < duree:
            raise serializers.ValidationError(
                f"Solde insuffisant pour ce type de congé. Disponible : {solde.jours_restants} jours, Demandé : {duree} jours."
            )
            
        return attrs
        
    def create(self, validated_data):
        # Assigner l'employé connecté
        request = self.context.get('request')
        validated_data['employe'] = request.user.employe_profile
        return super().create(validated_data)
