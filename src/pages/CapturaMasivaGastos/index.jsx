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
import { obtenerCliente, obtenerServiciosCliente } from "../../api/clientes";
import {
  obtenerCentrosCosto,
  obtenerCuentasGlobales,
  obtenerRendiciones,
  obtenerTiposDocumento
} from "../../api/rindeGastos";

const normalizarNombre = (valor = "") => valor.toString().normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const esServicioRindegastos = (nombre = "") => {
  const nombrePlano = normalizarNombre(nombre);
  return nombrePlano.includes("rindegastos") || nombrePlano.startsWith("rinde");
};

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
  const [clienteServicioId, setClienteServicioId] = useState(null);
  const [cargandoServicio, setCargandoServicio] = useState(false);
  const [servicioNoDisponible, setServicioNoDisponible] = useState(false);
  const [activeTab, setActiveTab] = useState("rendir");
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

  const [rendiciones, setRendiciones] = useState([]);
  const [cargandoRendiciones, setCargandoRendiciones] = useState(false);
  const [errorRendiciones, setErrorRendiciones] = useState("");
  const [historialCargado, setHistorialCargado] = useState(false);

  const [configuracion, setConfiguracion] = useState({
    centrosCosto: [],
    tiposDocumento: [],
    cuentasGlobales: []
  });
  const [cargandoConfiguracion, setCargandoConfiguracion] = useState(false);
  const [errorConfiguracion, setErrorConfiguracion] = useState("");
  const [configuracionCargada, setConfiguracionCargada] = useState(false);

  const { containers, buttons, alerts } = STYLES_CONFIG;
  const { steps } = CAPTURA_CONFIG;

  useEffect(() => {
    let active = true;

    const cargarContextoCliente = async () => {
      if (!clienteId) {
        setCliente(null);
        setClienteServicioId(null);
        setServicioNoDisponible(false);
        return;
      }

      try {
        setCargandoCliente(true);
        setCargandoServicio(true);
        setServicioNoDisponible(false);

        const [clienteData, serviciosData] = await Promise.all([
          obtenerCliente(clienteId),
          obtenerServiciosCliente(clienteId)
        ]);

        if (active) {
          setCliente(clienteData);
          const servicioRinde = (serviciosData || []).find((servicio) =>
            esServicioRindegastos(servicio?.servicio_nombre || servicio?.nombre)
          );
          if (servicioRinde?.id) {
            setClienteServicioId(servicioRinde.id);
          } else {
            setClienteServicioId(null);
            setServicioNoDisponible(true);
          }
        }
      } catch (err) {
        console.error("No se pudo cargar el cliente o servicios", err);
        if (active) {
          setCliente(null);
          setClienteServicioId(null);
          setServicioNoDisponible(true);
        }
      } finally {
        if (active) {
          setCargandoCliente(false);
          setCargandoServicio(false);
        }
      }
    };

    cargarContextoCliente();

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

  useEffect(() => {
    const cargarHistorial = async () => {
      if (!clienteServicioId) return;
      try {
        setCargandoRendiciones(true);
        setErrorRendiciones("");
        const data = await obtenerRendiciones(clienteServicioId);
        setRendiciones(Array.isArray(data) ? data : []);
        setHistorialCargado(true);
      } catch (error) {
        console.error("Error cargando historial de rendiciones", error);
        setErrorRendiciones(error.message);
      } finally {
        setCargandoRendiciones(false);
      }
    };

    if (activeTab === "historial" && !historialCargado) {
      cargarHistorial();
    }
  }, [activeTab, clienteServicioId, historialCargado]);

  useEffect(() => {
    const cargarConfiguracion = async () => {
      if (!clienteServicioId) return;
      try {
        setCargandoConfiguracion(true);
        setErrorConfiguracion("");
        const [centros, tipos, cuentas] = await Promise.all([
          obtenerCentrosCosto(clienteServicioId),
          obtenerTiposDocumento(clienteServicioId),
          obtenerCuentasGlobales(clienteServicioId)
        ]);
        setConfiguracion({
          centrosCosto: Array.isArray(centros) ? centros : [],
          tiposDocumento: Array.isArray(tipos) ? tipos : [],
          cuentasGlobales: Array.isArray(cuentas) ? cuentas : []
        });
        setConfiguracionCargada(true);
      } catch (error) {
        console.error("Error cargando configuraciones RG", error);
        setErrorConfiguracion(error.message);
      } finally {
        setCargandoConfiguracion(false);
      }
    };

    if (activeTab === "configuraciones" && !configuracionCargada) {
      cargarConfiguracion();
    }
  }, [activeTab, clienteServicioId, configuracionCargada]);

  const formatearFecha = (valor) => {
    if (!valor) return "Sin fecha";
    try {
      return new Date(valor).toLocaleString();
    } catch (err) {
      return valor;
    }
  };

  const renderHistorial = () => {
    if (cargandoServicio || cargandoRendiciones) {
      return <div className="text-gray-200">Cargando historial...</div>;
    }

    if (servicioNoDisponible) {
      return (
        <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-4 text-amber-100">
          No se encontró el servicio RindeGastos para este cliente. Solicita la activación para ver el historial.
        </div>
      );
    }

    if (!clienteServicioId) {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-gray-200">
          Selecciona un cliente válido para cargar las rendiciones.
        </div>
      );
    }

    if (errorRendiciones) {
      return <ErrorSection error={`No se pudo cargar el historial: ${errorRendiciones}`} />;
    }

    if (!rendiciones.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-gray-300">
          No hay rendiciones registradas todavía.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rendiciones.map((rendicion) => (
          <div key={rendicion.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Rendición #{rendicion.id}</h3>
              <span className="text-xs text-gray-400">{formatearFecha(rendicion.fecha_ejecucion)}</span>
            </div>
            <p className="text-sm text-gray-300">Usuario: {rendicion.usuario_correo || rendicion.usuario}</p>
            <p className="text-sm text-gray-300 break-words">
              Archivo: {rendicion.datos_archivo?.nombre_archivo || rendicion.datos_archivo?.archivo_nombre || "Sin detalle"}
            </p>
          </div>
        ))}
      </div>
    );
  };

  const renderConfiguraciones = () => {
    if (cargandoServicio || cargandoConfiguracion) {
      return <div className="text-gray-200">Cargando configuraciones...</div>;
    }

    if (servicioNoDisponible) {
      return (
        <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-4 text-amber-100">
          Activa RindeGastos para este cliente para ver sus configuraciones.
        </div>
      );
    }

    if (!clienteServicioId) {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-gray-200">
          Selecciona un cliente válido para revisar configuraciones.
        </div>
      );
    }

    if (errorConfiguracion) {
      return <ErrorSection error={`No se pudieron cargar las configuraciones: ${errorConfiguracion}`} />;
    }

    const { centrosCosto, tiposDocumento, cuentasGlobales } = configuracion;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-2">
          <h3 className="text-white font-semibold">Centros de costo</h3>
          {centrosCosto.length ? (
            <ul className="space-y-1 text-sm text-gray-200 max-h-64 overflow-auto">
              {centrosCosto.map((cc) => (
                <li key={cc.id} className="flex items-center justify-between border-b border-gray-700/60 pb-1 last:border-b-0">
                  <span>{cc.apodo}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${cc.activo ? "bg-emerald-500/10 text-emerald-200" : "bg-gray-700 text-gray-300"}`}>
                    {cc.codigo || "Sin código"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">No hay centros de costo configurados.</p>
          )}
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-2">
          <h3 className="text-white font-semibold">Tipos de documento</h3>
          {tiposDocumento.length ? (
            <ul className="space-y-1 text-sm text-gray-200 max-h-64 overflow-auto">
              {tiposDocumento.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between border-b border-gray-700/60 pb-1 last:border-b-0">
                  <span>{doc.nombre}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-200 border border-blue-500/30">{doc.codigo}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">No hay tipos de documento registrados.</p>
          )}
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-2">
          <h3 className="text-white font-semibold">Cuentas globales</h3>
          {cuentasGlobales.length ? (
            <ul className="space-y-1 text-sm text-gray-200 max-h-64 overflow-auto">
              {cuentasGlobales.map((cuenta) => (
                <li key={cuenta.id} className="flex items-center justify-between border-b border-gray-700/60 pb-1 last:border-b-0">
                  <span>{cuenta.codigo}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-200 border border-purple-500/30">
                    {cuenta.tipo}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">No hay cuentas globales definidas.</p>
          )}
        </div>
      </div>
    );
  };

  const tabs = [
    { id: "historial", label: "Historial" },
    { id: "configuraciones", label: "Configuraciones" },
    { id: "rendir", label: "Rendir Gasto" }
  ];

  return (
    <div className={containers.main}>
      {/* Header */}
      <PageHeader cliente={cliente} clienteId={clienteId} loadingCliente={cargandoCliente} />

      <div className={`${containers.content} space-y-6`}>
        <div className="flex flex-wrap gap-3 bg-gray-900/60 border border-gray-800 rounded-lg p-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
                  isActive
                    ? "bg-emerald-600/20 text-emerald-200 border-emerald-500"
                    : "bg-gray-800 text-gray-200 border-gray-700 hover:border-emerald-500/60"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "rendir" && (
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
        )}

        {activeTab === "historial" && <div className="space-y-4">{renderHistorial()}</div>}

        {activeTab === "configuraciones" && <div className="space-y-4">{renderConfiguraciones()}</div>}
      </div>
    </div>
  );
};

export default CapturaMasivaGastos;
