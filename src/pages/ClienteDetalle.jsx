import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { obtenerCliente, obtenerServiciosCliente } from "../api/clientes";
import { BadgeCheck, Loader2, ReceiptText, ShieldOff, Wrench } from "lucide-react";

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
            {servicio.valor && (
              <p className="text-xs text-gray-400 mt-1">
                Valor: {servicio.moneda ? `${servicio.moneda} ` : ""}{servicio.valor}
              </p>
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
      {servicio.valor && (
        <p className="text-xs text-gray-400 mt-1">
          Valor: {servicio.moneda ? `${servicio.moneda} ` : ""}{servicio.valor}
        </p>
      )}
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">Detalle del cliente</p>
          <h1 className="text-3xl font-bold">{cliente.nombre}</h1>
          <p className="text-gray-300 text-sm">RUT: {cliente.rut}</p>
        </div>
        <Link
          to="/menu/clientes"
          className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 text-sm font-semibold"
        >
          ← Volver a clientes
        </Link>
      </div>

      <div className="space-y-4">
        {serviciosOrdenados.length > 0 ? (
          serviciosOrdenados.map((servicio, index) => (
            <ServicioCard
              key={servicio.id ?? `${servicio.nombre}-${index}`}
              servicio={servicio}
              onIrAGastos={() => navigate("/menu/tools/captura-masiva-gastos")}
            />
          ))
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
