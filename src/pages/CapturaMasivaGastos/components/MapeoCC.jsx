import { AlertTriangle, CheckCircle, Info, Loader2 } from "lucide-react";
import { STYLES_CONFIG } from "../config/capturaConfig";

/**
 * Componente para mostrar el estado del mapeo automático de centros de costos
 */
const MapeoCC = ({
  mostrarMapeoCC,
  centrosCostoDetectados = {}, // Valor por defecto
  estadoMapeoCC
}) => {
  const { alerts } = STYLES_CONFIG;

  if (!mostrarMapeoCC) return null;

  const keysDetectadas = Object.keys(centrosCostoDetectados || {});
  const { estado, faltantes = [], error } = estadoMapeoCC || {};
  const hayFaltantes = faltantes.length > 0;
  const hayDetecciones = keysDetectadas.length > 0;

  return (
    <div className={hayFaltantes ? alerts.warning : alerts.info}>
      <div className="flex items-center gap-2 mb-3">
        {estado === "completo" && <CheckCircle className="w-5 h-5 text-emerald-400" />}
        {estado === "buscando" && <Loader2 className="w-5 h-5 animate-spin text-blue-300" />}
        {estado === "faltantes" && <AlertTriangle className="w-5 h-5 text-yellow-400" />}
        {estado === "error" && <AlertTriangle className="w-5 h-5 text-red-400" />}
        {estado === "sin-detecciones" && <Info className="w-5 h-5 text-blue-300" />}
        <h3 className="font-semibold text-white">Mapeo automático de centros de costo</h3>
      </div>

      {!hayDetecciones && (
        <p className="text-sm text-gray-200">No se detectaron centros de costo en el archivo cargado.</p>
      )}

      {estado === "buscando" && (
        <p className="text-sm text-gray-200">Buscando coincidencias en la base de datos...</p>
      )}

      {estado === "completo" && (
        <p className="text-sm text-emerald-100">Se mapearon automáticamente todos los centros de costo detectados.</p>
      )}

      {estado === "faltantes" && (
        <div className="space-y-2">
          <p className="text-sm text-yellow-100">
            No se pudo mapear automáticamente, falta el centro de costo: {faltantes.join(", ") || "centro de costo faltante"}.
          </p>
          {!!keysDetectadas.length && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-300 font-semibold mb-2">Centros detectados en el Excel</p>
              <ul className="text-xs text-gray-200 space-y-1 list-disc list-inside">
                {keysDetectadas.map((key) => {
                  const info = centrosCostoDetectados[key];
                  const nombre = info?.nombre || key;
                  const posicion = typeof info?.posicion === "number" ? ` (columna ${info.posicion + 1})` : "";
                  const esFaltante = faltantes.includes(nombre);

                  return (
                    <li key={key} className={esFaltante ? "text-yellow-200" : "text-emerald-100"}>
                      {nombre}
                      {posicion}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {estado === "error" && (
        <p className="text-sm text-red-200">{error || "No se pudo mapear los centros de costo"}</p>
      )}
    </div>
  );
};

export default MapeoCC;
