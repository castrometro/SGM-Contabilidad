from django.contrib import admin

from django.contrib import messages
from django.db import IntegrityError

from .models import (
    CentroCosto,
    CuentaGlobal,
    Rendicion,
    RendicionMovimiento,
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
    readonly_fields = ('fecha_ejecucion', 'datos_archivo', 'created_at', 'updated_at')
    date_hierarchy = 'fecha_ejecucion'
    ordering = ('-fecha_ejecucion',)

    def delete_queryset(self, request, queryset):
        try:
            super().delete_queryset(request, queryset)
        except IntegrityError:
            messages.error(
                request,
                'No se pueden eliminar rendiciones con movimientos asociados.',
            )


@admin.register(RendicionMovimiento)
class RendicionMovimientoAdmin(admin.ModelAdmin):
    list_display = ('id', 'rendicion')
    list_select_related = ('rendicion',)
    search_fields = ('rendicion__id',)
    readonly_fields = ('rendicion',)
    ordering = ('-id',)

    def has_add_permission(self, request):
        # No permitir crear movimientos manualmente desde admin
        return False

    def has_delete_permission(self, request, obj=None):
        # Permitir eliminación solo en cascada desde Rendicion
        # No bloquear delete_permission para superusers o staff
        return request.user.is_superuser or request.user.is_staff
    
    def has_change_permission(self, request, obj=None):
        # Solo lectura para usuarios normales
        return False
