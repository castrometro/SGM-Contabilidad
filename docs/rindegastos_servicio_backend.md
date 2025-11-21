# Propuesta de implementación del servicio **RindeGastos** en el backend

## Objetivo
Diseñar la estructura necesaria para que cada cliente pueda habilitar uno o varios servicios, manteniendo la lógica de negocio aislada por servicio. El foco de esta propuesta es el servicio **RindeGastos**, implementado como una aplicación Django dedicada dentro del proyecto backend.

## Consideraciones generales
- **Multiservicio**: un cliente puede tener múltiples servicios activos (p. ej. RindeGastos, otro servicio futuro). Cada servicio debe exponer su propia API y modelos, evitando acoplamientos innecesarios.
- **Escalabilidad**: la app del servicio debe ser autocontenida y versionable (migraciones, tests, fixtures) para facilitar despliegues e iteraciones.
- **Trazabilidad**: mantener registro de activaciones de servicios por cliente y eventos relevantes para auditoría.

## Cambios de modelo propuestos

### 1. Tabla pivote Cliente-Servicio
Crear una tabla que represente la suscripción/activación de un servicio por cliente. Ejemplo de estructura:
- `id`
- `cliente` (FK a tabla cliente existente)
- `servicio` (FK a tabla servicio existente, incluye el registro "RindeGastos")
- `estado` (`activo`, `suspendido`, `finalizado`)
- `configuracion` (JSONField) para parámetros específicos del servicio por cliente (p. ej. políticas de aprobación, moneda por defecto)
- `created_at` / `updated_at`

### 2. App Django `rindegastos`
Crear una aplicación dedicada con sus propios modelos y migraciones, aislada de otros servicios.

Modelos iniciales sugeridos:
- **CentroCosto**: representa unidades de gasto del cliente.
  - `cliente_servicio` (FK a la tabla pivote Cliente-Servicio)
  - `nombre`, `codigo`, `activo`
- **CategoriaGasto**: catálogo configurable de categorías.
  - `cliente_servicio` (FK)
  - `nombre`, `descripcion`, `limite_monto` (opcional)
- **ReporteGasto**: cabecera del reporte rendido.
  - `cliente_servicio` (FK)
  - `usuario`/`empleado` responsable (FK a usuario/empleado del sistema)
  - `estado` (`borrador`, `en_revision`, `aprobado`, `rechazado`)
  - `monto_total`, `moneda`, `fecha_envio`, `comentario`
- **ItemGasto**: ítems del reporte.
  - `reporte` (FK a ReporteGasto)
  - `categoria` (FK a CategoriaGasto)
  - `monto`, `moneda`, `fecha`, `descripcion`, `adjunto` (FileField/URL de almacenamiento)
- **FlujoAprobacion** (opcional fase 2): define steps de aprobación por importe o centro de costo.

Las FK hacia `cliente_servicio` garantizan que los datos estén ligados a la activación del servicio para un cliente concreto.

## API y vistas
- Prefijar rutas bajo `/api/rindegastos/` para mantener el espacio de nombres.
- Usar ViewSets/DRF para CRUD de `CentroCosto`, `CategoriaGasto`, `ReporteGasto` e `ItemGasto`.
- Endpoints clave:
  - `POST /api/rindegastos/reportes/` (crear reporte en borrador)
  - `POST /api/rindegastos/reportes/{id}/enviar` (mover a `en_revision`)
  - `POST /api/rindegastos/reportes/{id}/aprobar` y `/rechazar`
  - `GET /api/rindegastos/reportes/?cliente_servicio=...` (filtrado por cliente-servicio)
  - Upload de adjuntos mediante endpoint dedicado o direct upload a storage.

## Integración con autenticación/autorización
- Reutilizar el modelo de usuario existente.
- Permisos sugeridos:
  - **rindegastos.ver**: visualizar reportes del cliente.
  - **rindegastos.editar**: crear/editar reportes propios.
  - **rindegastos.aprobar**: aprobar/rechazar.
- Los endpoints validan que el `cliente_servicio` pertenece al usuario autenticado y que el usuario posee permisos adecuados.

## Trazabilidad y auditoría
- Registrar en un modelo `EventoRindeGastos` los cambios de estado de `ReporteGasto` (quién, cuándo, acción, comentario).
- Integrar con el sistema de logging/activity existente si aplica, usando señales post_save para disparar eventos.

## Migración y despliegue
1. Crear la app `rindegastos` con sus modelos y migraciones iniciales.
2. Añadir la tabla pivote Cliente-Servicio (si no existe) en la app central.
3. Registrar la app en `INSTALLED_APPS` y exponer rutas en el router DRF.
4. Agregar fixtures de ejemplo (categorías, centros de costo) para QA.
5. Incluir tests unitarios/integ. para flujos de creación, envío, aprobación y permisos.

## Roadmap incremental
- **Fase 1**: modelos base (pivote, centro de costo, categoría, reporte, ítem), endpoints CRUD, permisos básicos, migraciones.
- **Fase 2**: flujo de aprobación configurable, límites por categoría, adjuntos con storage externo, notificaciones.
- **Fase 3**: dashboards/resúmenes, exportaciones, integraciones contables.

## Beneficios
- Aislamiento: la app `rindegastos` encapsula su lógica sin afectar otros servicios.
- Escalabilidad: facilita agregar nuevos servicios con el mismo patrón (una app por servicio + tabla pivote).
- Gobernanza: la tabla pivote centraliza activaciones por cliente y permite auditar estados y configuraciones.
