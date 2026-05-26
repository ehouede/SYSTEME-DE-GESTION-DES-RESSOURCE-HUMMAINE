from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ServiceViewSet, EmployeViewSet

router = DefaultRouter()
router.register('services', ServiceViewSet, basename='services')
router.register('employes', EmployeViewSet, basename='employes')

urlpatterns = [
    path('', include(router.urls)),
]
