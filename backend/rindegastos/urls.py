from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CategoriaGastoViewSet,
    CentroCostoViewSet,
    CuentaGlobalViewSet,
    ItemGastoViewSet,
    RendicionViewSet,
    ReporteGastoViewSet,
    TipoDocumentoViewSet,
)

router = DefaultRouter()
router.register(r'centros-costo', CentroCostoViewSet)
router.register(r'categorias', CategoriaGastoViewSet)
router.register(r'tipos-documento', TipoDocumentoViewSet)
router.register(r'cuentas-globales', CuentaGlobalViewSet)
router.register(r'reportes', ReporteGastoViewSet)
router.register(r'items', ItemGastoViewSet)
router.register(r'rendiciones', RendicionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
