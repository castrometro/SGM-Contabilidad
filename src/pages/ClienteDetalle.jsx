import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { obtenerCliente, obtenerServiciosCliente } from "../api/clientes";
import { BadgeCheck, Briefcase, Loader2, ReceiptText, Shield, ShieldOff } from "lucide-react";

const ServicioRow = ({ servicio }) => {
  return (
    <tr className="border-b border-gray-800">
      <td className="p-3 text-white font-semibold">{servicio.nombre}</td>
      <td className="p-3 text-gray-300">{servicio.descripcion || "Servicio asignado"}</td>
      <td className="p-3 text-center">
        <span
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
            servicio.activo !== false
              ? "bg-emerald-500/10 text-emerald-300"
              : "bg-red-500/10 text-red-300"
          }`}
        >
          {servicio.activo !== false ? <BadgeCheck className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
          {servicio.activo !== false ? "Activo" : "Inactivo"}
        </span>
      </td>
    </tr>
  );
};

const RindeGastosCard = ({ onIrAGastos }) => (
  <div className="bg-gray-800 border border-emerald-600/40 rounded-xl p-6 shadow-lg">
    <div className="flex items-center gap-3 mb-3">
      <div className="p-3 rounded-lg bg-emerald-600/20 text-emerald-300">
        <ReceiptText className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-white">RindeGastos habilitado</h3>
        <p className="text-gray-300 text-sm">Captura masiva y contabilización de gastos para este cliente.</p>
      </div>
    </div>
    <div className="flex flex-wrap gap-3">
      <button
        onClick={onIrAGastos}
        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
      >
        Ir a RindeGastos
      </button>
      <span className="inline-flex items-center gap-2 text-sm text-emerald-200">
        <Shield className="w-4 h-4" />
        Acceso restringido por servicio contratado
      </span>
    </div>
  </div>
);

const ClienteDetalle = () => {
  const { clienteId } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarCliente = async () => {
      try {
        setCargando(true);
        const [clienteData, serviciosData] = await Promise.all([
          obtenerCliente(clienteId),
          obtenerServiciosCliente(clienteId)
        ]);
        setCliente(clienteData);
        setServicios(serviciosData);
      } catch (err) {
        console.error("Error cargando cliente", err);
        setError("No se pudo cargar la información del cliente.");
      } finally {
        setCargando(false);
      }
    };

    cargarCliente();
  }, [clienteId]);

  const tieneRindeGastos = useMemo(
    () => servicios?.some((s) => s.nombre?.toLowerCase().includes("rinde")),
    [servicios]
  );

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

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-semibold">Servicios contratados</h2>
        </div>
        {servicios && servicios.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="p-3">Servicio</th>
                  <th className="p-3">Descripción</th>
                  <th className="p-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {servicios.map((servicio) => (
                  <ServicioRow key={servicio.nombre} servicio={servicio} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400">Este cliente no tiene servicios registrados.</p>
        )}
      </div>

      {tieneRindeGastos ? (
        <RindeGastosCard onIrAGastos={() => navigate("/menu/tools/captura-masiva-gastos")} />
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 flex items-start gap-3">
          <ShieldOff className="w-6 h-6 text-red-300 mt-1" />
          <div>
            <h3 className="text-lg font-semibold">RindeGastos no está activo</h3>
            <p className="text-gray-300 text-sm">Habilita el servicio para mostrar la tarjeta y permitir la carga de gastos.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClienteDetalle;
