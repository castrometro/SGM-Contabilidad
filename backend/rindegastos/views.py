from django.db.models import QuerySet
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from api.models import ServicioCliente
from .models import CentroCosto, CuentaGlobal, Rendicion, TipoDocumento
from .serializers import (
    CentroCostoSerializer,
    CuentaGlobalSerializer,
    RendicionSerializer,
    TipoDocumentoSerializer,
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


class TipoDocumentoViewSet(BaseRindeGastosViewSet):
    queryset = TipoDocumento.objects.all()
    serializer_class = TipoDocumentoSerializer


class CuentaGlobalViewSet(BaseRindeGastosViewSet):
    queryset = CuentaGlobal.objects.all()
    serializer_class = CuentaGlobalSerializer


class RendicionViewSet(BaseRindeGastosViewSet):
    queryset = Rendicion.objects.select_related('cliente_servicio', 'usuario')
    serializer_class = RendicionSerializer

    def perform_create(self, serializer):
        cliente_servicio = serializer.validated_data.get('cliente_servicio')
        allowed = _cliente_servicios_permitidos(self.request.user)
        if not allowed.filter(pk=getattr(cliente_servicio, 'pk', None)).exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No puedes operar sobre este servicio del cliente.')

        serializer.save(usuario=self.request.user)


@api_view(['GET'])
@permission_classes([AllowAny])
def health(request):
    """Verifica que el servicio de RindeGastos esté operativo."""
    return Response(
        {
            'status': 'ok',
            'success': True,
            'message': 'Servicio RindeGastos operativo',
        },
        status=status.HTTP_200_OK,
    )
