import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { CAPTURA_CONFIG, STYLES_CONFIG } from "../config/capturaConfig";

/**
 * Componente header de la página de captura masiva
 */
const PageHeader = ({ cliente, clienteId, loadingCliente }) => {
  const navigate = useNavigate();
  const { page } = CAPTURA_CONFIG;
  const { containers, buttons } = STYLES_CONFIG;
  const Icon = page.icon;

  const handleBack = () => {
    if (clienteId) {
      navigate(`/menu/clientes/${clienteId}`);
      return;
    }
    navigate(-1);
  };

  return (
    <div className={containers.header}>
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <button onClick={handleBack} className={buttons.back} aria-label="Volver a cliente">
              <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-600 rounded-lg shadow-lg shadow-emerald-900/50">
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-emerald-200/80">Módulo</p>
                  <h1 className="text-3xl font-bold leading-tight">{page.title}</h1>
                  <p className="text-gray-300 text-sm">{page.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-sm">
                <span className="px-3 py-1 rounded-full bg-gray-900/70 border border-gray-700 text-gray-200">
                  Cliente: {cliente?.nombre || (loadingCliente ? "Cargando..." : "Sin especificar")}
                </span>
                {cliente?.rut && (
                  <span className="px-3 py-1 rounded-full bg-gray-900/70 border border-gray-700 text-gray-200">RUT: {cliente.rut}</span>
                )}
                {(cliente?.industria_nombre || cliente?.industria) && (
                  <span className="px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700 text-blue-100">
                    Industria: {cliente.industria_nombre || cliente.industria}
                  </span>
                )}
                {clienteId && (
                  <span className="px-3 py-1 rounded-full bg-gray-900/70 border border-gray-800 text-gray-300">
                    ID #{clienteId}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
