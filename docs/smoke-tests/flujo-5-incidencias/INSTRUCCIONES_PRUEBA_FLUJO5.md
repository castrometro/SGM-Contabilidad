# INSTRUCCIONES DE PRUEBA - FLUJO 5: INCIDENCIAS

## 📋 Pre-requisitos

✅ Sistema ejecutándose:
- Backend Django: `http://172.17.11.13:8000`
- Frontend React: `http://172.17.11.18:5174`
- Celery workers activos (nomina_queue)

✅ Usuario de prueba:
- Email: `analista.nomina@bdo.cl`
- Password: (tu contraseña)
- Rol: Analista de Nómina

✅ Cierre abierto:
- Cliente: EMPRESA SMOKE TEST (RUT: 77.777.777-7)
- Período: 2025-10

---

## 🚀 Pasos de Ejecución

### 1. Limpiar datos anteriores

```bash
docker compose exec -T django python manage.py shell <<'PYEOF'
from nomina.models import ArchivoAnalistaUpload, AnalistaIncidencia

# Limpiar incidencias anteriores
incidencias_count = AnalistaIncidencia.objects.filter(cierre_id=35).count()
AnalistaIncidencia.objects.filter(cierre_id=35).delete()

# Limpiar uploads anteriores
uploads_count = ArchivoAnalistaUpload.objects.filter(
    tipo_archivo='incidencias',
    cierre_id=35
).count()
ArchivoAnalistaUpload.objects.filter(
    tipo_archivo='incidencias',
    cierre_id=35
).delete()

print(f"✅ Datos limpiados:")
print(f"   • {incidencias_count} incidencias eliminadas")
print(f"   • {uploads_count} uploads eliminados")
print(f"   → Listo para ejecutar Flujo 5")
PYEOF
```

### 2. Subir archivo desde el frontend

1. Abrir navegador: `http://172.17.11.18:5174`
2. Login con `analista.nomina@bdo.cl`
3. Ir a: **Nómina → Gestión de Cierres**
4. Abrir cierre: **EMPRESA SMOKE TEST - 2025-10**
5. Buscar la tarjeta: **"Ausentismos/Incidencias"**
6. Click en **"Seleccionar archivo"**
7. Seleccionar: `/root/SGM/docs/smoke-tests/flujo-5-incidencias/incidencias_smoke_test.xlsx`
8. Click en **"Subir Ausentismos/Incidencias"**

### 3. Verificar logs en frontend

Deberías ver 2 notificaciones:
- 🔵 **Info:** "Inicio de procesamiento" (process_start)
- 🟢 **Success:** "Procesamiento completado" (process_complete)

---

## ✅ Verificación de Resultados

Ejecutar este script después de subir el archivo:

