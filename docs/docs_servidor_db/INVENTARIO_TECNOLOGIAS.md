# 📋 Inventario Completo de Tecnologías - Servidor de Base de Datos SGM

**Servidor:** vm-bdo-outcontab2 (172.17.11.14)  
**Fecha de Inventario:** 28 de Noviembre, 2025  
**Función del Servidor:** Base de Datos PostgreSQL + Stack de Monitoreo  

---

## 🖥️ Sistema Operativo y Hardware

### **Plataforma Base**
```yaml
Sistema Operativo:
  Distribución: Ubuntu 22.04.5 LTS (Jammy Jellyfish)
  Kernel: Linux 5.15.0-x86_64
  Arquitectura: x86_64 (64-bit)
  Virtualización: VMware vSphere / KVM
  
Especificaciones de Hardware:
  CPUs: 2 cores
  RAM Total: 3.8 GB
  Almacenamiento: 48 GB (9.5 GB usados, 22% utilización)
  Red: Gigabit Ethernet
  
Filesystems:
  Root (/): ext4 en /dev/mapper/ubuntu--vg-ubuntu--lv
  Swap: 3.8 GB
```

### **Herramientas del Sistema**
```yaml
Package Manager: APT (Advanced Package Tool)
Init System: systemd 249.11
Service Manager: systemctl
Log Management: journalctl + syslog
Cron: systemd-timers + traditional cron
Firewall: UFW (Uncomplicated Firewall) - Configurado pero inactivo
```

---

## 🗄️ Base de Datos Principal

### **PostgreSQL Database Management System**

#### **Versión y Distribución**
```yaml
Producto: PostgreSQL
Versión: 14.19 (Ubuntu 14.19-0ubuntu0.22.04.1)
Compilador: GCC (Ubuntu 11.4.0-1ubuntu1~22.04.2) 11.4.0
Plataforma: x86_64-pc-linux-gnu
Tipo: Open Source RDBMS
```

#### **Paquetes Instalados**
```bash
postgresql-14                    # Motor de base de datos principal
postgresql-client-14            # Cliente de línea de comandos
postgresql-contrib-14           # Extensiones adicionales
postgresql-common               # Archivos comunes PostgreSQL
```

#### **Configuración Clave**
```yaml
Puerto: 5432
Directorio de Datos: /var/lib/postgresql/14/main/
Archivos de Configuración:
  - postgresql.conf: /etc/postgresql/14/main/postgresql.conf
  - pg_hba.conf: /etc/postgresql/14/main/pg_hba.conf
  - pg_ident.conf: /etc/postgresql/14/main/pg_ident.conf

Optimizaciones Aplicadas:
  shared_buffers: 1GB (25% de RAM)
  effective_cache_size: 2GB (50% de RAM)  
  work_mem: 16MB
  maintenance_work_mem: 256MB
  max_connections: 100
  wal_level: replica
```

#### **Extensiones Habilitadas**
```sql
-- Extensiones instaladas en sgm_db
pg_stat_statements    # Estadísticas de queries
plpgsql              # Lenguaje procedural
adminpack            # Herramientas administrativas
```

#### **Base de Datos y Usuarios**
```yaml
Base de Datos Principal:
  Nombre: sgm_db
  Owner: sgm_user
  Encoding: UTF8
  Collate: es_ES.UTF-8
  Ctype: es_ES.UTF-8
  
Usuario de Aplicación:
  Nombre: sgm_user
  Privilegios: CONNECT, CREATE en sgm_db
  Restricciones: No SUPERUSER, No CREATEDB, No CREATEROLE
  
Usuario Administrativo:
  Nombre: postgres
  Privilegios: SUPERUSER (acceso local únicamente)
```

---

## 📊 Stack de Monitoreo y Observabilidad

### **1. Prometheus - Time Series Database**

#### **Información del Software**
```yaml
Producto: Prometheus
Tipo: Time Series Database & Monitoring System
Licencia: Apache License 2.0
Arquitectura: Single binary, Go-based
Estado: Activo desde 12 Nov 2025 (2+ semanas)
```

#### **Configuración de Despliegue**
```yaml
Ubicación del Binario: /opt/prometheus/prometheus
Directorio de Configuración: /etc/prometheus/
Directorio de Datos: /var/lib/prometheus/
Puerto: 9090
Protocolo: HTTP REST API

Archivos Principales:
  - /etc/prometheus/prometheus.yml (configuración principal)
  - /etc/systemd/system/prometheus.service (service unit)
  - /var/lib/prometheus/data/ (time series data)

Configuraciones:
  Scrape Interval: 15 segundos
  Evaluation Interval: 15 segundos
  Retención: 30 días
  Storage Engine: TSDB (Time Series Database)
```

