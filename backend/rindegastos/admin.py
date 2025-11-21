from django.contrib import admin

from .models import (
    CategoriaGasto,
    CentroCosto,
    EventoRindeGastos,
    ItemGasto,
    ReporteGasto,
)


@admin.register(CentroCosto)
class CentroCostoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'codigo', 'cliente_servicio', 'activo', 'created_at')
    list_filter = ('activo', 'cliente_servicio')
    search_fields = ('nombre', 'codigo', 'cliente_servicio__cliente__nombre')
    ordering = ('nombre',)


@admin.register(CategoriaGasto)
class CategoriaGastoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'cliente_servicio', 'limite_monto', 'created_at')
    list_filter = ('cliente_servicio',)
    search_fields = ('nombre', 'cliente_servicio__cliente__nombre')
    ordering = ('nombre',)


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
