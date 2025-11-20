import { Link } from "react-router-dom";
import { Users, Building2, ArrowRight } from "lucide-react";

const ClienteListCard = ({ cliente, areaActiva }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300">
          <Users className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-white font-semibold text-lg">{cliente.nombre}</h3>
            <span className="text-xs text-gray-400">ID #{cliente.id}</span>
          </div>
          <p className="text-sm text-gray-300 mb-3">RUT: {cliente.rut}</p>
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {areaActiva || "Área no asignada"}
            </span>
            <Link
              to={`/menu/clientes/${cliente.id}`}
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Ver detalle
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClienteListCard;
