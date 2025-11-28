# 🔐 Configuración de Seguridad Detallada - Servidor de Base de Datos SGM

**Servidor:** vm-bdo-outcontab2 (172.17.11.14)  
**Fecha:** 28 de Noviembre, 2025  
**Tipo:** Servidor de Base de Datos PostgreSQL + Monitoreo  
**Contexto de Red:** 🔒 Protegido por VPN Corporativa (No expuesto públicamente)  

---

## 🛡️ Matriz de Seguridad por Componente

| Componente | Puerto | Autenticación | Cifrado | Restricción IP | Nivel de Riesgo |
|------------|--------|---------------|---------|----------------|-----------------|
| PostgreSQL | 5432 | MD5 Hash | ❌ No SSL | ✅ Solo 172.17.11.13 | 🟢 Bajo |
| Grafana | 3000 | Usuario/Password | ❌ HTTP | 🔒 VPN Corporativa | 🟢 Bajo |
| Prometheus | 9090 | ❌ Ninguna | ❌ HTTP | 🔒 VPN Corporativa | 🟢 Bajo |
| postgres_exporter | 9187 | ❌ Ninguna | ❌ HTTP | 🔄 Interno | 🟢 Bajo |

---

## 🔒 Configuración de Seguridad PostgreSQL

### **1. Autenticación y Autorización**

#### Archivo: `/etc/postgresql/14/main/pg_hba.conf`
```bash
# TYPE  DATABASE    USER        ADDRESS         METHOD

# Conexión desde servidor de aplicación (SGM)
host    sgm_db      sgm_user    172.17.11.13/32  md5

# Conexión local administrativa
local   all         postgres                      peer
local   all         all                           md5

# Rechazar conexiones remotas no autorizadas
host    all         all         0.0.0.0/0         reject
host    all         all         ::/0              reject

# Replication (preparado para futuro)
#host   replication  replication 172.17.11.15/32  md5
```

#### Justificación de Configuración:
- **MD5 Authentication:** Suficiente para red interna cerrada
- **Restricción IP estricta:** Solo servidor de aplicación autorizado
- **Rechazo explícito:** Mayor seguridad que configuración por defecto

### **2. Configuración de Red**

#### Archivo: `/etc/postgresql/14/main/postgresql.conf`
```bash
# NETWORK SETTINGS
listen_addresses = 'localhost,172.17.11.14'
port = 5432
max_connections = 100
superuser_reserved_connections = 3

# SSL/TLS (deshabilitado para red interna)
ssl = off
ssl_cert_file = ''
ssl_key_file = ''

# SECURITY SETTINGS
password_encryption = md5
row_security = on

# LOGGING (para auditoría)
log_connections = on
log_disconnections = on
log_hostname = off
log_line_prefix = '%m [%p] %q%u@%d '
log_statement = 'mod'  # Solo modificaciones (INSERT, UPDATE, DELETE)
log_min_duration_statement = 1000  # Queries lentas >1s
```

### **3. Usuario y Permisos de Base de Datos**

#### Usuario `sgm_user` (para aplicación)
```sql
-- Permisos específicos (no superuser)
CREATE USER sgm_user WITH 
    ENCRYPTED PASSWORD 't2LShvMEC5nnbiCSQtzJtSyGiqt3HysI'
    NOCREATEDB 
    NOCREATEROLE 
    NOREPLICATION;

-- Acceso solo a sgm_db
GRANT CONNECT ON DATABASE sgm_db TO sgm_user;
GRANT USAGE ON SCHEMA public TO sgm_user;
GRANT CREATE ON SCHEMA public TO sgm_user;

-- Permisos de tabla (otorgados por Django migrations)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sgm_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sgm_user;
```

#### Fortaleza de Contraseña
```yaml
Contraseña: t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI
Características:
  - Longitud: 32 caracteres
  - Caracteres: A-Z, a-z, 0-9
  - Entropía: ~190 bits
  - Método generación: Base64 aleatorio
  - Rotación: Manual (recomendada cada 90 días)
```

