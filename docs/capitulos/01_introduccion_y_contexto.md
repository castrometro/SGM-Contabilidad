# Capítulo 1: Introducción y Contexto

**Parte I: Visión General del Sistema**  
**Documento:** SGM Contabilidad - Documentación Completa v2.0  
**Fecha:** 28 de Noviembre de 2025  

---

## 1.1 Propósito del Sistema

**SGM (Sistema de Gestión y Monitoreo) Contabilidad** es una plataforma integral desarrollada por BDO Chile para optimizar y automatizar los procesos de captura, procesamiento y análisis de información contable y rendiciones de gastos.

### Objetivos Principales

🎯 **Automatización de Procesos**
- Reducir tiempo de procesamiento de archivos Excel contables de horas a minutos
- Eliminar errores manuales en transcripción de datos
- Estandarizar formatos de información entre diferentes clientes

🎯 **Gestión Eficiente de Recursos**
- Asignación dinámica de clientes a analistas
- Visibilidad de carga de trabajo por equipo
- Supervisión estructurada de equipos de trabajo

🎯 **Trazabilidad y Auditoría**
- Registro completo de procesamiento de archivos
- Historial de asignaciones cliente-analista
- Logs de acceso y modificaciones

🎯 **Escalabilidad y Flexibilidad**
- Procesamiento asíncrono para archivos grandes (hasta 200k filas)
- Arquitectura modular para agregar nuevas funcionalidades
- Soporte multi-cliente con aislamiento de datos

### Problemática que Resuelve

**Antes del SGM:**
- ❌ Procesamiento manual de archivos Excel (2-4 horas por archivo)
- ❌ Errores frecuentes en captura de datos
- ❌ Falta de visibilidad sobre carga de trabajo
- ❌ Asignaciones de clientes no documentadas
- ❌ Dificultad para supervisar equipos
- ❌ Sin historial de rendiciones procesadas

**Con el SGM:**
- ✅ Procesamiento automatizado (5-10 minutos por archivo)
- ✅ Validación automática de datos
- ✅ Dashboard de carga de trabajo en tiempo real
- ✅ Asignaciones rastreables y auditables
- ✅ Herramientas de supervisión integradas
- ✅ Historial completo con descarga de resultados

### Módulos Funcionales

**1. Módulo de Autenticación y Usuarios**
- Login con credenciales BDO
- Gestión de roles (Gerente/Supervisor/Analista)
- Asignación de supervisores

**2. Módulo de Clientes**
- Catálogo de clientes BDO
- Información de industria y servicios contratados
- Asignación de clientes a analistas

**3. Módulo de Rinde Gastos (Captura Masiva)**
- Upload de archivos Excel
- Procesamiento asíncrono con Celery
- Validación de columnas y datos
- Descarga de resultados procesados
- Historial de rendiciones

**4. Módulo de Asignaciones**
- Gestión de relaciones cliente-analista
- Vista por analista y por cliente
- Clientes disponibles vs asignados

**5. Módulo de Supervisión** (en desarrollo)
- Dashboard de equipo supervisado
- Métricas de rendimiento
- Alertas y notificaciones

---

## 1.2 Alcance y Usuarios

### Usuarios del Sistema

**👔 Gerentes de Área**
- **Cantidad estimada:** 3-5 usuarios
- **Permisos:**
  - Acceso total a todos los clientes de su área
  - Gestión de usuarios (crear analistas, asignar supervisores)
  - Asignación y reasignación de clientes
  - Acceso a métricas y reportes ejecutivos
  - Configuración de alertas y umbrales

**👷 Supervisores de Equipo**
- **Cantidad estimada:** 8-12 usuarios
- **Permisos:**
  - Ver clientes de sus analistas supervisados
  - Monitoreo de equipo
  - Dashboard de rendimiento de equipo
  - Procesamiento de archivos de clientes supervisados

**💼 Analistas Contables**
- **Cantidad estimada:** 50-100 usuarios
- **Permisos:**
  - Acceso solo a clientes asignados
  - Procesamiento de archivos (Rinde Gastos)
  - Consulta de historial propio
  - Descarga de resultados

**📊 Analistas Senior**
- **Cantidad estimada:** 10-15 usuarios
- **Permisos:**
  - Similar a Analistas
  - Acceso a funcionalidades avanzadas
  - Mayor límite de procesamiento

### Alcance Funcional Actual (v2.0)

**✅ Implementado y Operativo:**

1. **Autenticación JWT**
   - Login/logout con tokens
   - Renovación automática de tokens
   - Roles y permisos

2. **Gestión de Usuarios**
   - CRUD de usuarios
   - Asignación de supervisores
   - Vista de analistas supervisados

3. **Gestión de Clientes**
   - Catálogo completo de clientes BDO
   - Información de servicios contratados
   - Filtros por industria y área

