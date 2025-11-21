from django.contrib import admin

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


@admin.register(TipoDocumento)
class TipoDocumentoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'cliente_servicio', 'created_at')
    search_fields = ('codigo', 'nombre', 'cliente_servicio__cliente__nombre')
    list_filter = ('cliente_servicio',)


@admin.register(CentroCosto)
class CentroCostoAdmin(admin.ModelAdmin):
    list_display = ('apodo', 'codigo', 'cliente_servicio', 'activo', 'created_at')
    list_filter = ('activo', 'cliente_servicio')
    search_fields = ('apodo', 'codigo', 'cliente_servicio__cliente__nombre')
    ordering = ('apodo',)


@admin.register(CategoriaGasto)
class CategoriaGastoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'cliente_servicio', 'limite_monto', 'created_at')
    list_filter = ('cliente_servicio',)
    search_fields = ('nombre', 'cliente_servicio__cliente__nombre')
    ordering = ('nombre',)


@admin.register(CuentaGlobal)
class CuentaGlobalAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'tipo', 'cliente_servicio', 'created_at')
    list_filter = ('tipo', 'cliente_servicio')
    search_fields = ('codigo', 'cliente_servicio__cliente__nombre')
    ordering = ('codigo',)


@admin.register(ReporteGasto)
class ReporteGastoAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'cliente_servicio',
        'usuario',
        'estado',
        'monto_total',
        'moneda',
        'fecha_envio',
        'created_at',
    )
    list_filter = ('estado', 'moneda', 'cliente_servicio')
    search_fields = (
        'id',
        'usuario__correo_bdo',
        'usuario__nombre',
        'usuario__apellido',
        'cliente_servicio__cliente__nombre',
    )
    ordering = ('-created_at',)


@admin.register(ItemGasto)
class ItemGastoAdmin(admin.ModelAdmin):
    list_display = ('id', 'reporte', 'categoria', 'monto', 'moneda', 'fecha', 'created_at')
    list_filter = ('moneda', 'categoria')
    search_fields = ('reporte__id', 'categoria__nombre', 'descripcion')
    date_hierarchy = 'fecha'
    ordering = ('-fecha', '-created_at')


@admin.register(EventoRindeGastos)
class EventoRindeGastosAdmin(admin.ModelAdmin):
    list_display = ('reporte', 'accion', 'usuario', 'comentario', 'created_at')
    list_filter = ('accion',)
    search_fields = (
        'reporte__id',
        'usuario__correo_bdo',
        'usuario__nombre',
        'usuario__apellido',
        'comentario',
    )
    ordering = ('-created_at',)


@admin.register(Rendicion)
class RendicionAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'cliente_servicio',
        'usuario',
        'fecha_ejecucion',
        'created_at',
    )
    list_filter = ('cliente_servicio',)
    search_fields = (
        'cliente_servicio__cliente__nombre',
        'usuario__correo_bdo',
        'usuario__nombre',
        'usuario__apellido',
    )
    ordering = ('-fecha_ejecucion',)
