import { CheckCircle, Info } from "lucide-react";
import { CAPTURA_CONFIG, STYLES_CONFIG } from "../config/capturaConfig";

/**
 * Componente para mostrar los resultados del procesamiento
 * TEMPORALMENTE SIMPLIFICADO - Solo muestra el botón de descarga
 */
const ResultsSection = ({ resultados, onDescargar, showPlaceholder = false, showTitle = true, useContainer = true }) => {
  const { containers, buttons } = STYLES_CONFIG;

  if (!resultados && !showPlaceholder) return null;

  const Wrapper = ({ children }) => (useContainer ? (
    <div className={containers.section}>{children}</div>
  ) : (
    <>{children}</>
  ));

  // Solo mostrar el botón de descarga por ahora
  return (
    <Wrapper>
      {showTitle && (
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Resultados del Procesamiento
        </h2>
      )}
      
      {resultados ? (
        <>
          <p className="text-gray-300 mb-4">
            Archivo procesado exitosamente. Puedes descargar los resultados:
          </p>

          {resultados.archivo_disponible && (
            <button
              onClick={onDescargar}
              className={buttons.primary}
            >
              <CheckCircle className="w-4 h-4" />
              Descargar Resultados
            </button>
          )}
        </>
      ) : (
        <div className="flex items-start gap-3 text-gray-300 text-sm">
          <Info className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <p className="font-medium text-white">Aún no hay archivo procesado</p>
            <p className="text-gray-400">Ejecuta el procesamiento para habilitar la descarga.</p>
          </div>
        </div>
      )}
    </Wrapper>
  );

  // TODO: Reactivar las métricas detalladas cuando se corrijan los errores
  // - Total de registros
  // - Procesados exitosamente  
  // - Grupos por tipo de documento
  // - Lista de grupos creados
};

export default ResultsSection;
