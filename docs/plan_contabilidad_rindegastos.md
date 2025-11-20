# Plan de migración a un SGM exclusivamente contable con módulo RindeGastos

## 1. Estado actual
- El backend carga tanto contabilidad como nómina (`INSTALLED_APPS`) y usa middleware de actividad de nómina, lo que introduce dependencias innecesarias para un despliegue solo contable.【F:backend/sgm_backend/settings.py†L60-L99】
- El modelo de dominio ya define clientes, servicios y servicios contratados, permitiendo controlar qué módulos recibe cada cliente sin duplicar lógica.【F:backend/api/models.py†L143-L240】
- El frontend expone rutas de cierres contables, dashboards y todo el stack de nómina, además de la página de captura masiva de gastos (RindeGastos).【F:src/App.jsx†L1-L130】
- El módulo RindeGastos tiene endpoints y tareas dedicadas para leer headers y procesar Step1 de manera asíncrona (Celery).【F:backend/contabilidad/urls.py†L301-L339】【F:backend/contabilidad/views/rindegastos.py†L28-L190】
- Existe un script SQL para eliminar todas las tablas de nómina si se requiere una limpieza completa de datos.【F:clean_nomina_tables.sql†L1-L68】

## 2. Objetivo
- Entregar un sistema exclusivamente contable centrado en RindeGastos, eliminando cualquier dependencia de nómina y desactivando flujos de cierre contable que no sean necesarios para la captura y contabilización de gastos.
- Mantener un modelo modular Cliente-Servicio: solo los clientes con el servicio "RindeGastos" activado deberían ver y usar el módulo.

## 3. Roadmap técnico

### 3.1 Backend (Django)
1. **Eliminar nómina del arranque**: remover `nomina` de `INSTALLED_APPS` y su middleware, y limpiar cualquier import que dependa de esa app. Esto evita migraciones y tablas de nómina en entornos nuevos.【F:backend/sgm_backend/settings.py†L60-L99】
2. **Depurar URLs**: en `backend/contabilidad/urls.py`, mantener únicamente los endpoints de RindeGastos y utilitarios mínimos (ej. plantillas) y desactivar rutas de cierres/actividad que no apliquen al flujo de gastos.【F:backend/contabilidad/urls.py†L301-L339】
3. **Feature flag por servicio**: aprovechar `Servicio` y `ServicioCliente` para habilitar o bloquear endpoints de RindeGastos según el servicio contratado; agregar decoradores o permisos que validen la membresía antes de procesar archivos.【F:backend/api/models.py†L208-L240】
4. **Saneamiento de datos**: en entornos existentes, ejecutar `clean_nomina_tables.sql` para eliminar tablas de nómina y borrar migraciones relacionadas; regenerar migraciones de contabilidad si es necesario.【F:clean_nomina_tables.sql†L1-L68】
5. **Celery & colas**: limitar las colas de Celery a `contabilidad,rindegastos` y eliminar workers/colas de nómina. El archivo `celery_worker.sh` puede actualizarse para reflejar esta cola única.

### 3.2 Frontend (React)
1. **Ruta única**: simplificar `src/App.jsx` dejando solo el login, menú y la ruta de captura de gastos (`/tools/captura-masiva-gastos`), eliminando páginas de cierres contables y todas las rutas de nómina.【F:src/App.jsx†L1-L130】
2. **Experiencia RindeGastos**: mantener la configuración y textos de `CapturaMasivaGastos`, que ya expone el flujo de descarga, carga y resultados para RindeGastos.【F:src/pages/CapturaMasivaGastos/config/capturaConfig.js†L17-L134】
3. **Protección por servicio**: añadir verificación del servicio contratado (vía API) antes de mostrar el módulo; reutilizar el modelo Cliente-Servicio del backend para mostrar/ocultar la opción en el menú.

### 3.3 Infraestructura
1. **Compose minimal**: tomar `docs/sgm-contabilidad-3-usuarios.md` como base de `docker-compose` minimal con Django, Redis, Postgres, Celery y nginx para servir el frontend estático; eliminar imágenes de nómina o workers adicionales.【F:docs/sgm-contabilidad-3-usuarios.md†L1-L194】
2. **Entorno**: reducir variables de entorno a las necesarias para contabilidad/RindeGastos (BD, Redis, JWT/secret); quitar claves ligadas a nómina.

## 4. Secuencia de implementación sugerida
1. Crear rama de limpieza y aplicar cambios backend (apps, middleware, urls, colas).
2. Simplificar rutas frontend y navegación, dejando solo RindeGastos y vistas básicas de clientes/servicios si se requieren para habilitar el módulo.
3. Ajustar pipelines de despliegue/docker-compose para el perfil contabilidad-only.
4. Ejecutar limpieza de datos de nómina y correr migraciones limpias.
5. Validar end-to-end el flujo RindeGastos: carga de Excel → Celery Step1 → descarga de resultados.

## 5. Resultado esperado
- Despliegue compacto (Django + Celery + Redis + Postgres + frontend estático) enfocado en captura y contabilización de gastos.
- Clientes controlados por contrato de servicio; sólo quienes tengan RindeGastos activo ven el módulo y pueden procesar archivos.
- Sin dependencias, tablas ni rutas de nómina; cierres contables avanzados y dashboards quedan deshabilitados hasta que se requieran.
