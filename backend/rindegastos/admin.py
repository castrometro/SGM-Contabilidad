from django.contrib import admin

from .models import CentroCosto, CuentaGlobal, Rendicion, TipoDocumento


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


@admin.register(CuentaGlobal)
class CuentaGlobalAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'tipo', 'cliente_servicio', 'created_at')
    list_filter = ('tipo', 'cliente_servicio')
    search_fields = ('codigo', 'cliente_servicio__cliente__nombre')
    ordering = ('codigo',)

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
