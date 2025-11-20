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

  const { containers } = STYLES_CONFIG;
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
        titulo: "Configuración de centros de costos",
        detalle: mostrarMapeoCC ? "Mapeo listo para editar" : "A la espera del archivo",
        estado: mostrarMapeoCC ? "en_progreso" : "pendiente"
      },
      {
        titulo: "Procesamiento",
        detalle: procesando ? "Procesando con Celery..." : resultados ? "Completado" : "Listo para procesar",
        estado: procesando ? "en_progreso" : resultados ? "completo" : "pendiente"
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
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <InstructionsSection />
              <DownloadTemplateSection onDownload={descargarPlantilla} />
            </div>

            <FileUploadSection
              archivo={archivo}
              procesando={procesando}
              onArchivoSeleccionado={handleArchivoSeleccionado}
              onLimpiarArchivo={limpiarArchivo}
              onProcesar={procesarArchivo}
            />

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
          </div>

          <div className="space-y-4">
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

            <ResultsSection
              resultados={resultados}
              onDescargar={descargarArchivo}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapturaMasivaGastos;
