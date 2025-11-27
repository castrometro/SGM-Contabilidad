# 🏗️ Arquitectura SGM - Resumen Ejecutivo

## 📊 Vista General

```
┌─────────────────────────────────────────────────────────────┐
│                      PRODUCCIÓN                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [1] SGM-Contabilidad (172.17.11.13) ──────┐               │
│      • Branch: production                   │               │
│      • Django + Gunicorn (3 workers)        │               │
│      • Celery + Redis                       │               │
│      • DEBUG=False                          │               │
│                                             │               │
│                                             ▼               │
│  [2] PostgreSQL (172.17.11.14)                             │
│      • Base de datos: sgm_db                               │
│      • ⚠️  DATOS REALES - NO TOCAR                         │
│                                                              │
│  [3] SGM-Nómina (otra IP)                                  │
│      • Sistema separado                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      DESARROLLO                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [4] Servidor Dev General ──────────────────┐              │
│      • Branch: development                   │              │
│      • Django + runserver (auto-reload)      │              │
│      • Celery + Redis                        │              │
│      • DEBUG=True                            │              │
│                                              │              │
│                                              ▼              │
│  [5] PostgreSQL Dev                                        │
│      • Base de datos: sgm_dev_db                           │
│      • ✅ Puedes resetear/modificar libremente              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🔑 Diferencias Clave

| Aspecto | Producción [1] | Desarrollo [4] |
|---------|----------------|----------------|
| **Branch Git** | `production` | `development` |
| **Servidor Web** | Gunicorn (3 workers) | runserver (auto-reload) |
| **DEBUG** | False | True |
| **Base de Datos** | [2] sgm_db (REAL) | [5] sgm_dev_db (TEST) |
| **Logs** | Warning level | Debug level |
| **Performance** | Optimizado | Debugging fácil |

## 📝 Archivos de Configuración

```
sgm-contabilidad/
├── .env.production.example   ← Plantilla para [1]
├── .env.development.example  ← Plantilla para [4]
├── .env                      ← NO COMMITEAR (ignorado)
│
├── docker-compose.yml        ← Detecta ambiente automático
├── backend/gunicorn.conf.py  ← Config de Gunicorn
│
├── SETUP.md                  ← Comandos rápidos
└── DEPLOY.md                 ← Guía completa
```

## 🚀 Comandos Principales

### Producción [1]
```bash
# Deployar cambios
git pull origin main
docker compose down && docker compose up -d --build

# Ver logs
docker compose logs -f django
```

### Desarrollo [4]
```bash
# Primera vez
git clone https://github.com/BDO-Chile/SGM-Contabilidad.git sgm-dev
cd sgm-dev && git checkout development
cp .env.development.example .env
docker compose up -d

# Desarrollo diario
git pull origin development
docker compose restart django
```

## ⚠️ Importante

1. **NUNCA** conectes desarrollo a la DB de producción [2]
2. **SIEMPRE** trabaja en branch `development` en servidor [4]
3. **Revisa** los Pull Requests antes de merge a `main`
4. **Testea** en desarrollo antes de deployar a producción

## 🔄 Flujo de Trabajo

```
1. Desarrollo
   └─ Servidor [4] → Branch development

2. Testing  
   └─ DB [5] → Datos de prueba

3. Pull Request
   └─ development → main

4. Deploy
   └─ Servidor [1] → git merge main → restart
```

---

📚 **Más Info:** Ver `SETUP.md` y `DEPLOY.md`