#### **Métricas de Rendimiento**
```yaml
Memoria Utilizada: ~283 MB
CPU Acumulado: 40+ minutos (2+ semanas)
Targets Monitoreados: 2 (postgresql, prometheus)
Series Activas: ~150 métricas PostgreSQL
```

### **2. Grafana - Visualization Platform**

#### **Información del Software**
```yaml
Producto: Grafana
Tipo: Analytics & Monitoring Platform
Licencia: AGPL v3 (Open Source)
Estado: Activo desde 12 Nov 2025 (2+ semanas)
```

#### **Configuración de Despliegue**
```yaml
Ubicación: /usr/share/grafana/
Configuración: /etc/grafana/grafana.ini
Datos: /var/lib/grafana/
Logs: /var/log/grafana/
Puerto: 3000
Protocolo: HTTP Web Interface + REST API

Configuraciones:
  Usuario Admin: admin
  Password Admin: admin (⚠️ CAMBIAR)
  Base de Datos: SQLite (embebida)
  Session Provider: file
  Data Sources: 1 (Prometheus)
```

#### **Dashboards Instalados**
```yaml
Dashboard Principal:
  ID: 9628
  Nombre: PostgreSQL Database
  Autor: Grafana Labs
  Métricas: ~50 paneles
  
Dashboards Recomendados (no instalados):
  - ID 455: PostgreSQL Overview
  - ID 6742: PostgreSQL Server Exporter
  - ID 12485: PostgreSQL Database Details
```

#### **Métricas de Rendimiento**
```yaml
Memoria Utilizada: ~107 MB
CPU Acumulado: 2+ horas (2+ semanas)
Dashboards: 1 activo
Users: 1 (admin)
```

### **3. postgres_exporter - PostgreSQL Metrics Exporter**

#### **Información del Software**
```yaml
Producto: postgres_exporter
Tipo: Prometheus Exporter for PostgreSQL
Fuente: prometheus-community/postgres_exporter
Licencia: Apache License 2.0
Estado: Activo desde 12 Nov 2025 (2+ semanas)
```

#### **Configuración de Despliegue**
```yaml
Ubicación: /usr/local/bin/postgres_exporter
Configuración: /etc/default/postgres_exporter
Service Unit: /etc/systemd/system/postgres_exporter.service
Puerto: 9187
Protocolo: HTTP Metrics Endpoint

Data Source Name: 
  postgresql://sgm_user:password@localhost:5432/sgm_db?sslmode=disable

Métricas Exportadas: ~150 métricas PostgreSQL
Conexiones DB: 1 permanente
```

#### **Métricas de Rendimiento**
```yaml
Memoria Utilizada: ~7.7 MB
CPU Acumulado: 58+ minutos (2+ semanas)
Scrapes/min: 4 (cada 15 segundos)
Health Status: UP (última conexión exitosa)
```

---

## 🔧 Herramientas de Desarrollo y Administración

### **Línea de Comandos**
```yaml
Shell por Defecto: bash 5.1.16
Terminal Utilities:
  - psql: Cliente PostgreSQL
  - curl: HTTP client tool
  - wget: File downloader
  - nano/vim: Text editors
  - htop: Process monitor
  - netstat: Network statistics
  - systemctl: Service management
  - journalctl: Log viewer
```

### **Monitoreo y Diagnóstico**
```bash
# Script personalizado de monitoreo
/usr/local/bin/pg_monitor.sh

# Herramientas estándar del sistema
htop                 # Process and resource monitor
iotop                # I/O monitoring
netstat              # Network connections
ss                   # Socket statistics
lsof                 # Open files
ps                   # Process status
```

### **Gestión de Logs**
```yaml
systemd-journald: Logging centralizado
logrotate: Rotación automática de logs
rsyslog: Syslog daemon

Ubicaciones de Logs Importantes:
  - PostgreSQL: /var/log/postgresql/
  - Grafana: /var/log/grafana/
  - Sistema: /var/log/syslog, /var/log/kern.log
  - Services: journalctl -u [service-name]
```

---

## 🌐 Componentes de Red y Comunicaciones

### **Protocolos de Red**
```yaml
PostgreSQL Wire Protocol v3.0:
  Puerto: 5432
  Cifrado: No SSL (red interna)
  Compresión: No habilitada
  
HTTP/1.1:
  Puertos: 3000 (Grafana), 9090 (Prometheus), 9187 (exporter)
  Cifrado: No HTTPS (red interna)
  Keep-Alive: Habilitado
  
SSH v2:
  Puerto: 22
  Autenticación: Key-based + Password
  Cifrado: AES-256
```

