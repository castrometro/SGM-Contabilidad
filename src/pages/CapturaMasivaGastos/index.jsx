import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useCapturaGastos } from "./hooks/useCapturaGastos";
import PageHeader from "./components/PageHeader";
import InstructionsSection from "./components/InstructionsSection";
import DownloadTemplateSection from "./components/DownloadTemplateSection";
import FileUploadSection from "./components/FileUploadSection";
import MapeoCC from "./components/MapeoCC";
import CuentasGlobalesSection from "./components/CuentasGlobalesSection";
import ResultsSection from "./components/ResultsSection";
import ErrorSection from "./components/ErrorSection";
import { STYLES_CONFIG, CAPTURA_CONFIG } from "./config/capturaConfig";
import { obtenerCliente } from "../../api/clientes";

const StepCard = ({ number, title, subtitle, locked = false, children }) => {
  const { containers } = STYLES_CONFIG;

  return (
    <div className={containers.section}>
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-10 h-10 rounded-full border border-emerald-500/60 bg-emerald-600/15 flex items-center justify-center text-lg font-semibold text-emerald-200 ${locked ? "opacity-60" : ""}`}>
          {number}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-200/70">Paso {number}</p>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
        </div>
      </div>

      <div className={locked ? "opacity-60 pointer-events-none" : ""}>{children}</div>
    </div>
  );
};

/**
 * Página principal de captura masiva de gastos
 * Refactorizada usando el patrón de feature folders
 */
const CapturaMasivaGastos = () => {
  const { clienteId } = useParams();
  const [cliente, setCliente] = useState(null);
  const [cargandoCliente, setCargandoCliente] = useState(false);
  const {
    // Estado
    archivo,
    procesando,
    resultados,
    error,
    headersExcel,
    centrosCostoDetectados,
    mapeoCC,
    mostrarMapeoCC,
    cuentasGlobales,
    setCuentasGlobales,
    
    // Acciones
    handleArchivoSeleccionado,
    procesarArchivo,
    descargarArchivo,
    descargarPlantilla,
    limpiarArchivo,
    setMapeoCC
  } = useCapturaGastos();

  const { containers, buttons, alerts } = STYLES_CONFIG;
  const { steps } = CAPTURA_CONFIG;

  useEffect(() => {
    let active = true;

    const cargarCliente = async () => {
      if (!clienteId) {
        setCliente(null);
        return;
      }

      try {
        setCargandoCliente(true);
        const data = await obtenerCliente(clienteId);
        if (active) setCliente(data);
      } catch (err) {
        console.error("No se pudo cargar el cliente", err);
        if (active) setCliente(null);
      } finally {
        if (active) setCargandoCliente(false);
      }
    };

    cargarCliente();

    return () => {
      active = false;
    };
  }, [clienteId]);

  const flujoResumen = useMemo(
    () => [
      {
        titulo: steps.download.title,
        detalle: "Plantilla disponible para descargar",
        estado: "listo"
      },
      {
        titulo: steps.upload.title,
        detalle: archivo ? archivo.name : "Pendiente de carga",
        estado: archivo ? "completo" : "pendiente"
      },
      {
        titulo: "Paso 3: Configurar centros de costo y cuentas",
        detalle: archivo ? (mostrarMapeoCC ? "Mapeo listo para editar" : "Leyendo cabeceras") : "Sube un archivo para habilitar",
        estado: archivo ? (mostrarMapeoCC ? "en_progreso" : "pendiente") : "pendiente"
      },
      {
        titulo: "Paso 4: Procesar (Step 1 RG)",
        detalle: procesando
          ? "Procesando con Celery..."
          : resultados
            ? "Completado"
            : archivo
              ? "Listo para enviar"
              : "Sube archivo primero",
        estado: procesando ? "en_progreso" : resultados ? "completo" : archivo ? "listo" : "pendiente"
      },
      {
        titulo: steps.results.title,
        detalle: resultados?.archivo_disponible ? "Descarga disponible" : "Aún sin descarga",
        estado: resultados?.archivo_disponible ? "listo" : "pendiente"
      }
    ],
    [archivo, mostrarMapeoCC, procesando, resultados, steps.download.title, steps.results.title, steps.upload.title]
  );

  return (
    <div className={containers.main}>
      {/* Header */}
      <PageHeader cliente={cliente} clienteId={clienteId} loadingCliente={cargandoCliente} />

      <div className={`${containers.content} space-y-6`}>
        <div className="grid lg:grid-cols-4 gap-6 items-start">
          <div className="lg:col-span-3 space-y-6">
            <StepCard
              number={1}
              title="Descargar plantilla"
              subtitle="Obtén el formato correcto antes de cargar tus gastos"
            >
              <DownloadTemplateSection onDownload={descargarPlantilla} showTitle={false} useContainer={false} />
            </StepCard>

            <StepCard
              number={2}
              title="Subir archivo completado"
              subtitle="Carga el Excel que llenaste con la plantilla"
            >
              <FileUploadSection
                archivo={archivo}
                procesando={procesando}
                onArchivoSeleccionado={handleArchivoSeleccionado}
                onLimpiarArchivo={limpiarArchivo}
                onProcesar={procesarArchivo}
                showProcesar={false}
                showTitle={false}
                useContainer={false}
              />
            </StepCard>

            <StepCard
              number={3}
              title="Configurar centros de costo y cuentas"
              subtitle="Revisa las imputaciones detectadas y completa las cuentas obligatorias"
              locked={!archivo}
            >
              {!archivo && (
                <div className={alerts.info}>
                  <p className="text-sm text-blue-200">Sube un archivo para habilitar la configuración.</p>
                </div>
              )}

              {archivo && (
                <div className="space-y-4">
                  <MapeoCC
                    mostrarMapeoCC={mostrarMapeoCC}
                    headersExcel={headersExcel}
                    centrosCostoDetectados={centrosCostoDetectados}
                    mapeoCC={mapeoCC}
                    setMapeoCC={setMapeoCC}
                  />

                  {mostrarMapeoCC && (
                    <CuentasGlobalesSection
                      cuentasGlobales={cuentasGlobales}
                      setCuentasGlobales={setCuentasGlobales}
                    />
                  )}

                  {!mostrarMapeoCC && (
                    <div className={alerts.info}>
                      <p className="text-sm text-blue-200">Leyendo cabeceras del archivo para mostrar mapeos...</p>
                    </div>
                  )}
                </div>
              )}
            </StepCard>

            <StepCard
              number={4}
              title="Procesar (Step 1 RG)"
              subtitle="Ejecuta el procesamiento con la configuración anterior"
              locked={!archivo}
            >
              <div className="space-y-3">
                <p className="text-sm text-gray-300">
                  Valida que los centros de costo y las cuentas globales estén completos antes de iniciar.
                </p>
                <button
                  onClick={procesarArchivo}
                  disabled={!archivo || procesando}
                  className={`w-full ${buttons.secondary} ${(!archivo || procesando) ? buttons.disabled : ""}`}
                >
                  {procesando ? "Procesando con Celery..." : "Procesar (Step 1 RG)"}
                </button>
              </div>
            </StepCard>

            <StepCard
              number={5}
              title="Descargar archivo procesado"
              subtitle="Obtén el Excel con el resultado del Step 1"
            >
              <ResultsSection
                resultados={resultados}
                onDescargar={descargarArchivo}
                showPlaceholder
                showTitle={false}
                useContainer={false}
              />
            </StepCard>
          </div>

          <div className="space-y-4">
            <InstructionsSection />

            <div className={containers.section}>
              <h3 className="text-lg font-semibold mb-4">Flujo del proceso</h3>
              <div className="space-y-3">
                {flujoResumen.map((paso) => {
                  const color = {
                    listo: "bg-emerald-500",
                    completo: "bg-emerald-500",
                    en_progreso: "bg-amber-400",
                    pendiente: "bg-gray-500"
                  }[paso.estado];

                  return (
                    <div
                      key={paso.titulo}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-900/50 border border-gray-800"
                    >
                      <span className={`w-2.5 h-2.5 rounded-full mt-1.5 ${color}`} aria-hidden />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{paso.titulo}</p>
                        <p className="text-xs text-gray-400">{paso.detalle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <ErrorSection error={error} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapturaMasivaGastos;
