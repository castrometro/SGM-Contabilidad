# 🔍 Ejemplos de Consultas: Activity Logging por Cierre

## 📊 Consultas Básicas

### 1. Ver toda la actividad de un cierre

```python
from nomina.models import ActivityEvent

cierre_id = 30

events = ActivityEvent.objects.filter(
    resource_type='cierre',
    resource_id=str(cierre_id)
).select_related('user', 'cliente').order_by('-timestamp')

for event in events:
    print(f"""
    Timestamp: {event.timestamp}
    Usuario: {event.user.email}
    Acción: {event.action}
    Detalles: {event.details}
    """)
```

**Output esperado:**
```
Timestamp: 2025-10-16 23:18:53
Usuario: cecilia.reyes@bdo.cl
Acción: modal_opened
Detalles: {'tarjeta': 'ingresos'}

Timestamp: 2025-10-16 23:18:52
Usuario: cecilia.reyes@bdo.cl
Acción: file_selected
Detalles: {'filename': 'ingresos.xlsx', 'filesize': 25600}
```

---

## 📈 Analytics por Cierre

### 2. Resumen de actividad

```python
from django.db.models import Count, Min, Max
from nomina.models import ActivityEvent

cierre_id = 30

stats = ActivityEvent.objects.filter(
    resource_type='cierre',
    resource_id=str(cierre_id)
).aggregate(
    total_eventos=Count('id'),
    primera_actividad=Min('timestamp'),
    ultima_actividad=Max('timestamp'),
    usuarios_unicos=Count('user_id', distinct=True)
)

print(f"""
📊 RESUMEN CIERRE {cierre_id}
=========================
Total eventos: {stats['total_eventos']}
Usuarios únicos: {stats['usuarios_unicos']}
Primera actividad: {stats['primera_actividad']}
Última actividad: {stats['ultima_actividad']}
""")
```

**Output:**
```
📊 RESUMEN CIERRE 30
=========================
Total eventos: 147
Usuarios únicos: 3
Primera actividad: 2025-10-16 08:30:15
Última actividad: 2025-10-16 23:18:53
```

---

### 3. Actividad más frecuente

```python
from django.db.models import Count

acciones = ActivityEvent.objects.filter(
    resource_type='cierre',
    resource_id='30'
).values('action').annotate(
    total=Count('id')
).order_by('-total')

print("🔥 TOP ACCIONES EN ESTE CIERRE:")
for accion in acciones:
    print(f"  {accion['action']:20s} → {accion['total']:3d} veces")
```

**Output:**
```
🔥 TOP ACCIONES EN ESTE CIERRE:
  modal_opened         →  45 veces
  file_selected        →  38 veces
  file_upload          →  25 veces
  polling_started      →  20 veces
  modal_closed         →  19 veces
```

---

### 4. Usuario más activo

```python
usuarios = ActivityEvent.objects.filter(
    resource_type='cierre',
    resource_id='30'
).values('user__email').annotate(
    total=Count('id')
).order_by('-total')

print("👥 USUARIOS MÁS ACTIVOS:")
for user in usuarios:
    print(f"  {user['user__email']:30s} → {user['total']:3d} eventos")
```

**Output:**
```
👥 USUARIOS MÁS ACTIVOS:
  cecilia.reyes@bdo.cl          → 120 eventos
  juan.perez@bdo.cl             →  18 eventos
  maria.gonzalez@bdo.cl         →   9 eventos
```

---

## ⏰ Consultas por Tiempo

### 5. Actividad de hoy

```python
from django.utils import timezone

hoy = timezone.now().date()

eventos_hoy = ActivityEvent.objects.filter(
    resource_type='cierre',
    resource_id='30',
    timestamp__date=hoy
).order_by('timestamp')

print(f"📅 ACTIVIDAD DE HOY ({hoy}):")
for e in eventos_hoy:
    hora = e.timestamp.strftime('%H:%M:%S')
    print(f"  {hora} - {e.user.email:30s} - {e.action}")
```

