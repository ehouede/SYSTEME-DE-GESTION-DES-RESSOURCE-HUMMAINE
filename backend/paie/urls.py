from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BulletinPaieViewSet

router = DefaultRouter()
router.register('bulletins', BulletinPaieViewSet, basename='bulletins-paie')

urlpatterns = [
    path('', include(router.urls)),
]
