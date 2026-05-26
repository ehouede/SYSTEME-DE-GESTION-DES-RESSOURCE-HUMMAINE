from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PointageViewSet

router = DefaultRouter()
router.register('', PointageViewSet, basename='pointage')

urlpatterns = [
    path('', include(router.urls)),
]
