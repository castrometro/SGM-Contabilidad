# 🔄 Metodología CI/CD - SGM Contabilidad

**Versión:** 1.0  
**Fecha:** Noviembre 2025  
**Autor:** BDO Chile - Equipo de Desarrollo

---

## 📑 Índice

1. [Introducción](#1-introducción)
2. [Flujo de Trabajo Git](#2-flujo-de-trabajo-git)
3. [Pipelines de CI/CD](#3-pipelines-de-cicd)
4. [Ambientes de Despliegue](#4-ambientes-de-despliegue)
5. [Proceso de Release](#5-proceso-de-release)
6. [Buenas Prácticas](#6-buenas-prácticas)

---

## 1. Introducción

### 1.1 ¿Qué es CI/CD?

**CI (Integración Continua):** Práctica de integrar cambios de código frecuentemente, validando automáticamente que no rompan el sistema existente.

**CD (Despliegue/Entrega Continua):** Automatización del proceso de despliegue para entregar cambios a los usuarios de forma rápida y segura.

### 1.2 Objetivos del CI/CD en SGM

- ✅ **Automatización**: Eliminar pasos manuales propensos a errores
- ✅ **Velocidad**: Reducir tiempo de entrega de nuevas funcionalidades
- ✅ **Calidad**: Detectar problemas tempranamente
- ✅ **Trazabilidad**: Historial completo de cambios y despliegues
- ✅ **Consistencia**: Procesos repetibles y predecibles

### 1.3 Herramientas Utilizadas

| Herramienta | Propósito |
|-------------|-----------|
| **GitHub** | Repositorio de código y gestión de issues |
| **GitHub Actions** | Automatización de CI/CD |
| **Self-hosted Runner** | Ejecución de workflows en servidores propios |
| **Docker Compose** | Orquestación de contenedores |

---

## 2. Flujo de Trabajo Git

### 2.1 Estructura de Ramas

```mermaid
gitGraph
    commit id: "Initial"
    branch development
    checkout development
    commit id: "Feature A"
    branch feature/issue-1
    checkout feature/issue-1
    commit id: "WIP Feature"
    commit id: "Complete"
    checkout development
    merge feature/issue-1 id: "Merge PR #1"
    branch feature/issue-2
    checkout feature/issue-2
    commit id: "Feature B"
    checkout development
    merge feature/issue-2 id: "Merge PR #2"
    checkout main
    merge development id: "Release v1.0" tag: "v1.0"
    branch production
    checkout production
    merge main id: "Deploy"
```

### 2.2 Ramas Principales

| Rama | Propósito | Servidor | Protección |
|------|-----------|----------|------------|
| `production` | Código en producción | 172.17.11.13 | ✅ Protegida |
| `development` | Código en desarrollo | 172.17.11.22 | ✅ Protegida |
| `feature/*` | Desarrollo de funcionalidades | Local | ❌ Temporal |
| `bugfix/*` | Corrección de bugs | Local | ❌ Temporal |
| `hotfix/*` | Correcciones urgentes | Local | ❌ Temporal |

### 2.3 Convención de Nombres de Ramas

```
tipo/issue-N-descripcion-corta

Ejemplos:
├── feature/issue-15-nuevo-reporte
├── bugfix/issue-23-corregir-validacion
├── hotfix/issue-99-critical-auth
└── docs/issue-42-actualizar-readme
```

### 2.4 Flujo de Desarrollo

```mermaid
flowchart TD
    A[📝 Issue Creado] --> B[👤 Desarrollador toma issue]
    B --> C[🌿 Crear feature branch]
    C --> D[💻 Desarrollo local]
    D --> E[🔄 Push cambios]
    E --> F[📋 Crear Pull Request]
    F --> G{🔍 Code Review}
    G -->|Cambios requeridos| D
    G -->|Aprobado| H[✅ Merge a development]
    H --> I[🚀 Deploy automático a DEV]
    I --> J{🧪 Testing en DEV}
    J -->|Bugs encontrados| K[🐛 Crear bugfix]
    K --> D
    J -->|OK| L[📦 Acumular para Release]
```

### 2.5 Convención de Commits

```
tipo: descripción corta

[Cuerpo opcional con más detalles]

Refs #N o Closes #N
```

**Tipos de commit:**

| Tipo | Descripción |
|------|-------------|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de bug |
| `refactor:` | Refactorización sin cambio funcional |
| `docs:` | Solo documentación |
| `style:` | Formato, espacios, punto y coma |
| `test:` | Agregar o modificar tests |
| `chore:` | Tareas de mantenimiento |

**Ejemplo:**
```bash
git commit -m "feat: Agregar filtro de fechas al reporte

- Implementar DatePicker component
- Agregar validación de rango
- Actualizar API endpoint con parámetros

Closes #15"
```

---

## 3. Pipelines de CI/CD

### 3.1 Arquitectura de Workflows

```mermaid
flowchart LR
    subgraph TRIGGER["🎯 Triggers"]
        Push["Push a branch"]
        Manual["workflow_dispatch"]
    end

    subgraph DEV["🔧 Development"]
        DevWorkflow["deploy-development.yml"]
        DevBuild["Build Frontend"]
        DevDeploy["Deploy to 172.17.11.22"]
    end

    subgraph PROD["🚀 Production"]
        ProdWorkflow["deploy-production.yml"]
        ProdBuild["Build Frontend"]
        ProdDeploy["Deploy to 172.17.11.13"]
    end

    Push -->|"push: development"| DevWorkflow
    Push -->|"push: production"| ProdWorkflow
    Manual --> DevWorkflow
    Manual --> ProdWorkflow
    
    DevWorkflow --> DevBuild --> DevDeploy
    ProdWorkflow --> ProdBuild --> ProdDeploy
```

### 3.2 Workflow de Desarrollo

**Archivo:** `.github/workflows/deploy-development.yml`

```yaml
name: Deploy to Development

on:
  push:
    branches:
      - development
  workflow_dispatch:  # Permite ejecución manual

jobs:
  build-and-deploy:
    runs-on: self-hosted
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build frontend
        env:
          VITE_MEDIA_BASE_URL: http://172.17.11.22:8000
        run: npm run build
      
      - name: Deploy to Django static
        run: |
          # Backup anterior
          if [ -d "/home/outcontab1/dev/sgm-contabilidad/backend/static/dist" ]; then
            mv /home/outcontab1/dev/sgm-contabilidad/backend/static/dist /home/outcontab1/dev/sgm-contabilidad/backend/static/dist.backup
          fi
          # Copiar nuevo build
          cp -r dist /home/outcontab1/dev/sgm-contabilidad/backend/static/
      
      - name: Collect static files
        run: docker compose exec -T django python manage.py collectstatic --noinput
      
      - name: Restart Django
        run: docker compose restart django
```

### 3.3 Workflow de Producción

**Archivo:** `.github/workflows/deploy-production.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - production
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: self-hosted
    
    steps:
      # Similar a desarrollo pero con:
      # VITE_MEDIA_BASE_URL: http://172.17.11.13:8000
```

### 3.4 Pasos del Pipeline

```mermaid
flowchart TD
    subgraph BUILD["📦 Build Stage"]
        B1["Checkout código"]
        B2["Setup Node.js 20"]
        B3["npm ci (install deps)"]
        B4["npm run build"]
    end

    subgraph DEPLOY["🚀 Deploy Stage"]
        D1["Backup build anterior"]
        D2["Copiar nuevo build"]
        D3["collectstatic"]
        D4["Restart Django"]
    end

    subgraph NOTIFY["📣 Notification"]
        N1["Log de éxito"]
        N2["URL del frontend"]
        N3["Tamaño del build"]
    end

    B1 --> B2 --> B3 --> B4
    B4 --> D1 --> D2 --> D3 --> D4
    D4 --> N1 --> N2 --> N3
```

### 3.5 Self-Hosted Runner

El sistema utiliza runners auto-hospedados en los servidores de BDO para ejecutar los workflows.

**Ubicación del Runner:**
- Producción: `172.17.11.13`
- Desarrollo: `172.17.11.22`

**Configuración:**
```bash
# Instalación del runner (una sola vez)
cd /home/outcontab1/actions-runner
./config.sh --url https://github.com/BDO-Chile/SGM-Contabilidad --token TOKEN

# Ejecutar como servicio
sudo ./svc.sh install
sudo ./svc.sh start
```

---

## 4. Ambientes de Despliegue

### 4.1 Comparación de Ambientes

| Aspecto | Desarrollo | Producción |
|---------|------------|------------|
| **Servidor** | 172.17.11.22 | 172.17.11.13 |
| **Branch** | `development` | `production` |
| **DEBUG** | `True` | `False` |
| **Servidor Web** | `runserver` | Gunicorn (3 workers) |
| **Base de Datos** | `sgm_dev_db` | `sgm_db` |
| **Logs** | Debug level | Warning level |
| **CORS** | Amplio | Restringido |

### 4.2 Diagrama de Ambientes

```mermaid
flowchart TB
    subgraph GITHUB["☁️ GitHub"]
        Repo["SGM-Contabilidad<br/>Repository"]
        Actions["GitHub Actions"]
    end

    subgraph DEV_ENV["🔧 DESARROLLO"]
        DevRunner["Self-hosted Runner"]
        DevDocker["Docker Compose"]
        DevDjango["Django (runserver)"]
        DevCelery["Celery Workers"]
        DevRedis["Redis"]
    end

    subgraph PROD_ENV["🚀 PRODUCCIÓN"]
        ProdRunner["Self-hosted Runner"]
        ProdDocker["Docker Compose"]
        ProdGunicorn["Gunicorn (3w)"]
        ProdCelery["Celery Workers"]
        ProdRedis["Redis"]
    end

    subgraph DATABASES["💾 BASES DE DATOS"]
        DevDB["sgm_dev_db<br/>(172.17.11.22)"]
        ProdDB["sgm_db<br/>(172.17.11.14)"]
    end

    Repo --> Actions
    Actions -->|"development"| DevRunner
    Actions -->|"production"| ProdRunner
    
    DevRunner --> DevDocker --> DevDjango --> DevDB
    DevDocker --> DevCelery --> DevRedis
    
    ProdRunner --> ProdDocker --> ProdGunicorn --> ProdDB
    ProdDocker --> ProdCelery --> ProdRedis
```

### 4.3 Proceso de Promoción

```mermaid
flowchart LR
    A["Feature Branch"] -->|"PR + Review"| B["development"]
    B -->|"Automatizado"| C["Deploy DEV"]
    C -->|"Testing"| D{¿OK?}
    D -->|No| E["Fix en feature"]
    E --> A
    D -->|Sí| F["PR a production"]
    F -->|"Aprobación"| G["production"]
    G -->|"Automatizado"| H["Deploy PROD"]
```

---

## 5. Proceso de Release

### 5.1 Tipos de Release

| Tipo | Descripción | Frecuencia | Ejemplo |
|------|-------------|------------|---------|
| **Regular** | Conjunto de features/fixes | Semanal | v1.2.0 |
| **Hotfix** | Corrección crítica urgente | Cuando sea necesario | v1.1.1 |
| **Major** | Cambios grandes o breaking | Trimestral | v2.0.0 |

### 5.2 Flujo de Release Regular

```mermaid
sequenceDiagram
    participant Dev as Desarrollo
    participant GH as GitHub
    participant Prod as Producción

    Note over Dev,GH: Acumulación de cambios en development
    Dev->>GH: Features #15, #16, #17 merged
    Dev->>GH: Bugfixes #18, #19 merged
    
    Note over GH: Crear Release PR
    GH->>GH: PR: development → production
    GH->>GH: Descripción con changelog
    GH->>GH: Review y aprobación
    
    Note over GH,Prod: Deploy automático
    GH->>Prod: Merge trigger workflow
    Prod->>Prod: Build frontend
    Prod->>Prod: Deploy y restart
    
    Note over Prod: Verificación
    Prod->>Prod: Smoke tests
    Prod->>GH: Tag release (opcional)
```

### 5.3 Plantilla de Release PR

```markdown
## 📦 Release v1.2.0 - [Fecha]

### ✨ Nuevas Funcionalidades
- #15 Nuevo reporte de consolidación mensual
- #17 Filtros avanzados en dashboard

### 🐛 Bug Fixes
- #18 Optimización de carga de datos
- #16 Validación de formato de email

### 🔧 Mejoras Técnicas
- #19 Refactoring de componente Header

### 🧪 Testing Realizado
- [x] Todas las funcionalidades probadas en desarrollo
- [x] Migrations verificadas
- [x] Performance aceptable
- [x] Revisión de seguridad

### ⚠️ Notas de Deployment
- Ejecutar migrations antes de reiniciar
- Limpiar caché de Redis si es necesario
```

### 5.4 Flujo de Hotfix

```mermaid
flowchart TD
    A[🚨 Bug crítico en PROD] --> B[Crear issue con label 'critical']
    B --> C["Crear branch hotfix/issue-N"]
    C --> D[Fix en hotfix branch]
    D --> E["PR: hotfix → production"]
    E --> F{Review urgente}
    F -->|Aprobado| G[Merge a production]
    G --> H[Deploy automático a PROD]
    H --> I[Verificar fix]
    I --> J["Backport: merge production → development"]
    J --> K[✅ Hotfix completado]
```

---

## 6. Buenas Prácticas

### 6.1 Antes de Crear un PR

- [ ] Código funciona localmente
- [ ] No hay errores de linting (`npm run lint`)
- [ ] Commit messages siguen convención
- [ ] Issue vinculado (`Closes #N` o `Refs #N`)
- [ ] Branch actualizado con `development`

### 6.2 Durante Code Review

- [ ] Revisar lógica del código
- [ ] Verificar manejo de errores
- [ ] Buscar posibles problemas de seguridad
- [ ] Validar que cumple con el issue
- [ ] Probar en ambiente de desarrollo

### 6.3 Después del Deploy

- [ ] Verificar que el deploy fue exitoso
- [ ] Realizar smoke tests básicos
- [ ] Monitorear logs por errores
- [ ] Actualizar issue/PR si hay problemas

### 6.4 Comandos Útiles

```bash
# Ver estado de workflows
gh run list

# Ver logs de un workflow específico
gh run view <run-id> --log

# Disparar workflow manualmente
gh workflow run deploy-development.yml

# Ver estado de contenedores
docker compose ps

# Ver logs de Django
docker compose logs -f django

# Reiniciar servicios
docker compose restart django celery_worker
```

### 6.5 Troubleshooting Común

| Problema | Posible Causa | Solución |
|----------|---------------|----------|
| Deploy falla en npm ci | Cache corrupto | Limpiar node_modules y cache |
| Static files no actualizan | collectstatic no ejecutado | `docker compose exec django python manage.py collectstatic --noinput` |
| Frontend no carga | Build no copiado | Verificar que dist existe en static/ |
| Worker no responde | Redis desconectado | `docker compose restart redis celery_worker` |

### 6.6 Contactos de Emergencia

En caso de problemas críticos en producción:

1. **Rollback inmediato:** Revertir al commit anterior
2. **Notificar al equipo:** Canal de comunicación definido
3. **Documentar incidente:** Crear issue con detalles

---

## 📎 Anexos

### A. Diagrama Completo del Flujo CI/CD

```mermaid
flowchart TB
    subgraph DEV_LOCAL["💻 Desarrollo Local"]
        Code["Escribir código"]
        Test["Test local"]
        Commit["Commit"]
        Push["Push"]
    end

    subgraph GITHUB["☁️ GitHub"]
        PR["Pull Request"]
        Review["Code Review"]
        Merge["Merge"]
        Workflow["GitHub Actions"]
    end

    subgraph DEV_SERVER["🔧 Servidor Dev"]
        DevBuild["Build"]
        DevDeploy["Deploy"]
        DevTest["Testing"]
    end

    subgraph PROD_SERVER["🚀 Servidor Prod"]
        ProdBuild["Build"]
        ProdDeploy["Deploy"]
        Monitor["Monitoreo"]
    end

    Code --> Test --> Commit --> Push
    Push --> PR --> Review
    Review -->|Aprobado| Merge
    Merge -->|development| Workflow
    Workflow --> DevBuild --> DevDeploy --> DevTest
    DevTest -->|"Release PR"| PR
    Merge -->|production| Workflow
    Workflow --> ProdBuild --> ProdDeploy --> Monitor
```

### B. Referencias

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

**Documento generado para BDO Chile - SGM Contabilidad**  
**Última actualización:** Noviembre 2025
