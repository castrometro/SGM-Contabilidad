# 🔗 APIs Expuestas - Servidor de Base de Datos SGM

**Servidor:** vm-bdo-outcontab2 (172.17.11.14)  
**Fecha:** 28 de Noviembre, 2025  
**Función:** Base de Datos PostgreSQL + Stack de Monitoreo  
**Red:** 🔒 VPN Corporativa - Solo acceso interno empresarial  

---

## 📊 Resumen de APIs Disponibles

| API | Puerto | Protocolo | Autenticación | Estado | Uso Principal |
|-----|--------|-----------|---------------|--------|---------------|
| **PostgreSQL** | 5432 | PostgreSQL Wire | MD5 Hash | ✅ Activa | Base de datos SGM |
| **Prometheus** | 9090 | HTTP REST | ❌ Ninguna* | ✅ Activa | Consulta de métricas |
| **Grafana** | 3000 | HTTP REST | Usuario/Pass | ✅ Activa | Dashboards web |

*Sin autenticación individual (protegido por VPN corporativa)
| **postgres_exporter** | 9187 | HTTP | ❌ Ninguna | ✅ Activa | Métricas PostgreSQL |

---

## 🗄️ API de PostgreSQL Database

### **Información de Conexión**
```yaml
Protocolo: PostgreSQL Wire Protocol (v3.0)
Puerto: 5432
Host: 172.17.11.14
Base de Datos: sgm_db
Usuario: sgm_user
Restricción: Solo desde 172.17.11.13/32
SSL: Deshabilitado (red interna)
```

### **Métodos de Conexión**

#### **1. Conexión Django/Python**
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'sgm_db',
        'USER': 'sgm_user',
        'PASSWORD': 't2LShvMEC5nnbiCSQtzJtSyGiqt3HysI',
        'HOST': '172.17.11.14',
        'PORT': '5432',
        'OPTIONS': {
            'connect_timeout': 30,
            'options': '-c default_transaction_isolation=read_committed'
        }
    }
}

# Ejemplo de uso con psycopg2
import psycopg2
conn = psycopg2.connect(
    host="172.17.11.14",
    port="5432",
    database="sgm_db",
    user="sgm_user",
    password="t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI"
)
```

#### **2. Conexión desde Terminal**
```bash
# Usando psql
export PGPASSWORD='t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI'
psql -h 172.17.11.14 -p 5432 -U sgm_user -d sgm_db

# String de conexión
psql "postgresql://sgm_user:t2LShvMEC5nnbiCSQtzJtSyGiqt3HysI@172.17.11.14:5432/sgm_db"
```

### **Operaciones Permitidas**
```yaml
DDL (Data Definition Language):
  - CREATE TABLE, INDEX, VIEW
  - ALTER TABLE (estructura)
  - DROP TABLE, INDEX, VIEW
  - COMMENT ON objects

DML (Data Manipulation Language):
  - SELECT (consultas)
  - INSERT (inserción de datos)
  - UPDATE (actualización de datos)
  - DELETE (eliminación de datos)

DCL (Data Control Language):
  - GRANT (limitado)
  - REVOKE (limitado)
  
Transacciones:
  - BEGIN, COMMIT, ROLLBACK
  - SAVEPOINT, RELEASE SAVEPOINT
  - SET TRANSACTION ISOLATION LEVEL

Funciones:
  - Stored procedures
  - User-defined functions
  - Aggregate functions
```

### **Limitaciones de Seguridad**
```yaml
Permisos NO otorgados:
  - SUPERUSER privileges
  - CREATE ROLE/USER
  - CREATE DATABASE
  - Access to system catalogs (read-only)
  - File system access (COPY FROM/TO file)
  - Extension installation

Restricciones de Red:
  - Solo conexiones desde 172.17.11.13
  - Máximo 100 conexiones concurrentes
  - Timeout de conexión: 30 segundos
```

### **Ejemplos de Uso**

#### **Consultas Básicas**
```sql
-- Verificar conectividad
SELECT 1 as test, current_database(), current_user, now();

