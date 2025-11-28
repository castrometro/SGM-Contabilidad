# Capítulo 4: Servidor de Base de Datos

**Parte II: Infraestructura y Deployment**  
**Documento:** SGM Contabilidad - Documentación Completa v2.0  
**Fecha:** 28 de Noviembre de 2025  

---

## 4.1 Especificaciones de Hardware y Sistema Operativo

### Servidor: vm-bdo-outcontab2 (172.17.11.14)

**Hardware:**
```yaml
Nombre: vm-bdo-outcontab2
IP: 172.17.11.14
Tipo: Máquina Virtual (VMware vSphere)
Función: Base de Datos PostgreSQL + Stack de Monitoreo

Recursos:
  CPU: 2 cores (Intel Xeon)
  RAM: 4 GB DDR4 (3.8 GB utilizables)
  Disco: 50 GB SSD
  Red: Gigabit Ethernet (1000 Mbps)

Capacidad de Crecimiento:
  CPU: Escalable hasta 4 cores
  RAM: Escalable hasta 8 GB
  Disco: Expandible hasta 200 GB
```

**Sistema Operativo:**
```bash
$ lsb_release -a
Distributor ID: Ubuntu
Description:    Ubuntu 22.04.5 LTS
Release:        22.04
Codename:       jammy

$ uname -a
Linux vm-bdo-outcontab2 5.15.0-119-generic #129-Ubuntu SMP x86_64 GNU/Linux
```

**Uso Actual de Recursos:**
```yaml
CPU:
  Uso promedio: 10-20%
  Picos: 30-40% (durante queries pesados)
  
RAM:
  Total: 3.8 GB
  PostgreSQL: ~1.2 GB (32%)
  Prometheus: ~283 MB (7%)
  Grafana: ~107 MB (3%)
  postgres_exporter: ~7.7 MB (<1%)
  Sistema operativo: ~500 MB (13%)
  Usado total: 2.1 GB (55%)
  Disponible: 1.7 GB (45%)

Disco:
  Total: 48 GB
  Usado: 9.5 GB (22%)
  /var/lib/postgresql: 3.2 GB (bases de datos)
  /var/lib/prometheus: 4.8 GB (métricas históricas)
  /var/lib/grafana: 1.1 GB (dashboards y configuración)
  /var/log: 0.4 GB (logs rotativos)
  Disponible: 38.5 GB (78%)

Red:
  Tráfico promedio: 10-30 Mbps
  Picos: 80-120 Mbps (backups o queries masivos)
  Conexiones concurrentes: 5-15 (PostgreSQL)
```

### Comparativa con Servidor Compartido (vmbdobases - 172.17.11.21)

**vm-bdo-outcontab2 (172.17.11.14):**
- **Uso:** Monitoreo exclusivo del sistema SGM
- **PostgreSQL:** 14.19 con base de datos `sgm_monitoring`
- **Stack Completo:** PostgreSQL + Prometheus + Grafana + postgres_exporter
- **Función:** Observabilidad y métricas del sistema

**vmbdobases (172.17.11.21):**
- **Uso:** Base de datos de producción compartida
- **PostgreSQL:** 16 con base de datos `sgm_db_dev`
- **Función:** Almacenamiento de datos de aplicación
- **Conexiones:** Django + Celery desde servidores de aplicación

| Aspecto | 172.17.11.14 (Monitoreo) | 172.17.11.21 (Producción) |
|---------|--------------------------|---------------------------|
| **Función** | Métricas y observabilidad | Datos de aplicación |
| **PostgreSQL** | 14.19 (sgm_monitoring) | 16 (sgm_db_dev) |
| **Stack Adicional** | Prometheus + Grafana | Ninguno |
| **Hardware** | 2 cores, 4GB RAM | 4+ cores, 8GB+ RAM |
| **Criticidad** | Media (monitoreo) | Alta (aplicación) |
| **Conexiones** | postgres_exporter | Django + Celery |

---

## 4.2 PostgreSQL: Configuración y Optimización

### Versión y Especificaciones

```bash
$ sudo -u postgres psql --version
psql (PostgreSQL) 14.19 (Ubuntu 14.19-0ubuntu0.22.04.1)

$ sudo -u postgres psql -c "SELECT version();"
PostgreSQL 14.19 (Ubuntu 14.19-0ubuntu0.22.04.1) on x86_64-pc-linux-gnu
```

