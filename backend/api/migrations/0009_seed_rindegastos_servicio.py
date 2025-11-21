from django.db import migrations


def seed_rindegastos_servicio(apps, schema_editor):
    Area = apps.get_model('api', 'Area')
    Servicio = apps.get_model('api', 'Servicio')

    area, _ = Area.objects.get_or_create(nombre='RindeGastos')
    Servicio.objects.get_or_create(nombre='RindeGastos', defaults={'area': area})


def remove_rindegastos_servicio(apps, schema_editor):
    Servicio = apps.get_model('api', 'Servicio')
    Servicio.objects.filter(nombre='RindeGastos').delete()


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0008_serviciocliente_configuracion_serviciocliente_estado'),
    ]

    operations = [
        migrations.RunPython(seed_rindegastos_servicio, remove_rindegastos_servicio),
    ]
