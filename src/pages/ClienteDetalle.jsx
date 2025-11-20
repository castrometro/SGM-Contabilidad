import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { obtenerCliente, obtenerServiciosCliente } from "../api/clientes";
import {
  BadgeCheck,
  Building2,
  Info,
  Loader2,
  ShieldOff,
  Wrench
} from "lucide-react";

const normalizarNombre = (valor = "") => valor.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const isRindeGastos = (servicioNombre = "") => {
  const nombrePlano = normalizarNombre(servicioNombre);
  return nombrePlano.includes("rindegastos") || nombrePlano.startsWith("rinde");
};

const RindeGastosCard = () => (
  <Link
    to="/menu/tools/captura-masiva-gastos"
    className="group bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg flex items-center gap-3 hover:border-emerald-500/60 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
  >
    <div className="p-3 rounded-lg bg-emerald-600/20 group-hover:bg-emerald-600/25 transition-colors">
      <Wrench className="w-6 h-6 text-emerald-400" />
    </div>
    <h3 className="text-xl font-bold text-white">RindeGastos</h3>
  </Link>
);

const ServicioCard = ({ servicio }) => {
  if (isRindeGastos(servicio.nombre)) {
    return <RindeGastosCard />;
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-white leading-tight">{servicio.nombre}</h3>
        <span
          className={`text-[11px] px-2 py-1 rounded-full border uppercase tracking-wide ${
            servicio.activo !== false
              ? "bg-emerald-500/10 text-emerald-200 border-emerald-600/40"
              : "bg-gray-700/60 text-gray-300 border-gray-600"
          }`}
        >
          {servicio.activo !== false ? "Activo" : "Inactivo"}
        </span>
      </div>
      <p className="text-gray-300 text-sm leading-relaxed">
        {servicio.descripcion || "Servicio contratado"}
      </p>
      {servicio.area && <p className="text-xs text-gray-400">Área: {servicio.area}</p>}
    </div>
  );
};

const ClienteDetalle = () => {
  const { clienteId } = useParams();
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
    return [...(servicios ?? [])].sort((a, b) => {
      const activoA = a.activo !== false ? 1 : 0;
      const activoB = b.activo !== false ? 1 : 0;
      if (activoA !== activoB) return activoB - activoA;
      return (a.nombre || "").localeCompare(b.nombre || "");
    });
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
    <div className="text-white space-y-6 animate-page-fade">
      <section className="bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 rounded-xl shadow-xl border border-gray-700/70 overflow-hidden">
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
      </section>

      <section className="space-y-4">
        {serviciosOrdenados.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {serviciosOrdenados.map((servicio, index) => (
              <ServicioCard key={servicio.id ?? `${servicio.nombre}-${index}`} servicio={servicio} />
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
      </section>

      <style>{`
        @keyframes page-fade-in {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-page-fade {
          animation: page-fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ClienteDetalle;
