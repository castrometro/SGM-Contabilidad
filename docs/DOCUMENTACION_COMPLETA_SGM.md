# 📚 Documentación Completa del Sistema SGM Contabilidad

**Versión:** 2.0  
**Fecha:** 28 de Noviembre de 2025  
**Autor:** BDO Chile - Equipo de Desarrollo  

> **🔒 NOTA DE SEGURIDAD:** Este sistema está desplegado dentro de la VPN corporativa de BDO Chile.  
> El acceso requiere conexión activa a la red privada 172.17.11.0/24.

---

## 📑 Índice General

### PARTE I: VISIÓN GENERAL DEL SISTEMA

**1. Introducción y Contexto**
   - 1.1 Propósito del Sistema
   - 1.2 Alcance y Usuarios
   - 1.3 Contexto de Seguridad: VPN Corporativa BDO

**2. Arquitectura del Sistema**
   - 2.1 Vista General de Alto Nivel
   - 2.2 Arquitectura de Servidores (Producción y Desarrollo)
   - 2.3 Flujo de Datos: Procesamiento de Excel
   - 2.4 Arquitectura de Red Corporativa
   - 2.5 Diagrama de Componentes Técnicos

### PARTE II: INFRAESTRUCTURA Y DEPLOYMENT

**3. Servidor de Aplicación (172.17.11.13 / 172.17.11.22)**
   - 3.1 Especificaciones de Hardware
   - 3.2 Sistema Operativo y Configuración Base
   - 3.3 Stack de Aplicación (Django + React)
   - 3.4 Servicios Activos
   - 3.5 Configuración de Docker Compose
   - 3.6 CI/CD con GitHub Actions

**4. Servidor de Base de Datos (172.17.11.14)**
   - 4.1 Especificaciones de Hardware
   - 4.2 PostgreSQL 14.19: Configuración y Optimizaciones
   - 4.3 Stack de Monitoreo (Prometheus + Grafana)
   - 4.4 postgres_exporter: Métricas del Sistema
   - 4.5 Dashboards Disponibles
   - 4.6 Gestión de Datos y Backups

**5. Servidor de Base de Datos Compartido (172.17.11.21)**
   - 5.1 PostgreSQL 16: Configuración
   - 5.2 Bases de Datos Alojadas
   - 5.3 Políticas de Acceso y Seguridad

### PARTE III: DESARROLLO Y TECNOLOGÍAS

**6. Stack Frontend**
   - 6.1 React 19 + Vite: Configuración
   - 6.2 Estructura de Directorios
   - 6.3 Componentes Principales
   - 6.4 Routing y Navegación
   - 6.5 Gestión de Estado
   - 6.6 Integración con API Backend
   - 6.7 Build y Deployment

**7. Stack Backend**
   - 7.1 Django 5.2.8: Configuración
   - 7.2 Django REST Framework
   - 7.3 Estructura de Apps
   - 7.4 Modelos de Datos
   - 7.5 Serializers y Validación
   - 7.6 ViewSets y Endpoints
   - 7.7 Celery: Procesamiento Asíncrono

**8. Base de Datos y Persistencia**
   - 8.1 Modelo de Datos Completo
   - 8.2 Relaciones entre Entidades
   - 8.3 Índices y Optimizaciones
   - 8.4 Migraciones de Django
   - 8.5 Redis: Cache y Broker

**9. Inventario Completo de Tecnologías**
   - 9.1 Frontend: Librerías y Versiones
   - 9.2 Backend: Paquetes Python
   - 9.3 Infraestructura: Docker y Servicios
   - 9.4 Herramientas de Desarrollo
   - 9.5 Árbol de Dependencias

### PARTE IV: SEGURIDAD Y AUTENTICACIÓN

**10. Infraestructura de Seguridad VPN**
   - 10.1 Topología de Red Corporativa BDO
   - 10.2 Ventajas de Seguridad VPN
   - 10.3 Implicaciones en Configuración
   - 10.4 Modelo de Autenticación en 3 Capas

**11. Autenticación y Autorización**
   - 11.1 JWT: Implementación y Configuración
   - 11.2 Flujo de Login y Renovación de Tokens
   - 11.3 Sistema de Roles (Gerente/Supervisor/Analista)
   - 11.4 Permisos y Restricciones por Rol
   - 11.5 Control de Acceso a Recursos