### **Networking Tools**
```yaml
Interfaces de Red:
  lo: Loopback (127.0.0.1)
  eth0: Primary interface (172.17.11.14)

Herramientas de Red:
  netstat: Network statistics
  ss: Socket statistics  
  ip: Network configuration
  iptables: Packet filtering (via UFW)
  ufw: Firewall management
```

---

## 📚 Librerías y Dependencies

### **Bibliotecas del Sistema**
```bash
# Librerías críticas para PostgreSQL
libc6                    # GNU C Library
libssl3                  # OpenSSL runtime library
libpq5                   # PostgreSQL C client library
libreadline8             # GNU readline library
zlib1g                   # Compression library

# Librerías para Grafana
libfontconfig1           # Font configuration library
libfreetype6             # FreeType 2 font engine
```

### **Python Environment (para scripts)**
```yaml
Python: 3.10.12 (sistema)
Pip: Disponible para instalación de paquetes
Paquetes instalados según necesidad:
  - psycopg2-binary (PostgreSQL adapter)
  - requests (HTTP library)
  - json (built-in)
```

### **Go Runtime (para binarios compilados)**
```yaml
Prometheus: Compilado estáticamente (no requiere Go runtime)
postgres_exporter: Compilado estáticamente
Grafana: Binarios pre-compilados
```

---

## 🔒 Componentes de Seguridad

### **Autenticación y Autorización**
```yaml
PAM (Pluggable Authentication Modules):
  Configuración: /etc/pam.d/
  Usado por: SSH, login, sudo

sudo: Privilege escalation
  Configuración: /etc/sudoers
  Usuario admin: outcontab2

PostgreSQL Authentication:
  Método: MD5 hash
  Configuración: pg_hba.conf
  Usuarios: postgres (local), sgm_user (remote)
```

### **Certificados y Criptografía**
```yaml
OpenSSL: 3.0.2 (crypto library)
Certificados del Sistema: /etc/ssl/certs/
SSH Keys: /home/outcontab2/.ssh/

Estados de SSL/TLS:
  PostgreSQL: Deshabilitado (red interna)
  HTTP Services: Sin HTTPS (red interna)
  SSH: Habilitado (puerto 22)
```

### **Firewall y Seguridad de Red**
```yaml
UFW (Uncomplicated Firewall): Instalado, configurado, inactivo
iptables: Sistema de filtrado subyacente
fail2ban: No instalado (considerar para SSH)

Reglas UFW Configuradas:
  - 5432/tcp from 172.17.11.13 (PostgreSQL)
  - 3000/tcp (Grafana)
  - 9090/tcp (Prometheus) 
  - 22/tcp (SSH)
```

---

## ⚙️ Variables de Entorno y Configuración

### **Variables del Sistema**
```bash
# Variables importantes
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
HOME=/home/outcontab2
SHELL=/bin/bash
LANG=en_US.UTF-8
TZ=UTC

# PostgreSQL specific
PGDATA=/var/lib/postgresql/14/main
PGVERSION=14
```

### **Configuraciones de kernel**
```bash
# /etc/sysctl.conf - Optimizaciones aplicadas
vm.swappiness = 10                    # Reducir uso de swap
vm.vfs_cache_pressure = 50            # Optimizar cache del filesystem
kernel.shmmax = 1073741824            # Shared memory máximo
kernel.shmall = 262144                # Páginas de memoria compartida
```

### **Limits del Sistema**
```bash
# /etc/security/limits.conf
postgres soft nofile 65536
postgres hard nofile 65536
grafana soft nofile 8192
grafana hard nofile 8192
prometheus soft nofile 16384
prometheus hard nofile 16384

# Default limits
* soft core 0
* hard core 0
```

---

## 🔄 Servicios y Daemons

### **Servicios Críticos**
```yaml
postgresql.service:
  Estado: active (exited) - Umbrella service
  Subservicio: postgresql@14-main.service
  Auto-start: enabled
  Uptime: 2+ semanas

prometheus.service:
  Estado: active (running)
  PID: 22764
  Auto-start: enabled  
  Uptime: 2+ semanas
  
postgres_exporter.service:
  Estado: active (running)
  PID: 22508
  Auto-start: enabled
  Uptime: 2+ semanas
  
grafana-server.service:
  Estado: active (running)
  PID: 24640
  Auto-start: enabled
  Uptime: 2+ semanas
```

### **Servicios del Sistema**
```yaml
systemd: Init system y service manager
NetworkManager: Gestión de red
cron: Scheduled task execution
ssh: Remote access daemon
rsyslog: System logging
ufw: Firewall service (inactivo)
```

