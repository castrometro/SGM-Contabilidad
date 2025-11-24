import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useCapturaGastos } from "./hooks/useCapturaGastos";
import { useAuth } from "../../hooks/useAuth";
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
  checkRindeGastosSalud,
  obtenerCentrosCosto,
  obtenerCuentasGlobales,
  obtenerRendiciones,
  obtenerTiposDocumento,
  crearCentroCosto,
  actualizarCentroCosto,
  eliminarCentroCosto,
  crearTipoDocumento,
  actualizarTipoDocumento,
  eliminarTipoDocumento,
  crearCuentaGlobal,
  actualizarCuentaGlobal,
  eliminarCuentaGlobal
} from "../../api/rindeGastos";

const normalizarNombre = (valor = "") => valor.toString().normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const esServicioRindegastos = (nombre = "") => {
  const nombrePlano = normalizarNombre(nombre);
  return nombrePlano.includes("rindegastos") || nombrePlano.startsWith("rinde");
};

/**
 * Modal component for displaying forms and dialogs
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Function to call when closing the modal
 * @param {string} title - Modal title displayed in the header
 * @param {React.ReactNode} children - Modal content
 */
const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    // Focus trap: find all focusable elements
    const modal = document.querySelector('[role="dialog"]');
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element when modal opens
    firstElement?.focus();

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 id="modal-title" className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
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
const TIPOS_CUENTA_GLOBAL = [
  { value: "IVA", label: "Iva" },
  { value: "GASTO", label: "Gasto" },
  { value: "PROVEEDOR", label: "Proveedor" }
];