**Output:**
```
📅 ACTIVIDAD DE HOY (2025-10-16):
  08:30:15 - cecilia.reyes@bdo.cl       - session_started
  08:30:18 - cecilia.reyes@bdo.cl       - modal_opened
  08:30:25 - cecilia.reyes@bdo.cl       - file_selected
  08:30:30 - cecilia.reyes@bdo.cl       - file_upload
```

---

### 6. Actividad en la última hora

```python
from datetime import timedelta

hace_1_hora = timezone.now() - timedelta(hours=1)

eventos_recientes = ActivityEvent.objects.filter(
    resource_type='cierre',
    resource_id='30',
    timestamp__gte=hace_1_hora
).order_by('-timestamp')

print(f"⏰ ÚLTIMA HORA:")
for e in eventos_recientes[:10]:
    minutos = (timezone.now() - e.timestamp).seconds // 60
    print(f"  hace {minutos:2d}min - {e.action}")
```

**Output:**
```
⏰ ÚLTIMA HORA:
  hace  2min - modal_closed
  hace  3min - file_upload
  hace  5min - file_selected
  hace  8min - modal_opened
```

---

## 🎯 Consultas Específicas

### 7. ¿Cuándo se subió el último archivo?

```python
ultimo_upload = ActivityEvent.objects.filter(
    resource_type='cierre',
    resource_id='30',
    action='file_upload'
).order_by('-timestamp').first()

if ultimo_upload:
    print(f"""
    📤 ÚLTIMO ARCHIVO SUBIDO:
    Usuario: {ultimo_upload.user.email}
    Fecha: {ultimo_upload.timestamp}
    Archivo: {ultimo_upload.details.get('filename', 'N/A')}
    """)
```

---

### 8. ¿Cuántas veces se abrió cada modal?

```python
modales = ActivityEvent.objects.filter(
    resource_type='cierre',
    resource_id='30',
    action='modal_opened'
).values('details__tarjeta').annotate(
    total=Count('id')
).order_by('-total')

print("📋 MODALES MÁS ABIERTOS:")
for m in modales:
    tarjeta = m['details__tarjeta'] or 'sin_especificar'
    print(f"  {tarjeta:20s} → {m['total']:2d} veces")
```

**Output:**
```
📋 MODALES MÁS ABIERTOS:
  ingresos             → 15 veces
  finiquitos           → 12 veces
  incidencias          →  8 veces
  movimientos_mes      →  6 veces
```

---

### 9. Timeline de sesión de usuario

```python
session_id = 's_1729117133123_abc123'

timeline = ActivityEvent.objects.filter(
    resource_type='cierre',
    resource_id='30',
    session_id=session_id
).order_by('timestamp')

print(f"🕐 TIMELINE SESIÓN {session_id[:20]}...")
inicio = None
for e in timeline:
    if inicio is None:
        inicio = e.timestamp
    segundos = (e.timestamp - inicio).seconds
    print(f"  +{segundos:3d}s - {e.action}")
```

**Output:**
```
🕐 TIMELINE SESIÓN s_1729117133123_ab...
  +  0s - session_started
  +  3s - modal_opened
  +  8s - file_selected
  + 12s - file_upload
  + 15s - polling_started
  + 45s - polling_stopped
  + 48s - modal_closed
```

---

### 10. Errores en el cierre

```python
# Si guardas resultado='error' en events
errores = ActivityEvent.objects.filter(
    resource_type='cierre',
    resource_id='30',
    details__has_key='error'  # Si guardas errores en details
).order_by('-timestamp')

print("❌ ERRORES EN ESTE CIERRE:")
for e in errores:
    print(f"""
    Timestamp: {e.timestamp}
    Usuario: {e.user.email}
    Acción: {e.action}
    Error: {e.details.get('error', 'N/A')}
    """)
```

---

## 🔄 Comparar Cierres

### 11. Comparar actividad entre cierres

