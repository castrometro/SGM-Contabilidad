import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { obtenerCliente, obtenerServiciosCliente } from "../api/clientes";
import {
  BadgeCheck,
  Building2,
  Info,
  Loader2,
  ReceiptText,
  ShieldOff,
  Wrench
} from "lucide-react";

const RindeGastosCard = ({ servicio, onIrAGastos }) => {
  const esActivo = servicio.activo !== false;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg transition-colors hover:border-gray-600">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-lg bg-emerald-600/20">
            <Wrench className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">Servicio contratado</p>
            <h3 className="text-xl font-bold text-white">RindeGastos</h3>
            <p className="text-gray-300 text-sm">
              {servicio.descripcion || "Captura y procesamiento de gastos"}
            </p>
            {servicio.area && (
              <p className="text-xs text-gray-400 mt-1">Área: {servicio.area}</p>
            )}
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full font-semibold ${
            esActivo ? "bg-emerald-500/10 text-emerald-200" : "bg-red-500/10 text-red-200"
          }`}
        >
          {esActivo ? <BadgeCheck className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
          {esActivo ? "Servicio activo" : "Servicio inactivo"}
        </span>
      </div>
      <div className="flex flex-wrap gap-3 items-center mt-4">
        <button
          onClick={onIrAGastos}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors disabled:opacity-60"
          disabled={!esActivo}
        >
          Ir a RindeGastos
        </button>
        <span className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-200">
          <ReceiptText className="w-4 h-4" />
          Captura masiva y contabilización
        </span>
      </div>
    </div>
  );
};

const ServicioCard = ({ servicio, onIrAGastos }) => {
  const nombre = servicio.nombre?.toLowerCase() || "";

  if (nombre.includes("rindegastos") || nombre.includes("rinde")) {
    return <RindeGastosCard servicio={servicio} onIrAGastos={onIrAGastos} />;
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-white">{servicio.nombre}</h3>
      <p className="text-gray-300 text-sm mt-2">{servicio.descripcion || "Servicio contratado"}</p>
      {servicio.area && <p className="text-xs text-gray-400 mt-2">Área: {servicio.area}</p>}
    </div>
  );
};

const ClienteDetalle = () => {
  const { clienteId } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const normalizarServicios = useCallback((data) => {
    if (!data) return [];

    const baseItems = Array.isArray(data) ? data : [data];
    const serviciosCliente = baseItems.flatMap((item) => item?.servicios_contratados ?? item);

    return serviciosCliente
      .filter(Boolean)
      .map((servicio, index) => ({
        id: servicio.id ?? servicio.servicio_id ?? index,
        nombre: servicio.servicio_nombre || servicio.nombre || servicio.servicio?.nombre || "Servicio",
        descripcion: servicio.descripcion,
        area: servicio.area_nombre || servicio.servicio?.area?.nombre,
        valor: servicio.valor,
        moneda: servicio.moneda,
        activo: servicio.activo
      }));
  }, []);

  useEffect(() => {
    const cargarCliente = async () => {
      try {
        setCargando(true);
        const [clienteData, serviciosData] = await Promise.all([
          obtenerCliente(clienteId),
          obtenerServiciosCliente(clienteId)
        ]);
        setCliente(clienteData);
        setServicios(normalizarServicios(serviciosData));
      } catch (err) {
        console.error("Error cargando cliente", err);
        setError("No se pudo cargar la información del cliente.");
      } finally {
        setCargando(false);
      }
    };

    cargarCliente();
  }, [clienteId, normalizarServicios]);

  const serviciosOrdenados = useMemo(() => {
    return [...(servicios ?? [])].sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  }, [servicios]);

  const totalServicios = serviciosOrdenados.length;
  const serviciosActivos = serviciosOrdenados.filter((servicio) => servicio.activo !== false).length;
  const serviciosInactivos = totalServicios - serviciosActivos;

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64 text-white gap-3">
        <Loader2 className="w-6 h-6 animate-spin" /> Cargando cliente...
      </div>
    );
  }

  if (error || !cliente) {
    return (
      <div className="text-center text-red-400 bg-red-900/20 border border-red-700 rounded-lg p-6">
        {error || "Cliente no encontrado"}
      </div>
    );
  }

  return (
    <div className="text-white space-y-6">
      <div className="bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 rounded-xl shadow-xl border border-gray-700/70 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600/15 via-blue-600/10 to-indigo-600/15 p-6 border-b border-gray-700/60">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Detalle del cliente</p>
                <h1 className="text-3xl font-bold leading-tight">{cliente.nombre}</h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-300 mt-2">
                  <span className="px-3 py-1 rounded-full bg-gray-900/50 border border-gray-700/70">RUT: {cliente.rut}</span>
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-200 border border-blue-500/30">
                    Industria: {cliente.industria_nombre || cliente.industria || "Sin especificar"}
                  </span>
                </div>
              </div>
            </div>
            <Link
              to="/menu/clientes"
              className="px-4 py-2 rounded-lg bg-gray-900/70 border border-gray-700 hover:border-gray-500 text-sm font-semibold h-fit"
            >
              ← Volver a clientes
            </Link>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/70 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              <BadgeCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Servicios activos</p>
              <p className="text-2xl font-bold text-white tabular-nums">{serviciosActivos}</p>
            </div>
          </div>

          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/70 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/30">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Servicios totales</p>
              <p className="text-2xl font-bold text-white tabular-nums">{totalServicios}</p>
            </div>
          </div>

          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/70 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-300 border border-red-500/30">
              <ShieldOff className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Servicios inactivos</p>
              <p className="text-2xl font-bold text-white tabular-nums">{Math.max(serviciosInactivos, 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {serviciosOrdenados.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {serviciosOrdenados.map((servicio, index) => (
              <ServicioCard
                key={servicio.id ?? `${servicio.nombre}-${index}`}
                servicio={servicio}
                onIrAGastos={() => navigate("/menu/tools/captura-masiva-gastos")}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 flex items-start gap-3">
            <ShieldOff className="w-6 h-6 text-red-300 mt-1" />
            <div>
              <h3 className="text-lg font-semibold">Sin servicios contratados</h3>
              <p className="text-gray-300 text-sm">Este cliente aún no tiene módulos habilitados.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClienteDetalle;