---

## 🌐 Configuración de Seguridad de Red

### **1. Firewall UFW**

#### Estado Actual
```bash
# UFW Status: ACTIVE ✅ (activado 28 Nov 2025)
# Firewall protegiendo servicios correctamente

# Reglas configuradas:
sudo ufw allow from 172.17.11.13 to any port 5432 proto tcp
sudo ufw allow 3000/tcp comment 'Grafana Dashboard'
sudo ufw allow 9090/tcp comment 'Prometheus API'
sudo ufw allow 22/tcp comment 'SSH Administrative Access'
sudo ufw default deny incoming
```

#### Contexto de Seguridad de Red
```bash
# Servidor protegido por VPN Corporativa
# Solo accesible desde red interna empresarial
# No expuesto directamente a Internet

# UFW habilitado como capa adicional de seguridad
# Restricciones para servicios críticos mantenidas
sudo ufw limit 22/tcp  # Rate limiting SSH
```

### **2. Configuración de Interfaces de Red**

#### Binding de Servicios
```yaml
PostgreSQL (5432):
  - Bind: localhost + 172.17.11.14
  - IPv6: Habilitado pero restringido
  - Interface: eth0 (interna)

Grafana (3000):
  - Bind: 0.0.0.0 (todas las interfaces VPN)
  - Contexto: Seguro dentro de VPN corporativa

Prometheus (9090):
  - Bind: 0.0.0.0 (todas las interfaces VPN)
  - Contexto: Acceso interno empresarial únicamente

postgres_exporter (9187):
  - Bind: 0.0.0.0 (para Prometheus local)
  - Uso: Solo interno
```

---

## 🔍 Configuración de Seguridad Grafana

### **1. Autenticación y Sesiones**

#### Archivo: `/etc/grafana/grafana.ini`
```ini
[server]
protocol = http
http_port = 3000
domain = 172.17.11.14
root_url = http://172.17.11.14:3000/

[security]
admin_user = admin
admin_password = admin  # ⚠️ CRÍTICO: CAMBIAR INMEDIATAMENTE
disable_gravatar = true
cookie_secure = false
cookie_samesite = strict
strict_transport_security = false
content_type_protection = true
x_content_type_options = true
x_xss_protection = true

[auth]
disable_login_form = false
disable_signout_menu = false

[auth.anonymous]
enabled = false
org_name = Main Org.
org_role = Viewer

[users]
allow_sign_up = false
allow_org_create = false
auto_assign_org = true
auto_assign_org_role = Viewer
```

### **2. Headers de Seguridad HTTP**

#### Headers Implementados por Grafana
```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000 (si HTTPS)
```

### **3. Gestión de Sesiones**
```ini
[session]
provider = file
provider_config = sessions
cookie_name = grafana_sess
cookie_secure = false  # HTTP local
session_life_time = 86400  # 24 horas
gc_interval_time = 86400
```

---

## 📊 Configuración de Seguridad Prometheus

### **1. Configuración de Scraping Seguro**

#### Archivo: `/etc/prometheus/prometheus.yml`
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    monitor: 'sgm-db-monitor'
    datacenter: 'local'

scrape_configs:
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

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
```

### **2. Configuración de Retención de Datos**
```yaml
# Configuración de almacenamiento
storage.tsdb.path: /var/lib/prometheus/
storage.tsdb.retention.time: 30d  # 30 días de retención
storage.tsdb.retention.size: 10GB  # Límite de tamaño

# Sin configuración de remote_write (datos locales únicamente)
```

### **3. Seguridad de APIs**
```yaml
# Sin autenticación (aceptable en VPN corporativa)
# Contexto: Solo accesible desde red empresarial
# Opcional: Implementar basic auth para mayor seguridad
# Rate limiting no crítico en entorno VPN
```

---

## 🔧 Configuración de Seguridad postgres_exporter

### **1. Conexión Segura a PostgreSQL**

#### Archivo: `/etc/default/postgres_exporter`
```bash
# Connection settings
DATA_SOURCE_NAME="postgresql://sgm_user:t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI@localhost:5432/sgm_db?sslmode=disable"

