# Capítulo 5: Servidor de Base de Datos Compartida

**Parte II: Infraestructura y Deployment**  
**Documento:** SGM Contabilidad - Documentación Completa v2.0  
**Fecha:** 28 de Noviembre de 2025  

---

## 5.1 Especificaciones y Contexto

### Servidor: vmbdobases (172.17.11.21)

**Hardware:**
```yaml
Nombre: vmbdobases
IP: 172.17.11.21
Tipo: Máquina Virtual (VMware vSphere)
Función: Servidor de Base de Datos Compartido

Recursos Estimados:
  CPU: 4+ cores (Intel Xeon)
  RAM: 8+ GB DDR4
  Disco: 200+ GB SSD
  Red: Gigabit Ethernet (1000 Mbps)

Nota: Servidor compartido con múltiples aplicaciones BDO
```

**Contexto de Uso:**
```yaml
Servidor Compartido:
  - Base de datos PostgreSQL 16
  - Múltiples bases de datos de diferentes aplicaciones
  - SGM es uno de varios clientes del servidor
  - Administrado por equipo de infraestructura BDO

SGM Database:
  - Nombre: sgm_db_dev
  - Usuario: sgm_user
  - Conexiones desde: 172.17.11.13, 172.17.11.22
  - Uso: Base de datos principal de aplicación
```

### Sistema Operativo

**Ubuntu Server LTS (Estimado)**
```bash
Sistema Operativo: Ubuntu 22.04 LTS o superior
Kernel: Linux 5.x
Arquitectura: x86_64

# Nota: Acceso limitado, servidor administrado por infraestructura
```

### Diferencias con Servidor de Monitoreo (172.17.11.14)

| Aspecto | vmbdobases (172.17.11.21) | vm-bdo-outcontab2 (172.17.11.14) |
|---------|---------------------------|----------------------------------|
| **Función Principal** | Base de datos de producción | Monitoreo y métricas |
| **PostgreSQL Version** | 16 (más reciente) | 14.19 |
| **Base de Datos** | sgm_db_dev (aplicación) | sgm_monitoring (métricas) |
| **Conexiones** | Django + Celery | postgres_exporter |
| **Hardware** | 4+ cores, 8+ GB RAM | 2 cores, 4 GB RAM |
| **Criticidad** | Alta (producción) | Media (monitoreo) |
| **Administración** | Equipo infraestructura | Equipo SGM |
| **Compartido** | Sí (múltiples apps) | No (dedicado SGM) |
| **Acceso** | Limitado, controlado | Completo (SSH, admin) |

---

## 5.2 PostgreSQL 16: Base de Datos Principal

### Versión y Características

```sql
-- PostgreSQL 16 características principales
PostgreSQL 16.x (Ubuntu)
Release: 2023 (versión estable más reciente)

Mejoras sobre PostgreSQL 14:
  ✅ Performance mejorado en queries complejos
  ✅ Paralelización más eficiente
  ✅ Mejor gestión de memoria
  ✅ Logical replication mejorado
  ✅ Monitoreo y estadísticas ampliadas
  ✅ Seguridad reforzada
```

### Base de Datos: sgm_db_dev

**Configuración:**
```sql
-- Información de la base de datos
Database Name: sgm_db_dev
Owner: sgm_user
Encoding: UTF8
Collate: en_US.UTF-8
Ctype: en_US.UTF-8

-- Tamaño estimado
Total Size: ~3-5 GB (crecimiento continuo)

-- Tablas principales
django_* (sistema Django)
api_* (clientes, usuarios)
rindegastos_* (registros de gastos)
```

**Estructura de Tablas (aproximada):**
```yaml
Tablas del Sistema (Django):
  - django_migrations: ~150 registros
  - django_session: ~100 registros activos
  - django_content_type: ~30 registros
  - auth_user: ~20 usuarios
  - auth_group: ~5 grupos
  - auth_permission: ~100 permisos

Tablas de Aplicación (API):
  - api_cliente: ~50 clientes
  - api_usuario: ~20 usuarios
  - api_asignacionusuariocliente: ~100 asignaciones

Tablas de RindeGastos:
  - rindegastos_cierrerindegastos: ~200 cierres
  - rindegastos_registrorindegastos: ~50,000 registros
  - rindegastos_empleado: ~1,000 empleados
  - rindegastos_clasificacioncuenta: ~500 clasificaciones

Tablas de Celery:
  - django_celery_results_taskresult: ~2,000 resultados (limpieza periódica)
```