---

## 🗂️ Estructura de Directorios

### **Directorios de Datos**
```bash
/var/lib/postgresql/14/main/    # Datos PostgreSQL
├── base/                       # Database files
├── global/                     # Cluster-wide tables
├── pg_wal/                     # Write-ahead logs
├── pg_xact/                    # Transaction status data
└── pg_stat/                    # Statistics files

/var/lib/prometheus/            # Datos Prometheus
├── data/                       # Time series data
└── wal/                        # Write-ahead logs

/var/lib/grafana/               # Datos Grafana
├── grafana.db                  # SQLite database
├── plugins/                    # Grafana plugins
└── sessions/                   # User sessions
```

### **Directorios de Configuración**
```bash
/etc/postgresql/14/main/        # Configuración PostgreSQL
├── postgresql.conf             # Configuración principal
├── pg_hba.conf                # Host-based authentication
├── pg_ident.conf              # User name mapping
└── postgresql.conf.backup      # Backup de configuración

/etc/prometheus/                # Configuración Prometheus
├── prometheus.yml              # Configuración principal
└── alert_rules.yml            # Reglas de alertas (si existe)

/etc/grafana/                   # Configuración Grafana
├── grafana.ini                 # Configuración principal  
└── provisioning/               # Provisioning automático
```

### **Directorios de Logs**
```bash
/var/log/postgresql/            # Logs PostgreSQL
/var/log/grafana/              # Logs Grafana
/var/log/prometheus/           # Logs Prometheus (systemd)
/var/log/syslog                # System logs
```

---

## 📦 Gestión de Paquetes

### **APT Package Manager**
```yaml
Sources List: /etc/apt/sources.list
Additional Sources: /etc/apt/sources.list.d/
Package Cache: /var/cache/apt/
Installed Packages: /var/lib/dpkg/status

Repositorios Configurados:
  - Ubuntu Main/Universe/Restricted/Multiverse
  - Ubuntu Security Updates
  - PostgreSQL Official APT Repository (si aplica)
  - Grafana APT Repository (si aplica)
```

### **Paquetes Críticos Instalados**
```bash
# Base del sistema
ubuntu-server                   # Server metapackage
openssh-server                  # SSH daemon
curl wget                       # Network tools
net-tools                       # Network utilities

# PostgreSQL ecosystem
postgresql-14                   # Database server
postgresql-client-14            # Command line client
postgresql-contrib-14           # Additional modules

# Monitoreo (instalados manualmente)
prometheus                      # Time series database
grafana-server                  # Visualization platform
postgres_exporter              # PostgreSQL metrics exporter

# Desarrollo y utilidades
python3 python3-pip           # Python runtime
git                            # Version control
nano vim                       # Text editors
htop                          # Process monitor
```

---

## 🔧 Herramientas de Backup y Recovery

### **Estrategias de Backup**
```yaml
PostgreSQL Backup:
  Método: pg_dump (lógico)
  Frecuencia: No configurada (manual)
  Comando: sudo -u postgres pg_dump sgm_db > backup.sql
  
Configuración para WAL Archiving:
  Estado: Preparado (wal_level=replica)
  Archive Command: No configurado
  
Point-in-Time Recovery:
  Estado: Posible con configuración adicional
```

### **Backup de Configuraciones**
```bash
# Scripts de backup recomendados
/home/outcontab2/postgresql_sgm_connection_info.txt (ya existe)
/home/outcontab2/CONFIGURACION_COMPLETA_PostgreSQL_Monitoreo.txt (ya existe)

# Archivos críticos para backup regular:
/etc/postgresql/14/main/postgresql.conf
/etc/postgresql/14/main/pg_hba.conf
/etc/prometheus/prometheus.yml
/etc/grafana/grafana.ini
/etc/systemd/system/postgres_exporter.service
```

---

## 📊 Métricas de Utilización de Recursos

### **Estado Actual del Sistema**
```yaml
RAM:
  Total: 3.8 GB
  Usada: 1.5 GB (39%)
  Libre: 127 MB
  Buffer/Cache: 2.2 GB
  Disponible: 2.0 GB (53%)

CPU:
  Cores: 2
  Utilización Promedio: < 5%
  Load Average: 0.1, 0.05, 0.02

Almacenamiento:
  Disco Total: 48 GB
  Usado: 9.5 GB (22%)
  Disponible: 36 GB (78%)
  Inodes: 5% usados

Red:
  Interface: eth0 (1000 Mb/s)
  Tráfico: Mínimo (monitoreo interno)
  Conexiones: PostgreSQL desde 172.17.11.13
```