-- Información de la base de datos
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public';

-- Estadísticas de conexiones
SELECT 
    state,
    count(*) 
FROM pg_stat_activity 
WHERE datname = 'sgm_db' 
GROUP BY state;
```

#### **Operaciones CRUD Típicas**
```sql
-- CREATE
INSERT INTO tabla_ejemplo (nombre, email, fecha_creacion) 
VALUES ('Usuario Test', 'test@example.com', NOW());

-- READ
SELECT id, nombre, email, fecha_creacion 
FROM tabla_ejemplo 
WHERE email = 'test@example.com';

-- UPDATE
UPDATE tabla_ejemplo 
SET nombre = 'Usuario Actualizado' 
WHERE email = 'test@example.com';

-- DELETE
DELETE FROM tabla_ejemplo 
WHERE email = 'test@example.com';
```

---

## 📈 API de Prometheus

### **Información de Conexión**
```yaml
Protocolo: HTTP REST API
Puerto: 9090
URL Base: http://172.17.11.14:9090
Autenticación: Ninguna
Formato: JSON
Versión API: v1
```

### **Endpoints Principales**

#### **1. Query API - Consulta Instantánea**
```http
GET /api/v1/query

Parámetros:
  - query (string): PromQL query
  - time (optional): Timestamp para evaluación
  - timeout (optional): Timeout de evaluación

Ejemplo:
GET /api/v1/query?query=pg_stat_activity_count{datname="sgm_db"}
```

**Respuesta:**
```json
{
  "status": "success",
  "data": {
    "resultType": "vector",
    "result": [
      {
        "metric": {
          "__name__": "pg_stat_activity_count",
          "datname": "sgm_db",
          "instance": "localhost:9187",
          "job": "postgresql",
          "state": "active"
        },
        "value": [1701182400, "3"]
      }
    ]
  }
}
```

#### **2. Query Range API - Consulta de Rango**
```http
GET /api/v1/query_range

Parámetros:
  - query (string): PromQL query
  - start (string): RFC3339 timestamp o Unix timestamp
  - end (string): RFC3339 timestamp o Unix timestamp  
  - step (string): Duration (ej: 15s, 1m, 1h)

Ejemplo:
GET /api/v1/query_range?query=pg_stat_activity_count{datname="sgm_db"}&start=2025-11-28T12:00:00Z&end=2025-11-28T18:00:00Z&step=15s
```

#### **3. Targets API - Estado de Scraping**
```http
GET /api/v1/targets

Respuesta:
{
  "status": "success",
  "data": {
    "activeTargets": [
      {
        "discoveredLabels": {
          "__address__": "localhost:9187",
          "__metrics_path__": "/metrics",
          "__scheme__": "http",
          "job": "postgresql"
        },
        "labels": {
          "instance": "localhost:9187",
          "job": "postgresql"
        },
        "scrapePool": "postgresql",
        "scrapeUrl": "http://localhost:9187/metrics",
        "globalUrl": "http://172.17.11.14:9187/metrics",
        "lastError": "",
        "lastScrape": "2025-11-28T14:35:22.123Z",
        "lastScrapeDuration": 0.002,
        "health": "up"
      }
    ]
  }
}
```

#### **4. Metadata API - Información de Métricas**
```http
GET /api/v1/metadata

Respuesta (ejemplo):
{
  "status": "success",
  "data": {
    "pg_stat_activity_count": [
      {
        "type": "gauge",
        "help": "Number of connections in this state",
        "unit": ""
      }
    ]
  }
}
```

### **Consultas PromQL Útiles**

#### **Métricas de Conexiones**
```promql
# Conexiones activas actuales
pg_stat_activity_count{datname="sgm_db", state="active"}

# Total de conexiones por estado
sum by (state) (pg_stat_activity_count{datname="sgm_db"})