### Conexión desde Aplicación

**Configuración en Django (settings.py):**
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'sgm_db_dev',
        'USER': 'sgm_user',
        'PASSWORD': 't2LShvMEC5nnbiCSQtzJtSyGiqt3HysI',
        'HOST': '172.17.11.21',
        'PORT': '5432',
        'CONN_MAX_AGE': 600,  # Connection pooling (10 minutos)
        'OPTIONS': {
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000'  # 30 segundos
        }
    }
}
```

**String de Conexión:**
```bash
# PostgreSQL connection string
postgresql://sgm_user:t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI@172.17.11.21:5432/sgm_db_dev

# Componentes:
# Protocolo: postgresql://
# Usuario: sgm_user
# Password: t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI
# Host: 172.17.11.21
# Puerto: 5432
# Base de datos: sgm_db_dev
```

### Pool de Conexiones

**Configuración Django:**
```python
# Connection pooling configuration
CONN_MAX_AGE = 600  # 10 minutos

# Django mantiene conexiones abiertas por 10 minutos
# Reduce overhead de conexión/desconexión constante
# Mejora performance en requests consecutivos
```

**Conexiones Activas Típicas:**
```yaml
Producción (172.17.11.13):
  Django workers (Gunicorn): 3 conexiones
  Celery workers: 10 conexiones
  Total: ~13 conexiones simultáneas

Desarrollo (172.17.11.22):
  Django workers: 2 conexiones
  Celery workers: 5 conexiones
  Total: ~7 conexiones simultáneas

Total SGM: ~20 conexiones concurrentes promedio
```

### Permisos de Usuario

**Usuario: sgm_user**
```sql
-- Permisos otorgados
GRANT CONNECT ON DATABASE sgm_db_dev TO sgm_user;
GRANT USAGE ON SCHEMA public TO sgm_user;
GRANT CREATE ON SCHEMA public TO sgm_user;

-- Permisos sobre tablas existentes
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sgm_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sgm_user;

-- Permisos por defecto para nuevas tablas (Django migrations)
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO sgm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT USAGE, SELECT ON SEQUENCES TO sgm_user;

-- Restricciones
-- ❌ NO es superuser
-- ❌ NO puede crear bases de datos
-- ❌ NO puede crear roles
-- ❌ NO tiene privilegios de replicación
```

---

## 5.3 Configuración de Acceso y Seguridad

### Autenticación y Autorización

**Método de Autenticación:**
```bash
# pg_hba.conf (administrado por infraestructura)
# TYPE  DATABASE        USER        ADDRESS             METHOD

# Conexión desde servidores de aplicación SGM
host    sgm_db_dev      sgm_user    172.17.11.13/32    md5
host    sgm_db_dev      sgm_user    172.17.11.22/32    md5

# Solo estas IPs pueden conectarse a sgm_db_dev con usuario sgm_user
```

**Fortaleza de Credenciales:**
```yaml
Usuario: sgm_user
Password: t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI

Características:
  - Longitud: 32 caracteres
  - Complejidad: Alfanumérica mixta
  - Entropía: ~190 bits
  - Generación: Base64 aleatorio
  - Almacenamiento: Variables de entorno (.env)
  - Rotación: Recomendada cada 90 días
```

### Firewall y Red

**Acceso de Red:**
```bash
# Servidor protegido en VPN corporativa
# Puerto 5432 accesible solo desde red interna

# IPs autorizadas para SGM:
172.17.11.13  # Producción
172.17.11.22  # Desarrollo

# Firewall (administrado por infraestructura):
# - Bloqueo de acceso externo
# - Solo IPs autorizadas en whitelist
# - Logs de intentos de conexión
```

**Configuración de Red en Aplicación:**
```python
# Django database host configuration
POSTGRES_HOST = os.environ.get('POSTGRES_HOST', '172.17.11.21')
POSTGRES_PORT = os.environ.get('POSTGRES_PORT', '5432')

