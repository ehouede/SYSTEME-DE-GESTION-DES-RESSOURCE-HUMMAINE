from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.crypto import get_random_string
from .models import Service, Employe, Contrat
from accounts.serializers import UserSerializer
from .pdf import generer_contrat_pdf
from django.core.files.base import ContentFile

User = get_user_model()

class ServiceSerializer(serializers.ModelSerializer):
    manager_name = serializers.ReadOnlyField(source='manager.get_full_name')

    class Meta:
        model = Service
        fields = ('id', 'nom', 'description', 'manager', 'manager_name')

class ContratSerializer(serializers.ModelSerializer):
    employe_name = serializers.ReadOnlyField(source='employe.user.get_full_name')
    type_contrat_display = serializers.CharField(source='get_type_contrat_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model = Contrat
        fields = ('id', 'employe', 'employe_name', 'type_contrat', 'type_contrat_display', 
                  'date_debut', 'date_fin', 'salaire_base', 'statut', 'statut_display', 'fichier_pdf')
        read_only_fields = ('fichier_pdf',)

class EmployeSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    service_detail = ServiceSerializer(source='service', read_only=True)
    contrat_actif = serializers.SerializerMethodField()

    class Meta:
        model = Employe
        fields = ('id', 'user', 'matricule', 'date_naissance', 'telephone', 'adresse', 'ifu', 
                  'service', 'service_detail', 'poste', 'date_embauche', 'salaire_base_saisi', 'contrat_actif')

    def get_contrat_actif(self, obj):
        contrat = obj.contrats.filter(statut='ACTIF').first()
        if contrat:
            return ContratSerializer(contrat).data
        return None

    @transaction.atomic
    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            user = instance.user
            for attr, value in user_data.items():
                # On ne permet pas de modifier le rôle via EmployeSerializer
                # Utilisez l'endpoint /api/accounts/users/{id}/change_role/ pour modifier le rôle
                if attr in ['email', 'first_name', 'last_name', 'telephone']:
                    setattr(user, attr, value)
            user.save()
        return super().update(instance, validated_data)

class EmployeCreateSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    username = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, style={'input_type': 'password'})
    user = UserSerializer(read_only=True)
    service_detail = ServiceSerializer(source='service', read_only=True)
    contrat_actif = serializers.SerializerMethodField()
    temp_password = serializers.SerializerMethodField()
    type_contrat = serializers.ChoiceField(choices=Contrat.TYPE_CONTRAT_CHOICES, write_only=True)
    date_debut = serializers.DateField(write_only=True)
    date_fin = serializers.DateField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Employe
        fields = (
            'id', 'matricule', 'date_naissance', 'telephone', 'adresse', 'ifu',
            'service', 'service_detail', 'poste', 'date_embauche', 'salaire_base_saisi',
            'first_name', 'last_name', 'email', 'username', 'password',
            'type_contrat', 'date_debut', 'date_fin',
            'user', 'contrat_actif', 'temp_password'
        )

    def validate_username(self, value):
        if value and User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà utilisé.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        # Extraire les données pour l'utilisateur
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        email = validated_data.pop('email')
        username = validated_data.pop('username', None) or email.split('@')[0]
        password = validated_data.pop('password', None)
        
        # Extraire les données du contrat
        type_contrat = validated_data.pop('type_contrat')
        date_debut = validated_data.pop('date_debut')
        date_fin = validated_data.pop('date_fin', None)
        
        # Génération ou validation du mot de passe
        if not password:
            password = get_random_string(10)
        self._temp_password = password

        # S'assurer de l'unicité du username
        if User.objects.filter(username=username).exists():
            username = f"{username}_{get_random_string(4)}"

        user = User.objects.create_user(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=password,
            role='EMPLOYE',
            telephone=validated_data['telephone']
        )
        
        # Créer l'employé
        employe = Employe.objects.create(user=user, **validated_data)
        
        # Créer le contrat actif
        contrat = Contrat.objects.create(
            employe=employe,
            type_contrat=type_contrat,
            date_debut=date_debut,
            date_fin=date_fin,
            salaire_base=validated_data['salaire_base_saisi'],
            statut='ACTIF'
        )
        
        # Générer le fichier PDF du contrat
        filename, pdf_content = generer_contrat_pdf(employe, contrat)
        contrat.fichier_pdf.save(filename, ContentFile(pdf_content), save=True)
        
        return employe

    def get_contrat_actif(self, obj):
        contrat = obj.contrats.filter(statut='ACTIF').first()
        if contrat:
            return ContratSerializer(contrat).data
        return None

    def get_temp_password(self, obj):
        return getattr(self, '_temp_password', None)