# Porcentaje de uso de conexiones
(sum(pg_stat_activity_count{datname="sgm_db"}) / pg_settings_max_connections) * 100
```

#### **Métricas de Rendimiento**
```promql
# Transacciones por segundo
rate(pg_stat_database_xact_commit{datname="sgm_db"}[5m])

# Cache hit ratio
(pg_stat_database_blks_hit{datname="sgm_db"} / (pg_stat_database_blks_hit{datname="sgm_db"} + pg_stat_database_blks_read{datname="sgm_db"})) * 100

# Tamaño de base de datos
pg_database_size_bytes{datname="sgm_db"}
```

#### **Métricas Históricas**
```promql
# Promedio de conexiones en las últimas 6 horas
avg_over_time(pg_stat_activity_count{datname="sgm_db"}[6h])

# Máximo de conexiones en el último día
max_over_time(pg_stat_activity_count{datname="sgm_db"}[1d])

# Tasa de crecimiento de transacciones
rate(pg_stat_database_xact_commit{datname="sgm_db"}[1h])
```

### **Ejemplos de Uso con curl**

#### **Consulta Simple**
```bash
# Conexiones actuales
curl -G 'http://172.17.11.14:9090/api/v1/query' \
  --data-urlencode 'query=pg_stat_activity_count{datname="sgm_db"}'
```

#### **Consulta de Rango**
```bash
# Últimas 6 horas con step de 1 minuto
curl -G 'http://172.17.11.14:9090/api/v1/query_range' \
  --data-urlencode 'query=pg_stat_activity_count{datname="sgm_db"}' \
  --data-urlencode 'start=2025-11-28T08:00:00Z' \
  --data-urlencode 'end=2025-11-28T14:00:00Z' \
  --data-urlencode 'step=1m'
```

---

## 🎨 API de Grafana

### **Información de Conexión**
```yaml
Protocolo: HTTP REST API
Puerto: 3000
URL Base: http://172.17.11.14:3000
Autenticación: Session-based (login requerido)
Formato: JSON
Versión: v1 (Grafana API)
```

### **Autenticación**

#### **1. Login Web**
```http
POST /login
Content-Type: application/json

Body:
{
  "user": "admin",
  "password": "admin",
  "email": ""
}

Response:
{
  "message": "Logged in"
}
```

#### **2. API Key Authentication (Alternativo)**
```bash
# Crear API Key desde UI: Configuration → API Keys
# Usar en headers:
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk

# Test de conectividad
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://172.17.11.14:3000/api/health
```

### **Endpoints Principales**

#### **1. Dashboards API**
```http
# Listar dashboards
GET /api/search?type=dash-db

Response:
[
  {
    "id": 1,
    "uid": "abc123",
    "title": "PostgreSQL Database",
    "uri": "db/postgresql-database",
    "url": "/d/abc123/postgresql-database",
    "slug": "postgresql-database",
    "type": "dash-db",
    "tags": ["postgresql", "database"],
    "isStarred": false
  }
]
```

```http
# Obtener dashboard específico
GET /api/dashboards/uid/{dashboard-uid}

# Crear/actualizar dashboard
POST /api/dashboards/db
Content-Type: application/json

Body:
{
  "dashboard": {
    "id": null,
    "title": "Mi Dashboard Custom",
    "tags": ["custom"],
    "timezone": "browser",
    "panels": [...],
    "time": {
      "from": "now-6h",
      "to": "now"
    },
    "refresh": "30s"
  },
  "folderId": 0,
  "overwrite": false
}
```

#### **2. Data Sources API**
```http
# Listar data sources
GET /api/datasources

Response:
[
  {
    "id": 1,
    "uid": "prometheus-uid",
    "orgId": 1,
    "name": "Prometheus",
    "type": "prometheus",
    "typeLogoUrl": "",
    "access": "proxy",
    "url": "http://localhost:9090",
    "password": "",
    "user": "",
    "database": "",
    "basicAuth": false,
    "basicAuthUser": "",
    "basicAuthPassword": "",
    "withCredentials": false,
    "isDefault": true,
    "jsonData": {},
    "secureJsonFields": {},
    "version": 1,
    "readOnly": false
  }
]
```

#### **3. Query API (Proxy a Prometheus)**
```http
POST /api/ds/query
Content-Type: application/json