4. **Asignaciones Cliente-Analista**
   - Asignación múltiple
   - Remoción de asignaciones
   - Vista de clientes disponibles
   - Vista de clientes asignados

5. **Rinde Gastos - Procesamiento Excel**
   - Upload de archivos Excel (.xlsx)
   - Lectura de headers automática
   - Procesamiento asíncrono con Celery
   - Validación de datos
   - Descarga de resultados
   - Historial de rendiciones

6. **Monitoreo Operacional**
   - Flower para Celery
   - Redis Insight para cache
   - Prometheus + Grafana (servidor DB)

**🚧 En Desarrollo / Planificado:**

1. **Dashboard Analítico**
   - Métricas de rendimiento por analista
   - KPIs ejecutivos
   - Análisis de portafolio de clientes

2. **Sistema de Alertas**
   - Alertas configurables
   - Notificaciones por email
   - Dashboard de alertas pendientes

3. **Reportería Avanzada**
   - Generación de reportes automáticos
   - Exportación a PDF/Excel
   - Programación de reportes

4. **Módulos Adicionales**
   - Contabilidad (Libros Mayores)
   - Nómina (Procesamiento de planillas)
   - Conciliación bancaria

### Alcance Técnico

**Límites del Sistema:**
- **Archivos Excel:** Hasta 200,000 filas por archivo
- **Tamaño máximo:** 5 MB por upload
- **Usuarios concurrentes:** ~50 usuarios simultáneos
- **Tareas Celery:** 10 workers paralelos
- **Conexiones DB:** 100 conexiones máximo
- **Cache Redis:** 2GB memoria

**Restricciones:**
- Requiere acceso a VPN corporativa BDO
- Navegadores modernos (Chrome 90+, Firefox 88+, Edge 90+)
- Resolución mínima: 1366x768
- Conexión estable (procesamiento largo)

### Integraciones

**✅ Integrado:**
- GitHub (repositorio de código)
- GitHub Actions (CI/CD)
- PostgreSQL (base de datos corporativa)
- Redis (cache y broker)

**🔄 En Evaluación:**
- InVGate Service Desk (tickets)
- Sistemas contables BDO internos
- Plataformas de BI corporativas

---

## 1.3 Contexto de Seguridad: VPN Corporativa BDO

### Modelo de Seguridad en Capas

El sistema SGM opera bajo un **modelo de seguridad en tres capas** aprovechando la infraestructura VPN corporativa de BDO Chile:

```
┌─────────────────────────────────────────────────┐
│  CAPA 1: VPN CORPORATIVA BDO                   │
│  • Autenticación corporativa (AD/LDAP)         │
│  • Cifrado de tráfico end-to-end               │
│  • Firewall perimetral                          │
│  • IPS/IDS corporativo                          │
│  • Gestión centralizada IT                      │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  CAPA 2: AUTENTICACIÓN SGM (JWT)               │
│  • Login con credenciales BDO                   │
│  • Tokens JWT (8 horas)                         │
│  • Refresh tokens (3 días)                      │
│  • Blacklist de tokens                          │
│  • Validación de sesión activa                  │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  CAPA 3: AUTORIZACIÓN POR ROL                  │
│  • Permisos Gerente/Supervisor/Analista        │
│  • Control de acceso a clientes                 │
│  • Restricción de endpoints                     │
│  • Validación de recursos                       │
│  • Auditoría de acciones                        │
└─────────────────────────────────────────────────┘
```

### Ventajas de Seguridad VPN

**🔒 Aislamiento Total**
- Sistema **NO accesible** desde Internet público
- Solo dispositivos conectados a VPN BDO pueden acceder
- Protección contra ataques externos automatizados
- Sin exposición a scanning de puertos

**🛡️ Defensa en Profundidad**
- Firewall corporativo como primera barrera
- Sistema de detección de intrusiones (IDS)
- VPN con cifrado AES-256
- Autenticación multi-factor en VPN (MFA)

**👥 Control de Acceso Centralizado**
- IT de BDO gestiona accesos VPN
- Revocación inmediata al desvincular empleado
- Auditoría de conexiones corporativa
- Políticas de seguridad empresariales

**📊 Reducción de Superficie de Ataque**
- Sin ataques DDoS desde Internet
- Sin bots o scrapers maliciosos
- Sin necesidad de HTTPS público
- Menor complejidad de configuración

### Topología de Red

