from django.urls import path

from .views.rindegastos import (
    descargar_step1_rindegastos,
    estado_step1_rindegastos,
    leer_headers_excel_rindegastos,
    procesar_step1_rindegastos,
)

urlpatterns = [
    path("rindegastos/leer-headers/", leer_headers_excel_rindegastos, name="rg-leer-headers-conta"),
    path("rindegastos/step1/iniciar/", procesar_step1_rindegastos, name="rg-step1-iniciar"),
    path("rindegastos/step1/estado/<str:task_id>/", estado_step1_rindegastos, name="rg-step1-estado"),
    path("rindegastos/step1/descargar/<str:task_id>/", descargar_step1_rindegastos, name="rg-step1-descargar"),
]
