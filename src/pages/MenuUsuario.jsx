import OpcionMenu from "../components/OpcionMenu";
import { Users } from "lucide-react";

const MenuUsuario = () => {
  const opciones = [
    {
      label: "Clientes",
      descripcion: "Lista de clientes asignados",
      icon: Users,
      color: "#3B82F6",
      path: "/menu/clientes"
    }
  ];

  const cardOpacity = 0.9;

  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-6 animate-fade-in">Menú Principal</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {opciones.map((op, index) => (
          <div
            key={op.label}
            className="animate-slide-up"
            style={{
              animationDelay: `${index * 100}ms`,
              opacity: cardOpacity,
              transition: 'opacity 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = cardOpacity}
          >
            <OpcionMenu {...op} />
          </div>
        ))}
      </div>

      <style>
        {`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slide-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fade-in {
            animation: fade-in 0.8s ease-out;
          }

          .animate-slide-up {
            animation: slide-up 0.6s ease-out both;
          }
        `}
      </style>
    </div>
  );
};

export default MenuUsuario;