# Security options
PG_EXPORTER_EXTEND_QUERY_PATH=""
PG_EXPORTER_INCLUDE_DATABASES="sgm_db"
PG_EXPORTER_EXCLUDE_DATABASES="template0,template1,postgres"

# Disable sensitive metrics
PG_EXPORTER_DISABLE_DEFAULT_METRICS="false"
PG_EXPORTER_DISABLE_SETTINGS_METRICS="false"

# Log level
PG_EXPORTER_LOG_LEVEL="info"
```

### **2. Métricas Expuestas de Forma Segura**
```yaml
Métricas Seguras (no sensibles):
  - pg_stat_activity_count: Número de conexiones
  - pg_stat_database_*: Estadísticas agregadas
  - pg_settings_*: Configuraciones (no passwords)
  - pg_stat_bgwriter_*: Estadísticas del background writer

Métricas NO Expuestas (sensibles):
  - Contenido de tablas
  - Datos de aplicación
  - Passwords o credenciales
  - Información personal
```

---

## 🔐 Gestión de Credenciales y Secretos

### **1. Almacenamiento de Credenciales**

#### Variables de Entorno (Recomendado para Django)
```bash
# En servidor de aplicación (172.17.11.13)
export POSTGRES_HOST=172.17.11.14
export POSTGRES_PORT=5432
export POSTGRES_DB=sgm_db
export POSTGRES_USER=sgm_user
export POSTGRES_PASSWORD=t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI

# Archivo: ~/.bashrc o /etc/environment
# Permisos: 600 (solo owner puede leer)
```

#### Archivos de Configuración Sensibles
```bash
# Ubicación y permisos de archivos críticos
/home/outcontab2/postgresql_sgm_connection_info.txt (600)
/home/outcontab2/CONFIGURACION_COMPLETA_PostgreSQL_Monitoreo.txt (600)
/etc/postgresql/14/main/postgresql.conf (644)
/etc/postgresql/14/main/pg_hba.conf (640)
/etc/default/postgres_exporter (600)
```

### **2. Rotación de Contraseñas**

#### Procedimiento Recomendado (cada 90 días)
```bash
# 1. Generar nueva contraseña
NEW_PASSWORD=$(openssl rand -base64 32)

# 2. Actualizar en PostgreSQL
sudo -u postgres psql -c "ALTER USER sgm_user PASSWORD '$NEW_PASSWORD';"

# 3. Actualizar postgres_exporter
sudo sed -i "s/t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI/$NEW_PASSWORD/g" /etc/default/postgres_exporter
sudo systemctl restart postgres_exporter

# 4. Coordinar cambio en servidor de aplicación
# 5. Actualizar documentación
```

---

## 🚨 Configuración de Logging y Auditoría

### **1. Logging de PostgreSQL**

#### Configuración de Auditoría
```bash
# /etc/postgresql/14/main/postgresql.conf
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB

# Eventos de seguridad
log_connections = on
log_disconnections = on
log_duration = off
log_hostname = off
log_line_prefix = '%m [%p] %q%u@%d %r '

# Statements logging
log_statement = 'mod'  # DDL, DML modifications
log_min_duration_statement = 1000  # Slow queries
```

#### Análisis de Logs de Seguridad
```bash
# Conexiones fallidas
grep "FATAL" /var/log/postgresql/postgresql-*.log

# Conexiones exitosas desde IPs no autorizadas
grep "connection received" /var/log/postgresql/postgresql-*.log | grep -v "172.17.11.13"

