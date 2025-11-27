# 🚀 Deployment con GitHub Actions Self-Hosted Runner

Este documento describe el proceso completo de deployment automático usando GitHub Actions con runners auto-hospedados en los servidores de BDO.

## 📋 Tabla de Contenidos

- [Visión General](#visión-general)
- [Instalación del Runner](#instalación-del-runner)
- [Flujo de Deployment](#flujo-de-deployment)
- [Gestión del Runner](#gestión-del-runner)
- [Troubleshooting](#troubleshooting)

## 🎯 Visión General

**Sistema de CI/CD implementado:**
- **Producción**: Deployment automático al hacer push a rama `production`
- **Desarrollo**: Deployment automático al hacer push a rama `development`
- **Manual**: Ejecución manual de workflows desde GitHub UI

**Arquitectura:**
```
GitHub Push → GitHub Actions → Self-Hosted Runner → Build Frontend → Deploy to Django → Restart
```

**¿Por qué Self-Hosted Runner?**
- Los servidores BDO están en VPN privada (no accesibles desde Internet)
- El runner corre DENTRO del servidor, con acceso completo al filesystem y Docker
- No requiere exponer servicios ni configurar SSH desde GitHub

## 🔧 Instalación del Runner

### Prerequisitos

Verifica que tengas instalado:
```bash
# Node.js 20+
node --version  # >= 20.19.5

# Docker y Docker Compose
docker --version
docker compose version

# Git configurado con acceso al repo
git remote -v
```

### Paso 1: Ejecutar el script de instalación

**Para servidor de PRODUCCIÓN (172.17.11.13):**
```bash
cd /home/outcontab1/dev/sgm-contabilidad
./scripts/setup-github-runner.sh production
```

**Para servidor de DESARROLLO (172.17.11.22 - vm-bdo-q):**
```bash
cd /home/outcontab1/dev/sgm-contabilidad
./scripts/setup-github-runner.sh development
```

### Paso 2: Obtener el token de GitHub

1. Ve a: https://github.com/BDO-Chile/SGM-Contabilidad/settings/actions/runners/new
2. Selecciona **Linux** como sistema operativo
3. Copia el **TOKEN** que aparece en el comando de configuración

### Paso 3: Configurar el runner

**Para PRODUCCIÓN:**
```bash
cd ~/actions-runner-production
./config.sh --url https://github.com/BDO-Chile/SGM-Contabilidad \
            --token <TU_TOKEN_AQUÍ> \
            --name sgm-runner-prod \
            --labels self-hosted,Linux,X64,production
```

**Para DESARROLLO:**
```bash
cd ~/actions-runner-development
./config.sh --url https://github.com/BDO-Chile/SGM-Contabilidad \
            --token <TU_TOKEN_AQUÍ> \
            --name sgm-runner-dev \
            --labels self-hosted,Linux,X64,development
```

### Paso 4: Instalar como servicio

```bash
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status  # Verificar que esté corriendo
```

### Paso 5: Verificar en GitHub

Ve a: https://github.com/BDO-Chile/SGM-Contabilidad/settings/actions/runners

Deberías ver tu runner con estado **Idle** (verde).

## 🚀 Flujo de Deployment

### Deployment a Producción

```bash
# 1. Hacer cambios en tu rama de trabajo
git checkout -b feature/nueva-funcionalidad
# ... hacer cambios ...
git add .
git commit -m "feat: nueva funcionalidad"
git push origin feature/nueva-funcionalidad

# 2. Crear PR y mergear a production
# (esto se hace desde GitHub UI)

# 3. GitHub Actions se ejecuta automáticamente
# - Checkout del código
# - Instala dependencias (npm ci)
# - Build del frontend (npm run build)
# - Copia archivos a staticfiles/dist
# - Ejecuta collectstatic
# - Reinicia Django

# 4. Tu aplicación está desplegada!
# Visita: http://172.17.11.13:8000
```

### Deployment a Desarrollo

```bash
# 1. Mergear a rama development
git checkout development
git merge main
git push origin development

# 2. GitHub Actions se ejecuta automáticamente
# (mismo proceso que producción pero en servidor dev)

# 3. Tu aplicación está desplegada!
# Visita: http://172.17.11.22:8000
```

### Deployment Manual

Si necesitas ejecutar el workflow manualmente:

1. Ve a: https://github.com/BDO-Chile/SGM-Contabilidad/actions
2. Selecciona el workflow que deseas ejecutar:
   - "Deploy to Production" o "Deploy to Development"
3. Click en **"Run workflow"**
4. Selecciona la rama y click en **"Run workflow"**

## 🛠️ Gestión del Runner

Cada runner instalado incluye un script de gestión:

### Comandos disponibles

```bash
cd ~/actions-runner-production  # o ~/actions-runner-development

# Iniciar el runner
./manage-runner.sh start

# Detener el runner
./manage-runner.sh stop

# Reiniciar el runner
./manage-runner.sh restart

# Ver estado del runner
./manage-runner.sh status

# Ver logs en tiempo real
./manage-runner.sh logs
```

### Verificar ejecución de workflows

```bash
# Ver logs del runner
./manage-runner.sh logs

# Ver logs del último workflow
cd /home/outcontab1/dev/sgm-contabilidad
docker compose logs django --tail=50
```

### Actualizar el runner

GitHub notificará cuando haya una nueva versión:

```bash
cd ~/actions-runner-production
./manage-runner.sh stop
./bin/Runner.Listener update
./manage-runner.sh start
```

## 🔍 Troubleshooting

### El runner no aparece en GitHub

**Problema:** El runner se instaló pero no aparece como "Idle" en GitHub.

**Solución:**
```bash
cd ~/actions-runner-production
sudo ./svc.sh status  # Verificar que el servicio esté corriendo

# Si no está corriendo:
sudo ./svc.sh start

# Ver logs para diagnosticar:
./manage-runner.sh logs
```

### El workflow falla en "Install frontend dependencies"

**Problema:** `npm ci` falla con errores de permisos o versiones.

**Solución:**
```bash
# Verificar versión de Node.js en el runner
node --version  # Debe ser >= 20.19.5

# Si es incorrecta, instalar nvm y Node 20:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20

# Reiniciar el runner
cd ~/actions-runner-production
./manage-runner.sh restart
```

### El build de Vite falla

**Problema:** `npm run build` falla con errores de compilación.

**Solución:**
```bash
# Probar el build localmente primero
cd /home/outcontab1/dev/sgm-contabilidad
npm run build

# Si funciona localmente, verificar variables de entorno en workflow
# Revisar .github/workflows/deploy-production.yml
```

### Django no encuentra el index.html

**Problema:** Después del deployment, al acceder a la raíz obtienes error 404.

**Solución:**
```bash
# Verificar que el directorio dist existe
ls -la /home/outcontab1/dev/sgm-contabilidad/backend/staticfiles/dist/

# Verificar que index.html está ahí
ls -la /home/outcontab1/dev/sgm-contabilidad/backend/staticfiles/dist/index.html

# Ejecutar collectstatic manualmente
cd /home/outcontab1/dev/sgm-contabilidad/backend
docker compose exec django python manage.py collectstatic --noinput

# Reiniciar Django
docker compose restart django
```

### Los assets de Vite no cargan (404 en archivos JS/CSS)

**Problema:** La página carga pero los archivos JavaScript y CSS devuelven 404.

**Solución:**
```bash
# Verificar que los assets están en static
ls -la /home/outcontab1/dev/sgm-contabilidad/backend/static/assets/

# Verificar configuración de STATICFILES_DIRS en settings.py
cd /home/outcontab1/dev/sgm-contabilidad/backend
grep -A 5 "STATICFILES_DIRS" sgm_backend/settings.py

# Ejecutar collectstatic y reiniciar
docker compose exec django python manage.py collectstatic --noinput
docker compose restart django
```

### El runner se queda "stuck" en un job

**Problema:** Un workflow se ejecuta pero nunca termina.

**Solución:**
```bash
# Cancelar el job desde GitHub UI
# Luego reiniciar el runner
cd ~/actions-runner-production
./manage-runner.sh restart

# Ver logs para diagnosticar
./manage-runner.sh logs
```

### Permisos de Docker

**Problema:** El workflow falla con error "permission denied" al ejecutar `docker compose`.

**Solución:**
```bash
# Agregar el usuario al grupo docker
sudo usermod -aG docker outcontab1

# Cerrar sesión y volver a entrar (o reiniciar el runner)
cd ~/actions-runner-production
./manage-runner.sh restart
```

## 📊 Monitoreo y Logs

### Ver logs del deployment

```bash
# Logs del runner
cd ~/actions-runner-production
./manage-runner.sh logs

# Logs de Django después del deployment
cd /home/outcontab1/dev/sgm-contabilidad
docker compose logs django --tail=100 -f

# Logs de los workers de Celery
docker compose logs celery_worker --tail=50 -f
```

### Ver estado de los contenedores

```bash
cd /home/outcontab1/dev/sgm-contabilidad
docker compose ps
docker compose top
```

### Verificar que el frontend se sirve correctamente

```bash
# Probar la raíz
curl -I http://localhost:8000/

# Probar una ruta de React Router
curl -I http://localhost:8000/dashboard

# Probar assets estáticos
curl -I http://localhost:8000/static/assets/index-[hash].js
```

## 🔐 Seguridad

### Tokens y Secrets

Los tokens del runner están almacenados localmente en:
```
~/actions-runner-production/.credentials
~/actions-runner-production/.runner
```

**Nunca compartas estos archivos ni los incluyas en Git.**

### Variables de entorno

Para agregar variables de entorno sensibles al workflow:

1. Ve a: https://github.com/BDO-Chile/SGM-Contabilidad/settings/secrets/actions
2. Click en **"New repository secret"**
3. Agrega la variable (ejemplo: `DATABASE_PASSWORD`)
4. Úsala en el workflow como: `${{ secrets.DATABASE_PASSWORD }}`

## 📚 Referencias

- [GitHub Actions Self-Hosted Runners](https://docs.github.com/en/actions/hosting-your-own-runners)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Vite Build Documentation](https://vitejs.dev/guide/build.html)
- [Django Static Files](https://docs.djangoproject.com/en/5.2/howto/static-files/)
- [WhiteNoise Documentation](http://whitenoise.evans.io/)

## 🆘 Soporte

Si encuentras problemas no cubiertos aquí:

1. Revisa los logs del runner y de Django
2. Verifica que todos los servicios estén corriendo
3. Prueba el build localmente primero
4. Consulta la documentación de GitHub Actions

---

**Última actualización:** Noviembre 2025  
**Versión del sistema:** SGM Contabilidad v1.0