# Timeout de conexión
'OPTIONS': {
    'connect_timeout': 10,  # 10 segundos para establecer conexión
}
```

### SSL/TLS

```yaml
Conexión SSL:
  Estado: Deshabilitado
  Justificación: Red interna confiable VPN
  
Configuración:
  sslmode: disable
  
Consideraciones:
  ✅ Red corporativa cerrada
  ✅ Firewall perimetral
  ✅ VPN corporativa obligatoria
  ❌ No expuesto a Internet
  
Recomendación futura:
  - Habilitar SSL para mayor seguridad
  - Certificados internos o Let's Encrypt
  - sslmode: require o verify-full
```

### Gestión de Credenciales

**Almacenamiento Seguro:**
```bash
# Variables de entorno en servidores de aplicación
# Archivo: /home/outcontab1/sgm-contabilidad/.env

POSTGRES_HOST=172.17.11.21
POSTGRES_PORT=5432
POSTGRES_DB=sgm_db_dev
POSTGRES_USER=sgm_user
POSTGRES_PASSWORD=t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI

# Permisos del archivo
chmod 600 .env
chown outcontab1:outcontab1 .env

# Backup de credenciales
# Ubicación: Fuera del repositorio Git
# Acceso: Solo administradores
```

**Procedimiento de Rotación de Password:**
```bash
#!/bin/bash
# Script de rotación de contraseña (ejecutar cada 90 días)

# 1. Generar nueva contraseña
NEW_PASSWORD=$(openssl rand -base64 32)

# 2. Coordinar con equipo de infraestructura
# Contacto: infraestructura@bdo.cl
# Solicitud: Cambio de password para sgm_user en vmbdobases

# 3. Actualizar password en PostgreSQL (por infraestructura)
# ALTER USER sgm_user PASSWORD '$NEW_PASSWORD';

# 4. Actualizar .env en servidores de aplicación
# Producción: 172.17.11.13
# Desarrollo: 172.17.11.22

# 5. Reiniciar servicios
docker compose restart django celery

# 6. Verificar conectividad
docker compose exec django python manage.py check --database default

# 7. Actualizar documentación
```

---

## 5.4 Optimización y Performance

### Índices de Base de Datos

**Índices Automáticos (Django ORM):**
```sql
-- Índices en Primary Keys (automáticos)
CREATE UNIQUE INDEX ON api_cliente(id);
CREATE UNIQUE INDEX ON rindegastos_registrorindegastos(id);

-- Índices en Foreign Keys (automáticos)
CREATE INDEX ON rindegastos_registrorindegastos(cierre_id);
CREATE INDEX ON api_asignacionusuariocliente(cliente_id);
CREATE INDEX ON api_asignacionusuariocliente(usuario_id);

-- Índices en campos únicos
CREATE UNIQUE INDEX ON auth_user(username);
CREATE UNIQUE INDEX ON api_cliente(codigo_cliente);
```

**Índices Personalizados (agregados manualmente):**
```sql
-- Índice para búsquedas por fecha de cierre
CREATE INDEX idx_cierre_fecha 
ON rindegastos_cierrerindegastos(fecha_cierre);

-- Índice compuesto para filtros comunes
CREATE INDEX idx_registro_cierre_fecha 
ON rindegastos_registrorindegastos(cierre_id, fecha_creacion);

-- Índice para búsqueda de empleados por RUT
CREATE INDEX idx_empleado_rut 
ON rindegastos_empleado(rut);

-- Índice para clasificaciones activas
CREATE INDEX idx_clasificacion_activa 
ON rindegastos_clasificacioncuenta(activa) 
WHERE activa = true;
```

**Análisis de Uso de Índices:**
```sql
-- Ver índices no utilizados
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE 'pg_toast%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Ver índices más usados
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 20;
```

### Connection Pooling

**Django Connection Management:**
```python
# settings.py
DATABASES = {
    'default': {
        # ...
        'CONN_MAX_AGE': 600,  # Mantener conexiones por 10 minutos
        'OPTIONS': {
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000'  # 30 seg timeout
        }
    }
}

# Beneficios:
# ✅ Reduce overhead de conexión/desconexión
# ✅ Mejora latencia de requests
# ✅ Optimiza uso de recursos
# ✅ Evita "connection storms"
```

**Celery Connection Management:**
```python
# Celery workers mantienen conexiones persistentes
# Cada worker = 1 conexión permanente a PostgreSQL
# Total: 10 workers (prod) + 3 gunicorn = 13 conexiones

