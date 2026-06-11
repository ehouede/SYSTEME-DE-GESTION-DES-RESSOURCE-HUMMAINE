from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, RegisterSerializer, CustomTokenObtainPairSerializer, ChangeRoleSerializer
from .permissions import EstAdmin

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    """
    Vue de création de compte utilisateur, accessible à tout utilisateur authentifié.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.IsAuthenticated]

class LoginView(TokenObtainPairView):
    """
    Vue de connexion JWT personnalisée renvoyant le token d'accès, le token de rafraîchissement 
    et les informations de base de l'utilisateur.
    """
    serializer_class = CustomTokenObtainPairSerializer

class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Vue permettant à l'utilisateur connecté de voir et modifier ses informations de profil.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les utilisateurs.
    - Liste: Accessibles aux utilisateurs authentifiés
    - Détail: Accessibles aux utilisateurs authentifiés
    - Modification du rôle: Accessible uniquement aux ADMIN
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'change_role':
            return ChangeRoleSerializer
        return UserSerializer

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated, EstAdmin])
    def change_role(self, request, pk=None):
        """
        Action pour modifier le rôle d'un utilisateur.
        Accessible uniquement aux ADMIN.
        
        Body attendu:
        {
            "role": "EMPLOYE" | "MANAGER" | "RH" | "ADMIN"
        }
        
        Réponse:
        {
            "id": 1,
            "username": "john",
            "email": "john@example.com",
            "first_name": "John",
            "last_name": "Doe",
            "role": "RH",
            "role_display": "Ressources Humaines"
        }
        """
        user = self.get_object()
        new_role = request.data.get('role')
        
        # Valider le rôle
        valid_roles = ['EMPLOYE', 'MANAGER', 'RH', 'ADMIN']
        if not new_role or new_role not in valid_roles:
            return Response(
                {"error": f"Le rôle doit être l'un des suivants: {', '.join(valid_roles)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Empêcher l'utilisateur de changer son propre rôle
        if request.user.id == user.id:
            return Response(
                {"error": "Vous ne pouvez pas modifier votre propre rôle"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.role = new_role
        user.save()
        
        serializer = self.get_serializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
