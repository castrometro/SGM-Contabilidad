from rest_framework import serializers
from .models import CentroCosto, CuentaGlobal, Rendicion, TipoDocumento


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
        read_only_fields = ['id', 'usuario', 'usuario_correo', 'created_at', 'updated_at']