# Configuración de timeout en tareas Celery
from celery import Task

class DatabaseTask(Task):
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        # Cerrar conexiones en caso de error
        from django.db import connection
        connection.close()
```

### Query Optimization

**Técnicas Implementadas:**
```python
# 1. Select Related (reduce queries en JOINs)
Cliente.objects.select_related('usuario').all()
# 1 query en lugar de N+1

# 2. Prefetch Related (reduce queries en relaciones inversas)
Cierre.objects.prefetch_related('registros').all()
# 2 queries en lugar de N+1

# 3. Only / Defer (cargar solo campos necesarios)
Cliente.objects.only('id', 'nombre', 'codigo_cliente')
# Reduce transferencia de datos

# 4. Bulk Operations (operaciones masivas)
RegistroRindeGastos.objects.bulk_create(registros, batch_size=1000)
# 1 query para 1000 inserts en lugar de 1000 queries

# 5. Annotate / Aggregate (cálculos en DB)
Cliente.objects.annotate(
    total_cierres=Count('cierrerindegastos')
)
# Cálculo en PostgreSQL, no en Python
```

**Análisis de Queries Lentas:**
```sql
-- Habilitar pg_stat_statements (si no está)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Ver queries más lentas
SELECT 
    query,
    calls,
    total_exec_time / 1000 AS total_seconds,
    mean_exec_time / 1000 AS mean_seconds,
    max_exec_time / 1000 AS max_seconds
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = 'sgm_db_dev')
  AND query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Cache Strategy

**Django Cache con Redis:**
```python
# Cache de queries frecuentes
from django.core.cache import cache

def get_clientes_activos():
    cache_key = 'clientes_activos'
    clientes = cache.get(cache_key)
    
    if clientes is None:
        clientes = Cliente.objects.filter(activo=True).values()
        cache.set(cache_key, clientes, timeout=300)  # 5 minutos
    
    return clientes

# Invalidación de cache
@receiver(post_save, sender=Cliente)
def invalidate_cliente_cache(sender, instance, **kwargs):
    cache.delete('clientes_activos')
```

**Cache en Celery Tasks:**
```python
# Cachear resultados de procesamiento
from celery import shared_task

@shared_task(bind=True)
def procesar_rinde_gastos(self, archivo_id):
    cache_key = f'resultado_rinde_{archivo_id}'
    
    # Verificar si ya está procesado
    resultado = cache.get(cache_key)
    if resultado:
        return resultado
    
    # Procesar...
    resultado = procesar_archivo(archivo_id)
    
    # Cachear por 1 hora
    cache.set(cache_key, resultado, timeout=3600)
    return resultado
```

---

## 5.5 Backup y Recuperación

### Estrategia de Backup

**Responsabilidad:**
```yaml
Backups Principales:
  - Responsable: Equipo de Infraestructura BDO
  - Frecuencia: Diaria
  - Retención: 30 días
  - Tipo: Backup completo del servidor
  - Ubicación: Storage empresarial
  
Backups Específicos SGM:
  - Responsable: Equipo SGM
  - Frecuencia: Semanal (manual)
  - Retención: 7 días
  - Tipo: pg_dump de sgm_db_dev
  - Ubicación: Servidor de aplicación
```

### Backup Manual (Equipo SGM)

**Script de Backup:**
```bash
#!/bin/bash
# /usr/local/bin/backup_sgm_db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/outcontab1/backups/database"
RETENTION_DAYS=7

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Backup completo de sgm_db_dev
PGPASSWORD='t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI' \
pg_dump -h 172.17.11.21 \
        -U sgm_user \
        -d sgm_db_dev \
        --format=custom \
        --compress=9 \
        --file=$BACKUP_DIR/sgm_db_$DATE.backup

# Backup en formato SQL (para inspección)
PGPASSWORD='t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI' \
pg_dump -h 172.17.11.21 \
        -U sgm_user \
        -d sgm_db_dev \
        --format=plain \
        | gzip > $BACKUP_DIR/sgm_db_$DATE.sql.gz

# Eliminar backups antiguos
find $BACKUP_DIR -name "sgm_db_*.backup" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "sgm_db_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Verificar backup
if [ -f "$BACKUP_DIR/sgm_db_$DATE.backup" ]; then
    SIZE=$(du -h "$BACKUP_DIR/sgm_db_$DATE.backup" | cut -f1)
    echo "✅ Backup exitoso: sgm_db_$DATE.backup ($SIZE)"
    
    # Verificar integridad
    pg_restore --list $BACKUP_DIR/sgm_db_$DATE.backup > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Integridad verificada"
    else
        echo "❌ ERROR: Backup corrupto" >&2
        exit 1
    fi
else
    echo "❌ ERROR: Backup falló" >&2
    exit 1
fi
```