### **Proyecciones de Crecimiento**
```yaml
Base de Datos:
  Crecimiento Estimado: Depende de uso SGM
  Monitoring Data: ~500 MB/mes (Prometheus)
  Logs: ~100 MB/mes (con rotación)

Escalabilidad:
  RAM: Suficiente para 2x carga actual
  CPU: Suficiente para 5x carga actual  
  Disco: Sufficient para 12+ meses
```

---

## 🔍 Herramientas de Diagnóstico

### **Scripts Personalizados**
```bash
# Script principal de monitoreo
/usr/local/bin/pg_monitor.sh

Funciones:
  - Estado de servicios
  - Conexiones PostgreSQL activas
  - Métricas de rendimiento
  - Uso de recursos
  - Top 5 tablas más grandes
  - Cache hit ratio
  - Queries más lentas
```

### **Comandos de Diagnóstico Útiles**
```bash
# PostgreSQL
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
sudo -u postgres psql -c "SELECT * FROM pg_stat_database;"

# Servicios
systemctl status postgresql prometheus grafana-server postgres_exporter

# Recursos
free -h
df -h
htop
netstat -tlnp

# Logs
journalctl -xe
tail -f /var/log/postgresql/postgresql-*.log
```

---

## 📈 Roadmap Tecnológico

### **Próximas Actualizaciones (Corto Plazo)**
```yaml
Seguridad:
  - Activar UFW firewall
  - Cambiar password por defecto Grafana
  - Implementar rotación de contraseñas
  
Monitoreo:
  - Configurar alertas Prometheus
  - Dashboards adicionales Grafana
  - Scripts de backup automatizados
```

### **Mejoras Futuras (Mediano Plazo)**
```yaml
Alta Disponibilidad:
  - PostgreSQL replication (streaming)
  - Load balancer para lecturas
  - Backup automatizado con cifrado
  
Observabilidad:
  - Logs centralizados (ELK stack?)
  - Métricas de aplicación Django
  - Distributed tracing
  
Seguridad:
  - SSL/TLS para PostgreSQL
  - HTTPS para servicios web
  - Certificate management
```

### **Consideraciones de Migración**
```yaml
PostgreSQL:
  Versión Actual: 14.19
  EOL: November 2026
  Migración a 15/16: Planificar para 2025

Sistema Operativo:
  Ubuntu 22.04 LTS
  EOL: April 2027
  Próxima LTS: 24.04 (considerar para 2025)
```

---

## 📞 Información de Soporte

### **Documentación Oficial**
```yaml
PostgreSQL 14: https://www.postgresql.org/docs/14/
Prometheus: https://prometheus.io/docs/
Grafana: https://grafana.com/docs/grafana/latest/
Ubuntu 22.04: https://help.ubuntu.com/22.04/
```

### **Comunidades y Recursos**
```yaml
Stack Overflow: Tags postgresql, prometheus, grafana
Reddit: r/PostgreSQL, r/grafana, r/Ubuntu
GitHub: Issues en repositorios oficiales
IRC: #postgresql, #prometheus (Libera.Chat)
```

### **Vendor Support**
```yaml
PostgreSQL: Community support (no comercial)
Grafana: Community + Enterprise options
Prometheus: CNCF project, community support
Ubuntu: Canonical support available
```

---

## 📝 Resumen Ejecutivo

### **Tecnologías Core**
- **PostgreSQL 14.19:** Base de datos relacional principal optimizada para 4GB RAM
- **Prometheus:** TSDB con 30 días de retención, scraping cada 15s
- **Grafana:** Plataforma de visualización con dashboard PostgreSQL
- **postgres_exporter:** Bridge para ~150 métricas PostgreSQL

### **Estado del Sistema**
- **Servicios:** 4/4 activos y estables (2+ semanas uptime)
- **Recursos:** 53% RAM disponible, 78% disco disponible
- **Seguridad:** Configurado, pendientes mejoras recomendadas
- **Monitoreo:** Operacional con dashboard principal

### **Próximas Acciones Requeridas**
1. **Inmediato:** Cambiar password Grafana, activar firewall
2. **Corto plazo:** Configurar alertas, implementar backups
3. **Mediano plazo:** SSL/TLS, alta disponibilidad si requerida

---

**Inventario Generado:** 28 de Noviembre, 2025  
**Servidor:** vm-bdo-outcontab2 (172.17.11.14)  
**Responsable:** Documentación Técnica SGM  
**Próxima Revisión:** Trimestral  

---

*Este inventario debe actualizarse cada vez que se instalen, actualicen o desinstalen componentes del sistema.*