Body:
{
  "queries": [
    {
      "refId": "A",
      "datasource": {
        "type": "prometheus",
        "uid": "prometheus-uid"
      },
      "expr": "pg_stat_activity_count{datname=\"sgm_db\"}",
      "interval": "",
      "legendFormat": "Active Connections",
      "range": true,
      "instant": false
    }
  ],
  "range": {
    "from": "2025-11-28T12:00:00Z",
    "to": "2025-11-28T18:00:00Z",
    "raw": {
      "from": "now-6h",
      "to": "now"
    }
  },
  "interval": "15s",
  "intervalMs": 15000,
  "maxDataPoints": 1440
}
```

#### **4. Annotations API**
```http
# Crear anotación
POST /api/annotations
Content-Type: application/json

Body:
{
  "dashboardId": 1,
  "panelId": 2,
  "time": 1701182400000,
  "timeEnd": 1701182460000,
  "text": "Deployment realizado",
  "tags": ["deployment", "production"]
}
```

### **Ejemplos de Uso con Python**

#### **Cliente Grafana Básico**
```python
import requests
import json

class GrafanaClient:
    def __init__(self, base_url, username, password):
        self.base_url = base_url
        self.session = requests.Session()
        self._login(username, password)
    
    def _login(self, username, password):
        login_data = {
            "user": username,
            "password": password
        }
        response = self.session.post(
            f"{self.base_url}/login",
            json=login_data
        )
        response.raise_for_status()
    
    def get_dashboards(self):
        response = self.session.get(f"{self.base_url}/api/search")
        return response.json()
    
    def query_prometheus(self, query, range_from="now-1h", range_to="now"):
        query_data = {
            "queries": [{
                "refId": "A",
                "datasource": {"type": "prometheus", "uid": "prometheus-uid"},
                "expr": query,
                "range": True,
                "instant": False
            }],
            "range": {
                "from": range_from,
                "to": range_to,
                "raw": {"from": range_from, "to": range_to}
            }
        }
        response = self.session.post(
            f"{self.base_url}/api/ds/query",
            json=query_data
        )
        return response.json()

# Uso
client = GrafanaClient("http://172.17.11.14:3000", "admin", "admin")
dashboards = client.get_dashboards()
connections_data = client.query_prometheus('pg_stat_activity_count{datname="sgm_db"}')
```

---

## 📊 API de postgres_exporter

### **Información de Conexión**
```yaml
Protocolo: HTTP (Prometheus Metrics Format)
Puerto: 9187
URL: http://172.17.11.14:9187/metrics
Autenticación: Ninguna
Formato: Prometheus Text Format
Uso: Solo para scraping de Prometheus
```

### **Endpoint de Métricas**

#### **GET /metrics**
```http
GET /metrics

Content-Type: text/plain; version=0.0.4; charset=utf-8

Response (ejemplo):
# HELP pg_stat_activity_count Number of connections in this state
# TYPE pg_stat_activity_count gauge
pg_stat_activity_count{datname="sgm_db",state="active"} 3
pg_stat_activity_count{datname="sgm_db",state="idle"} 2
pg_stat_activity_count{datname="sgm_db",state="idle_in_transaction"} 0

# HELP pg_stat_database_numbackends Number of backends currently connected to this database
# TYPE pg_stat_database_numbackends gauge
pg_stat_database_numbackends{datname="sgm_db"} 5

# HELP pg_stat_database_xact_commit Number of transactions in this database that have been committed
# TYPE pg_stat_database_xact_commit counter
pg_stat_database_xact_commit{datname="sgm_db"} 1247

# HELP pg_settings_max_connections Sets the maximum number of concurrent connections
# TYPE pg_settings_max_connections gauge
pg_settings_max_connections 100