**Programación con Cron:**
```bash
# Editar crontab
crontab -e

# Backup semanal (Domingos a las 2 AM)
0 2 * * 0 /usr/local/bin/backup_sgm_db.sh >> /var/log/sgm_backup.log 2>&1

# Verificación de backups (Lunes a las 8 AM)
0 8 * * 1 ls -lh /home/outcontab1/backups/database/ | tail -3
```

### Procedimiento de Restauración

**Restauración Completa:**
```bash
#!/bin/bash
# Script de restauración de base de datos

# ⚠️ PELIGRO: Este procedimiento elimina todos los datos actuales
# Solo ejecutar en caso de desastre o en ambiente de prueba

BACKUP_FILE="/home/outcontab1/backups/database/sgm_db_20251128_020000.backup"

echo "⚠️  ADVERTENCIA: Restauración destructiva"
echo "Base de datos: sgm_db_dev"
echo "Archivo: $BACKUP_FILE"
read -p "¿Continuar? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restauración cancelada"
    exit 0
fi

# 1. Detener aplicación
echo "1. Deteniendo servicios..."
cd /home/outcontab1/sgm-contabilidad
docker compose stop django celery

# 2. Terminar conexiones activas
echo "2. Terminando conexiones activas..."
PGPASSWORD='t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI' \
psql -h 172.17.11.21 -U sgm_user -d postgres <<EOF
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'sgm_db_dev'
  AND pid <> pg_backend_pid();
EOF

# 3. Drop y recrear base de datos (requiere permisos especiales)
# Nota: Esto debe ser coordinado con infraestructura
echo "3. Coordinando con infraestructura para drop/create..."
echo "   Contactar: infraestructura@bdo.cl"

# 4. Restaurar desde backup
echo "4. Restaurando desde backup..."
PGPASSWORD='t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI' \
pg_restore -h 172.17.11.21 \
           -U sgm_user \
           -d sgm_db_dev \
           --clean \
           --if-exists \
           --no-owner \
           --no-privileges \
           --verbose \
           $BACKUP_FILE

# 5. Verificar restauración
echo "5. Verificando restauración..."
PGPASSWORD='t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI' \
psql -h 172.17.11.21 -U sgm_user -d sgm_db_dev -c "
SELECT 
    COUNT(*) as total_tablas
FROM information_schema.tables
WHERE table_schema = 'public';
"

# 6. Aplicar migraciones pendientes
echo "6. Aplicando migraciones..."
docker compose run --rm django python manage.py migrate

# 7. Reiniciar servicios
echo "7. Reiniciando servicios..."
docker compose up -d

echo "✅ Restauración completada"
echo "Verificar manualmente:"
echo "  - Login de usuarios"
echo "  - Acceso a clientes"
echo "  - Procesamiento de archivos"
```

**Restauración Parcial (Tabla Específica):**
```bash
# Restaurar solo una tabla específica
PGPASSWORD='t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI' \
pg_restore -h 172.17.11.21 \
           -U sgm_user \
           -d sgm_db_dev \
           --table=rindegastos_registrorindegastos \
           --data-only \
           /path/to/backup.backup
```

### Backup de Datos Críticos