**12. Configuración de Seguridad del Sistema**
   - 12.1 Headers HTTP de Seguridad
   - 12.2 CORS: Configuración para VPN
   - 12.3 Protección CSRF
   - 12.4 Validación de Contraseñas
   - 12.5 Variables de Entorno Sensibles
   - 12.6 Seguridad de Redis y PostgreSQL

**13. Seguridad del Servidor de Base de Datos**
   - 13.1 PostgreSQL: Autenticación y pg_hba.conf
   - 13.2 Firewall UFW: Reglas y Configuración
   - 13.3 Grafana: Seguridad de Dashboards
   - 13.4 Prometheus: Consideraciones de Acceso
   - 13.5 Gestión de Credenciales
   - 13.6 Logging y Auditoría

### PARTE V: APIs Y ENDPOINTS

**14. APIs del Servidor de Aplicación**
   - 14.1 Endpoints de Autenticación
   - 14.2 Endpoints de Usuarios
   - 14.3 Endpoints de Clientes
   - 14.4 Endpoints de Asignaciones
   - 14.5 Endpoints de Rinde Gastos
   - 14.6 Endpoints Auxiliares
   - 14.7 Endpoints Deshabilitados (Referencia Histórica)

**15. APIs del Servidor de Base de Datos**
   - 15.1 PostgreSQL Database API
   - 15.2 Prometheus Metrics API
   - 15.3 Grafana Dashboard API
   - 15.4 postgres_exporter Metrics Endpoint
   - 15.5 Ejemplos de Integración

**16. Documentación de Ejemplos**
   - 16.1 Ejemplos de Peticiones con curl
   - 16.2 Ejemplos con Python requests
   - 16.3 Integración desde Frontend (Axios)
   - 16.4 Scripts de Monitoreo Personalizados

### PARTE VI: OPERACIONES Y MANTENIMIENTO

**17. Monitoreo y Observabilidad**
   - 17.1 Prometheus: Métricas del Sistema
   - 17.2 Grafana: Dashboards y Visualizaciones
   - 17.3 Flower: Monitoreo de Celery
   - 17.4 Redis Insight: Visualización de Cache
   - 17.5 Logs del Sistema
   - 17.6 Alertas y Notificaciones

**18. Procedimientos Operacionales**
   - 18.1 Inicio y Detención de Servicios
   - 18.2 Despliegue de Nuevas Versiones
   - 18.3 Rollback en Caso de Error
   - 18.4 Gestión de Migraciones de Base de Datos
   - 18.5 Limpieza de Archivos Temporales

**19. Backups y Recuperación**
   - 19.1 Estrategia de Backup
   - 19.2 Backup de PostgreSQL
   - 19.3 Backup de Redis
   - 19.4 Backup de Archivos Media
   - 19.5 Procedimientos de Restauración
   - 19.6 Plan de Recuperación ante Desastres

**20. Troubleshooting y Diagnóstico**
   - 20.1 Problemas Comunes y Soluciones
   - 20.2 Herramientas de Diagnóstico
   - 20.3 Análisis de Logs
   - 20.4 Verificación de Conectividad
   - 20.5 Resolución de Problemas de Performance

### PARTE VII: DESARROLLO Y CONTRIBUCIÓN

**21. Configuración de Entorno de Desarrollo**
   - 21.1 Requisitos Previos
   - 21.2 Instalación Local
   - 21.3 Configuración de Variables de Entorno
   - 21.4 Ejecución en Modo Desarrollo
   - 21.5 Herramientas Recomendadas

**22. Workflow de Desarrollo con Git**
   - 22.1 Estrategia de Branching
   - 22.2 Convenciones de Commits
   - 22.3 Pull Requests y Code Review
   - 22.4 Integración con GitHub Issues
   - 22.5 CI/CD Pipeline

**23. Guías de Código**
   - 23.1 Estándares de Python (PEP 8)
   - 23.2 Estándares de JavaScript/React
   - 23.3 Estructura de Componentes
   - 23.4 Nomenclatura y Convenciones
   - 23.5 Comentarios y Documentación

**24. Testing**
   - 24.1 Testing Backend (Django)
   - 24.2 Testing Frontend (React)
   - 24.3 Testing de Integración
   - 24.4 Testing de APIs
   - 24.5 Cobertura de Tests