**Bases de Datos:**
```sql
-- Base de datos de monitoreo
CREATE DATABASE sgm_monitoring WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Extensiones habilitadas
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

### Configuración de postgresql.conf

**Archivo:** `/etc/postgresql/14/main/postgresql.conf`

```ini
#------------------------------------------------------------------------------
# NETWORK SETTINGS
#------------------------------------------------------------------------------
listen_addresses = 'localhost,172.17.11.14'
port = 5432
max_connections = 100
superuser_reserved_connections = 3

#------------------------------------------------------------------------------
# MEMORY SETTINGS (Optimizado para 4GB RAM)
#------------------------------------------------------------------------------
# Aproximadamente 25% de RAM total
shared_buffers = 1GB

# Cache efectivo (aprox. 50% de RAM)
effective_cache_size = 2GB

# Memoria por operación de ordenamiento
work_mem = 16MB

# Memoria para operaciones de mantenimiento
maintenance_work_mem = 256MB

# Shared memory segments
dynamic_shared_memory_type = posix

#------------------------------------------------------------------------------
# QUERY TUNING
#------------------------------------------------------------------------------
# Costos del planner
random_page_cost = 1.1          # SSD optimizado
effective_io_concurrency = 200  # SSD concurrente

# Parallel query settings
max_worker_processes = 2
max_parallel_workers_per_gather = 1
max_parallel_maintenance_workers = 1
max_parallel_workers = 2

#------------------------------------------------------------------------------
# WRITE AHEAD LOG (WAL)
#------------------------------------------------------------------------------
wal_level = replica
wal_buffers = 16MB
min_wal_size = 80MB
max_wal_size = 1GB
checkpoint_completion_target = 0.9

#------------------------------------------------------------------------------
# REPLICATION (Preparado para futuro)
#------------------------------------------------------------------------------
# max_wal_senders = 3
# wal_keep_size = 64MB

#------------------------------------------------------------------------------
# QUERY/INDEX STATISTICS
#------------------------------------------------------------------------------
# Extensión pg_stat_statements
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.max = 10000
pg_stat_statements.track = all

#------------------------------------------------------------------------------
# LOGGING
#------------------------------------------------------------------------------
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_line_prefix = '%m [%p] %q%u@%d %r '
log_timezone = 'America/Santiago'

# Qué loggear
log_connections = on
log_disconnections = on
log_duration = off
log_hostname = off
log_statement = 'mod'  # Solo modificaciones
log_min_duration_statement = 1000  # Queries >1s

#------------------------------------------------------------------------------
# LOCALE AND FORMATTING
#------------------------------------------------------------------------------
datestyle = 'iso, dmy'
timezone = 'America/Santiago'
lc_messages = 'en_US.UTF-8'
lc_monetary = 'en_US.UTF-8'
lc_numeric = 'en_US.UTF-8'
lc_time = 'en_US.UTF-8'
default_text_search_config = 'pg_catalog.english'

#------------------------------------------------------------------------------
# SECURITY
#------------------------------------------------------------------------------
password_encryption = md5
row_security = on
ssl = off  # Red interna confiable
```

### Configuración de pg_hba.conf

**Archivo:** `/etc/postgresql/14/main/pg_hba.conf`

```bash
# PostgreSQL Client Authentication Configuration File
# ===================================================

# TYPE  DATABASE        USER            ADDRESS                 METHOD

# Conexión local administrativa
local   all             postgres                                peer
local   all             all                                     md5

# Conexión desde servidor de aplicación (SGM)
host    sgm_db          sgm_user        172.17.11.13/32        md5
host    sgm_db          sgm_user        172.17.11.22/32        md5

# Conexión para postgres_exporter (local)
local   sgm_monitoring  postgres                                peer
host    sgm_monitoring  sgm_user        127.0.0.1/32           md5

# Rechazar conexiones remotas no autorizadas
host    all             all             0.0.0.0/0              reject
host    all             all             ::/0                   reject

# Configuración para replication (preparado para futuro)
# host  replication     replication     172.17.11.15/32        md5
```

### Usuario y Permisos de Base de Datos

**Usuario para Aplicación:**
```sql
-- Crear usuario sgm_user
CREATE USER sgm_user WITH 
    ENCRYPTED PASSWORD 't2LShvMEC5nnbiCSQtzJtSyGiqt3HysI'
    NOCREATEDB 
    NOCREATEROLE 
    NOREPLICATION
    CONNECTION LIMIT 50;