```python
from django.db.models import Count

cierres = ['28', '29', '30']

for cierre_id in cierres:
    stats = ActivityEvent.objects.filter(
        resource_type='cierre',
        resource_id=cierre_id
    ).aggregate(
        eventos=Count('id'),
        usuarios=Count('user_id', distinct=True)
    )
    
    print(f"Cierre {cierre_id}: {stats['eventos']:3d} eventos, {stats['usuarios']} usuarios")
```

**Output:**
```
Cierre 28: 156 eventos, 4 usuarios
Cierre 29: 142 eventos, 3 usuarios
Cierre 30: 147 eventos, 3 usuarios
```

---

## 📊 Report Completo

### 12. Reporte consolidado

```python
def generar_reporte_cierre(cierre_id):
    """Genera reporte completo de actividad de un cierre"""
    
    from django.db.models import Count, Min, Max
    from django.utils import timezone
    
    events = ActivityEvent.objects.filter(
        resource_type='cierre',
        resource_id=str(cierre_id)
    )
    
    # Stats generales
    stats = events.aggregate(
        total=Count('id'),
        usuarios=Count('user_id', distinct=True),
        primera=Min('timestamp'),
        ultima=Max('timestamp')
    )
    
    # Top acciones
    top_acciones = events.values('action').annotate(
        total=Count('id')
    ).order_by('-total')[:5]
    
    # Top usuarios
    top_usuarios = events.values('user__email').annotate(
        total=Count('id')
    ).order_by('-total')[:5]
    
    # Actividad por hora
    actividad_hora = events.extra(
        select={'hora': 'EXTRACT(hour FROM timestamp)'}
    ).values('hora').annotate(
        total=Count('id')
    ).order_by('hora')
    
    print(f"""
    ╔═══════════════════════════════════════════════════╗
    ║     REPORTE DE ACTIVIDAD - CIERRE {cierre_id:5s}       ║
    ╚═══════════════════════════════════════════════════╝
    
    📊 RESUMEN GENERAL
    ------------------
    Total eventos:    {stats['total']}
    Usuarios únicos:  {stats['usuarios']}
    Primera actividad: {stats['primera']}
    Última actividad:  {stats['ultima']}
    
    🔥 TOP 5 ACCIONES
    -----------------
    """)
    
    for i, acc in enumerate(top_acciones, 1):
        print(f"    {i}. {acc['action']:20s} ({acc['total']:3d} veces)")
    
    print("""
    👥 TOP 5 USUARIOS
    -----------------
    """)
    
    for i, usr in enumerate(top_usuarios, 1):
        print(f"    {i}. {usr['user__email']:30s} ({usr['total']:3d} eventos)")
    
    print("""
    ⏰ ACTIVIDAD POR HORA
    ---------------------
    """)
    
    for hora in actividad_hora:
        h = int(hora['hora'])
        barra = '█' * (hora['total'] // 5)
        print(f"    {h:02d}:00 {barra} ({hora['total']})")

# Usar función
generar_reporte_cierre(30)
```

---

## 🌐 Via REST API

### 13. Consultar desde cURL

```bash
# Obtener actividad del cierre 30
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://172.17.11.13:8000/api/nomina/activity-log/cierre/30/" | jq

# Con filtros adicionales
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://172.17.11.13:8000/api/nomina/activity-log/?resource_type=cierre&resource_id=30&days=1" | jq
```

---

## 💡 Tips

- Usa `select_related('user', 'cliente')` para optimizar queries
- Agrega índices si consultas frecuentemente por `action` o `session_id`
- Considera hacer limpieza de eventos antiguos (>90 días)
- Usa `details` JSON para guardar contexto específico sin agregar campos

---

**✅ Con estas queries puedes:**
- Auditar todo lo que pasó en un cierre
- Generar reportes de uso
- Identificar patrones de trabajo
- Detectar problemas y cuellos de botella
- Analizar comportamiento de usuarios