### PARTE VIII: REFERENCIA Y ANEXOS

**25. Glosario de Términos**
   - 25.1 Términos Técnicos
   - 25.2 Términos de Negocio
   - 25.3 Acrónimos y Abreviaturas

**26. Modelos de Datos Detallados**
   - 26.1 Diagrama ER Completo
   - 26.2 Descripción de Tablas
   - 26.3 Campos y Tipos de Datos
   - 26.4 Relaciones y Constraints

**27. Configuraciones de Referencia**
   - 27.1 settings.py Completo Comentado
   - 27.2 docker-compose.yml Explicado
   - 27.3 nginx.conf (si aplica)
   - 27.4 Archivos .env de Ejemplo

**28. Recursos Externos**
   - 28.1 Documentación Oficial de Tecnologías
   - 28.2 Repositorios GitHub Relacionados
   - 28.3 Comunidades y Soporte
   - 28.4 Tutoriales y Guías

**29. Roadmap y Futuras Mejoras**
   - 29.1 Funcionalidades Planificadas
   - 29.2 Mejoras de Performance
   - 29.3 Actualizaciones de Seguridad
   - 29.4 Migración de Tecnologías
   - 29.5 Escalabilidad

**30. Historial de Cambios y Versiones**
   - 30.1 Registro de Versiones
   - 30.2 Changelog Detallado
   - 30.3 Migrations Log
   - 30.4 Breaking Changes

---

## 🚀 Cómo Usar Esta Documentación

### Para Desarrolladores Nuevos
1. Leer Parte I (Visión General)
2. Configurar entorno siguiendo Parte VII
3. Revisar Parte III (Tecnologías)
4. Consultar Parte V (APIs) según necesidad

### Para Administradores de Sistema
1. Revisar Parte II (Infraestructura)
2. Estudiar Parte IV (Seguridad)
3. Familiarizarse con Parte VI (Operaciones)
4. Mantener actualizada Parte VI

### Para Analistas de Seguridad
1. Estudiar Parte IV completa (Seguridad)
2. Revisar configuraciones en Parte VIII
3. Analizar logs según Parte VI
4. Validar checklist de seguridad

### Para Product Owners / Gerentes
1. Leer Parte I (Contexto)
2. Revisar Parte V (APIs disponibles)
3. Consultar Parte VIII (Roadmap)
4. Monitorear con herramientas de Parte VI

---

## 📝 Notas de Versión

**Versión 2.0 - 28 de Noviembre 2025**
- ✅ Consolidación de documentación de ambos servidores
- ✅ Documentación completa de infraestructura VPN
- ✅ Integración de contexto de seguridad corporativa
- ✅ Unificación de inventarios tecnológicos
- ✅ Descripción detallada de APIs de todos los servicios
- ✅ Procedimientos operacionales estandarizados

---

---

## 📖 Capítulos Disponibles