**Red Corporativa BDO:**
```
Internet Público
       │
       │ (Sin acceso directo)
       │
┌──────▼────────────────────────────────────┐
│    FIREWALL CORPORATIVO BDO               │
│    + VPN Gateway                          │
│    IP Pública: [Gestionada por IT BDO]   │
└──────┬────────────────────────────────────┘
       │
┌──────▼────────────────────────────────────┐
│    RED PRIVADA: 172.17.11.0/24           │
│                                           │
│  ┌─────────────────────────────────┐     │
│  │ Servidor Producción             │     │
│  │ vm-bdo-outcontab1               │     │
│  │ 172.17.11.13                    │     │
│  │ • Django + React + Celery       │     │
│  └─────────────────────────────────┘     │
│                                           │
│  ┌─────────────────────────────────┐     │
│  │ Servidor Desarrollo             │     │
│  │ vm-bdo-q                        │     │
│  │ 172.17.11.22                    │     │
│  │ • Django + React + Celery       │     │
│  └─────────────────────────────────┘     │
│                                           │
│  ┌─────────────────────────────────┐     │
│  │ Servidor Base de Datos          │     │
│  │ vm-bdo-outcontab2               │     │
│  │ 172.17.11.14                    │     │
│  │ • PostgreSQL + Monitoring       │     │
│  └─────────────────────────────────┘     │
│                                           │
│  ┌─────────────────────────────────┐     │
│  │ Servidor DB Compartido          │     │
│  │ vmbdobases                      │     │
│  │ 172.17.11.21                    │     │
│  │ • PostgreSQL 16                 │     │
│  └─────────────────────────────────┘     │
│                                           │
└───────────────────────────────────────────┘
```

**Características de la Red:**
- **Rango IP:** 172.17.11.0/24 (254 hosts disponibles)
- **Gateway:** Gestionado por IT BDO
- **DNS:** Servidores DNS corporativos
- **DHCP:** Red estática para servidores
- **Segmentación:** VLAN dedicada a sistemas de Outcontab

### Implicaciones en Configuración

**1. HTTPS No Es Crítico**
- El tráfico VPN ya está cifrado (AES-256)
- HTTP interno es aceptable para red privada
- Simplifica configuración y certificados
- Mejor rendimiento sin overhead SSL

**2. CORS Simplificado**
- Solo IPs internas en whitelist
- No hay orígenes externos
- Configuración predecible y estable

**3. Firewall de Aplicación Opcional**
- VPN ya proporciona filtrado de IPs
- Rate limiting menos crítico
- DDoS protection innecesario

**4. Backup y Recuperación**
- Backups pueden almacenarse en red interna
- Sin necesidad de cifrado adicional en tránsito
- Acceso rápido desde cualquier servidor

### Procedimiento de Acceso para Usuarios

**Paso 1: Conexión VPN**
```bash
1. Usuario abre cliente VPN BDO
2. Ingresa credenciales corporativas
3. Completa MFA (si configurado)
4. Cliente VPN establece túnel cifrado
5. Usuario obtiene IP en rango 172.17.11.0/24
```

**Paso 2: Acceso al Sistema**
```bash
1. Usuario abre navegador
2. Navega a: http://172.17.11.13:8000 (producción)
3. Sistema presenta login SGM
4. Usuario ingresa credenciales BDO
5. Sistema emite JWT token
6. Usuario accede según su rol
```

**Paso 3: Uso Normal**
- Todas las peticiones HTTP dentro de VPN
- Tokens JWT en localStorage del navegador
- Refresh automático de tokens
- Logout al cerrar sesión o expiración

### Políticas de Seguridad BDO Aplicables

**Acceso:**
- Solo empleados activos de BDO
- Dispositivos corporativos gestionados
- Antivirus actualizado obligatorio
- Parches de seguridad al día

**Uso:**
- Prohibido compartir credenciales
- No usar en redes públicas
- Reportar actividad sospechosa
- Logout al terminar jornada

**Auditoría:**
- Logs de acceso conservados 12 meses
- Revisión trimestral de accesos
- Alertas de accesos inusuales
- Cumplimiento con normativa GDPR

### Ventanas de Mantenimiento

**Programadas:**
- Domingos 02:00 - 06:00 AM (hora Chile)
- Notificación 72 horas antes
- Downtime máximo: 2 horas

**Emergencias:**
- Notificación inmediata vía email
- Estimación de tiempo de resolución
- Updates cada hora durante incidente

---

## Resumen del Capítulo 1

✅ **Propósito:** Sistema integral para procesamiento contable automatizado  
✅ **Usuarios:** Gerentes, Supervisores y Analistas (60-120 usuarios)  
✅ **Módulos:** Autenticación, Clientes, Asignaciones, Rinde Gastos  
✅ **Seguridad:** 3 capas (VPN + JWT + Roles) dentro de red corporativa BDO  
✅ **Alcance:** Procesamiento Excel hasta 200k filas, multi-cliente, auditable  

---

**📖 Navegación:**
- ⬅️ [Volver al Índice](../DOCUMENTACION_COMPLETA_SGM.md)
- ➡️ [Capítulo 2: Arquitectura del Sistema](./02_arquitectura_del_sistema.md)

---

**Documento generado para BDO Chile - SGM Contabilidad**  
**Última actualización:** 28 de Noviembre 2025