-- Permisos en sgm_db (producción - 172.17.11.21)
GRANT CONNECT ON DATABASE sgm_db TO sgm_user;
GRANT USAGE ON SCHEMA public TO sgm_user;
GRANT CREATE ON SCHEMA public TO sgm_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sgm_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sgm_user;

-- Permisos por defecto para nuevas tablas
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO sgm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT USAGE, SELECT ON SEQUENCES TO sgm_user;
```

**Fortaleza de Contraseña:**
```yaml
Contraseña: t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI
Longitud: 32 caracteres
Tipos: Mayúsculas, minúsculas, números
Entropía: ~190 bits
Generación: Base64 aleatorio
Rotación: Recomendada cada 90 días
```

### Análisis de Performance

**Queries de Diagnóstico:**
```sql
-- Estadísticas de base de datos
SELECT 
    datname AS database,
    numbackends AS connections,
    xact_commit AS commits,
    xact_rollback AS rollbacks,
    blks_read AS disk_reads,
    blks_hit AS cache_hits,
    ROUND(100.0 * blks_hit / NULLIF(blks_hit + blks_read, 0), 2) AS cache_hit_ratio
FROM pg_stat_database
WHERE datname = 'sgm_db';

-- Queries más lentas
SELECT 
    query,
    calls,
    total_exec_time / 1000 AS total_time_seconds,
    mean_exec_time / 1000 AS mean_time_seconds,
    max_exec_time / 1000 AS max_time_seconds
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY total_exec_time DESC
LIMIT 10;

-- Índices no utilizados
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Conexiones activas
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    state_change
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;
```

### Mantenimiento de Base de Datos

**Tareas Automáticas (autovacuum):**
```sql
-- Configuración de autovacuum
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 1min

-- Ver estado de autovacuum
SELECT 
    schemaname,
    tablename,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze,
    vacuum_count,
    autovacuum_count
FROM pg_stat_user_tables
ORDER BY last_autovacuum DESC NULLS LAST;
```

**Comandos Manuales:**
```bash
# Vacuum completo (programar en mantenimiento)
sudo -u postgres psql -d sgm_db -c "VACUUM FULL ANALYZE;"

# Reindex de base de datos
sudo -u postgres psql -d sgm_db -c "REINDEX DATABASE sgm_db;"

# Analizar estadísticas
sudo -u postgres psql -d sgm_db -c "ANALYZE;"
```

---

## 4.3 Stack de Monitoreo: Prometheus + Grafana

### Arquitectura del Monitoreo

```mermaid
graph TB
    subgraph "Visualización"
        A[Grafana<br/>:3000<br/>Dashboards]
    end
    
    subgraph "Almacenamiento TSDB"
        B[Prometheus<br/>:9090<br/>Time Series DB]
    end
    
    subgraph "Recolección"
        C[postgres_exporter<br/>:9187<br/>Metrics Exporter]
    end
    
    subgraph "Base de Datos"
        D[PostgreSQL 14.19<br/>:5432<br/>sgm_monitoring]
    end
    
    A -->|PromQL queries| B
    B -->|HTTP scraping| C
    C -->|SQL queries| D
    
    style A fill:#fff3e0
    style B fill:#e8f5e8
    style C fill:#f3e5f5
    style D fill:#e1f5fe
```

### Prometheus Configuration

**Versión y Servicio:**
```bash
$ prometheus --version
prometheus, version 2.48.0

$ systemctl status prometheus
● prometheus.service - Prometheus Time Series DB
     Loaded: loaded (/etc/systemd/system/prometheus.service; enabled)
     Active: active (running) since Mon 2025-11-14 10:30:00 -03; 2 weeks ago
```

**Archivo:** `/etc/prometheus/prometheus.yml`

```yaml
# Global configuration
global:
  scrape_interval: 15s        # Recolectar métricas cada 15 segundos
  evaluation_interval: 15s    # Evaluar reglas cada 15 segundos
  scrape_timeout: 10s         # Timeout de scraping
  
  external_labels:
    monitor: 'sgm-db-monitor'
    datacenter: 'bdo-chile'
    environment: 'production'