# HELP pg_up Whether the last scrape of metrics from PostgreSQL was able to connect to the server (1 for yes, 0 for no)
# TYPE pg_up gauge
pg_up 1
```

### **Métricas Principales Expuestas**

#### **Conexiones y Actividad**
```
pg_stat_activity_count{datname,state}           # Conexiones por estado
pg_stat_database_numbackends{datname}           # Backends conectados
pg_settings_max_connections                     # Límite de conexiones
```

#### **Transacciones**
```
pg_stat_database_xact_commit{datname}           # Transacciones exitosas
pg_stat_database_xact_rollback{datname}         # Transacciones revertidas
pg_stat_database_conflicts{datname}             # Conflictos
```

#### **I/O y Rendimiento**
```
pg_stat_database_blks_read{datname}             # Bloques leídos de disco
pg_stat_database_blks_hit{datname}              # Bloques leídos de cache
pg_stat_database_tup_returned{datname}          # Tuplas devueltas
pg_stat_database_tup_fetched{datname}           # Tuplas obtenidas
```

#### **Configuración**
```
pg_settings_shared_buffers_bytes                # Memoria compartida
pg_settings_work_mem_bytes                      # Memoria de trabajo
pg_settings_effective_cache_size_bytes          # Cache efectivo
```

#### **Estado del Sistema**
```
pg_up                                           # Estado de conexión (1=OK, 0=Error)
pg_version_info{version,short_version}          # Versión PostgreSQL
```

### **Ejemplo de Scraping Manual**
```bash
# Obtener todas las métricas
curl http://172.17.11.14:9187/metrics

# Filtrar métricas específicas
curl http://172.17.11.14:9187/metrics | grep "pg_stat_activity_count"

# Solo conexiones activas
curl http://172.17.11.14:9187/metrics | grep 'state="active"'