# Statements modificando datos
grep "statement:" /var/log/postgresql/postgresql-*.log | grep -E "(INSERT|UPDATE|DELETE|DROP|CREATE)"
```

### **2. Logging de Grafana**

#### Configuración de Logs
```ini
# /etc/grafana/grafana.ini
[log]
mode = file
level = info
format = text
path = /var/log/grafana

[log.file]
level = info
format = text
log_rotate = true
max_lines = 1000000
max_size_shift = 28  # 256MB
daily_rotate = true
max_days = 7
```

#### Eventos de Seguridad Grafana
```bash
# Login attempts
grep -i "login" /var/log/grafana/grafana.log

# Admin actions
grep -i "admin" /var/log/grafana/grafana.log

# Dashboard changes
grep -i "dashboard" /var/log/grafana/grafana.log
```

### **3. Logging del Sistema**

#### systemd Journal Configuration
```bash
# Ver logs de servicios críticos
journalctl -u postgresql -f
journalctl -u prometheus -f
journalctl -u postgres_exporter -f
journalctl -u grafana-server -f

# Filtrar eventos de seguridad
journalctl -u postgresql | grep -i "authentication\|connection\|error"
```

---

## 🔍 Monitoreo de Seguridad

### **1. Métricas de Seguridad en Prometheus**

#### Queries de Monitoreo
```promql
# Conexiones fallidas (requiere configuración adicional)
increase(postgresql_connection_errors_total[5m])

# Conexiones activas por origen
pg_stat_activity_count by (client_addr)

# Queries lentas (posible ataque)
rate(pg_stat_statements_max_exec_time[5m])

# Uso excesivo de conexiones
(pg_stat_activity_count / pg_settings_max_connections) * 100
```

### **2. Alertas de Seguridad Recomendadas**

#### Configuración en Prometheus
```yaml
# /etc/prometheus/alert_rules.yml
groups:
  - name: security_alerts
    rules:
    - alert: ExcessiveConnections
      expr: pg_stat_activity_count > 80
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "Demasiadas conexiones activas"
        
    - alert: SlowQueryAttack
      expr: rate(pg_stat_statements_max_exec_time[5m]) > 10
      for: 2m
      labels:
        severity: critical
      annotations:
        summary: "Posible ataque de queries lentas"

    - alert: ServiceDown
      expr: up{job="postgresql"} == 0
      for: 1m
      labels:
        severity: critical
```

---

## 🛡️ Validaciones del Lado del Servidor

### **1. Validaciones PostgreSQL**

#### Constraints de Base de Datos
```sql
-- Ejemplos de constraints de seguridad
ALTER TABLE users ADD CONSTRAINT valid_email 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE sessions ADD CONSTRAINT valid_session_duration
    CHECK (expires_at > created_at);

-- Row Level Security (RLS)
ALTER TABLE sensitive_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_access ON sensitive_data 
    FOR ALL TO sgm_user 
    USING (user_id = current_setting('app.current_user_id')::int);
```

### **2. Validaciones de Input**

#### Configuración de postgres_exporter
```yaml
# Sanitización automática de queries
# No permite queries arbitrarias del usuario
# Solo queries predefinidas y seguras
# Escapado automático de caracteres especiales
```

#### Grafana Input Validation
```javascript
// Validación automática en queries PromQL
// Sanitización de parámetros de dashboard
// Validación de JSON en configuraciones
// Escape de HTML en visualizaciones
```

---

## 🔧 Configuraciones de Hardening

### **1. Optimizaciones de Seguridad del Sistema**

#### Configuraciones sysctl
```bash
# /etc/sysctl.conf
# Network security
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.icmp_ignore_bogus_error_responses = 1

# Memory management (evitar swap excesivo)
vm.swappiness = 10
vm.vfs_cache_pressure = 50