```bash
docker compose exec -T django python manage.py shell <<'PYEOF'
from nomina.models import ArchivoAnalistaUpload, AnalistaIncidencia, TarjetaActivityLogNomina

print(f"\n{'='*70}")
print(f"🔍 VERIFICACIÓN - FLUJO 5 (INCIDENCIAS)")
print(f"{'='*70}\n")

# 1. Buscar el upload más reciente
upload = ArchivoAnalistaUpload.objects.filter(
    tipo_archivo='incidencias',
    cierre_id=35
).order_by('-id').first()

if not upload:
    print("❌ ERROR: No se encontró el upload")
    exit(1)

print(f"1️⃣ UPLOAD ENCONTRADO")
print(f"   • ID: {upload.id}")
print(f"   • Estado: {upload.estado}")
print(f"   • Analista: {str(upload.analista)}")

# 2. Verificar registros creados
incidencias = AnalistaIncidencia.objects.filter(archivo_origen=upload).order_by('rut')
print(f"\n2️⃣ REGISTROS CREADOS: {incidencias.count()}/6")

if incidencias.exists():
    for i, inc in enumerate(incidencias, 1):
        print(f"   {i}. {inc.rut} - {inc.nombre}")
        print(f"      Ausencia: {inc.fecha_inicio_ausencia} a {inc.fecha_fin_ausencia}")
        print(f"      Días: {inc.dias} | Tipo: {inc.tipo_ausentismo}")

# 3. Verificar fechas específicas
print(f"\n3️⃣ VERIFICACIÓN DE FECHAS:")
fechas_esperadas = {
    '19111111-1': ('2025-10-01', '2025-10-03', 3),
    '19222222-2': ('2025-10-05', '2025-10-07', 3),
    '19333333-3': ('2025-10-10', '2025-10-14', 5),
    '19444444-4': ('2025-10-15', '2025-10-16', 2),
    '19555555-5': ('2025-10-20', '2025-10-24', 5),
    '19666666-6': ('2025-10-25', '2025-10-27', 3)
}

fechas_ok = 0
for rut, (inicio_esp, fin_esp, dias_esp) in fechas_esperadas.items():
    inc = incidencias.filter(rut=rut).first()
    if inc:
        inicio_str = inc.fecha_inicio_ausencia.strftime('%Y-%m-%d')
        fin_str = inc.fecha_fin_ausencia.strftime('%Y-%m-%d')
        ok_inicio = '✅' if inicio_str == inicio_esp else '❌'
        ok_fin = '✅' if fin_str == fin_esp else '❌'
        ok_dias = '✅' if inc.dias == dias_esp else '❌'
        print(f"   {rut}:")
        print(f"      {ok_inicio} Inicio: {inicio_str} (esperado: {inicio_esp})")
        print(f"      {ok_fin} Fin: {fin_str} (esperado: {fin_esp})")
        print(f"      {ok_dias} Días: {inc.dias} (esperado: {dias_esp})")
        if inicio_str == inicio_esp and fin_str == fin_esp and inc.dias == dias_esp:
            fechas_ok += 1

# 4. Verificar logs
logs = TarjetaActivityLogNomina.objects.filter(
    tarjeta='analista_incidencias',
    cierre_id=35
).order_by('timestamp')

print(f"\n4️⃣ LOGS REGISTRADOS: {logs.count()}")
for log in logs:
    print(f"   • {log.accion} ({log.resultado}) - {log.timestamp.strftime('%H:%M:%S')}")

# RESUMEN
print(f"\n{'='*70}")
print(f"📊 RESUMEN:")
print(f"{'='*70}\n")

checks = 0
if upload.estado == 'procesado':
    print(f"✅ 1. Upload procesado")
    checks += 1
else:
    print(f"❌ 1. Upload: {upload.estado}")

if incidencias.count() == 6:
    print(f"✅ 2. Registros: 6/6")
    checks += 1
else:
    print(f"❌ 2. Registros: {incidencias.count()}/6")

if fechas_ok == 6:
    print(f"✅ 3. Fechas y días: 6/6 correctos")
    checks += 1
else:
    print(f"❌ 3. Fechas y días: {fechas_ok}/6")

if logs.count() >= 2:
    print(f"✅ 4. Logs: {logs.count()} eventos")
    checks += 1
else:
    print(f"❌ 4. Logs: {logs.count()}")

print(f"\n{'='*70}")
if checks == 4:
    print(f"🎉 ÉXITO: {checks}/4 verificaciones pasadas")
else:
    print(f"⚠️  PARCIAL: {checks}/4 verificaciones pasadas")
print(f"{'='*70}\n")
PYEOF
```

---

## 🔍 Verificaciones Detalladas

### Columnas procesadas correctamente

```sql
-- Verificar que todos los campos están poblados
SELECT 
    rut,
    nombre,
    fecha_inicio_ausencia,
    fecha_fin_ausencia,
    dias,
    tipo_ausentismo
FROM nomina_analistaincidencia
WHERE cierre_id = 35
ORDER BY rut;
```

### Tipos de ausentismo únicos

```bash
docker compose exec -T django python manage.py shell -c "
from nomina.models import AnalistaIncidencia
tipos = AnalistaIncidencia.objects.filter(cierre_id=35).values_list('tipo_ausentismo', flat=True).distinct()
print('Tipos de ausentismo procesados:')
for t in tipos:
    count = AnalistaIncidencia.objects.filter(cierre_id=35, tipo_ausentismo=t).count()
    print(f'  • {t}: {count} registro(s)')
"
```

---

## 🐛 Troubleshooting

### Error: "No se encontró el upload"
- Verifica que el archivo se subió correctamente desde el frontend
- Revisa logs de Celery: `docker compose logs celery_worker | tail -50`

### Error: "Registros incorrectos"
- Verifica el formato del Excel (6 columnas correctas)
- Revisa logs del backend: `docker compose logs django | tail -50`

### Error: "Fechas con desfase"
- Este error NO debería ocurrir (ya resuelto globalmente)
- Si ocurre, reportar como bug crítico

---

## 📊 Resultados Esperados

```
✅ 1. Upload procesado
✅ 2. Registros: 6/6
✅ 3. Fechas y días: 6/6 correctos
✅ 4. Logs: 2 eventos

🎉 ÉXITO: 4/4 verificaciones pasadas
```

---

**Nota:** Este es el último flujo de la suite de smoke tests de Archivos Analista.
