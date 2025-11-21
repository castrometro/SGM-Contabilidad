from django.db import transaction
from django.db.models import QuerySet
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.models import ServicioCliente
from .models import CentroCosto, CategoriaGasto, ReporteGasto, ItemGasto
from .serializers import (
    CentroCostoSerializer,
    CategoriaGastoSerializer,
    ReporteGastoSerializer,
    ItemGastoSerializer,
)


def _cliente_servicios_permitidos(user) -> QuerySet:
    base_qs = ServicioCliente.objects.select_related('cliente', 'servicio')
    if user.is_superuser or getattr(user, 'tipo_usuario', None) in {'gerente', 'supervisor'}:
        return base_qs
    return base_qs.filter(cliente__asignaciones__usuario=user).distinct()


class BaseRindeGastosViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filterset_fields = ['cliente_servicio']

    def _filter_by_user(self, qs):
        allowed = _cliente_servicios_permitidos(self.request.user)
        return qs.filter(cliente_servicio__in=allowed).distinct()

    def get_queryset(self):
        qs = super().get_queryset()
        qs = self._filter_by_user(qs)
        cliente_servicio_id = self.request.query_params.get('cliente_servicio')
        if cliente_servicio_id:
            qs = qs.filter(cliente_servicio_id=cliente_servicio_id)
        return qs

    def perform_create(self, serializer):
        cliente_servicio = serializer.validated_data.get('cliente_servicio')
        allowed = _cliente_servicios_permitidos(self.request.user)
        if not allowed.filter(pk=getattr(cliente_servicio, 'pk', None)).exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No puedes operar sobre este servicio del cliente.')
        serializer.save()


class CentroCostoViewSet(BaseRindeGastosViewSet):
    queryset = CentroCosto.objects.all()
    serializer_class = CentroCostoSerializer


class CategoriaGastoViewSet(BaseRindeGastosViewSet):
    queryset = CategoriaGasto.objects.all()
    serializer_class = CategoriaGastoSerializer


class ReporteGastoViewSet(BaseRindeGastosViewSet):
    queryset = ReporteGasto.objects.select_related('cliente_servicio', 'usuario').prefetch_related('items', 'eventos')
    serializer_class = ReporteGastoSerializer

    def perform_create(self, serializer):
        cliente_servicio = serializer.validated_data.get('cliente_servicio')
        allowed = _cliente_servicios_permitidos(self.request.user)
        if not allowed.filter(pk=getattr(cliente_servicio, 'pk', None)).exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No puedes operar sobre este servicio del cliente.')
        serializer.save(usuario=self.request.user)

    @action(detail=True, methods=['post'])
    def enviar(self, request, pk=None):
        reporte = self.get_object()
        comentario = request.data.get('comentario', '')
        if not reporte.mover_a_revision(usuario=request.user, comentario=comentario):
            return Response({'error': 'El reporte debe estar en borrador para enviarse.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(self.get_serializer(reporte).data)

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        reporte = self.get_object()
        comentario = request.data.get('comentario', '')
        if not reporte.aprobar(usuario=request.user, comentario=comentario):
            return Response({'error': 'Solo se pueden aprobar reportes en revisión.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(self.get_serializer(reporte).data)

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        reporte = self.get_object()
        comentario = request.data.get('comentario', '')
        if not reporte.rechazar(usuario=request.user, comentario=comentario):
            return Response({'error': 'Solo se pueden rechazar reportes en revisión.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(self.get_serializer(reporte).data)


class ItemGastoViewSet(BaseRindeGastosViewSet):
    queryset = ItemGasto.objects.select_related('reporte', 'categoria', 'reporte__cliente_servicio')
    serializer_class = ItemGastoSerializer

    def perform_create(self, serializer):
        reporte = serializer.validated_data['reporte']
        allowed = _cliente_servicios_permitidos(self.request.user)
        if not allowed.filter(pk=reporte.cliente_servicio_id).exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No puedes operar sobre este servicio del cliente.')
        with transaction.atomic():
            item = serializer.save()
            reporte.recompute_totales()
        return item

    def perform_update(self, serializer):
        item = serializer.save()
        item.reporte.recompute_totales()
        return item

    def perform_destroy(self, instance):
        reporte = instance.reporte
        super().perform_destroy(instance)
        reporte.recompute_totales()