# Alertmanager configuration (opcional, para futuro)
# alerting:
#   alertmanagers:
#     - static_configs:
#         - targets: ['localhost:9093']

# Load rules once and periodically evaluate them
rule_files:
  - '/etc/prometheus/rules/*.yml'

# Scrape configurations
scrape_configs:
  # PostgreSQL exporter
  - job_name: 'postgresql'
    scrape_interval: 15s
    scrape_timeout: 10s
    metrics_path: /metrics
    scheme: http
    static_configs:
      - targets: ['localhost:9187']
        labels:
          instance: 'sgm_db'
          server: 'vm-bdo-outcontab2'
          environment: 'production'
          database: 'sgm_monitoring'

  # Prometheus self-monitoring
  - job_name: 'prometheus'
    scrape_interval: 30s
    static_configs:
      - targets: ['localhost:9090']
        labels:
          instance: 'prometheus'
          server: 'vm-bdo-outcontab2'

  # Node exporter (opcional, para métricas del sistema)
  # - job_name: 'node'
  #   static_configs:
  #     - targets: ['localhost:9100']
```

**Storage Configuration:**
```yaml
# Configurado en systemd service
--storage.tsdb.path=/var/lib/prometheus/
--storage.tsdb.retention.time=30d
--storage.tsdb.retention.size=10GB
--storage.tsdb.wal-compression
```

**Queries PromQL Útiles:**
```promql
# Cache hit ratio (debe ser >90%)
100 * pg_stat_database_blks_hit{datname="sgm_db"} / 
(pg_stat_database_blks_hit{datname="sgm_db"} + pg_stat_database_blks_read{datname="sgm_db"})

# Conexiones activas
pg_stat_activity_count{datname="sgm_db",state="active"}

# Transacciones por segundo
rate(pg_stat_database_xact_commit{datname="sgm_db"}[5m])

# Queries lentas (>1s)
rate(pg_stat_statements_max_exec_time[5m])

# Uso de conexiones (%)
100 * pg_stat_activity_count / pg_settings_max_connections

# Tamaño de base de datos
pg_database_size_bytes{datname="sgm_db"}
```

### postgres_exporter Configuration

**Versión y Servicio:**
```bash
$ /usr/local/bin/postgres_exporter --version
postgres_exporter, version 0.15.0

$ systemctl status postgres_exporter
● postgres_exporter.service - PostgreSQL Exporter
     Loaded: loaded (/etc/systemd/system/postgres_exporter.service; enabled)
     Active: active (running) since Mon 2025-11-14 10:30:00 -03; 2 weeks ago
```

**Archivo systemd:** `/etc/systemd/system/postgres_exporter.service`

```ini
[Unit]
Description=PostgreSQL Exporter for Prometheus
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=postgres
Group=postgres
EnvironmentFile=/etc/default/postgres_exporter
ExecStart=/usr/local/bin/postgres_exporter
Restart=always
RestartSec=5s

# Security settings
NoNewPrivileges=true
PrivateTmp=true
PrivateDevices=true
ProtectHome=true
ProtectSystem=strict
ReadWritePaths=/var/log/postgres_exporter

[Install]
WantedBy=multi-user.target
```

**Archivo de Configuración:** `/etc/default/postgres_exporter`

```bash
# Connection to PostgreSQL
DATA_SOURCE_NAME="postgresql://sgm_user:t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI@localhost:5432/sgm_monitoring?sslmode=disable"

# Exporter settings
PG_EXPORTER_WEB_LISTEN_ADDRESS=":9187"
PG_EXPORTER_WEB_TELEMETRY_PATH="/metrics"
PG_EXPORTER_DISABLE_DEFAULT_METRICS="false"
PG_EXPORTER_DISABLE_SETTINGS_METRICS="false"
PG_EXPORTER_AUTO_DISCOVER_DATABASES="true"

# Include only SGM databases
PG_EXPORTER_INCLUDE_DATABASES="sgm_db,sgm_monitoring"
PG_EXPORTER_EXCLUDE_DATABASES="template0,template1,postgres"

# Logging
PG_EXPORTER_LOG_LEVEL="info"
PG_EXPORTER_LOG_FORMAT="logfmt"
```

**Métricas Expuestas (ejemplos):**
```
# Conexiones activas
pg_stat_activity_count{datname="sgm_db",state="active"} 3

