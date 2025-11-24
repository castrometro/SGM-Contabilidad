from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CentroCostoViewSet,
    CuentaGlobalViewSet,
    RendicionViewSet,
    TipoDocumentoViewSet,
    health,
)

router = DefaultRouter()
router.register(r'centros-costo', CentroCostoViewSet)
router.register(r'tipos-documento', TipoDocumentoViewSet)
router.register(r'cuentas-globales', CuentaGlobalViewSet)
router.register(r'rendiciones', RendicionViewSet)

urlpatterns = [
    path('health/', health, name='rindegastos-health'),
    path('', include(router.urls)),
]