**Exportar Datos Específicos:**
```bash
# Exportar solo clientes
PGPASSWORD='t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI' \
psql -h 172.17.11.21 -U sgm_user -d sgm_db_dev -c "
COPY (SELECT * FROM api_cliente) 
TO STDOUT WITH CSV HEADER
" > clientes_backup.csv

# Exportar cierres de último mes
PGPASSWORD='t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI' \
psql -h 172.17.11.21 -U sgm_user -d sgm_db_dev -c "
COPY (
    SELECT * FROM rindegastos_cierrerindegastos 
    WHERE fecha_cierre >= CURRENT_DATE - INTERVAL '1 month'
) 
TO STDOUT WITH CSV HEADER
" > cierres_ultimo_mes.csv
```

---

## 5.6 Monitoreo y Diagnóstico

### Herramientas de Monitoreo

**Monitoreo Remoto desde 172.17.11.14:**
```yaml
Prometheus + Grafana:
  - Servidor: 172.17.11.14
  - postgres_exporter: Conectado a 172.17.11.21
  - Métricas: ~150 métricas de PostgreSQL
  - Dashboards: 3 dashboards Grafana
  - URL: http://172.17.11.14:3000

Métricas Monitoreadas:
  - Conexiones activas por base de datos
  - Transacciones por segundo
  - Cache hit ratio
  - Queries lentas
  - Tamaño de base de datos
  - Locks y deadlocks
```

### Queries de Diagnóstico

**Conexiones Activas:**
```sql
-- Ver conexiones activas a sgm_db_dev
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    state_change,
    LEFT(query, 50) as query_preview
FROM pg_stat_activity
WHERE datname = 'sgm_db_dev'
ORDER BY query_start DESC;
```

**Estadísticas de Base de Datos:**
```sql
-- Estadísticas generales
SELECT 
    numbackends AS conexiones,
    xact_commit AS commits,
    xact_rollback AS rollbacks,
    blks_read AS lecturas_disco,
    blks_hit AS lecturas_cache,
    ROUND(100.0 * blks_hit / NULLIF(blks_hit + blks_read, 0), 2) AS cache_hit_ratio,
    tup_returned AS filas_retornadas,
    tup_fetched AS filas_obtenidas,
    tup_inserted AS filas_insertadas,
    tup_updated AS filas_actualizadas,
    tup_deleted AS filas_eliminadas
FROM pg_stat_database
WHERE datname = 'sgm_db_dev';
```

**Tamaño de Tablas:**
```sql
-- Ver tamaño de cada tabla
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - 
                   pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
```

**Locks y Bloqueos:**
```sql
-- Ver locks activos
SELECT 
    l.pid,
    l.mode,
    l.locktype,
    l.relation::regclass AS table,
    a.usename,
    a.query_start,
    a.state,
    LEFT(a.query, 100) AS query
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE l.database = (SELECT oid FROM pg_database WHERE datname = 'sgm_db_dev')
  AND NOT l.granted
ORDER BY a.query_start;
```

**Vacuum y Autovacuum:**
```sql
-- Estado de vacuum por tabla
SELECT 
    schemaname,
    tablename,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze,
    vacuum_count,
    autovacuum_count,
    n_live_tup AS filas_vivas,
    n_dead_tup AS filas_muertas
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_dead_tup DESC
LIMIT 20;
```

### Scripts de Diagnóstico Rápido

**Script de Health Check:**
```bash
#!/bin/bash
# /usr/local/bin/check_sgm_db.sh

echo "=== SGM Database Health Check ==="
echo "Fecha: $(date)"
echo ""

# Test de conexión
echo "1. Test de Conexión:"
PGPASSWORD='t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI' \
psql -h 172.17.11.21 -U sgm_user -d sgm_db_dev -c "SELECT 'OK' as status;" 2>&1 | grep -q "OK"

if [ $? -eq 0 ]; then
    echo "   ✅ Conexión exitosa"
else
    echo "   ❌ Error de conexión"
    exit 1
fi

# Conexiones activas
echo ""
echo "2. Conexiones Activas:"
PGPASSWORD='t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI' \
psql -h 172.17.11.21 -U sgm_user -d sgm_db_dev -t -c "
SELECT COUNT(*) || ' conexiones activas' 
FROM pg_stat_activity 
WHERE datname = 'sgm_db_dev';"

# Cache hit ratio
echo ""
echo "3. Cache Hit Ratio:"
PGPASSWORD='t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI' \
psql -h 172.17.11.21 -U sgm_user -d sgm_db_dev -t -c "
SELECT ROUND(100.0 * blks_hit / NULLIF(blks_hit + blks_read, 0), 2) || '%'
FROM pg_stat_database
WHERE datname = 'sgm_db_dev';"

# Tamaño de base de datos
echo ""
echo "4. Tamaño de Base de Datos:"
PGPASSWORD='t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI' \
psql -h 172.17.11.21 -U sgm_user -d sgm_db_dev -t -c "
SELECT pg_size_pretty(pg_database_size('sgm_db_dev'));"

# Tabla más grande
echo ""
echo "5. Tabla Más Grande:"
PGPASSWORD='t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI' \
psql -h 172.17.11.21 -U sgm_user -d sgm_db_dev -t -c "
SELECT tablename || ' - ' || pg_size_pretty(pg_total_relation_size('public.' || tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.' || tablename) DESC
LIMIT 1;"

echo ""
echo "=== Health Check Completado ==="
```