# Transacciones
pg_stat_database_xact_commit{datname="sgm_db"} 12478
pg_stat_database_xact_rollback{datname="sgm_db"} 31

# Cache hit ratio
pg_stat_database_blks_hit{datname="sgm_db"} 982347
pg_stat_database_blks_read{datname="sgm_db"} 18762

# Configuración
pg_settings_max_connections 100
pg_settings_shared_buffers_bytes 1073741824

# Tamaño de DB
pg_database_size_bytes{datname="sgm_db"} 3421487104

# Uptime
pg_postmaster_start_time_seconds 1731585000
```

### Grafana Configuration

**Versión y Servicio:**
```bash
$ grafana-server -v
Version 10.2.3

$ systemctl status grafana-server
● grafana-server.service - Grafana instance
     Loaded: loaded (/lib/systemd/system/grafana-server.service; enabled)
     Active: active (running) since Mon 2025-11-14 10:30:15 -03; 2 weeks ago
```

**Archivo:** `/etc/grafana/grafana.ini`

```ini
[paths]
data = /var/lib/grafana
temp_data_files = /var/lib/grafana/tmp
logs = /var/log/grafana
plugins = /var/lib/grafana/plugins
provisioning = /etc/grafana/provisioning

[server]
protocol = http
http_addr = 0.0.0.0
http_port = 3000
domain = 172.17.11.14
root_url = http://172.17.11.14:3000/
enable_gzip = true

[database]
type = sqlite3
path = /var/lib/grafana/grafana.db

[session]
provider = file
provider_config = sessions

[security]
# ⚠️ CAMBIAR EN PRODUCCIÓN
admin_user = admin
admin_password = admin

# Security headers
disable_gravatar = true
cookie_secure = false
cookie_samesite = strict
strict_transport_security = false
x_content_type_options = true
x_xss_protection = true

[auth]
disable_login_form = false
disable_signout_menu = false

[auth.anonymous]
enabled = false

[users]
allow_sign_up = false
allow_org_create = false
auto_assign_org = true
auto_assign_org_role = Viewer

[log]
mode = console file
level = info
format = text

[log.console]
level = info
format = text

[log.file]
level = info
format = text
log_rotate = true
max_lines = 1000000
max_size_shift = 28  # 256MB
daily_rotate = true
max_days = 7

[metrics]
enabled = true
interval_seconds = 10

[alerting]
enabled = true
execute_alerts = true

[dashboards]
versions_to_keep = 20
default_home_dashboard_path = /var/lib/grafana/dashboards/postgresql-overview.json
```

**Data Source Configuration:**
```yaml
# /etc/grafana/provisioning/datasources/prometheus.yml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://localhost:9090
    isDefault: true
    editable: true
    jsonData:
      httpMethod: POST
      timeInterval: 15s
```

**Dashboards Instalados:**
```yaml
# PostgreSQL Database (ID 9628)
URL: http://172.17.11.14:3000/d/postgresql-database/
Métricas:
  - Conexiones activas
  - TPS (Transactions Per Second)
  - Cache hit ratio
  - Tamaño de DB
  - Queries lentas
  - Locks y deadlocks

# PostgreSQL Overview (ID 455)
URL: http://172.17.11.14:3000/d/postgresql-overview/
Métricas:
  - Uso de CPU/RAM
  - I/O de disco
  - Replication lag
  - Checkpoint stats
  - WAL activity

# PostgreSQL Server Exporter (ID 6742)
URL: http://172.17.11.14:3000/d/postgres-exporter/
Métricas:
  - Métricas del exporter
  - Health checks
  - Scraping performance
```

**Acceso a Grafana:**
```bash
URL: http://172.17.11.14:3000
Usuario: admin
Password: admin  # ⚠️ CAMBIAR INMEDIATAMENTE

# Primera vez: Change password prompt
# Configurar: Admin → Profile → Change Password
```

---

## 4.4 Seguridad y Firewall

### Firewall UFW

**Estado Actual:**
```bash
$ sudo ufw status verbose
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)

To                         Action      From
--                         ------      ----
5432/tcp                   ALLOW       172.17.11.13           # Django Prod
5432/tcp                   ALLOW       172.17.11.22           # Django Dev
3000/tcp                   ALLOW       Anywhere               # Grafana
9090/tcp                   ALLOW       Anywhere               # Prometheus
22/tcp                     LIMIT       Anywhere               # SSH (rate limited)
```

**Reglas Configuradas:**
```bash
# PostgreSQL: Solo servidores de aplicación
sudo ufw allow from 172.17.11.13 to any port 5432 proto tcp comment 'Django Production'
sudo ufw allow from 172.17.11.22 to any port 5432 proto tcp comment 'Django Development'

