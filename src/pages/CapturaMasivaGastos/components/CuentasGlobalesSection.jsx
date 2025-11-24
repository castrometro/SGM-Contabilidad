import { useMemo } from "react";
import { Settings, Info, CheckCircle, AlertCircle } from "lucide-react";
import { STYLES_CONFIG } from "../config/capturaConfig";

const CuentasGlobalesSection = ({ cuentasGlobales, setCuentasGlobales, cuentasRegistradas }) => {
  const { containers } = STYLES_CONFIG;

  const cuentasPorTipo = useMemo(() => {
    const lista = Array.isArray(cuentasRegistradas) ? cuentasRegistradas : [];
    return {
      IVA: lista.filter((c) => c.tipo === "IVA"),
      PROVEEDOR: lista.filter((c) => c.tipo === "PROVEEDOR"),
      GASTO: lista.filter((c) => c.tipo === "GASTO"),
    };
  }, [cuentasRegistradas]);

  const handleChange = (field, value) => {
    setCuentasGlobales((prev) => ({ ...prev, [field]: value }));
  };

  const getValidacionEstilo = (campo) => {
    const valor = cuentasGlobales[campo];
    if (!valor || !valor.trim()) {
      return "border-red-500";
    }
    return "border-emerald-500";
  };

  const renderValidacionIcono = (campo) => {
    const valor = cuentasGlobales[campo];
    if (!valor || !valor.trim()) return null;

    return valor ? (
      <CheckCircle className="w-4 h-4 text-emerald-500" />
    ) : (
      <AlertCircle className="w-4 h-4 text-red-500" />
    );
  };

  const renderSelectCuenta = (campo, label, placeholder, opciones = []) => {
    const sinOpciones = opciones.length === 0;
    return (
      <div>
        <label className="block text-sm text-gray-300 mb-1">{label}</label>
        <div className="relative">
          <select
            value={cuentasGlobales[campo]}
            onChange={(e) => handleChange(campo, e.target.value)}
            className={`w-full bg-gray-700 border ${getValidacionEstilo(campo)} text-white px-3 py-2 pr-10 rounded-lg focus:outline-none focus:border-emerald-500`}
            required
            disabled={sinOpciones}
          >
            <option value="" disabled>
              {sinOpciones ? "No hay cuentas disponibles" : placeholder}
            </option>
            {opciones.map((cuenta) => (
              <option key={cuenta.id} value={cuenta.codigo}>
                {cuenta.codigo}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {renderValidacionIcono(campo)}
          </div>
        </div>
        {sinOpciones && (
          <p className="text-xs text-yellow-400 mt-1">
            Agrega cuentas globales en Configuraciones para habilitar esta selección.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className={containers.section}>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5" />
        Cuentas Globales (obligatorias)
      </h2>

      <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">Selecciona las cuentas registradas:</p>
            <p className="text-xs">
              Usa las cuentas configuradas para este cliente. Si falta alguna, crea la cuenta en la pestaña de
              <strong> Configuraciones → Cuentas globales</strong>.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderSelectCuenta(
          "cuentaIVA",
          "Cuenta IVA (1xxx)",
          "Selecciona una cuenta IVA",
          cuentasPorTipo.IVA
        )}

        {renderSelectCuenta(
          "cuentaGasto",
          "Cuenta Gasto (5xxx)",
          "Selecciona una cuenta de gasto",
          cuentasPorTipo.GASTO
        )}

        {renderSelectCuenta(
          "cuentaProveedores",
          "Cuenta Proveedores (2xxx)",
          "Selecciona una cuenta de proveedores",
          cuentasPorTipo.PROVEEDOR
        )}
      </div>

      <p
        className={`text-xs mt-3 ${
          !cuentasGlobales.cuentaIVA || !cuentasGlobales.cuentaProveedores || !cuentasGlobales.cuentaGasto
            ? "text-red-400"
            : "text-gray-400"
        }`}
      >
        Debes completar las tres cuentas antes de procesar.
      </p>
    </div>
  );
};

export default CuentasGlobalesSection;