**Ejecutar Health Check:**
```bash
# Manualmente
/usr/local/bin/check_sgm_db.sh

# Programar cada hora
# crontab -e
0 * * * * /usr/local/bin/check_sgm_db.sh >> /var/log/sgm_db_health.log 2>&1
```

---

## 5.7 Mantenimiento y Administración

### Coordinación con Infraestructura

**Contactos:**
```yaml
Equipo de Infraestructura BDO:
  Email: infraestructura@bdo.cl
  Responsable: [Nombre del responsable]
  
Procedimientos que requieren coordinación:
  - Cambios de contraseñas
  - Creación de nuevas bases de datos
  - Ajustes de configuración PostgreSQL
  - Expansión de recursos (CPU/RAM/Disco)
  - Mantenimiento programado
  - Migraciones de versión
  - Restauración de backups
```

### Tareas de Mantenimiento Regulares

**Semanal (Ejecutado por SGM):**
```bash
# Backup manual
/usr/local/bin/backup_sgm_db.sh

# Análisis de tablas
PGPASSWORD='t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI' \
psql -h 172.17.11.21 -U sgm_user -d sgm_db_dev -c "ANALYZE;"

# Limpieza de resultados antiguos de Celery
PGPASSWORD='t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI' \
psql -h 172.17.11.21 -U sgm_user -d sgm_db_dev -c "
DELETE FROM django_celery_results_taskresult 
WHERE date_done < NOW() - INTERVAL '7 days';"
```

**Mensual (Coordinado con Infraestructura):**
```yaml
Tareas:
  - Revisión de espacio en disco
  - Análisis de queries lentas
  - Optimización de índices
  - Vacuum completo (si es necesario)
  - Revisión de logs de PostgreSQL
  - Actualización de estadísticas
```

### Migraciones de Django

**Aplicar Migraciones:**
```bash
# Desde servidor de aplicación (172.17.11.13)
cd /home/outcontab1/sgm-contabilidad

# Ver migraciones pendientes
docker compose exec django python manage.py showmigrations

# Aplicar migraciones
docker compose exec django python manage.py migrate

# Verificar
docker compose exec django python manage.py migrate --check
```

**Crear Migraciones:**
```bash
# Después de cambios en models.py
docker compose exec django python manage.py makemigrations

# Review de migración generada
docker compose exec django cat api/migrations/0XXX_auto_*.py

# Test en desarrollo primero (172.17.11.22)
# Luego aplicar en producción (172.17.11.13)
```

### Limpieza de Datos

**Script de Limpieza Periódica:**
```python
# backend/api/management/commands/cleanup_old_data.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from django_celery_results.models import TaskResult

class Command(BaseCommand):
    help = 'Limpia datos antiguos de la base de datos'

    def handle(self, *args, **options):
        # Eliminar resultados de Celery >7 días
        cutoff_date = timezone.now() - timedelta(days=7)
        deleted_count = TaskResult.objects.filter(
            date_done__lt=cutoff_date
        ).delete()[0]
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Eliminados {deleted_count} resultados antiguos de Celery'
            )
        )
```

**Ejecutar Limpieza:**
```bash
# Manual
docker compose exec django python manage.py cleanup_old_data

# Automático (cron en servidor de aplicación)
# crontab -e
0 4 * * * cd /home/outcontab1/sgm-contabilidad && docker compose exec -T django python manage.py cleanup_old_data
```

