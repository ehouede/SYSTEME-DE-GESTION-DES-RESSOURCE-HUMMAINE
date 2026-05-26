from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TypeCongeViewSet, SoldeCongeViewSet, DemandeCongeViewSet

router = DefaultRouter()
router.register('types', TypeCongeViewSet, basename='types-conge')
router.register('soldes', SoldeCongeViewSet, basename='soldes-conge')
router.register('demandes', DemandeCongeViewSet, basename='demandes-conge')

urlpatterns = [
    path('', include(router.urls)),
]