# Grafana: Acceso desde VPN corporativa
sudo ufw allow 3000/tcp comment 'Grafana Dashboard'

# Prometheus: Acceso desde VPN corporativa
sudo ufw allow 9090/tcp comment 'Prometheus API'

# SSH: Rate limiting para prevenir brute force
sudo ufw limit 22/tcp comment 'SSH Administrative Access'

# Redis: Bloqueado externamente (solo local)
sudo ufw deny 6379 comment 'Redis blocked externally'

# postgres_exporter: No necesita regla (localhost only)
```

**Recomendaciones de Endurecimiento:**
```bash
# Restringir Grafana solo a IPs de administradores
sudo ufw delete allow 3000/tcp
sudo ufw allow from 172.17.11.0/24 to any port 3000 proto tcp

# Restringir Prometheus
sudo ufw delete allow 9090/tcp
sudo ufw allow from 172.17.11.0/24 to any port 9090 proto tcp
```

### Seguridad de PostgreSQL

**Autenticación:**
- **Método:** MD5 hash para conexiones remotas
- **Restricción IP:** Solo 172.17.11.13 y 172.17.11.22
- **Usuario limitado:** `sgm_user` sin privilegios de superusuario
- **SSL:** Deshabilitado (red interna confiable)

**Configuración de Seguridad:**
```sql
-- Ver usuarios y sus privilegios
SELECT 
    usename AS role,
    usesuper AS superuser,
    usecreatedb AS createdb,
    usecreaterole AS createrole,
    usebypassrls AS bypass_rls
FROM pg_user;

-- Ver permisos en base de datos
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
GROUP BY grantee, privilege_type;
```

**Logging de Seguridad:**
```bash
# Ver conexiones fallidas
sudo grep "FATAL" /var/log/postgresql/postgresql-*.log