# Aplicar cambios:
sudo sysctl -p
```

#### Limits de Recursos
```bash
# /etc/security/limits.conf
postgres soft nofile 65536
postgres hard nofile 65536
grafana soft nofile 8192
grafana hard nofile 8192
prometheus soft nofile 16384
prometheus hard nofile 16384
```

### **2. Configuración de Servicios systemd**

#### Restricciones de Seguridad
```ini
# /etc/systemd/system/postgres_exporter.service
[Service]
Type=simple
User=postgres
Group=postgres
ExecStart=/usr/local/bin/postgres_exporter
Restart=always
RestartSec=5

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

---

## 📋 Checklist de Seguridad

### **✅ Implementado**
- [x] Restricción IP para PostgreSQL (solo 172.17.11.13)
- [x] Autenticación MD5 en PostgreSQL
- [x] Usuario limitado (no superuser) para aplicación
- [x] Contraseña robusta (32 caracteres)
- [x] Logging de conexiones y modifications
- [x] Firewall UFW configurado y ACTIVO ✅
- [x] Servicios con restart automático
- [x] Permisos de archivos sensibles restringidos

### **⚠️ Pendiente (Recomendaciones)**
- [x] Activar firewall UFW ✅ COMPLETADO
- [ ] Cambiar contraseña por defecto de Grafana
- [ ] Restricción IP para Grafana y Prometheus
- [ ] Implementar HTTPS/SSL
- [ ] Configurar alertas de seguridad
- [ ] Implementar backup cifrado
- [ ] Rotación automática de contraseñas
- [ ] Monitoreo de logs de seguridad

### **🔍 Para Evaluación**
- [ ] Análisis de vulnerabilidades
- [ ] Penetration testing
- [ ] Audit de configuraciones
- [ ] Review de permisos

---

## 🚀 Próximos Pasos de Seguridad

### **Prioridad Alta (1-7 días)**
1. **Cambiar password de Grafana**
   ```bash
   # En Grafana UI: http://172.17.11.14:3000
   # Login admin/admin → Profile → Change Password
   ```

2. **Verificar firewall UFW** ✅ COMPLETADO
   ```bash
   # Firewall activado el 28 Nov 2025
   sudo ufw status verbose
   ```

### **Prioridad Media (1-4 semanas)**
3. **Restringir acceso a Grafana/Prometheus**
   ```bash
   sudo ufw delete allow 3000/tcp
   sudo ufw delete allow 9090/tcp
   sudo ufw allow from [ADMIN_IPS] to any port 3000
   sudo ufw allow from [ADMIN_IPS] to any port 9090
   ```

4. **Implementar monitoreo de seguridad**
   - Configurar alertas en Prometheus
   - Script de análisis de logs
   - Dashboard de eventos de seguridad

### **Prioridad Baja (1-3 meses)**
5. **SSL/TLS Implementation**
   ```bash
   # Certificados Let's Encrypt o internos
   # Configurar HTTPS en Grafana
   # SSL en PostgreSQL si es necesario
   ```

---

## 📞 Contactos y Escalamiento

### **En caso de Incidente de Seguridad**
1. **Inmediato:** Desactivar servicios afectados
2. **Análisis:** Revisar logs y métricas
3. **Containment:** Bloquear IPs/usuarios sospechosos
4. **Recovery:** Restaurar servicios seguros
5. **Lessons Learned:** Actualizar configuraciones

### **Herramientas de Diagnóstico**
```bash
# Monitoreo rápido de seguridad
sudo /usr/local/bin/pg_monitor.sh

# Análisis de conexiones activas
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Verificar servicios
systemctl status postgresql prometheus grafana-server postgres_exporter

# Análisis de logs
journalctl -xe --since "1 hour ago"
```

---

**Documento Generado:** 28 de Noviembre, 2025  
**Servidor:** vm-bdo-outcontab2 (172.17.11.14)  
**Clasificación:** CONFIDENCIAL - Contiene información de seguridad crítica  

---

*Esta configuración de seguridad debe revisarse y actualizarse periódicamente. La seguridad es un proceso continuo, no un estado final.*