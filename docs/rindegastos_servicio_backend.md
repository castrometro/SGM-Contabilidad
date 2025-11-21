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

Modelos iniciales sugeridos (enfoque simplificado):
- **TipoDocumento**: catálogo de tipos (boleta, factura, etc.) asociados al servicio del cliente.
  - `cliente_servicio` (FK a la tabla pivote Cliente-Servicio)
  - `codigo`, `nombre`
- **CentroCosto**: representa unidades de gasto del cliente.
  - `cliente_servicio` (FK)
  - `apodo` (nombre corto), `codigo`, `activo`
- **CuentaGlobal**: mapea códigos contables generales por tipo (IVA, GASTO, PROVEEDOR).
  - `cliente_servicio` (FK)
  - `codigo`, `tipo`
- **Rendicion**: registro de cada ejecución/exportación generada para el cliente.
  - `cliente_servicio` (FK)
  - `usuario` ejecutor, `fecha_ejecucion`, `datos_archivo` (JSON con metadatos del archivo generado)

Las FK hacia `cliente_servicio` garantizan que los datos estén ligados a la activación del servicio para un cliente concreto sin
sumar lógica adicional de aprobaciones o ítems de gasto en esta fase.

## API y vistas
- Prefijar rutas bajo `/api/rindegastos/` para mantener el espacio de nombres.
- Usar ViewSets/DRF para CRUD de `TipoDocumento`, `CentroCosto`, `CuentaGlobal` y `Rendicion`.
- Endpoints clave:
  - `GET/POST /api/rindegastos/centros-costo/`
  - `GET/POST /api/rindegastos/tipos-documento/`
  - `GET/POST /api/rindegastos/cuentas-globales/`
  - `GET/POST /api/rindegastos/rendiciones/`

## Integración con autenticación/autorización
- Reutilizar el modelo de usuario existente.
- Permisos sugeridos (según necesidades del cliente):
  - **rindegastos.ver_catalogos**: leer catálogos (tipos de documento, centros de costo, cuentas globales).
  - **rindegastos.gestionar_catalogos**: crear/editar catálogos del servicio.
  - **rindegastos.generar_rendicion**: crear entradas de rendición/exportación.
- Los endpoints validan que el `cliente_servicio` pertenece al usuario autenticado y que el usuario posee permisos adecuados.

## Trazabilidad y auditoría
- Registrar auditoría básica de creación/actualización de catálogos y rendiciones (por ejemplo, usando el sistema de logging
  existente si aplica).

## Migración y despliegue
1. Crear la app `rindegastos` con sus modelos y migraciones iniciales.
2. Añadir la tabla pivote Cliente-Servicio (si no existe) en la app central.
3. Registrar la app en `INSTALLED_APPS` y exponer rutas en el router DRF.
4. Agregar fixtures de ejemplo para catálogos básicos (tipos de documento, centros de costo, cuentas globales) para QA.
5. Incluir tests unitarios/integ. para CRUD y permisos de catálogos/rendiciones.

## Roadmap incremental
- **Fase 1 (actual)**: catálogos básicos (tipo de documento, centro de costo, cuentas globales) y registro de rendiciones.
- **Fase 2**: agregar validaciones/controles adicionales (límites, flujos de aprobación) si el cliente lo solicita.
- **Fase 3**: dashboards/resúmenes y exportaciones contables.

## Beneficios
- Aislamiento: la app `rindegastos` encapsula su lógica sin afectar otros servicios.
- Escalabilidad: facilita agregar nuevos servicios con el mismo patrón (una app por servicio + tabla pivote).
- Gobernanza: la tabla pivote centraliza activaciones por cliente y permite auditar estados y configuraciones.
