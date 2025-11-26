// src/components/Header.jsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/BDO_LOGO.png';
import { clearAuthState } from '../utils/tokenStorage';

export default function Header() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const logout = () => {
    clearAuthState();
    localStorage.removeItem('usuario');
    navigate('/');
  };

  return (
    <header className="w-full bg-gray-800 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
        {/* Logo y Título */}
        <div className="flex items-center gap-3 sm:gap-4">
          <img 
            src={logo} 
            alt="BDO Logo" 
            className="h-8 sm:h-10 cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => navigate('/menu')}
          />
          <span className="text-white font-semibold text-sm sm:text-base lg:text-lg whitespace-nowrap">
            Sistema de Gestión y Monitoreo SGM
          </span>
        </div>

        {/* Usuario y acciones */}
        <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-300">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Bienvenido(a), </span>
              <strong className="text-white">{usuario?.nombre || '...'}</strong>
            </span>
            <button
              onClick={logout}
              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors whitespace-nowrap"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