---

## 5.8 Troubleshooting

### Problemas Comunes

**1. Error de Conexión:**
```bash
# Síntoma
django.db.utils.OperationalError: could not connect to server

# Diagnóstico
ping 172.17.11.21  # Verificar conectividad de red
telnet 172.17.11.21 5432  # Verificar puerto abierto

# Soluciones
# - Verificar firewall
# - Verificar credenciales
# - Verificar que PostgreSQL esté corriendo
# - Contactar infraestructura
```

**2. Conexiones Agotadas:**
```bash
# Síntoma
FATAL: remaining connection slots are reserved

# Diagnóstico
PGPASSWORD='...' psql -h 172.17.11.21 -U sgm_user -d sgm_db_dev -c "
SELECT COUNT(*) FROM pg_stat_activity;"

# Solución
# - Reiniciar servicios Django/Celery
# - Revisar connection pooling
# - Coordinar aumento de max_connections con infraestructura
```

**3. Queries Lentas:**
```bash
# Síntoma
Timeout en requests, aplicación lenta

# Diagnóstico
PGPASSWORD='...' psql -h 172.17.11.21 -U sgm_user -d sgm_db_dev -c "
SELECT pid, query_start, state, LEFT(query, 100)
FROM pg_stat_activity
WHERE state = 'active' AND query_start < NOW() - INTERVAL '30 seconds';"

# Solución
# - Optimizar queries con select_related/prefetch_related
# - Agregar índices necesarios
# - Implementar cache
# - Analizar EXPLAIN de queries problemáticas
```

**4. Espacio en Disco:**
```bash
# Síntoma
ERROR: could not extend file... No space left on device

# Diagnóstico
PGPASSWORD='...' psql -h 172.17.11.21 -U sgm_user -d sgm_db_dev -c "
SELECT pg_size_pretty(pg_database_size('sgm_db_dev'));"

# Solución
# - Limpiar datos antiguos
# - Coordinar expansión de disco con infraestructura
# - Implementar políticas de retención
```

### Logs y Debugging

**Acceder a Logs de Django:**
```bash
# En servidor de aplicación
docker compose logs django --tail=100 --follow

# Filtrar errores de base de datos
docker compose logs django | grep -i "database\|postgresql\|connection"
```

**Habilitar Debug SQL en Django:**
```python
# settings.py (solo en desarrollo)
if DEBUG:
    LOGGING['loggers']['django.db.backends'] = {
        'handlers': ['console'],
        'level': 'DEBUG',
    }
```

### Comandos de Emergencia

**Terminar Conexión Problemática:**
```sql
-- Identificar PID de conexión problemática
SELECT pid, query_start, state, query
FROM pg_stat_activity
WHERE datname = 'sgm_db_dev'
  AND state = 'active';

-- Terminar conexión específica
SELECT pg_terminate_backend(12345);  -- Reemplazar 12345 con PID real
```

**Cancelar Query en Ejecución:**
```sql
-- Cancelar query sin terminar conexión
SELECT pg_cancel_backend(12345);
```

---

## Resumen del Capítulo 5

✅ **Servidor:** vmbdobases (172.17.11.21) - Compartido con múltiples aplicaciones BDO  
✅ **PostgreSQL:** Versión 16, base de datos sgm_db_dev  
✅ **Conexiones:** Desde 172.17.11.13 (prod) y 172.17.11.22 (dev)  
✅ **Seguridad:** Autenticación MD5, restricción por IP, VPN corporativa  
✅ **Backup:** Diario por infraestructura + semanal manual por equipo SGM  
✅ **Monitoreo:** Remoto desde 172.17.11.14 con Prometheus + Grafana  
✅ **Administración:** Coordinada entre equipo SGM e infraestructura BDO  

---

**📖 Navegación:**
- ⬅️ [Capítulo 4: Servidor de Base de Datos](./04_servidor_base_datos.md)
- 🏠 [Volver al Índice](../DOCUMENTACION_COMPLETA_SGM.md)
- ➡️ [Capítulo 6: Modelo de Datos](./06_modelo_datos.md)

---

**Documento generado para BDO Chile - SGM Contabilidad**  
**Última actualización:** 28 de Noviembre 2025