# Ver conexiones desde IPs no autorizadas
sudo grep "connection received" /var/log/postgresql/*.log | grep -v "172.17.11.13\|172.17.11.22"

# Ver statements de modificación
sudo grep "statement:" /var/log/postgresql/*.log | grep -E "(INSERT|UPDATE|DELETE|DROP|CREATE)"
```

### Gestión de Credenciales

**Ubicación de Archivos Sensibles:**
```bash
# Información de conexión
/home/outcontab2/postgresql_sgm_connection_info.txt (permisos: 600)

# Configuración completa
/home/outcontab2/CONFIGURACION_COMPLETA_PostgreSQL_Monitoreo.txt (permisos: 600)

# Variables de entorno (en servidor de aplicación)
POSTGRES_HOST=172.17.11.14
POSTGRES_PORT=5432
POSTGRES_DB=sgm_db
POSTGRES_USER=sgm_user
POSTGRES_PASSWORD=t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI
```

**Rotación de Contraseñas (cada 90 días):**
```bash
# 1. Generar nueva contraseña
NEW_PASSWORD=$(openssl rand -base64 32)

# 2. Actualizar en PostgreSQL
sudo -u postgres psql -c "ALTER USER sgm_user PASSWORD '$NEW_PASSWORD';"

# 3. Actualizar postgres_exporter
sudo sed -i "s/OLD_PASSWORD/$NEW_PASSWORD/g" /etc/default/postgres_exporter
sudo systemctl restart postgres_exporter

# 4. Coordinar cambio en servidores de aplicación
# 5. Actualizar documentación
```

---

## 4.5 Backup y Recuperación

### Estrategia de Backup

**Tipos de Backup:**
```yaml
Backup Lógico (pg_dump):
  - Base de datos completa
  - Frecuencia: Diaria (3 AM)
  - Retención: 7 días
  - Ubicación: /backup/postgresql/
  - Tamaño promedio: ~300 MB comprimido

Backup de Configuración:
  - postgresql.conf
  - pg_hba.conf
  - Frecuencia: Semanal
  - Ubicación: /backup/config/

Backup de Prometheus:
  - Snapshots de TSDB
  - Frecuencia: Semanal
  - Retención: 4 semanas
  - Ubicación: /backup/prometheus/

Backup de Grafana:
  - dashboards.db
  - grafana.ini
  - Frecuencia: Semanal
  - Ubicación: /backup/grafana/
```

### Scripts de Backup

**Backup Diario de PostgreSQL:**
```bash
#!/bin/bash
# /usr/local/bin/backup_postgres.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/postgresql"
RETENTION_DAYS=7

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Backup de base de datos
sudo -u postgres pg_dump sgm_db | gzip > $BACKUP_DIR/sgm_db_$DATE.sql.gz

# Backup de configuración
tar czf $BACKUP_DIR/config_$DATE.tar.gz \
    /etc/postgresql/14/main/postgresql.conf \
    /etc/postgresql/14/main/pg_hba.conf

# Eliminar backups antiguos
find $BACKUP_DIR -name "sgm_db_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "config_*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Verificar backup
if [ -f "$BACKUP_DIR/sgm_db_$DATE.sql.gz" ]; then
    echo "Backup exitoso: sgm_db_$DATE.sql.gz"
else
    echo "ERROR: Backup falló" >&2
    exit 1
fi
```

**Cron Job:**
```bash
# Editar crontab
sudo crontab -e

# Backup diario a las 3 AM
0 3 * * * /usr/local/bin/backup_postgres.sh >> /var/log/backup.log 2>&1

# Backup semanal de Prometheus (Domingos 4 AM)
0 4 * * 0 tar czf /backup/prometheus/prometheus_$(date +\%Y\%m\%d).tar.gz /var/lib/prometheus/

# Backup semanal de Grafana (Domingos 4:30 AM)
30 4 * * 0 tar czf /backup/grafana/grafana_$(date +\%Y\%m\%d).tar.gz /var/lib/grafana/
```

### Procedimientos de Recuperación

**Restaurar Base de Datos:**
```bash
# 1. Detener aplicación (en servidor 172.17.11.13)
docker compose stop django celery

# 2. Eliminar base de datos actual (si es necesario)
sudo -u postgres psql -c "DROP DATABASE sgm_db;"

# 3. Crear nueva base de datos
sudo -u postgres psql -c "CREATE DATABASE sgm_db OWNER sgm_user;"

# 4. Restaurar desde backup
gunzip -c /backup/postgresql/sgm_db_20251128.sql.gz | sudo -u postgres psql sgm_db

# 5. Verificar integridad
sudo -u postgres psql -d sgm_db -c "SELECT COUNT(*) FROM django_migrations;"

# 6. Reiniciar aplicación
docker compose start django celery
```

**Restaurar Configuración:**
```bash
# Restaurar archivos de configuración
tar xzf /backup/postgresql/config_20251128.tar.gz -C /

# Reiniciar PostgreSQL
sudo systemctl restart postgresql

# Verificar
sudo systemctl status postgresql
```

**Point-in-Time Recovery (PITR):**
```bash
# Requiere configuración WAL archiving
# Configurar en postgresql.conf:
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /backup/wal_archive/%f && cp %p /backup/wal_archive/%f'

# Recuperación:
# 1. Restaurar backup base
# 2. Crear recovery.signal
# 3. Configurar restore_command
# 4. Iniciar PostgreSQL
```

---

## 4.6 Monitoreo y Mantenimiento

### Scripts de Monitoreo

**Script de Monitoreo Rápido:**
```bash
#!/bin/bash
# /usr/local/bin/pg_monitor.sh

echo "=== PostgreSQL Status ==="
sudo systemctl status postgresql --no-pager | grep "Active"

echo -e "\n=== Conexiones Activas ==="
sudo -u postgres psql -c "
SELECT 
    COUNT(*) as total_connections,
    COUNT(*) FILTER (WHERE state = 'active') as active,
    COUNT(*) FILTER (WHERE state = 'idle') as idle
FROM pg_stat_activity
WHERE datname = 'sgm_db';"

echo -e "\n=== Cache Hit Ratio ==="
sudo -u postgres psql -c "
SELECT 
    ROUND(100.0 * blks_hit / NULLIF(blks_hit + blks_read, 0), 2) AS cache_hit_ratio
FROM pg_stat_database
WHERE datname = 'sgm_db';"

echo -e "\n=== Tamaño de Base de Datos ==="
sudo -u postgres psql -c "
SELECT 
    pg_size_pretty(pg_database_size('sgm_db')) AS db_size;"

echo -e "\n=== Uso de Recursos ==="
echo "CPU: $(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}')"
echo "RAM: $(free -h | awk '/^Mem/ {print $3 "/" $2}')"
echo "Disco: $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 ")"}')"

echo -e "\n=== Servicios de Monitoreo ==="
systemctl is-active prometheus postgres_exporter grafana-server
```

### Alertas Recomendadas

**Configuración de Alertas en Prometheus:**
```yaml
# /etc/prometheus/rules/postgresql_alerts.yml
groups:
  - name: postgresql_alerts
    interval: 30s
    rules:
    
    # Alta utilización de conexiones
    - alert: HighConnectionUsage
      expr: (pg_stat_activity_count / pg_settings_max_connections) > 0.8
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "Alto uso de conexiones PostgreSQL"
        description: "Conexiones al {{ $value }}% de capacidad"

    # Cache hit ratio bajo
    - alert: LowCacheHitRatio
      expr: |
        100 * pg_stat_database_blks_hit{datname="sgm_db"} / 
        (pg_stat_database_blks_hit{datname="sgm_db"} + 
         pg_stat_database_blks_read{datname="sgm_db"}) < 90
      for: 10m
      labels:
        severity: warning
      annotations:
        summary: "Cache hit ratio bajo"
        description: "Cache hit ratio: {{ $value }}% (debe ser >90%)"

    # PostgreSQL caído
    - alert: PostgreSQLDown
      expr: pg_up == 0
      for: 1m
      labels:
        severity: critical
      annotations:
        summary: "PostgreSQL está caído"
        description: "PostgreSQL no responde"

    # Disco casi lleno
    - alert: DiskSpaceWarning
      expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.2
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "Espacio en disco bajo"
        description: "Espacio disponible: {{ $value | humanizePercentage }}"

    # Queries lentas frecuentes
    - alert: FrequentSlowQueries
      expr: rate(pg_stat_statements_max_exec_time[5m]) > 10
      for: 10m
      labels:
        severity: warning
      annotations:
        summary: "Queries lentas frecuentes"
        description: "Múltiples queries >1s detectadas"
```

### Tareas de Mantenimiento

**Mantenimiento Semanal:**
```bash
#!/bin/bash
# /usr/local/bin/weekly_maintenance.sh

# Vacuum y Analyze
sudo -u postgres psql -d sgm_db -c "VACUUM ANALYZE;"

# Reindexar si es necesario
sudo -u postgres psql -d sgm_db -c "REINDEX DATABASE sgm_db;"

# Limpiar logs antiguos
find /var/log/postgresql/ -name "*.log" -mtime +30 -delete

# Limpiar Prometheus data antigua (ya manejado por retention)
# /var/lib/prometheus/ se limpia automáticamente

# Verificar integridad
sudo -u postgres pg_dumpall --globals-only > /tmp/globals_test.sql

# Reporte de estado
echo "Mantenimiento completado: $(date)" >> /var/log/maintenance.log
```

**Cron para Mantenimiento:**
```bash
# Ejecutar cada Domingo a las 5 AM
0 5 * * 0 /usr/local/bin/weekly_maintenance.sh >> /var/log/maintenance.log 2>&1
```

---

## Resumen del Capítulo 4

✅ **Hardware:** 2 cores, 4GB RAM, 50GB SSD  
✅ **PostgreSQL:** 14.19 optimizado para 4GB RAM, 100 conexiones máx  
✅ **Monitoreo:** Prometheus + Grafana + postgres_exporter con 150+ métricas  
✅ **Seguridad:** Firewall UFW activo, autenticación MD5, restricción por IP  
✅ **Backup:** Diario con pg_dump, retención 7 días, scripts automatizados  
✅ **Dashboards:** 3 dashboards Grafana con métricas en tiempo real  

---

**📖 Navegación:**
- ⬅️ [Capítulo 3: Servidor de Aplicación](./03_servidor_aplicacion.md)
- 🏠 [Volver al Índice](../DOCUMENTACION_COMPLETA_SGM.md)
- ➡️ [Capítulo 5: Servidor de Base de Datos Compartida](./05_servidor_db_compartida.md)

---

**Documento generado para BDO Chile - SGM Contabilidad**  
**Última actualización:** 28 de Noviembre 2025
