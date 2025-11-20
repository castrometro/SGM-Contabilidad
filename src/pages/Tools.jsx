import { useNavigate } from "react-router-dom";
import { Receipt } from "lucide-react";
import AreaIndicator from "../components/AreaIndicator";

const ToolCard = ({ title, description, icon: Icon, onClick }) => (
  <div
    className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
    onClick={onClick}
  >
    <div className="flex items-center mb-4">
      <div className="p-3 rounded-lg bg-emerald-600">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="ml-4">
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </div>
  </div>
);

const Tools = () => {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  return (
    <div className="text-white space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">Herramientas</h1>
          <p className="text-gray-400">RindeGastos es el módulo activo para captura y contabilización de gastos.</p>
        </div>
        {usuario?.areas && Array.isArray(usuario.areas) && usuario.areas.length > 0 && (
          <AreaIndicator areas={usuario.areas} size="sm" />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ToolCard
          title="Captura Masiva de Gastos"
          description="Procesar y clasificar gastos desde Excel vía RindeGastos"
          icon={Receipt}
          onClick={() => navigate("/menu/tools/captura-masiva-gastos")}
        />
      </div>

      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
        <h3 className="font-semibold text-blue-400 mb-2">Acceso restringido por servicio</h3>
        <p className="text-gray-300 text-sm">
          Solo los clientes con el servicio RindeGastos activo pueden ejecutar este módulo. Si no ves datos o recibes un error
          de permiso, valida que el servicio esté contratado para tu cliente.
        </p>
      </div>
    </div>
  );
};

export default Tools;
