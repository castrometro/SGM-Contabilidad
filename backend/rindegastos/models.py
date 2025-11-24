from django.conf import settings
from django.db import models
from django.utils import timezone

from api.models import ServicioCliente


class TipoDocumento(models.Model):
    cliente_servicio = models.ForeignKey(
        ServicioCliente,
        on_delete=models.CASCADE,
        related_name='tipos_documento'
    )
    codigo = models.CharField(max_length=30)
    nombre = models.CharField(max_length=150)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('cliente_servicio', 'codigo')
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.codigo}) – {self.cliente_servicio}"


class CentroCosto(models.Model):
    cliente_servicio = models.ForeignKey(
        ServicioCliente,
        on_delete=models.CASCADE,
        related_name='centros_costo'
    )
    apodo = models.CharField(max_length=150)
    codigo = models.CharField(max_length=50, blank=True, default='')
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('cliente_servicio', 'apodo')
        ordering = ['apodo']

    def __str__(self):
        return f"{self.apodo} – {self.cliente_servicio}"

class CuentaGlobal(models.Model):
    class Tipo(models.TextChoices):
        IVA = 'IVA', 'IVA'
        GASTO = 'GASTO', 'Gasto'
        PROVEEDOR = 'PROVEEDOR', 'Proveedores'

    cliente_servicio = models.ForeignKey(
        ServicioCliente,
        on_delete=models.CASCADE,
        related_name='cuentas_globales'
    )
    codigo = models.CharField(max_length=50)
    tipo = models.CharField(max_length=20, choices=Tipo.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('cliente_servicio', 'codigo')
        ordering = ['codigo']

    def __str__(self):
        return f"{self.codigo} – {self.get_tipo_display()} – {self.cliente_servicio}"


class Rendicion(models.Model):
    cliente_servicio = models.ForeignKey(
        ServicioCliente,
        on_delete=models.CASCADE,
        related_name='rendiciones'
    )
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    fecha_ejecucion = models.DateTimeField(default=timezone.now)
    datos_archivo = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-fecha_ejecucion']

    def __str__(self):
        return f"Rendición {self.id} – {self.cliente_servicio} – {self.fecha_ejecucion:%Y-%m-%d}"


class RendicionMovimiento(models.Model):
    id = models.BigAutoField(primary_key=True)
    rendicion = models.ForeignKey(
        Rendicion,
        on_delete=models.CASCADE,
        related_name='movimientos',
        db_column='rendicion_id',
    )

    class Meta:
        managed = False
        db_table = 'rindegastos_rendicionmovimiento'
        verbose_name = 'Movimiento de rendición'
        verbose_name_plural = 'Movimientos de rendición'
        ordering = ['-id']

    def __str__(self):
        return f"Movimiento {self.id} – Rendición {self.rendicion_id}"
