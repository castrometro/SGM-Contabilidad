from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CentroCostoViewSet,
    CuentaGlobalViewSet,
    RendicionViewSet,
    TipoDocumentoViewSet,
    health,
)
from .views_procesamiento import (
    descargar_step1_rindegastos,
    estado_step1_rindegastos,
    leer_headers_excel_rindegastos,
    procesar_step1_rindegastos,
)

router = DefaultRouter()
router.register(r'centros-costo', CentroCostoViewSet)
router.register(r'tipos-documento', TipoDocumentoViewSet)
router.register(r'cuentas-globales', CuentaGlobalViewSet)
router.register(r'rendiciones', RendicionViewSet)

urlpatterns = [
    path('health/', health, name='rindegastos-health'),
    # Endpoints de procesamiento (migrados desde contabilidad)
    path('leer-headers/', leer_headers_excel_rindegastos, name='rg-leer-headers'),
    path('step1/iniciar/', procesar_step1_rindegastos, name='rg-step1-iniciar'),
    path('step1/estado/<str:task_id>/', estado_step1_rindegastos, name='rg-step1-estado'),
    path('step1/descargar/<str:task_id>/', descargar_step1_rindegastos, name='rg-step1-descargar'),
    path('', include(router.urls)),
]
