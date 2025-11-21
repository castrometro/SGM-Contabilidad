from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CentroCostoViewSet,
    CategoriaGastoViewSet,
    ReporteGastoViewSet,
    ItemGastoViewSet,
)

router = DefaultRouter()
router.register(r'centros-costo', CentroCostoViewSet)
router.register(r'categorias', CategoriaGastoViewSet)
router.register(r'reportes', ReporteGastoViewSet)
router.register(r'items', ItemGastoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