# Verificar estado de conexión
curl http://172.17.11.14:9187/metrics | grep "pg_up"
```

---

## 🔗 Integración entre APIs

### **Flujo de Datos Completo**
```
1. postgres_exporter (/metrics) → consulta PostgreSQL cada 15s
2. Prometheus (/api/v1/*) → scrapes postgres_exporter cada 15s  
3. Grafana (/api/ds/query) → query Prometheus para dashboards
4. Django Application → conecta directamente a PostgreSQL
```

### **Ejemplo de Integración Completa**

#### **Script de Monitoreo Personalizado**
```python
#!/usr/bin/env python3
import requests
import psycopg2
import json
from datetime import datetime

class SGMMonitor:
    def __init__(self):
        self.prometheus_url = "http://172.17.11.14:9090"
        self.grafana_url = "http://172.17.11.14:3000"
        self.pg_config = {
            'host': '172.17.11.14',
            'port': 5432,
            'database': 'sgm_db',
            'user': 'sgm_user',
            'password': 't2LShvMEC5nnbiCSQtzJtSyGiqt3HysI'
        }
    
    def get_prometheus_metric(self, query):
        """Obtener métrica de Prometheus"""
        response = requests.get(
            f"{self.prometheus_url}/api/v1/query",
            params={'query': query}
        )
        return response.json()
    
    def get_direct_pg_stats(self):
        """Obtener estadísticas directamente de PostgreSQL"""
        conn = psycopg2.connect(**self.pg_config)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                state,
                count(*) as connections,
                max(now() - state_change) as max_duration
            FROM pg_stat_activity 
            WHERE datname = 'sgm_db'
            GROUP BY state;
        """)
        
        results = cursor.fetchall()
        conn.close()
        return results
    
    def create_grafana_annotation(self, text, tags):
        """Crear anotación en Grafana"""
        # Requiere autenticación - implementar según necesidad
        pass
    
    def health_check(self):
        """Verificar salud de todos los servicios"""
        status = {
            'timestamp': datetime.now().isoformat(),
            'postgresql': False,
            'prometheus': False,
            'postgres_exporter': False,
            'grafana': False
        }
        
        # Test PostgreSQL
        try:
            conn = psycopg2.connect(**self.pg_config)
            conn.close()
            status['postgresql'] = True
        except:
            pass
        
        # Test Prometheus
        try:
            response = requests.get(f"{self.prometheus_url}/api/v1/query?query=up")
            if response.status_code == 200:
                status['prometheus'] = True
        except:
            pass
        
        # Test postgres_exporter (via Prometheus)
        try:
            response = requests.get(f"{self.prometheus_url}/api/v1/query?query=pg_up")
            data = response.json()
            if data['status'] == 'success' and len(data['data']['result']) > 0:
                status['postgres_exporter'] = True
        except:
            pass
        
        # Test Grafana
        try:
            response = requests.get(f"{self.grafana_url}/api/health")
            if response.status_code == 200:
                status['grafana'] = True
        except:
            pass
        
        return status

# Uso del monitor
if __name__ == "__main__":
    monitor = SGMMonitor()
    
    # Health check
    health = monitor.health_check()
    print("=== HEALTH CHECK ===")
    for service, status in health.items():
        print(f"{service}: {'✅ OK' if status else '❌ ERROR'}")
    
    # Métricas actuales
    print("\n=== MÉTRICAS ACTUALES ===")
    connections = monitor.get_prometheus_metric('pg_stat_activity_count{datname="sgm_db"}')
    print(f"Conexiones desde Prometheus: {json.dumps(connections, indent=2)}")
    
    pg_stats = monitor.get_direct_pg_stats()
    print(f"Conexiones directas de PostgreSQL: {pg_stats}")
```

---

## ⚡ Consideraciones de Rendimiento

### **Límites y Throttling**
```yaml
PostgreSQL:
  - Max connections: 100
  - Connection timeout: 30s
  - Query timeout: Sin límite (configurar en aplicación)

Prometheus:
  - Query timeout: 2m (default)
  - Max samples: 50M per query
  - Rate limiting: No implementado

Grafana:
  - Dashboard refresh: Min 5s
  - Query timeout: 30s (configurable)
  - Concurrent queries: 20 (default)

postgres_exporter:
  - Scrape interval: 15s
  - Query timeout: 10s
  - Max connections: 1
```

### **Optimizaciones Recomendadas**
```yaml
Contexto VPN Corporativa:
  - Red interna confiable, latencia baja
  - Sin restricciones de ancho de banda críticas
  - Autenticación a nivel de VPN ya implementada

Para PostgreSQL:
  - Usar connection pooling en Django
  - Implementar prepared statements
  - Índices apropiados en tablas monitoreadas

Para Prometheus:
  - Usar recording rules para queries complejas
  - Retención de 30 días adecuada para VPN interna
  - Acceso directo desde red empresarial eficiente

Para Grafana:
  - Cache de queries habilitado
  - Variables de template para eficiencia
  - Refresh intervals apropiados para uso interno
```

---

## 📚 Documentación de Referencia

### **Enlaces Oficiales**
- **PostgreSQL 14:** https://www.postgresql.org/docs/14/
- **Prometheus API:** https://prometheus.io/docs/prometheus/latest/querying/api/
- **Grafana HTTP API:** https://grafana.com/docs/grafana/latest/http_api/
- **postgres_exporter:** https://github.com/prometheus-community/postgres_exporter

### **Herramientas de Testing**
```bash
# Postman Collections disponibles en:
# - Prometheus API: https://www.postman.com/prometheus/workspace/
# - Grafana API: https://grafana.com/docs/grafana/latest/http_api/

# Swagger/OpenAPI
# Prometheus: http://172.17.11.14:9090/api/v1/
# Grafana: No disponible oficialmente
```

---

**Documentación Generada:** 28 de Noviembre, 2025  
**Servidor:** vm-bdo-outcontab2 (172.17.11.14)  
**APIs Documentadas:** PostgreSQL, Prometheus, Grafana, postgres_exporter  

---

*Para ejemplos más específicos o integraciones personalizadas, consultar la documentación técnica completa en los archivos adjuntos.*