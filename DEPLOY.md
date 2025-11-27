# Guía de Deploy - SGM Contabilidad

## Arquitectura de Servidores

```
PRODUCCIÓN:
├── [1] SGM-Contabilidad Prod (172.17.11.13)
│   ├── Branch: production
│   ├── Gunicorn (3 workers)
│   └── Conectado a → [2]
│
└── [2] DB Contabilidad (172.17.11.14)
    └── PostgreSQL: sgm_db

DESARROLLO:
├── [4] Servidor Dev General
│   ├── Branch: development
│   ├── Runserver (auto-reload)
│   └── Conectado a → [5]
│
└── [5] Servidor Dev con DB
    └── PostgreSQL: sgm_dev_db
```

## Setup por Ambiente

### 🚀 PRODUCCIÓN - Servidor [1]

```bash
# Ya está configurado (este servidor)
git checkout production
cp .env.production.example .env
# Editar .env con valores reales de producción

# Levantar servicios (usa Gunicorn automáticamente porque DEBUG=False)
docker compose up -d
```

**Características:**
- ✅ Gunicorn con 3 workers
- ✅ DEBUG=False
- ✅ Conectado a DB producción [2]
- ✅ Logs en modo warning

### 🔧 DESARROLLO - Servidor [4]

```bash
# En el servidor [4]
git clone https://github.com/BDO-Chile/SGM-Contabilidad.git sgm-dev
cd sgm-dev
git checkout development

# Configurar
cp .env.development.example .env
# Editar .env: cambiar IP_DEL_SERVIDOR_5 por la IP real

# Preparar DB en servidor [5] (una sola vez)
# En servidor [5]:
psql -U postgres
CREATE DATABASE sgm_dev_db;
CREATE USER sgm_user WITH PASSWORD 'dev_password_simple';
GRANT ALL PRIVILEGES ON DATABASE sgm_dev_db TO sgm_user;

# Volver al servidor [4] y levantar
docker compose up -d
```

**Características:**
- ✅ Runserver (auto-reload al cambiar código)
- ✅ DEBUG=True
- ✅ Conectado a DB desarrollo [5]
- ✅ Logs detallados para debugging

## Cambios Automáticos por Ambiente

El `docker-compose.yml` detecta automáticamente el ambiente usando la variable `DEBUG`:

- **DEBUG=False** (producción) → Usa Gunicorn
- **DEBUG=True** (desarrollo) → Usa runserver

No necesitas cambiar el docker-compose.yml entre ambientes.

## Servidor de Producción con Gunicorn

### ¿Qué cambiamos?

**Antes:** Django `runserver` (servidor de desarrollo)
**Ahora:** Gunicorn (servidor WSGI para producción)

### Ventajas

✅ **3 workers** → Maneja múltiples requests simultáneas
✅ **Timeout 120s** → Para procesamiento de Excel pesado
✅ **Auto-restart** → Workers se reinician cada 1000 requests (previene memory leaks)
✅ **Mejor logging** → Logs estructurados con tiempos de respuesta
✅ **Preload app** → Optimiza uso de RAM

### Aplicar los cambios

```bash
# 1. Reconstruir contenedores con Gunicorn
docker compose build django

# 2. Reiniciar servicios
docker compose down
docker compose up -d

# 3. Verificar que está funcionando
docker compose logs django | head -20

# Deberías ver: "Booting worker with pid: XXXX" (3 veces)
```

### Monitorear

```bash
# Ver logs en tiempo real
docker compose logs -f django

# Ver solo errores
docker compose logs django | grep ERROR

# Ver workers activos
docker compose exec django ps aux | grep gunicorn
```

### Configuración Personalizada

Edita `backend/gunicorn.conf.py`:

```python
# Más workers (si tienes más RAM)
workers = 5

# Timeout más largo (para archivos Excel muy grandes)
timeout = 180

# Worker asyncrónico (para muchas conexiones I/O)
worker_class = "gevent"
```

### Troubleshooting

**Problema:** Workers se reinician constantemente
```bash
# Aumentar memoria del contenedor o reducir workers
workers = 2
```

**Problema:** Timeouts en Excel grandes
```bash
# Aumentar timeout
timeout = 240
```

**Problema:** Quiero volver al modo desarrollo
```bash
# En docker-compose.yml, cambiar:
command: python manage.py runserver 0.0.0.0:8000
```

### Próximo Paso (Opcional): Nginx

Para producción seria, agregar Nginx:
```
Internet → Nginx (SSL, cache) → Gunicorn → Django
```

Beneficios adicionales:
- HTTPS con Let's Encrypt
- Compresión gzip
- Cache de archivos estáticos
- Protección básica contra ataques

¿Necesitas ayuda con Nginx? Pídemelo cuando estés listo.
