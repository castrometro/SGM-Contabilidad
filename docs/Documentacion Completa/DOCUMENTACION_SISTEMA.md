# 📚 Documentación del Sistema SGM Contabilidad

**Versión:** 1.2  
**Fecha:** 28 de Noviembre de 2025  
**Autor:** BDO Chile - Equipo de Desarrollo

> **🔒 NOTA DE SEGURIDAD:** Este sistema está desplegado dentro de la VPN corporativa de BDO Chile.  
> El acceso requiere conexión activa a la red privada 172.17.11.0/24.

---

## 📑 Índice

1. [Diagrama de Arquitectura](#1-diagrama-de-arquitectura)
2. [Flujo de Autenticación y Autorización](#2-flujo-de-autenticación-y-autorización)
3. [Inventario de Tecnologías](#3-inventario-de-tecnologías)
4. [Descripción de APIs Expuestas](#4-descripción-de-apis-expuestas)
5. [Configuración de Seguridad](#5-configuración-de-seguridad)

---

## 1. Diagrama de Arquitectura

### 1.1 Vista General del Sistema

```mermaid
flowchart TB
    subgraph CLIENTE["🖥️ CLIENTE"]
        Browser["Navegador Web<br/>React SPA"]
    end

    subgraph FRONTEND["📱 FRONTEND - React"]
        direction TB
        ReactApp["React 19 + Vite"]
        Router["React Router DOM"]
        TailwindCSS["TailwindCSS + DaisyUI"]
        AxiosClient["Axios HTTP Client"]
    end

    subgraph BACKEND["⚙️ BACKEND - Django REST"]
        direction TB
        Django["Django 5.2"]
        DRF["Django REST Framework"]
        JWT["JWT Authentication<br/>(SimpleJWT)"]
        Gunicorn["Gunicorn<br/>(3 Workers)"]
        WhiteNoise["WhiteNoise<br/>(Static Files)"]
        
        subgraph APPS["📦 Django Apps"]
            API["api<br/>(Usuarios, Clientes)"]
            RindeGastos["rindegastos<br/>(Captura Masiva)"]
        end
    end

    subgraph ASYNC["🔄 PROCESAMIENTO ASÍNCRONO"]
        direction TB
        Celery["Celery Workers"]
        Redis["Redis 7.2<br/>(Broker + Cache)"]
        Flower["Flower<br/>(Monitoreo)"]
    end

    subgraph DATA["💾 DATOS"]
        direction TB
        PostgreSQL["PostgreSQL<br/>(Base de Datos)"]
        MediaFiles["Media Files<br/>(Excel, Uploads)"]
    end

    subgraph EXTERNAL["🌐 SERVICIOS EXTERNOS"]
        GitHub["GitHub<br/>(Repositorio)"]
        GHActions["GitHub Actions<br/>(CI/CD)"]
    end

    Browser --> ReactApp
    ReactApp --> Router
    ReactApp --> TailwindCSS
    ReactApp --> AxiosClient
    
    AxiosClient -->|"HTTP/REST<br/>+ JWT Token"| Gunicorn
    Gunicorn --> Django
    Django --> DRF
    DRF --> JWT
    DRF --> API
    DRF --> RindeGastos
    
    API --> PostgreSQL
    RindeGastos --> Celery
    Celery --> Redis
    Redis --> Flower
    Celery --> PostgreSQL
    Celery --> MediaFiles
    
    Django --> WhiteNoise
    
    GHActions -->|"Deploy"| Gunicorn
    GitHub --> GHActions
```

### 1.2 Arquitectura de Servidores

> **🔒 IMPORTANTE:** Todos los servidores están dentro de la **VPN corporativa BDO Chile** (Red 172.17.11.0/24).  
> El acceso está restringido únicamente a equipos conectados a la VPN interna de BDO.

```mermaid
flowchart TB
    subgraph VPN["🔒 VPN CORPORATIVA BDO (172.17.11.0/24)"]
        subgraph PROD["🚀 PRODUCCIÓN (172.17.11.13)"]
            direction TB
            ProdBranch["Branch: production"]
            ProdDjango["Django + Gunicorn<br/>Puerto 8000"]
            ProdCelery["Celery Workers"]
            ProdRedis["Redis<br/>Puerto 6379"]
        end

        subgraph DEV["🔧 DESARROLLO (172.17.11.22)"]
            direction TB
            DevBranch["Branch: development"]
            DevDjango["Django + runserver<br/>Puerto 8000"]
            DevCelery["Celery Workers"]
            DevRedis["Redis<br/>Puerto 6379"]
        end

        subgraph DB_SERVER["💾 SERVIDOR DE BASES DE DATOS (172.17.11.21)"]
            ProdDB["PostgreSQL 16<br/>sgm_db_dev<br/>Puerto 5432"]
        end
    end

    subgraph USERS["👥 USUARIOS BDO"]
        Employee["Empleados con<br/>acceso a VPN"]
    end

    Employee -->|"VPN Connection"| VPN
    
    ProdDjango --> ProdDB
    DevDjango --> ProdDB
    ProdDjango --> ProdRedis
    DevDjango --> DevRedis
    ProdCelery --> ProdRedis
    DevCelery --> DevRedis
```

**Características de la Red:**
- **Aislamiento total**: Sin acceso desde Internet público
- **Autenticación VPN**: Requiere credenciales corporativas BDO
- **Firewall corporativo**: Protección a nivel de infraestructura
- **Segmentación**: Red 172.17.11.0/24 dedicada a SGM

### 1.3 Flujo de Datos - Procesamiento Excel

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend (React)
    participant D as Django API
    participant C as Celery Worker
    participant R as Redis
    participant DB as PostgreSQL

    U->>F: Sube archivo Excel
    F->>D: POST /api/rindegastos/step1/iniciar/
    D->>R: Guarda archivo temporalmente
    D->>C: Encola tarea (task_id)
    D-->>F: Retorna task_id
    
    loop Polling cada 3s
        F->>D: GET /api/rindegastos/step1/estado/{task_id}/
        D->>R: Consulta estado
        D-->>F: Estado (procesando/completado)
    end
    
    C->>R: Lee archivo
    C->>C: Procesa Excel
    C->>R: Guarda resultado
    C->>DB: Crea registro Rendicion
    
    U->>F: Click descargar
    F->>D: GET /api/rindegastos/step1/descargar/{task_id}/
    D->>R: Obtiene Excel procesado
    D-->>F: Archivo Excel
    F-->>U: Descarga archivo
```

---

## 2. Flujo de Autenticación y Autorización

### 2.1 Mecanismo de Autenticación

El sistema utiliza **JWT (JSON Web Tokens)** implementado con `djangorestframework-simplejwt`.

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant A as Django Auth
    participant DB as PostgreSQL

    U->>F: Ingresa credenciales
    F->>A: POST /api/token/<br/>{correo_bdo, password}
    A->>DB: Valida usuario
    DB-->>A: Usuario válido
    A-->>F: {access_token, refresh_token}
    F->>F: Almacena tokens (localStorage)
    
    Note over F,A: Peticiones subsecuentes
    
    F->>A: GET /api/clientes/<br/>Authorization: Bearer {access_token}
    A->>A: Valida JWT
    A-->>F: Datos del recurso
    
    Note over F,A: Renovación de token
    
    F->>A: POST /api/token/refresh/<br/>{refresh_token}
    A-->>F: {access_token nuevo}
```

### 2.2 Configuración JWT

```python
# backend/sgm_backend/settings.py
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),    # Jornada laboral completa
    'REFRESH_TOKEN_LIFETIME': timedelta(days=3),    # Balance seguridad/comodidad
    'ROTATE_REFRESH_TOKENS': True,                  # Nuevo refresh token cada uso
    'BLACKLIST_AFTER_ROTATION': True,               # Invalida tokens rotados
    'UPDATE_LAST_LOGIN': True,                      # Actualiza último login
}
```

### 2.3 Sistema de Roles y Permisos

```mermaid
flowchart TB
    subgraph ROLES["🎭 JERARQUÍA DE ROLES"]
        direction TB
        Gerente["👔 Gerente<br/>• Acceso total a sus áreas<br/>• Gestión de usuarios<br/>• Asignación de clientes"]
        Supervisor["👷 Supervisor<br/>• Ve sus analistas supervisados<br/>• Acceso a clientes de su equipo<br/>• Dashboard de equipo"]
        Senior["📊 Senior<br/>• Acceso a clientes asignados<br/>• Funciones avanzadas"]
        Analista["💼 Analista<br/>• Solo clientes asignados<br/>• Funciones básicas"]
    end

    Gerente --> Supervisor
    Supervisor --> Senior
    Senior --> Analista
```

### 2.4 Clases de Permisos Personalizados

| Clase | Descripción | Uso |
|-------|-------------|-----|
| `IsGerente` | Solo usuarios con `tipo_usuario='gerente'` | Gestión de analistas, asignaciones |
| `IsSupervisor` | Solo supervisores | Dashboard de equipo supervisado |
| `IsAnalista` | Solo analistas | Vistas básicas de clientes |
| `IsAuthenticatedAndActive` | Autenticados y activos | Todos los endpoints protegidos |
| `ClienteAccess` | Acceso según rol a clientes | ViewSets de clientes |
| `IsGerenteOrSelfOrReadOnly` | Gerente o propietario | Asignaciones cliente-usuario |

### 2.5 Control de Acceso por Recurso

```python
# Ejemplo de implementación en ViewSet
class ClienteViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedAndActive, ClienteAccess]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.tipo_usuario == 'analista':
            # Analistas solo ven sus clientes asignados
            asignados = AsignacionClienteUsuario.objects.filter(
                usuario=self.request.user
            ).values_list('cliente_id', flat=True)
            return qs.filter(pk__in=asignados)
        return qs  # Gerentes ven todos
```

### 2.6 Validación de Acceso a Recursos

```mermaid
flowchart TD
    A[Petición HTTP] --> B{¿Token JWT válido?}
    B -->|No| C[401 Unauthorized]
    B -->|Sí| D{¿Usuario activo?}
    D -->|No| E[403 Forbidden]
    D -->|Sí| F{¿Tiene rol requerido?}
    F -->|No| G[403 Forbidden]
    F -->|Sí| H{¿Tiene acceso al objeto?}
    H -->|No| I[403 Forbidden]
    H -->|Sí| J[200 OK - Retorna datos]
```

---

## 3. Inventario de Tecnologías

### 3.1 Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | 19.0.0 | Framework UI principal |
| **Vite** | 7.2.4 | Build tool y dev server |
| **React Router DOM** | 7.3.0 | Enrutamiento SPA |
| **TailwindCSS** | 4.0.13 | Framework CSS utility-first |
| **DaisyUI** | 5.0.3 | Componentes UI para Tailwind |
| **Axios** | 1.9.0 | Cliente HTTP |
| **Recharts** | 2.15.2 | Gráficos y visualizaciones |
| **Framer Motion** | 12.7.3 | Animaciones |
| **Lucide React** | 0.488.0 | Iconos |
| **React Select** | 5.10.1 | Selectores avanzados |

### 3.2 Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Django** | 5.2.8 | Framework web principal |
| **Django REST Framework** | 3.16.0 | API REST |
| **djangorestframework-simplejwt** | 5.5.1 | Autenticación JWT |
| **Celery** | 5.5.2 | Procesamiento asíncrono |
| **Redis** | 6.0.0 | Broker de mensajes y caché |
| **Gunicorn** | 23.0.0 | Servidor WSGI producción |
| **WhiteNoise** | 6.9.0 | Archivos estáticos |
| **Pandas** | 2.2.3 | Procesamiento de datos |
| **OpenPyXL** | 3.1.5 | Manipulación de Excel |
| **psycopg2-binary** | 2.9.10 | Driver PostgreSQL |
| **django-cors-headers** | 4.7.0 | Configuración CORS |
| **django-redis** | >=5.4.0 | Cache con Redis |

### 3.3 Base de Datos

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| **Base de datos principal** | PostgreSQL | Almacenamiento persistente |
| **Cache** | Redis 7.2 | Sesiones, cache de queries |
| **Cola de tareas** | Redis 7.2 | Broker para Celery |

### 3.4 Infraestructura y DevOps

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| **Contenedores** | Docker + Docker Compose | Despliegue y orquestación |
| **CI/CD** | GitHub Actions | Automatización de deploys |
| **Runner** | Self-hosted runner | Ejecución de workflows |
| **Monitoreo Celery** | Flower | Dashboard de tareas |
| **Monitoreo Redis** | Redis Insight | Visualización de datos |

### 3.5 Árbol de Dependencias Simplificado

```
SGM-Contabilidad/
├── Frontend (npm)
│   ├── react@19.0.0
│   ├── vite@7.2.4 (dev)
│   ├── tailwindcss@4.0.13
│   └── axios@1.9.0
│
├── Backend (pip)
│   ├── Django@5.2.8
│   ├── djangorestframework@3.16.0
│   ├── celery@5.5.2
│   ├── redis@6.0.0
│   └── pandas@2.2.3
│
└── Infraestructura (Docker)
    ├── redis:7.2.5
    ├── mher/flower (Celery monitor)
    └── redis/redisinsight (Redis GUI)
```

---

## 4. Descripción de APIs Expuestas

### 4.1 Endpoints de Autenticación

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `POST` | `/api/token/` | Obtener access y refresh token | No |
| `POST` | `/api/token/refresh/` | Renovar access token | Refresh token |

**Ejemplo de Login:**
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"correo_bdo": "usuario@bdo.cl", "password": "secreto"}'

# Respuesta
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 4.2 Endpoints de Usuarios

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| `GET` | `/api/usuarios/` | Listar usuarios | Gerente, Supervisor |
| `GET` | `/api/usuarios/me/` | Usuario actual | Autenticado |
| `GET` | `/api/usuarios/mis-analistas/` | Analistas supervisados | Supervisor |
| `GET` | `/api/usuarios/clientes-supervisados/` | Clientes de equipo | Supervisor |
| `POST` | `/api/usuarios/{id}/asignar-supervisor/` | Asignar supervisor | Gerente |

### 4.3 Endpoints de Clientes

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| `GET` | `/api/clientes/` | Listar clientes | Según rol |
| `GET` | `/api/clientes/asignados/` | Clientes asignados al usuario | Autenticado |
| `GET` | `/api/clientes/{id}/servicios/` | Servicios del cliente | Autenticado |
| `GET` | `/api/clientes/{id}/servicios-area/` | Servicios por área del usuario | Autenticado |

### 4.4 Endpoints de Asignaciones

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| `GET` | `/api/asignaciones/` | Listar asignaciones | Según rol |
| `POST` | `/api/asignaciones/` | Crear asignación | Gerente |
| `DELETE` | `/api/asignaciones/{analista_id}/{cliente_id}/` | Remover asignación | Gerente |
| `GET` | `/api/clientes-disponibles/{analista_id}/` | Clientes sin asignar | Gerente |
| `GET` | `/api/clientes-asignados/{analista_id}/` | Clientes de un analista | Gerente |

### 4.5 Endpoints de Rinde Gastos (Captura Masiva)

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| `POST` | `/api/rindegastos/leer-headers/` | Leer headers de Excel | Autenticado |
| `POST` | `/api/rindegastos/step1/iniciar/` | Iniciar procesamiento | Autenticado |
| `GET` | `/api/rindegastos/step1/estado/{task_id}/` | Estado de tarea | Autenticado |
| `GET` | `/api/rindegastos/step1/descargar/{task_id}/` | Descargar resultado | Autenticado |
| `GET` | `/api/rindegastos/centros-costo/` | Listar centros de costo | Autenticado |
| `GET` | `/api/rindegastos/tipos-documento/` | Listar tipos de documento | Autenticado |
| `GET` | `/api/rindegastos/cuentas-globales/` | Listar cuentas globales | Autenticado |
| `GET` | `/api/rindegastos/rendiciones/` | Historial de rendiciones | Autenticado |

### 4.6 Endpoints Auxiliares

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| `GET` | `/api/areas/` | Listar áreas | Gerente |
| `GET` | `/api/industrias/` | Listar industrias | Autenticado |
| `GET` | `/api/servicios/` | Listar servicios | Autenticado |
| `GET` | `/api/ping/` | Health check del sistema | Autenticado |

### 4.7 Endpoints Deshabilitados

> **⚠️ IMPORTANTE:** Los siguientes endpoints han sido **deshabilitados** y ya no están disponibles en el sistema:

#### 4.7.1 Dashboard y Business Intelligence
- ❌ `GET /api/dashboard/` - Dashboard ejecutivo con KPIs
- ❌ `GET /api/bi-analistas/` - Performance de analistas
- ❌ `GET /api/analistas-detallado/` - Análisis detallado de analistas
- ❌ `GET /api/analistas-detallado/{id}/estadisticas/` - Estadísticas de un analista

#### 4.7.2 Endpoints Exclusivos de Gerente
- ❌ `GET /api/gerente/clientes/` - Vista completa de clientes
- ❌ `POST /api/gerente/clientes/reasignar/` - Reasignar cliente a analista
- ❌ `GET /api/gerente/clientes/{id}/perfil-completo/` - Perfil detallado de cliente
- ❌ `GET /api/gerente/metricas/` - Métricas avanzadas del sistema
- ❌ `GET /api/gerente/analisis-portafolio/` - Análisis de portafolio completo
- ❌ `GET /api/gerente/alertas/` - Sistema de alertas
- ❌ `PATCH /api/gerente/alertas/{id}/marcar-leida/` - Marcar alerta como leída
- ❌ `GET /api/gerente/alertas/configuracion/` - Configuración de alertas
- ❌ `POST /api/gerente/alertas/configurar/` - Configurar umbrales de alertas
- ❌ `POST /api/gerente/reportes/generar/` - Generar reporte
- ❌ `GET /api/gerente/reportes/historial/` - Historial de reportes
- ❌ `GET /api/gerente/reportes/{id}/descargar/` - Descargar reporte

#### 4.7.3 Cobranza (CxC)
- ❌ `POST /api/cobranza/parse-auxiliar/` - Parser de auxiliar CxC

**Motivo de deshabilitación:** Simplificación del sistema y enfoque en funcionalidades core. El código está preservado en `backend/api/views.py` (comentado) y `backend/api/urls_gerente.py.disabled` para referencia futura.

### 4.8 Formato de Respuestas de Error

```json
// 401 Unauthorized
{
  "detail": "Las credenciales de autenticación no fueron provistas."
}

// 403 Forbidden
{
  "detail": "No tiene permiso para realizar esta acción."
}

// 400 Bad Request
{
  "error": "Descripción del error específico"
}

// 404 Not Found
{
  "detail": "No encontrado."
}
```

### 4.9 Paginación

Los endpoints que retornan listas soportan paginación por defecto de Django REST Framework:

```bash
GET /api/clientes/?page=1&page_size=20
```

### 4.10 Resumen de Endpoints por Categoría

| Categoría | Endpoints Activos | Endpoints Deshabilitados |
|-----------|-------------------|--------------------------|
| **Autenticación** | 2 | 0 |
| **Usuarios** | 5 | 0 |
| **Clientes** | 4 | 0 |
| **Asignaciones** | 5 | 0 |
| **Rinde Gastos** | 8 | 0 |
| **Dashboard/BI** | 0 | 4 |
| **Gerente** | 0 | 12 |
| **Cobranza** | 0 | 1 |
| **Auxiliares** | 4 | 0 |
| **TOTAL** | **28** | **17** |

---

## 5. Configuración de Seguridad

### 5.1 Infraestructura de Red y VPN

#### 5.1.1 Topología de Red Corporativa

El sistema SGM está desplegado dentro de la **VPN corporativa de BDO Chile**, proporcionando una capa adicional de seguridad mediante aislamiento de red.

**Especificaciones de la Red:**

| Componente | Detalle |
|------------|--------|
| **Red VPN** | 172.17.11.0/24 |
| **Servidor Producción** | 172.17.11.13 (vm-bdo-outcontab1) |
| **Servidor Desarrollo** | 172.17.11.22 (vm-bdo-q) |
| **Servidor Base de Datos** | 172.17.11.21 (vmbdobases) |
| **Acceso** | Solo mediante VPN corporativa BDO |
| **Firewall** | Gestionado por infraestructura BDO |

#### 5.1.2 Ventajas de Seguridad VPN

✅ **Aislamiento Total**
- El sistema **NO es accesible desde Internet público**
- Requiere conexión activa a VPN corporativa BDO
- Protección contra ataques externos automatizados

✅ **Autenticación en Capas**
1. **Capa 1 - VPN**: Credenciales corporativas BDO
2. **Capa 2 - Sistema**: JWT token con usuario/contraseña
3. **Capa 3 - Recursos**: Permisos por rol (Gerente/Supervisor/Analista)

✅ **Control de Acceso Centralizado**
- Departamento IT de BDO gestiona accesos VPN
- Revocación inmediata al desvincularse empleado
- Auditoría de conexiones a nivel corporativo

✅ **Reducción de Superficie de Ataque**
- No expuesto a escaneos de puertos públicos
- Protegido contra ataques DDoS
- Sin necesidad de certificados SSL públicos (HTTP interno)

#### 5.1.3 Implicaciones en Configuración

**HTTPS No Requerido:**
```python
# Como el tráfico está dentro de VPN cifrada,
# no es crítico implementar HTTPS interno
SECURE_SSL_REDIRECT = False  # Aceptable en VPN corporativa
```

**CORS Restringido a Red Interna:**
```python
CORS_ALLOWED_ORIGINS = [
    "http://172.17.11.13:8000",  # Solo IPs internas
    "http://172.17.11.22:8000",  # Dentro de VPN
]
```

**Puertos Internos:**
- Django: `8000` (HTTP interno, no expuesto públicamente)
- PostgreSQL: `5432` (solo red interna)
- Redis: `6379` (solo localhost/Docker network)
- Flower: `5555` (monitoreo Celery, red interna)

### 5.2 Headers HTTP de Seguridad

El sistema implementa headers de seguridad a través del middleware de Django:

```python
# Configuración en settings.py
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',           # CORS
    'django.middleware.security.SecurityMiddleware',   # Headers de seguridad
    'whitenoise.middleware.WhiteNoiseMiddleware',      # Archivos estáticos
    'django.middleware.csrf.CsrfViewMiddleware',       # Protección CSRF
    'django.middleware.clickjacking.XFrameOptionsMiddleware',  # X-Frame-Options
    # ...
]
```

### 5.3 Configuración CORS

> **Nota VPN:** Todos los orígenes permitidos son IPs privadas dentro de la VPN corporativa BDO.

```python
# Desarrollo (DEBUG=True)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5174",        # Vite dev server local (dev machines en VPN)
    "http://172.17.11.13:5174",     # Vite en servidor producción (VPN)
    "http://172.17.11.22:5174",     # Vite en servidor desarrollo (VPN)
    "http://172.17.11.13:8000",     # Django producción (VPN)
    "http://172.17.11.22:8000",     # Django desarrollo (VPN)
]

# Producción (DEBUG=False)
CORS_ALLOWED_ORIGINS = [
    "http://172.17.11.13:8000",     # Producción (VPN interna)
    "http://172.17.11.22:8000",     # Desarrollo (VPN interna)
]

# Configuración adicional
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept', 'accept-encoding', 'authorization',
    'content-type', 'dnt', 'origin', 'user-agent',
    'x-csrftoken', 'x-requested-with',
]
CORS_ALLOW_METHODS = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']
```

### 5.3 Validación de Contraseñas

```python
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]
```

### 5.4 Protección Redis

```python
# Redis con contraseña obligatoria
REDIS_PASSWORD = os.environ.get('REDIS_PASSWORD')
if not REDIS_PASSWORD:
    raise ImproperlyConfigured("REDIS_PASSWORD environment variable is required")

REDIS_URL = f"redis://:{REDIS_PASSWORD}@redis:6379/0"
```

### 5.5 Configuración de Archivos y Uploads

```python
# Límites de tamaño para prevenir DoS
DATA_UPLOAD_MAX_NUMBER_FIELDS = 200000  # Para formularios grandes
DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880   # 5MB para uploads
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880   # 5MB para archivos
```

### 5.6 Variables de Entorno Sensibles

Las siguientes variables **NUNCA** deben commitearse y deben configurarse en el archivo `.env`:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `SECRET_KEY` | Clave secreta de Django | `django-insecure-abc123...` |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL | `password_seguro_aqui` |
| `REDIS_PASSWORD` | Contraseña de Redis | `redis_password_aqui` |
| `DEBUG` | Modo debug (False en producción) | `False` |

### 5.7 Configuración de Producción vs Desarrollo

| Aspecto | Desarrollo | Producción |
|---------|------------|------------|
| `DEBUG` | `True` | `False` |
| Servidor web | `runserver` | Gunicorn (3 workers) |
| CORS | Orígenes amplios | Orígenes restringidos |
| Logs | Debug level | Warning level |
| Static files | Django serve | WhiteNoise |
| Token lifetime | 8 horas | 8 horas |

### 5.9 Checklist de Seguridad

**Seguridad de Red:**
- [x] ✅ Sistema dentro de VPN corporativa BDO
- [x] ✅ Sin exposición a Internet público
- [x] ✅ Firewall corporativo activo
- [x] ✅ Red segmentada (172.17.11.0/24)

**Autenticación y Autorización:**
- [x] ✅ JWT para autenticación stateless
- [x] ✅ Tokens con rotación automática
- [x] ✅ Blacklist de tokens rotados
- [x] ✅ Permisos por rol implementados
- [x] ✅ Contraseñas validadas con políticas

**Configuración de Aplicación:**
- [x] ✅ CORS restringido a IPs internas VPN
- [x] ✅ Redis protegido con contraseña
- [x] ✅ Variables sensibles en `.env`
- [x] ✅ X-Frame-Options habilitado
- [x] ✅ CSRF protection activo
- [x] ✅ Límites de upload configurados

### 5.10 Recomendaciones Futuras

**Prioridad Alta:**
1. **Rate Limiting**: Implementar throttling en endpoints críticos
2. **Auditoría**: Agregar logging de accesos y cambios sensibles
3. **2FA**: Considerar autenticación de dos factores para gerentes
4. **Backup Automatizado**: Implementar respaldos incrementales diarios

**Prioridad Media:**
5. **Monitoring**: Herramientas de monitoreo proactivo (Prometheus/Grafana)
6. **Nginx**: Agregar proxy reverso para balanceo de carga
7. **WAF**: Web Application Firewall adicional (opcional dado VPN)

**No Crítico (dado VPN corporativa):**
- ⚠️ **HTTPS Interno**: No es prioritario ya que el tráfico está dentro de VPN cifrada
- ⚠️ **CDN**: No aplicable en red interna
- ⚠️ **DDoS Protection**: VPN ya proporciona aislamiento

> **Nota:** La VPN corporativa reduce significativamente varios riesgos de seguridad típicos de aplicaciones web públicas, permitiendo enfocarse en seguridad a nivel de aplicación y auditoría.

---

## 📎 Anexos

### A. Modelo de Datos Simplificado

```mermaid
erDiagram
    Usuario ||--o{ AsignacionClienteUsuario : tiene
    Cliente ||--o{ AsignacionClienteUsuario : asignado_a
    Usuario }o--|| Area : pertenece
    Cliente }o--|| Industria : tiene
    Cliente ||--o{ ServicioCliente : contrata
    Servicio ||--o{ ServicioCliente : incluido_en
    ServicioCliente ||--o{ Rendicion : genera
    
    Usuario {
        int id PK
        string correo_bdo UK
        string nombre
        string apellido
        string tipo_usuario
        int supervisor_id FK
    }
    
    Cliente {
        int id PK
        string nombre
        string rut UK
        boolean bilingue
        int industria_id FK
    }
    
    AsignacionClienteUsuario {
        int id PK
        int cliente_id FK
        int usuario_id FK
        datetime fecha_asignacion
    }
```

### B. Variables de Entorno Requeridas

```bash
# .env.example
# Base de datos
POSTGRES_DB=sgm_db
POSTGRES_USER=sgm_user
POSTGRES_PASSWORD=tu_password_seguro
POSTGRES_HOST=db
POSTGRES_PORT=5432

# Django
SECRET_KEY=tu_secret_key_django
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,tu-dominio.com

# Redis
REDIS_PASSWORD=tu_redis_password

# Celery (opcional, usa valores de Redis)
# CELERY_BROKER_URL=redis://:password@redis:6379/0
```

---

**Documento generado para BDO Chile - SGM Contabilidad**  
**Última actualización:** Noviembre 2025

---

## �� Historial de Cambios

### [v1.1] - 28 de Noviembre 2025

**Eliminación de Endpoints**
- ❌ Deshabilitados 17 endpoints de Dashboard, BI, Gerente y Cobranza
- 📝 Código preservado en archivos comentados para referencia futura
- ✅ Sistema simplificado enfocado en funcionalidades core
- 🎯 28 endpoints activos en producción

**Archivos afectados:**
- `backend/api/urls.py` - Eliminadas rutas de BI/Dashboard/Gerente/Cobranza
- `backend/api/views.py` - ViewSets comentados para referencia
- `backend/api/urls_gerente.py` - Renombrado a `.disabled`

**Commits relacionados:**
- `e6e220f4` - feat: Eliminar endpoints de BI, Dashboard, Gerente y Cobranza
- `2201e17d` - fix: Corregir error de sintaxis en comentarios de views.py

### [v1.2] - 28 de Noviembre 2025

**Actualización: Infraestructura VPN Corporativa**
- 🔒 Documentada arquitectura dentro de VPN corporativa BDO
- 📡 Actualizado diagrama de red con segmentación (172.17.11.0/24)
- 🛡️ Nueva sección 5.1: Infraestructura de Red y VPN
- ✅ Ventajas de seguridad VPN documentadas
- 📝 Implicaciones de configuración HTTPS/CORS actualizadas
- 🎯 Checklist de seguridad reorganizado por categorías
- 💡 Recomendaciones futuras priorizadas según contexto VPN

**Detalles clave:**
- Sin exposición a Internet público (solo VPN interna)
- Autenticación en 3 capas: VPN + JWT + Permisos
- HTTPS interno no crítico (tráfico cifrado por VPN)
- Superficie de ataque reducida significativamente