const CapturaMasivaGastos = () => {
  const { clienteId } = useParams();
  const { usuario } = useAuth();
  const [cliente, setCliente] = useState(null);
  const [cargandoCliente, setCargandoCliente] = useState(false);
  const [clienteServicioId, setClienteServicioId] = useState(null);
  const [cargandoServicio, setCargandoServicio] = useState(false);
  const [servicioNoDisponible, setServicioNoDisponible] = useState(false);
  const [errorServicio, setErrorServicio] = useState("");
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
    setMapeoCC,
    setError
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
  const [centroForm, setCentroForm] = useState({ apodo: "", codigo: "", activo: true });
  const [tipoDocForm, setTipoDocForm] = useState({ nombre: "", codigo: "" });
  const [cuentaGlobalForm, setCuentaGlobalForm] = useState({ codigo: "", tipo: "" });
  const [editingCentroId, setEditingCentroId] = useState(null);
  const [editingTipoId, setEditingTipoId] = useState(null);
  const [editingCuentaId, setEditingCuentaId] = useState(null);
  const [estadoGuardado, setEstadoGuardado] = useState({
    centros: { guardando: false, mensaje: "", error: "" },
    tipos: { guardando: false, mensaje: "", error: "" },
    cuentas: { guardando: false, mensaje: "", error: "" }
  });
  const [configSection, setConfigSection] = useState("centros");
  
  // Estados para modales y búsqueda
  const [modalCentroAbierto, setModalCentroAbierto] = useState(false);
  const [modalTipoAbierto, setModalTipoAbierto] = useState(false);
  const [modalCuentaAbierto, setModalCuentaAbierto] = useState(false);
  const [busquedaCentros, setBusquedaCentros] = useState("");
  const [busquedaTipos, setBusquedaTipos] = useState("");
  const [busquedaCuentas, setBusquedaCuentas] = useState("");

  const { containers, buttons, alerts } = STYLES_CONFIG;
  const { steps } = CAPTURA_CONFIG;

  useEffect(() => {
    let active = true;

    const verificarSaludServicio = async () => {
      if (!clienteId) return;
      try {
        await checkRindeGastosSalud();
        if (!active) return;
        setServicioNoDisponible(false);
        setErrorServicio("");
      } catch (error) {
        console.error("RindeGastos no disponible", error);
        if (!active) return;
        setServicioNoDisponible(true);
        setErrorServicio(error.message || "Servicio no disponible");
      }
    };

    verificarSaludServicio();

    return () => {
      active = false;
    };
  }, [clienteId]);

  useEffect(() => {
    let active = true;

    const cargarContextoCliente = async () => {
      if (!clienteId) {
        setCliente(null);
        setClienteServicioId(null);
        setServicioNoDisponible(false);
        setErrorServicio("");
        return;
      }

      try {
        setCargandoCliente(true);
        setCargandoServicio(true);

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
            setErrorServicio("No se encontró el servicio RindeGastos para este cliente.");
          }
        }
      } catch (err) {
        console.error("No se pudo cargar el cliente o servicios", err);
        if (active) {
          setCliente(null);
          setClienteServicioId(null);
          setServicioNoDisponible(true);
          setErrorServicio("No se pudo cargar la información del cliente o sus servicios.");
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
      if (!clienteServicioId || servicioNoDisponible) return;
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
  }, [activeTab, clienteServicioId, historialCargado, servicioNoDisponible]);

  const actualizarEstadoGuardado = (section, updates) => {
    setEstadoGuardado((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...updates
      }
    }));
  };

  const limpiarMensajes = (section) => {
    actualizarEstadoGuardado(section, { mensaje: "", error: "" });
  };

  const cargarCentrosCosto = useCallback(async () => {
    if (!clienteServicioId || servicioNoDisponible) return;
    const centros = await obtenerCentrosCosto(clienteServicioId);
    setConfiguracion((prev) => ({
      ...prev,
      centrosCosto: Array.isArray(centros) ? centros : []
    }));
  }, [clienteServicioId, servicioNoDisponible]);

  const cargarTiposDocumento = useCallback(async () => {
    if (!clienteServicioId || servicioNoDisponible) return;
    const tipos = await obtenerTiposDocumento(clienteServicioId);
    setConfiguracion((prev) => ({
      ...prev,
      tiposDocumento: Array.isArray(tipos) ? tipos : []
    }));
  }, [clienteServicioId, servicioNoDisponible]);

  const cargarCuentasGlobales = useCallback(async () => {
    if (!clienteServicioId || servicioNoDisponible) return;
    const cuentas = await obtenerCuentasGlobales(clienteServicioId);
    setConfiguracion((prev) => ({
      ...prev,
      cuentasGlobales: Array.isArray(cuentas) ? cuentas : []
    }));
  }, [clienteServicioId, servicioNoDisponible]);

  const cargarConfiguracion = useCallback(async () => {
    if (!clienteServicioId || servicioNoDisponible) return;
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
  }, [clienteServicioId, servicioNoDisponible]);

  useEffect(() => {
    if (activeTab === "configuraciones" && !configuracionCargada) {
      cargarConfiguracion();
    }
  }, [activeTab, configuracionCargada, cargarConfiguracion]);

  const accionesBackendDeshabilitadas = servicioNoDisponible;

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

  const puedeEditarConfiguracion = true;

  const resetForms = (section = null) => {
    if (!section || section === "centros") {
      setCentroForm({ apodo: "", codigo: "", activo: true });
      setEditingCentroId(null);
      limpiarMensajes("centros");
    }
    if (!section || section === "tipos") {
      setTipoDocForm({ nombre: "", codigo: "" });
      setEditingTipoId(null);
      limpiarMensajes("tipos");
    }
    if (!section || section === "cuentas") {
      setCuentaGlobalForm({ codigo: "", tipo: "" });
      setEditingCuentaId(null);
      limpiarMensajes("cuentas");
    }
  };

  const handleGuardarCentro = async (e) => {
    e.preventDefault();
    if (!clienteServicioId || accionesBackendDeshabilitadas) {
      actualizarEstadoGuardado("centros", {
        error: "Servicio RindeGastos no disponible, contactar con el administrador.",
        mensaje: ""
      });
      return;
    }
    try {
      actualizarEstadoGuardado("centros", { guardando: true, error: "", mensaje: "" });
      const payload = {
        apodo: centroForm.apodo,
        codigo: centroForm.codigo,
        activo: Boolean(centroForm.activo)
      };
      if (editingCentroId) {
        await actualizarCentroCosto(editingCentroId, payload, clienteServicioId);
      } else {
        await crearCentroCosto(clienteServicioId, payload);
      }
      actualizarEstadoGuardado("centros", { mensaje: "Centro de costo guardado correctamente" });
      resetForms("centros");
      await cargarCentrosCosto();
      cerrarModales();
    } catch (error) {
      console.error("Error guardando centro de costo", error);
      actualizarEstadoGuardado("centros", {
        error: error.message || "No se pudo guardar el centro de costo"
      });
    } finally {
      actualizarEstadoGuardado("centros", { guardando: false });
    }
  };

  const handleGuardarTipo = async (e) => {
    e.preventDefault();
    if (!clienteServicioId || accionesBackendDeshabilitadas) {
      actualizarEstadoGuardado("tipos", {
        error: "Servicio RindeGastos no disponible, contactar con el administrador.",
        mensaje: ""
      });
      return;
    }
    try {
      actualizarEstadoGuardado("tipos", { guardando: true, error: "", mensaje: "" });
      const payload = { nombre: tipoDocForm.nombre, codigo: tipoDocForm.codigo };
      if (editingTipoId) {
        await actualizarTipoDocumento(editingTipoId, payload, clienteServicioId);
      } else {
        await crearTipoDocumento(clienteServicioId, payload);
      }
      actualizarEstadoGuardado("tipos", { mensaje: "Tipo de documento guardado" });
      resetForms("tipos");
      await cargarTiposDocumento();
      cerrarModales();
    } catch (error) {
      console.error("Error guardando tipo de documento", error);
      actualizarEstadoGuardado("tipos", {
        error: error.message || "No se pudo guardar el tipo de documento"
      });
    } finally {
      actualizarEstadoGuardado("tipos", { guardando: false });
    }
  };

  const handleGuardarCuenta = async (e) => {
    e.preventDefault();
    if (!clienteServicioId || accionesBackendDeshabilitadas) {
      actualizarEstadoGuardado("cuentas", {
        error: "Servicio RindeGastos no disponible, contactar con el administrador.",
        mensaje: ""
      });
      return;
    }
    try {
      actualizarEstadoGuardado("cuentas", { guardando: true, error: "", mensaje: "" });
      const payload = {
        codigo: cuentaGlobalForm.codigo,
        tipo: cuentaGlobalForm.tipo
      };
      if (editingCuentaId) {
        await actualizarCuentaGlobal(editingCuentaId, payload, clienteServicioId);
      } else {
        await crearCuentaGlobal(clienteServicioId, payload);
      }
      actualizarEstadoGuardado("cuentas", { mensaje: "Cuenta global guardada" });
      resetForms("cuentas");
      await cargarCuentasGlobales();
      cerrarModales();
    } catch (error) {
      console.error("Error guardando cuenta global", error);
      actualizarEstadoGuardado("cuentas", {
        error: error.message || "No se pudo guardar la cuenta global"
      });
    } finally {
      actualizarEstadoGuardado("cuentas", { guardando: false });
    }
  };

  const handleEliminarCentro = async (id) => {
    if (!clienteServicioId) return;
    const centro = configuracion.centrosCosto.find((item) => item.id === id);
    const confirmDelete = window.confirm(
      `¿Eliminar el centro de costo ${centro?.apodo || "seleccionado"}?`
    );
    if (!confirmDelete) return;

    try {
      actualizarEstadoGuardado("centros", { guardando: true, mensaje: "", error: "" });
      await eliminarCentroCosto(id, clienteServicioId);
      if (editingCentroId === id) {
        setCentroForm({ apodo: "", codigo: "", activo: true });
        setEditingCentroId(null);
      }
      actualizarEstadoGuardado("centros", { mensaje: "Centro de costo eliminado correctamente" });
      await cargarCentrosCosto();
    } catch (error) {
      console.error("Error eliminando centro de costo", error);
      actualizarEstadoGuardado("centros", {
        error: error.message || "No se pudo eliminar el centro de costo"
      });
    } finally {
      actualizarEstadoGuardado("centros", { guardando: false });
    }
  };

  const handleEliminarTipo = async (id) => {
    if (!clienteServicioId) return;
    const tipo = configuracion.tiposDocumento.find((item) => item.id === id);
    const confirmDelete = window.confirm(
      `¿Eliminar el tipo de documento ${tipo?.nombre || "seleccionado"}?`
    );
    if (!confirmDelete) return;

    try {
      actualizarEstadoGuardado("tipos", { guardando: true, mensaje: "", error: "" });
      await eliminarTipoDocumento(id, clienteServicioId);
      if (editingTipoId === id) {
        setTipoDocForm({ nombre: "", codigo: "" });
        setEditingTipoId(null);
      }
      actualizarEstadoGuardado("tipos", { mensaje: "Tipo de documento eliminado correctamente" });
      await cargarTiposDocumento();
    } catch (error) {
      console.error("Error eliminando tipo de documento", error);
      actualizarEstadoGuardado("tipos", {
        error: error.message || "No se pudo eliminar el tipo de documento"
      });
    } finally {
      actualizarEstadoGuardado("tipos", { guardando: false });
    }
  };

  const handleEliminarCuenta = async (id) => {
    if (!clienteServicioId) return;
    const cuenta = configuracion.cuentasGlobales.find((item) => item.id === id);
    const confirmDelete = window.confirm(
      `¿Eliminar la cuenta global ${cuenta?.codigo || "seleccionada"}?`
    );
    if (!confirmDelete) return;

    try {
      actualizarEstadoGuardado("cuentas", { guardando: true, mensaje: "", error: "" });
      await eliminarCuentaGlobal(id, clienteServicioId);
      if (editingCuentaId === id) {
        setCuentaGlobalForm({ codigo: "", tipo: "" });
        setEditingCuentaId(null);
      }
      actualizarEstadoGuardado("cuentas", { mensaje: "Cuenta global eliminada correctamente" });
      await cargarCuentasGlobales();
    } catch (error) {
      console.error("Error eliminando cuenta global", error);
      actualizarEstadoGuardado("cuentas", {
        error: error.message || "No se pudo eliminar la cuenta global"
      });
    } finally {
      actualizarEstadoGuardado("cuentas", { guardando: false });
    }
  };

  const abrirModalCentro = (centro = null) => {
    if (centro) {
      setCentroForm({ apodo: centro.apodo || "", codigo: centro.codigo || "", activo: centro.activo });
      setEditingCentroId(centro.id);
    } else {
      setCentroForm({ apodo: "", codigo: "", activo: true });
      setEditingCentroId(null);
    }
    limpiarMensajes("centros");
    setModalCentroAbierto(true);
  };

  const abrirModalTipo = (tipo = null) => {
    if (tipo) {
      setTipoDocForm({ nombre: tipo.nombre || "", codigo: tipo.codigo || "" });
      setEditingTipoId(tipo.id);
    } else {
      setTipoDocForm({ nombre: "", codigo: "" });
      setEditingTipoId(null);
    }
    limpiarMensajes("tipos");
    setModalTipoAbierto(true);
  };

  const abrirModalCuenta = (cuenta = null) => {
    if (cuenta) {
      setCuentaGlobalForm({ codigo: cuenta.codigo || "", tipo: cuenta.tipo });
      setEditingCuentaId(cuenta.id);
    } else {
      setCuentaGlobalForm({ codigo: "", tipo: "" });
      setEditingCuentaId(null);
    }
    limpiarMensajes("cuentas");
    setModalCuentaAbierto(true);
  };

  const cerrarModales = () => {
    setModalCentroAbierto(false);
    setModalTipoAbierto(false);
    setModalCuentaAbierto(false);
    setEditingCentroId(null);
    setEditingTipoId(null);
    setEditingCuentaId(null);
  };

  const renderConfiguraciones = () => {
    const guardandoCentros = estadoGuardado.centros.guardando;
    const guardandoTipos = estadoGuardado.tipos.guardando;
    const guardandoCuentas = estadoGuardado.cuentas.guardando;

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

    // Filtrar datos según búsqueda
    const centrosFiltrados = centrosCosto.filter((c) =>
      c.apodo?.toLowerCase().includes(busquedaCentros.toLowerCase()) ||
      c.codigo?.toLowerCase().includes(busquedaCentros.toLowerCase())
    );

    const tiposFiltrados = tiposDocumento.filter((t) =>
      t.nombre?.toLowerCase().includes(busquedaTipos.toLowerCase()) ||
      t.codigo?.toLowerCase().includes(busquedaTipos.toLowerCase())
    );

    const cuentasFiltradas = cuentasGlobales.filter((c) =>
      c.codigo?.toLowerCase().includes(busquedaCuentas.toLowerCase()) ||
      c.tipo?.toLowerCase().includes(busquedaCuentas.toLowerCase())
    );

    const seccionesConfiguracion = {
      centros: {
        label: "Centros de costo",
        description: "Define los centros que usas para imputar los gastos."
      },
      tipos: {
        label: "Tipos de documento",
        description: "Administra los documentos válidos para rendir."
      },
      cuentas: {
        label: "Cuentas globales",
        description: "Mantén las cuentas contables disponibles."
      }
    };

    const renderMensajesSeccion = (sectionKey) => {
      const { mensaje, error } = estadoGuardado[sectionKey];

      return (
        <>
          {mensaje && (
            <div className="bg-emerald-900/30 border border-emerald-700 text-emerald-100 rounded-md px-4 py-3 text-sm mb-3">
              {mensaje}
            </div>
          )}
          {error && <div className="mb-3"><ErrorSection error={error} /></div>}
        </>
      );
    };

    const renderSeccionActual = () => {
      if (configSection === "centros") {
        return (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-4">
            {renderMensajesSeccion("centros")}
            
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <label htmlFor="busqueda-centros" className="sr-only">
                Buscar centros de costo
              </label>
              <input
                id="busqueda-centros"
                type="text"
                placeholder="Buscar por nombre o código..."
                value={busquedaCentros}
                onChange={(e) => setBusquedaCentros(e.target.value)}
                className="flex-1 min-w-[200px] bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-500"
              />
              <button
                onClick={() => abrirModalCentro()}
                className={`${buttons.primary} text-sm px-4 py-2`}
              >
                + Crear Centro
              </button>
            </div>

            {centrosFiltrados.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-gray-900/60 text-gray-400">
                    <tr>
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Código</th>
                      <th className="px-4 py-3">Activo</th>
                      <th className="px-4 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {centrosFiltrados.map((cc) => (
                      <tr key={cc.id} className="border-b border-gray-700 hover:bg-gray-900/40">
                        <td className="px-4 py-3 text-white font-medium">{cc.apodo}</td>
                        <td className="px-4 py-3 text-gray-300">{cc.codigo || "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded ${cc.activo ? "bg-emerald-500/10 text-emerald-200" : "bg-gray-700 text-gray-300"}`}>
                            {cc.activo ? "Sí" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => abrirModalCentro(cc)}
                              className="text-xs text-emerald-300 hover:text-emerald-200 underline"
                              disabled={guardandoCentros}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleEliminarCentro(cc.id)}
                              className="text-xs text-red-300 hover:text-red-200 underline"
                              disabled={guardandoCentros}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">
                {busquedaCentros ? "No se encontraron centros de costo con ese criterio" : "No hay centros de costo configurados"}
              </p>
            )}
          </div>
        );
      }

      if (configSection === "tipos") {
        return (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-4">
            {renderMensajesSeccion("tipos")}
            
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <label htmlFor="busqueda-tipos" className="sr-only">
                Buscar tipos de documento
              </label>
              <input
                id="busqueda-tipos"
                type="text"
                placeholder="Buscar por nombre o código..."
                value={busquedaTipos}
                onChange={(e) => setBusquedaTipos(e.target.value)}
                className="flex-1 min-w-[200px] bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-500"
              />
              <button
                onClick={() => abrirModalTipo()}
                className={`${buttons.primary} text-sm px-4 py-2`}
              >
                + Crear Tipo
              </button>
            </div>

            {tiposFiltrados.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-gray-900/60 text-gray-400">
                    <tr>
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Código</th>
                      <th className="px-4 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiposFiltrados.map((doc) => (
                      <tr key={doc.id} className="border-b border-gray-700 hover:bg-gray-900/40">
                        <td className="px-4 py-3 text-white font-medium">{doc.nombre}</td>
                        <td className="px-4 py-3 text-gray-300">{doc.codigo}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => abrirModalTipo(doc)}
                              className="text-xs text-blue-300 hover:text-blue-200 underline"
                              disabled={guardandoTipos}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleEliminarTipo(doc.id)}
                              className="text-xs text-red-300 hover:text-red-200 underline"
                              disabled={guardandoTipos}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">
                {busquedaTipos ? "No se encontraron tipos de documento con ese criterio" : "No hay tipos de documento registrados"}
              </p>
            )}
          </div>
        );
      }

      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-4">
          {renderMensajesSeccion("cuentas")}
          
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <label htmlFor="busqueda-cuentas" className="sr-only">
              Buscar cuentas globales
            </label>
            <input
              id="busqueda-cuentas"
              type="text"
              placeholder="Buscar por código o tipo..."
              value={busquedaCuentas}
              onChange={(e) => setBusquedaCuentas(e.target.value)}
              className="flex-1 min-w-[200px] bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-500"
            />
            <button
              onClick={() => abrirModalCuenta()}
              className={`${buttons.primary} text-sm px-4 py-2`}
            >
              + Crear Cuenta
            </button>
          </div>

          {cuentasFiltradas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-gray-900/60 text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cuentasFiltradas.map((cuenta) => (
                    <tr key={cuenta.id} className="border-b border-gray-700 hover:bg-gray-900/40">
                      <td className="px-4 py-3 text-white font-medium">{cuenta.codigo}</td>
                      <td className="px-4 py-3 text-gray-300">{cuenta.tipo}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => abrirModalCuenta(cuenta)}
                            className="text-xs text-purple-300 hover:text-purple-200 underline"
                            disabled={guardandoCuentas}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleEliminarCuenta(cuenta.id)}
                            className="text-xs text-red-300 hover:text-red-200 underline"
                            disabled={guardandoCuentas}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">
              {busquedaCuentas ? "No se encontraron cuentas globales con ese criterio" : "No hay cuentas globales definidas"}
            </p>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-3 flex flex-wrap gap-3">
          {Object.entries(seccionesConfiguracion).map(([key, data]) => (
            <button
              key={key}
              onClick={() => setConfigSection(key)}
              className={`max-w-xs min-w-[200px] text-left px-4 py-3 rounded-md border transition ${
                configSection === key
                  ? "bg-emerald-600/20 border-emerald-500 text-white"
                  : "bg-gray-900/60 border-gray-800 text-gray-300 hover:border-emerald-700/40"
              }`}
              type="button"
            >
              <div>
                <p className="text-sm font-semibold">{data.label}</p>
                <p className="text-xs text-gray-400">{data.description}</p>
              </div>
            </button>
          ))}
        </div>

        {renderSeccionActual()}

        {/* Modales */}
        <Modal
          isOpen={modalCentroAbierto}
          onClose={() => { cerrarModales(); resetForms("centros"); }}
          title={editingCentroId ? "Editar Centro de Costo" : "Crear Centro de Costo"}
        >
          <form className="space-y-4" onSubmit={handleGuardarCentro}>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nombre / apodo</label>
              <input
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100"
                value={centroForm.apodo}
                onChange={(e) => setCentroForm({ ...centroForm, apodo: e.target.value })}
                disabled={guardandoCentros}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Código</label>
              <input
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100"
                value={centroForm.codigo}
                onChange={(e) => setCentroForm({ ...centroForm, codigo: e.target.value })}
                disabled={guardandoCentros}
                placeholder="Ej: CC-001"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={centroForm.activo}
                onChange={(e) => setCentroForm({ ...centroForm, activo: e.target.checked })}
                disabled={guardandoCentros}
                className="h-4 w-4 text-emerald-500"
              />
              Activo
            </label>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { cerrarModales(); resetForms("centros"); }}
                className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded"
                disabled={guardandoCentros}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardandoCentros}
                className={`px-4 py-2 text-sm ${buttons.primary} ${guardandoCentros ? buttons.disabled : ""}`}
              >
                {guardandoCentros ? "Guardando..." : editingCentroId ? "Actualizar" : "Crear"}
              </button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={modalTipoAbierto}
          onClose={() => { cerrarModales(); resetForms("tipos"); }}
          title={editingTipoId ? "Editar Tipo de Documento" : "Crear Tipo de Documento"}
        >
          <form className="space-y-4" onSubmit={handleGuardarTipo}>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nombre</label>
              <input
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100"
                value={tipoDocForm.nombre}
                onChange={(e) => setTipoDocForm({ ...tipoDocForm, nombre: e.target.value })}
                disabled={guardandoTipos}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Código</label>
              <input
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100"
                value={tipoDocForm.codigo}
                onChange={(e) => setTipoDocForm({ ...tipoDocForm, codigo: e.target.value })}
                disabled={guardandoTipos}
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { cerrarModales(); resetForms("tipos"); }}
                className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded"
                disabled={guardandoTipos}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardandoTipos}
                className={`px-4 py-2 text-sm ${buttons.primary} ${guardandoTipos ? buttons.disabled : ""}`}
              >
                {guardandoTipos ? "Guardando..." : editingTipoId ? "Actualizar" : "Crear"}
              </button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={modalCuentaAbierto}
          onClose={() => { cerrarModales(); resetForms("cuentas"); }}
          title={editingCuentaId ? "Editar Cuenta Global" : "Crear Cuenta Global"}
        >
          <form className="space-y-4" onSubmit={handleGuardarCuenta}>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Código</label>
              <input
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100"
                value={cuentaGlobalForm.codigo}
                onChange={(e) => setCuentaGlobalForm({ ...cuentaGlobalForm, codigo: e.target.value })}
                disabled={guardandoCuentas}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tipo</label>
              <select
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100"
                value={cuentaGlobalForm.tipo}
                onChange={(e) => setCuentaGlobalForm({ ...cuentaGlobalForm, tipo: e.target.value })}
                disabled={guardandoCuentas}
                required
              >
                <option value="" disabled>
                  Selecciona un tipo
                </option>
                {TIPOS_CUENTA_GLOBAL.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { cerrarModales(); resetForms("cuentas"); }}
                className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded"
                disabled={guardandoCuentas}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardandoCuentas}
                className={`px-4 py-2 text-sm ${buttons.primary} ${guardandoCuentas ? buttons.disabled : ""}`}
              >
                {guardandoCuentas ? "Guardando..." : editingCuentaId ? "Actualizar" : "Crear"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  };

  const tabs = [
    { id: "historial", label: "Historial" },
    { id: "configuraciones", label: "Configuraciones" },
    { id: "rendir", label: "Rendir Gasto" }
  ];

  const handleArchivoSeleccionadoSeguro = (event) => {
    if (accionesBackendDeshabilitadas) {
      setError("Servicio RindeGastos no disponible, contactar con el administrador.");
      return;
    }
    handleArchivoSeleccionado(event);
  };

  const procesarArchivoSeguro = async () => {
    if (accionesBackendDeshabilitadas) {
      setError("Servicio RindeGastos no disponible, contactar con el administrador.");
      return;
    }
    await procesarArchivo();
  };

  const descargarArchivoSeguro = async () => {
    if (accionesBackendDeshabilitadas) {
      setError("Servicio RindeGastos no disponible, contactar con el administrador.");
      return;
    }
    await descargarArchivo();
  };

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
              {servicioNoDisponible && (
                <div className="bg-amber-900/30 border border-amber-700 text-amber-100 rounded-md px-4 py-3 text-sm">
                  <p className="font-semibold">Servicio no disponible, contactar con el administrador.</p>
                  {errorServicio && <p className="text-amber-50/80 text-xs mt-1">Detalle: {errorServicio}</p>}
                </div>
              )}

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
                  onArchivoSeleccionado={handleArchivoSeleccionadoSeguro}
                  onLimpiarArchivo={limpiarArchivo}
                  onProcesar={procesarArchivoSeguro}
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
                    onClick={procesarArchivoSeguro}
                    disabled={!archivo || procesando || accionesBackendDeshabilitadas}
                    className={`w-full ${buttons.secondary} ${(!archivo || procesando || accionesBackendDeshabilitadas) ? buttons.disabled : ""}`}
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
                  onDescargar={descargarArchivoSeguro}
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