| # | Capítulo | Estado | Archivo |
|---|----------|--------|---------|
| **PARTE I: VISIÓN GENERAL** | | | |
| 1 | [Introducción y Contexto](./capitulos/01_introduccion_y_contexto.md) | ✅ Completo | `01_introduccion_y_contexto.md` |
| 2 | [Arquitectura del Sistema](./capitulos/02_arquitectura_del_sistema.md) | ✅ Completo | `02_arquitectura_del_sistema.md` |
| **PARTE II: INFRAESTRUCTURA** | | | |
| 3 | [Servidor de Aplicación](./capitulos/03_servidor_aplicacion.md) | ✅ Completo | `03_servidor_aplicacion.md` |
| 4 | [Servidor de Base de Datos](./capitulos/04_servidor_base_datos.md) | ✅ Completo | `04_servidor_base_datos.md` |
| 5 | [Servidor DB Compartido](./capitulos/05_servidor_db_compartida.md) | ✅ Completo | `05_servidor_db_compartida.md` |
| **PARTE III: DESARROLLO** | | | |
| 6 | [Stack Frontend](./capitulos/06_stack_frontend.md) | ✅ Completo | `06_stack_frontend.md` |
| 7 | Stack Backend | 📝 Pendiente | `07_stack_backend.md` |
| 8 | Base de Datos y Persistencia | 📝 Pendiente | `08_base_datos_persistencia.md` |
| 9 | Inventario de Tecnologías | 📝 Pendiente | `09_inventario_tecnologias.md` |
| **PARTE IV: SEGURIDAD** | | | |
| 10 | Infraestructura VPN | 📝 Pendiente | `10_infraestructura_vpn.md` |
| 11 | Autenticación y Autorización | 📝 Pendiente | `11_autenticacion_autorizacion.md` |
| 12 | Configuración de Seguridad | 📝 Pendiente | `12_configuracion_seguridad.md` |
| 13 | Seguridad Servidor DB | 📝 Pendiente | `13_seguridad_servidor_db.md` |
| **PARTE V: APIs** | | | |
| 14 | APIs Servidor Aplicación | 📝 Pendiente | `14_apis_servidor_aplicacion.md` |
| 15 | APIs Servidor Base de Datos | 📝 Pendiente | `15_apis_servidor_base_datos.md` |
| 16 | Ejemplos de Integración | 📝 Pendiente | `16_ejemplos_integracion.md` |
| **PARTE VI: OPERACIONES** | | | |
| 17 | Monitoreo y Observabilidad | 📝 Pendiente | `17_monitoreo_observabilidad.md` |
| 18 | Procedimientos Operacionales | 📝 Pendiente | `18_procedimientos_operacionales.md` |
| 19 | Backups y Recuperación | 📝 Pendiente | `19_backups_recuperacion.md` |
| 20 | Troubleshooting | 📝 Pendiente | `20_troubleshooting.md` |
| **PARTE VII: DESARROLLO** | | | |
| 21 | Entorno de Desarrollo | 📝 Pendiente | `21_entorno_desarrollo.md` |
| 22 | Workflow Git | 📝 Pendiente | `22_workflow_git.md` |
| 23 | Guías de Código | 📝 Pendiente | `23_guias_codigo.md` |
| 24 | Testing | 📝 Pendiente | `24_testing.md` |
| **PARTE VIII: REFERENCIA** | | | |
| 25 | Glosario | 📝 Pendiente | `25_glosario.md` |
| 26 | Modelos de Datos | 📝 Pendiente | `26_modelos_datos.md` |
| 27 | Configuraciones Referencia | 📝 Pendiente | `27_configuraciones_referencia.md` |
| 28 | Recursos Externos | 📝 Pendiente | `28_recursos_externos.md` |
| 29 | Roadmap | 📝 Pendiente | `29_roadmap.md` |
| 30 | Historial de Cambios | 📝 Pendiente | `30_historial_cambios.md` |

---

## 🚀 Cómo Usar Esta Documentación

### Para Desarrolladores Nuevos
1. Leer [Capítulo 1: Introducción y Contexto](./capitulos/01_introduccion_y_contexto.md)
2. Configurar entorno siguiendo Capítulo 21
3. Revisar Parte III (Tecnologías)
4. Consultar Parte V (APIs) según necesidad

### Para Administradores de Sistema
1. Revisar Parte II (Infraestructura)
2. Estudiar Parte IV (Seguridad)
3. Familiarizarse con Parte VI (Operaciones)
4. Mantener actualizada Parte VI

### Para Analistas de Seguridad
1. Estudiar Parte IV completa (Seguridad)
2. Revisar configuraciones en Parte VIII
3. Analizar logs según Parte VI
4. Validar checklist de seguridad

### Para Product Owners / Gerentes
1. Leer Parte I (Contexto)
2. Revisar Parte V (APIs disponibles)
3. Consultar Parte VIII (Roadmap)
4. Monitorear con herramientas de Parte VI

---

## 📝 Notas de Versión

**Versión 2.0 - 28 de Noviembre 2025**
- ✅ Consolidación de documentación de ambos servidores
- ✅ Documentación completa de infraestructura VPN
- ✅ Integración de contexto de seguridad corporativa
- ✅ Unificación de inventarios tecnológicos
- ✅ Descripción detallada de APIs de todos los servicios
- ✅ Procedimientos operacionales estandarizados
- ✅ Estructura modular por capítulos individuales

---

**Estado de Documentación:** 📋 6/30 capítulos completados

> 💡 **Instrucciones:** Solicita los capítulos numerados uno por uno.  
> Ejemplo: "Dame el capítulo 2", "Ahora el capítulo 3", etc.

---

**Documento generado para BDO Chile - SGM Contabilidad**  
**Última actualización:** 28 de Noviembre 2025
