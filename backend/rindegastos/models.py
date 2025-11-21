from django.conf import settings
from django.db import models
from django.db.models import Sum
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


class CategoriaGasto(models.Model):
    cliente_servicio = models.ForeignKey(
        ServicioCliente,
        on_delete=models.CASCADE,
        related_name='categorias_gasto'
    )
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, default='')
    limite_monto = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Límite opcional por ítem en la categoría'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('cliente_servicio', 'nombre')
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} – {self.cliente_servicio}"


class ReporteGasto(models.Model):
    class Estado(models.TextChoices):
        BORRADOR = 'borrador', 'Borrador'
        EN_REVISION = 'en_revision', 'En revisión'
        APROBADO = 'aprobado', 'Aprobado'
        RECHAZADO = 'rechazado', 'Rechazado'

    cliente_servicio = models.ForeignKey(
        ServicioCliente,
        on_delete=models.CASCADE,
        related_name='reportes_gasto'
    )
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.BORRADOR)
    monto_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    moneda = models.CharField(
        max_length=10,
        choices=[('UF', 'UF'), ('USD', 'USD'), ('CLP', 'CLP')],
        default='CLP'
    )
    fecha_envio = models.DateTimeField(null=True, blank=True)
    comentario = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def puede_enviar(self):
        return self.estado == self.Estado.BORRADOR

    def puede_aprobar(self):
        return self.estado == self.Estado.EN_REVISION

    def puede_rechazar(self):
        return self.estado == self.Estado.EN_REVISION

    def mover_a_revision(self, usuario, comentario=''):
        if not self.puede_enviar():
            return False
        self.estado = self.Estado.EN_REVISION
        self.fecha_envio = timezone.now()
        self.save(update_fields=['estado', 'fecha_envio', 'updated_at'])
        EventoRindeGastos.objects.create(
            reporte=self,
            usuario=usuario,
            accion=EventoRindeGastos.Accion.ENVIAR,
            comentario=comentario,
        )
        return True

    def aprobar(self, usuario, comentario=''):
        if not self.puede_aprobar():
            return False
        self.estado = self.Estado.APROBADO
        self.save(update_fields=['estado', 'updated_at'])
        EventoRindeGastos.objects.create(
            reporte=self,
            usuario=usuario,
            accion=EventoRindeGastos.Accion.APROBAR,
            comentario=comentario,
        )
        return True

    def rechazar(self, usuario, comentario=''):
        if not self.puede_rechazar():
            return False
        self.estado = self.Estado.RECHAZADO
        self.save(update_fields=['estado', 'updated_at'])
        EventoRindeGastos.objects.create(
            reporte=self,
            usuario=usuario,
            accion=EventoRindeGastos.Accion.RECHAZAR,
            comentario=comentario,
        )
        return True

    def recompute_totales(self):
        total = self.items.aggregate(total=Sum('monto'))['total'] or 0
        self.monto_total = total
        self.save(update_fields=['monto_total', 'updated_at'])

    def __str__(self):
        return f"Reporte #{self.id} – {self.cliente_servicio}"


class ItemGasto(models.Model):
    reporte = models.ForeignKey(
        ReporteGasto,
        on_delete=models.CASCADE,
        related_name='items'
    )
    categoria = models.ForeignKey(
        CategoriaGasto,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='items'
    )
    monto = models.DecimalField(max_digits=14, decimal_places=2)
    moneda = models.CharField(
        max_length=10,
        choices=[('UF', 'UF'), ('USD', 'USD'), ('CLP', 'CLP')],
        default='CLP'
    )
    fecha = models.DateField()
    descripcion = models.TextField(blank=True, default='')
    adjunto = models.FileField(upload_to='rindegastos/adjuntos/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-fecha', '-created_at']

    def __str__(self):
        return f"Item {self.id} – Reporte {self.reporte_id}"


class EventoRindeGastos(models.Model):
    class Accion(models.TextChoices):
        ENVIAR = 'enviar', 'Enviar'
        APROBAR = 'aprobar', 'Aprobar'
        RECHAZAR = 'rechazar', 'Rechazar'
        ACTUALIZAR = 'actualizar', 'Actualizar'

    reporte = models.ForeignKey(
        ReporteGasto,
        on_delete=models.CASCADE,
        related_name='eventos'
    )
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    accion = models.CharField(max_length=20, choices=Accion.choices)
    comentario = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_accion_display()} por {self.usuario} en {self.created_at:%Y-%m-%d}"


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
