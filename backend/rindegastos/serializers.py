from rest_framework import serializers

from api.models import ServicioCliente
from .models import (
    CategoriaGasto,
    CentroCosto,
    CuentaGlobal,
    EventoRindeGastos,
    ItemGasto,
    Rendicion,
    ReporteGasto,
    TipoDocumento,
)


class TipoDocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoDocumento
        fields = [
            'id', 'cliente_servicio', 'codigo', 'nombre',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CentroCostoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CentroCosto
        fields = [
            'id', 'cliente_servicio', 'apodo', 'codigo', 'activo',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CategoriaGastoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaGasto
        fields = [
            'id', 'cliente_servicio', 'nombre', 'descripcion',
            'limite_monto', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ItemGastoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemGasto
        fields = [
            'id', 'reporte', 'categoria', 'monto', 'moneda', 'fecha',
            'descripcion', 'adjunto', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EventoRindeGastosSerializer(serializers.ModelSerializer):
    usuario_correo = serializers.EmailField(source='usuario.correo_bdo', read_only=True)

    class Meta:
        model = EventoRindeGastos
        fields = ['id', 'accion', 'comentario', 'usuario', 'usuario_correo', 'created_at']
        read_only_fields = ['id', 'created_at', 'usuario_correo']


class ReporteGastoSerializer(serializers.ModelSerializer):
    eventos = EventoRindeGastosSerializer(many=True, read_only=True)
    items = ItemGastoSerializer(many=True, read_only=True)
    usuario_correo = serializers.EmailField(source='usuario.correo_bdo', read_only=True)

    class Meta:
        model = ReporteGasto
        fields = [
            'id', 'cliente_servicio', 'usuario', 'usuario_correo', 'estado',
            'monto_total', 'moneda', 'fecha_envio', 'comentario',
            'created_at', 'updated_at', 'eventos', 'items'
        ]
        read_only_fields = [
            'id', 'monto_total', 'fecha_envio', 'created_at', 'updated_at',
            'eventos', 'items', 'usuario_correo'
        ]

    def validate_cliente_servicio(self, value: ServicioCliente):
        if value.estado != 'activo':
            raise serializers.ValidationError('El servicio del cliente debe estar activo para crear reportes.')
        return value


class CuentaGlobalSerializer(serializers.ModelSerializer):
    class Meta:
        model = CuentaGlobal
        fields = [
            'id', 'cliente_servicio', 'codigo', 'tipo',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class RendicionSerializer(serializers.ModelSerializer):
    usuario_correo = serializers.EmailField(source='usuario.correo_bdo', read_only=True)

    class Meta:
        model = Rendicion
        fields = [
            'id', 'cliente_servicio', 'usuario', 'usuario_correo',
            'fecha_ejecucion', 'datos_archivo', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'usuario_correo', 'created_at', 'updated_at']
