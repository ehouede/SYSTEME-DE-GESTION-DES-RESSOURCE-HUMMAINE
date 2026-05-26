from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ObjectifViewSet

router = DefaultRouter()
router.register('', ObjectifViewSet, basename='objectifs')

urlpatterns = [
    path('', include(router.urls)),
]
