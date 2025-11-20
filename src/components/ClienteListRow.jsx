import { Link } from "react-router-dom";
import { ArrowRightCircle, CheckCircle2 } from "lucide-react";

const ClienteListRow = ({ cliente }) => {
  return (
    <tr className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
      <td className="p-3 text-white font-medium">{cliente.nombre}</td>
      <td className="p-3 text-gray-300">{cliente.rut}</td>
      <td className="p-3 text-center text-sm text-gray-400">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300">
          <CheckCircle2 className="w-4 h-4" />
          Activo
        </span>
      </td>
      <td className="p-3 text-center">
        <Link
          to={`/menu/clientes/${cliente.id}`}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold"
        >
          Ver cliente
          <ArrowRightCircle className="w-4 h-4" />
        </Link>
      </td>
    </tr>
  );
};

export default ClienteListRow;
