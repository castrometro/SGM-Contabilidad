# Setup Rápido por Servidor

## 📋 Checklist de Configuración

### Servidor [1] - Producción (ESTE SERVIDOR)
- [x] Repositorio clonado
- [x] Branch: `production`
- [x] Archivo: `.env` (basado en `.env.production.example`)
- [x] Conectado a DB: 172.17.11.14
- [x] Docker Compose: Listo

**Comando para deployar cambios:**
```bash
git pull origin main
docker compose build
docker compose down && docker compose up -d
```

---

### Servidor [4] - Desarrollo General
- [ ] Clonar repositorio
- [ ] Branch: `development`
- [ ] Archivo: `.env` (basado en `.env.development.example`)
- [ ] Conectar a DB: Servidor [5]
- [ ] Levantar con Docker Compose

**Comandos:**
```bash
# Primera vez
git clone https://github.com/BDO-Chile/SGM-Contabilidad.git sgm-dev
cd sgm-dev
git checkout development
cp .env.development.example .env

# Editar .env y cambiar:
# POSTGRES_HOST=IP_REAL_SERVIDOR_5

# Levantar
docker compose up -d

# Ver logs
docker compose logs -f django
```

---

### Servidor [5] - Base de Datos Dev
- [ ] Crear base de datos `sgm_dev_db`
- [ ] Crear usuario `sgm_user`
- [ ] Permitir conexión desde Servidor [4]

**Comandos:**
```bash
# En servidor [5]
sudo -u postgres psql

CREATE DATABASE sgm_dev_db;
CREATE USER sgm_user WITH PASSWORD 'dev_password_simple';
GRANT ALL PRIVILEGES ON DATABASE sgm_dev_db TO sgm_user;
ALTER DATABASE sgm_dev_db OWNER TO sgm_user;
\q

# Configurar acceso remoto en pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf
# Agregar: host sgm_dev_db sgm_user IP_SERVIDOR_4/32 md5

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

---

## 🔄 Workflow de Trabajo

```
1. Desarrollo en Servidor [4]
   ├── Trabajas en branch: development
   ├── Testeas cambios
   └── git push origin development

2. Crear Pull Request
   ├── development → main
   └── Revisar y aprobar

3. Deploy a Producción en Servidor [1]
   ├── git checkout production
   ├── git merge main
   ├── docker compose build
   └── docker compose down && docker compose up -d
```

---

## 🆘 Comandos Útiles

### Ver logs
```bash
# Todos los servicios
docker compose logs -f

# Solo Django
docker compose logs -f django

# Solo Celery
docker compose logs -f celery_worker
```

### Reiniciar servicios
```bash
# Todo
docker compose restart

# Solo Django
docker compose restart django
```

### Entrar al contenedor
```bash
# Django
docker compose exec django bash

# PostgreSQL (en servidor [2] o [5])
docker compose exec postgres psql -U sgm_user sgm_db
```

### Migraciones
```bash
# Crear migraciones
docker compose exec django python manage.py makemigrations

# Aplicar migraciones
docker compose exec django python manage.py migrate

# Ver estado
docker compose exec django python manage.py showmigrations
```

### Copiar datos Prod → Dev
```bash
# En servidor [2] (DB Producción)
pg_dump -U sgm_user sgm_db > backup.sql

# Copiar a servidor [5]
scp backup.sql user@servidor5:/tmp/

# En servidor [5] (DB Desarrollo)
psql -U sgm_user sgm_dev_db < /tmp/backup.sql
```
