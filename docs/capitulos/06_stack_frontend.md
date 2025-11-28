# Capítulo 6: Stack Frontend

**Parte III: Desarrollo y Tecnologías**  
**Documento:** SGM Contabilidad - Documentación Completa v2.0  
**Fecha:** 28 de Noviembre de 2025  

---

## 6.1 React 19 + Vite: Configuración

### Versiones y Tecnologías Base

```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "vite": "^7.2.4",
  "@vitejs/plugin-react": "^5.0.4"
}
```

**Justificación de Elección:**
- ✅ **React 19:** Última versión estable con mejoras de performance
- ✅ **Vite 7:** Build tool moderno, extremadamente rápido (esbuild)
- ✅ **HMR (Hot Module Replacement):** Desarrollo ágil con recarga instantánea
- ✅ **Optimización de bundle:** Tree-shaking y code-splitting automático

### Configuración de Vite

**Archivo:** `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),           // Plugin React con Fast Refresh
    tailwindcss(),     // Plugin Tailwind CSS v4
  ],
  
  // Base path para integración con Django static files
  base: '/static/dist/',
  
  // Variables de entorno
  define: {
    'import.meta.env.VITE_MEDIA_BASE_URL': JSON.stringify(
      process.env.VITE_MEDIA_BASE_URL || 'http://172.17.11.13:8000'
    )
  },
  
  // Alias de rutas para imports limpios
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  // Configuración del servidor de desarrollo
  server: {
    host: '0.0.0.0',     // Accesible desde red local
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://172.17.11.13:8000',
        changeOrigin: true,
        secure: false,
      },
      '/media': {
        target: 'http://172.17.11.13:8000',
        changeOrigin: true,
      }
    }
  },
  
  // Optimizaciones de build
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'utils': ['axios'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
})
```

**Características Clave:**
- **Base Path:** `/static/dist/` para servir desde Django
- **Proxy:** Redirige `/api` y `/media` al backend Django
- **Code Splitting:** Separación de vendors para optimizar caching
- **Alias:** `@` apunta a `/src` para imports limpios

### Variables de Entorno

**Archivo:** `.env`

```bash
VITE_API_BASE_URL=/api
VITE_MEDIA_BASE_URL=http://172.17.11.13:8000
```

**Archivo:** `.env.production`

```bash
VITE_API_BASE_URL=/api
VITE_MEDIA_BASE_URL=http://172.17.11.13:8000
```

**Uso en Código:**
```javascript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
const mediaUrl = import.meta.env.VITE_MEDIA_BASE_URL;
```

### Package.json Scripts

```json
{
  "scripts": {
    "preinstall": "node scripts/check-node.js",
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "engines": {
    "node": ">=20.19.5"
  },
  "engineStrict": true
}
```

**Comandos:**
```bash
# Desarrollo (con HMR)
npm run dev

# Build de producción
npm run build

# Preview de build
npm run preview

# Linting
npm run lint
```

---

## 6.2 Estructura de Directorios

### Árbol de Directorio `/src`

```
src/
├── main.jsx                    # Punto de entrada
├── App.jsx                     # Componente raíz con routing
├── index.css                   # Estilos globales (Tailwind)
├── App.css                     # Estilos del App
│
├── api/                        # Clientes API (axios)
│   ├── config.js              # Configuración axios + interceptors
│   ├── auth.js                # APIs de autenticación
│   ├── clientes.js            # APIs de clientes
│   ├── rindeGastos.js         # APIs de rinde gastos
│   ├── gerente.js             # APIs para gerente
│   ├── supervisores.js        # APIs de supervisores
│   ├── analistas.js           # APIs de analistas
│   └── areas.js               # APIs de áreas
│
├── pages/                      # Páginas/Vistas principales
│   ├── Login.jsx              # Página de login
│   ├── MenuUsuario.jsx        # Menú principal
│   ├── Clientes.jsx           # Lista de clientes
│   ├── ClienteDetalle.jsx     # Detalle de cliente
│   └── CapturaMasivaGastos/   # Módulo de captura masiva
│       ├── index.jsx
│       ├── UploadSection.jsx
│       ├── ResultsSection.jsx
│       └── ...
│
├── components/                 # Componentes reutilizables
│   ├── Layout.jsx             # Layout principal con Navbar/Sidebar
│   ├── Header.jsx             # Header de la app
│   ├── Footer.jsx             # Footer
│   ├── Navbar.jsx             # Barra de navegación
│   ├── Sidebar.jsx            # Menú lateral
│   ├── PrivateRoute.jsx       # Protección de rutas
│   ├── LoginForm.jsx          # Formulario de login
│   ├── ClienteListCard.jsx    # Card de cliente
│   ├── ClienteListRow.jsx     # Row de cliente
│   ├── Pagination.jsx         # Componente de paginación
│   ├── Notificacion.jsx       # Sistema de notificaciones
│   ├── OpcionMenu.jsx         # Opciones del menú
│   ├── SkeletonLoaders.jsx    # Loading placeholders
│   ├── InfoCards/             # Cards informativos
│   ├── DashboardGerente/      # Dashboard de gerente
│   └── Gerente/               # Componentes de gerente
│
├── ui/                         # Componentes UI primitivos
│   ├── button.jsx             # Botón reutilizable
│   ├── card.jsx               # Card base
│   ├── input.jsx              # Input de texto
│   ├── textarea.jsx           # Textarea
│   ├── alert.jsx              # Alert/Banner
│   └── badge.jsx              # Badge/Tag
│
├── hooks/                      # Custom React Hooks
│   ├── useAuth.js             # Hook de autenticación
│   └── dashboard/             # Hooks de dashboard
│
├── utils/                      # Utilidades y helpers
│   ├── tokenStorage.js        # Gestión de tokens JWT
│   ├── dashboard/             # Utilidades de dashboard
│   │   └── tooltips.jsx
│   └── ...
│
├── constants/                  # Constantes de la app
│   └── estadoCierreColors.js  # Colores de estados
│
├── assets/                     # Recursos estáticos
│   └── images/
│
└── examples/                   # Ejemplos y demos
    └── ActivityLoggingExamples.jsx
```

### Convenciones de Nombres

```yaml
Archivos:
  - Componentes: PascalCase (e.g., ClienteDetalle.jsx)
  - Hooks: camelCase con prefijo use (e.g., useAuth.js)
  - Utils: camelCase (e.g., tokenStorage.js)
  - Constantes: camelCase (e.g., estadoCierreColors.js)

Carpetas:
  - camelCase o kebab-case según contexto
  - Componentes complejos: PascalCase (e.g., CapturaMasivaGastos/)

Extensiones:
  - Componentes JSX: .jsx
  - Utilidades JS: .js
  - Estilos: .css
```

---

## 6.3 Componentes Principales

### App.jsx - Componente Raíz

```jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import PrivateRoute from "./components/PrivateRoute";
import Layout from "./components/Layout";
import MenuUsuario from "./pages/MenuUsuario";
import CapturaMasivaGastos from "./pages/CapturaMasivaGastos";
import Clientes from "./pages/Clientes";
import ClienteDetalle from "./pages/ClienteDetalle";

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta pública */}
        <Route path="/" element={<Login />} />
        
        {/* Rutas protegidas con Layout */}
        <Route
          path="/menu"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          {/* Rutas anidadas dentro del Layout */}
          <Route index element={<MenuUsuario />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/:clienteId" element={<ClienteDetalle />} />
          <Route
            path="clientes/:clienteId/rindegastos"
            element={<CapturaMasivaGastos />}
          />
          <Route 
            path="*" 
            element={<h1 className="text-white">404 - Página no encontrada</h1>} 
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
```

**Características:**
- **React Router v7:** Navegación declarativa
- **PrivateRoute:** Protección de rutas autenticadas
- **Layout Wrapper:** Header + Sidebar + Outlet
- **Nested Routes:** Rutas anidadas bajo `/menu`

### Layout.jsx - Estructura Principal

```jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet /> {/* Renderiza las rutas hijas */}
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
```

**Estructura:**
- **Sidebar:** Navegación lateral fija
- **Header:** Información de usuario y acciones
- **Main:** Contenido dinámico (Outlet)
- **Footer:** Información adicional

### PrivateRoute.jsx - Protección de Rutas

```jsx
import { Navigate } from "react-router-dom";
import { getAccessToken } from "../utils/tokenStorage";

export default function PrivateRoute({ children }) {
  const token = getAccessToken();
  
  // Si no hay token, redirigir a login
  return token ? children : <Navigate to="/" />;
}
```

**Funcionamiento:**
1. Verifica existencia de token JWT en localStorage
2. Si existe token: Renderiza componente hijo
3. Si no existe: Redirige a `/` (Login)

### Login.jsx - Página de Autenticación

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import Header_login from '../components/Header_login';
import { loginUsuario } from '../api/auth';
import { setAccessToken, setRefreshToken } from '../utils/tokenStorage';

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (correo, password) => {
    try {
      setLoading(true);
      setError('');
      
      // Llamar API de login
      const data = await loginUsuario(correo, password);
      
      // Guardar tokens
      setAccessToken(data.access);
      setRefreshToken(data.refresh);
      
      // Redirigir al menú
      navigate('/menu');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <Header_login />
      
      {/* Background con blobs animados */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      
      {/* Formulario de login */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <LoginForm 
          onSubmit={handleLogin}
          error={error}
          loading={loading}
        />
      </div>
    </div>
  );
}
```

### Clientes.jsx - Lista de Clientes

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerClientes } from '../api/clientes';
import ClienteListCard from '../components/ClienteListCard';
import ClienteListRow from '../components/ClienteListRow';
import SkeletonLoaders from '../components/SkeletonLoaders';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const navigate = useNavigate();

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      setLoading(true);
      const data = await obtenerClientes();
      setClientes(data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClienteClick = (clienteId) => {
    navigate(`/menu/clientes/${clienteId}`);
  };

  if (loading) {
    return <SkeletonLoaders count={6} type="card" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Clientes</h1>
        
        {/* Toggle View Mode */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
          >
            List
          </button>
        </div>
      </div>

      {/* Lista de Clientes */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientes.map((cliente) => (
            <ClienteListCard
              key={cliente.id}
              cliente={cliente}
              onClick={() => handleClienteClick(cliente.id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {clientes.map((cliente) => (
            <ClienteListRow
              key={cliente.id}
              cliente={cliente}
              onClick={() => handleClienteClick(cliente.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 6.4 Routing y Navegación

### React Router v7 Configuration

**Instalación:**
```bash
npm install react-router-dom@^7.3.0
```

**Estructura de Rutas:**
```javascript
<Router>
  <Routes>
    {/* Ruta pública */}
    <Route path="/" element={<Login />} />
    
    {/* Rutas protegidas */}
    <Route path="/menu" element={<PrivateRoute><Layout /></PrivateRoute>}>
      <Route index element={<MenuUsuario />} />
      <Route path="clientes" element={<Clientes />} />
      <Route path="clientes/:clienteId" element={<ClienteDetalle />} />
      <Route path="clientes/:clienteId/rindegastos" element={<CapturaMasivaGastos />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
</Router>
```

### Navegación Programática

```jsx
import { useNavigate, useParams } from 'react-router-dom';

function MiComponente() {
  const navigate = useNavigate();
  const { clienteId } = useParams();
  
  // Navegar a otra ruta
  const irADetalle = (id) => {
    navigate(`/menu/clientes/${id}`);
  };
  
  // Navegar hacia atrás
  const volver = () => {
    navigate(-1);
  };
  
  // Navegar con reemplazo (no crea entrada en historial)
  const irConReemplazo = () => {
    navigate('/menu', { replace: true });
  };
  
  return (
    <div>
      <h1>Cliente: {clienteId}</h1>
      <button onClick={() => irADetalle(123)}>Ir a cliente 123</button>
      <button onClick={volver}>Volver</button>
    </div>
  );
}
```

### Links Declarativos

```jsx
import { Link, NavLink } from 'react-router-dom';

function Navbar() {
  return (
    <nav>
      {/* Link básico */}
      <Link to="/menu/clientes">Clientes</Link>
      
      {/* NavLink con estilos activos */}
      <NavLink
        to="/menu/clientes"
        className={({ isActive }) => 
          isActive ? 'text-blue-500' : 'text-white'
        }
      >
        Clientes
      </NavLink>
    </nav>
  );
}
```

### Protección de Rutas por Rol

```jsx
import { Navigate } from 'react-router-dom';
import { getAccessToken, getUserRole } from '../utils/tokenStorage';

export default function RoleProtectedRoute({ children, allowedRoles }) {
  const token = getAccessToken();
  const userRole = getUserRole();
  
  if (!token) {
    return <Navigate to="/" />;
  }
  
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/menu" />;
  }
  
  return children;
}

// Uso:
<Route
  path="/admin"
  element={
    <RoleProtectedRoute allowedRoles={['gerente']}>
      <AdminPanel />
    </RoleProtectedRoute>
  }
/>
```

---

## 6.5 Gestión de Estado

### Estado Local con useState

```jsx
import { useState } from 'react';

function FormularioCliente() {
  // Estado simple
  const [nombre, setNombre] = useState('');
  
  // Estado objeto
  const [cliente, setCliente] = useState({
    nombre: '',
    codigo: '',
    activo: true
  });
  
  // Estado array
  const [servicios, setServicios] = useState([]);
  
  // Actualizar estado objeto
  const handleChange = (e) => {
    setCliente({
      ...cliente,
      [e.target.name]: e.target.value
    });
  };
  
  // Agregar a array
  const agregarServicio = (servicio) => {
    setServicios([...servicios, servicio]);
  };
  
  return (
    <form>
      <input
        name="nombre"
        value={cliente.nombre}
        onChange={handleChange}
      />
    </form>
  );
}
```

### Estado con useEffect

```jsx
import { useState, useEffect } from 'react';
import { obtenerClientes } from '../api/clientes';

function ListaClientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Ejecutar al montar el componente
  useEffect(() => {
    cargarClientes();
  }, []); // Array vacío = solo en mount
  
  // Ejecutar cuando cambia una dependencia
  useEffect(() => {
    console.log('Clientes actualizados:', clientes);
  }, [clientes]);
  
  const cargarClientes = async () => {
    try {
      setLoading(true);
      const data = await obtenerClientes();
      setClientes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      {loading ? 'Cargando...' : clientes.map(c => <div key={c.id}>{c.nombre}</div>)}
    </div>
  );
}
```

### Custom Hook: useAuth

```jsx
// hooks/useAuth.js
import { useState, useEffect } from 'react';
import { obtenerUsuario } from '../api/auth';
import { getAccessToken } from '../utils/tokenStorage';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      cargarUsuario();
    } else {
      setLoading(false);
    }
  }, []);
  
  const cargarUsuario = async () => {
    try {
      const userData = await obtenerUsuario();
      setUser(userData);
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  
  return { user, loading, refetch: cargarUsuario };
}

// Uso en componente:
function Header() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Cargando...</div>;
  
  return <div>Hola, {user?.nombre}</div>;
}
```

### Gestión de Estado sin Librerías Externas

**¿Por qué no Redux/Zustand?**
- ✅ Aplicación de tamaño mediano
- ✅ Estado local suficiente para la mayoría de casos
- ✅ Props drilling limitado gracias a estructura de rutas
- ✅ JWT en localStorage para autenticación
- ✅ React Context para estado global mínimo

**Si se necesita estado global:**
```jsx
// contexts/AppContext.jsx
import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [notificaciones, setNotificaciones] = useState([]);
  
  const agregarNotificacion = (mensaje, tipo = 'info') => {
    const id = Date.now();
    setNotificaciones([...notificaciones, { id, mensaje, tipo }]);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
      setNotificaciones(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };
  
  return (
    <AppContext.Provider value={{ notificaciones, agregarNotificacion }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
```

---

## 6.6 Integración con API Backend

### Configuración de Axios

**Archivo:** `src/api/config.js`

```javascript
import axios from "axios";
import { getAccessToken, setAccessToken, getRefreshToken, clearTokens } from "../utils/tokenStorage";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

// Crear instancia de axios
const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor de request: Agregar token JWT
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de response: Manejo de errores y refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Si es 401 y no se ha intentado refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          // Intentar refrescar token
          const response = await axios.post(
            `${apiBaseUrl}/token/refresh/`,
            { refresh: refreshToken }
          );
          
          const newAccessToken = response.data.access;
          setAccessToken(newAccessToken);
          
          // Reintentar request original
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh falló, limpiar tokens y redirigir a login
        clearTokens();
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

### Cliente API: auth.js

```javascript
// src/api/auth.js
import api from "./config";

// Login de usuario
export const loginUsuario = async (correo, password) => {
  const response = await api.post("/token/", {
    correo_bdo: correo,
    password,
  });
  return response.data; // { access, refresh }
};

// Obtener datos del usuario actual
export const obtenerUsuario = async () => {
  const response = await api.get("/usuarios/me/");
  return response.data;
};

// Refresh token
export const refreshToken = async (refresh) => {
  const response = await api.post("/token/refresh/", { refresh });
  return response.data; // { access }
};
```

### Cliente API: clientes.js

```javascript
// src/api/clientes.js
import api from "./config";

// Obtener todos los clientes
export const obtenerClientes = async () => {
  const response = await api.get("/clientes/");
  return response.data;
};

// Obtener un cliente por ID
export const obtenerCliente = async (id) => {
  const response = await api.get(`/clientes/${id}/`);
  return response.data;
};

// Crear un nuevo cliente
export const crearCliente = async (clienteData) => {
  const response = await api.post("/clientes/", clienteData);
  return response.data;
};

// Actualizar un cliente
export const actualizarCliente = async (id, clienteData) => {
  const response = await api.put(`/clientes/${id}/`, clienteData);
  return response.data;
};

// Eliminar un cliente
export const eliminarCliente = async (id) => {
  const response = await api.delete(`/clientes/${id}/`);
  return response.data;
};

// Obtener servicios contratados de un cliente
export const obtenerServiciosCliente = async (id) => {
  const response = await api.get(`/clientes/${id}/servicios/`);
  return response.data;
};
```

### Cliente API: rindeGastos.js

```javascript
// src/api/rindeGastos.js
import api from "./config";

// Subir archivo Excel
export const subirArchivoRindeGastos = async (clienteId, archivo, onUploadProgress) => {
  const formData = new FormData();
  formData.append('archivo', archivo);
  formData.append('cliente_id', clienteId);
  
  const response = await api.post(
    "/rindegastos/procesar/",
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress, // Callback de progreso
    }
  );
  
  return response.data; // { task_id, message }
};

// Consultar estado de procesamiento
export const consultarEstadoTarea = async (taskId) => {
  const response = await api.get(`/rindegastos/task-status/${taskId}/`);
  return response.data; // { state, status, result }
};

// Descargar archivo procesado
export const descargarArchivoResultado = async (cierreId) => {
  const response = await api.get(
    `/rindegastos/descargar/${cierreId}/`,
    { responseType: 'blob' }
  );
  return response.data;
};

// Obtener cierres de un cliente
export const obtenerCierresCliente = async (clienteId) => {
  const response = await api.get(`/rindegastos/cierres/`, {
    params: { cliente_id: clienteId }
  });
  return response.data;
};
```

### Manejo de Errores

```javascript
// Ejemplo de uso con manejo de errores
import { obtenerClientes } from '../api/clientes';

function ListaClientes() {
  const [clientes, setClientes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    cargarClientes();
  }, []);
  
  const cargarClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await obtenerClientes();
      setClientes(data);
    } catch (err) {
      console.error('Error al cargar clientes:', err);
      
      // Manejo específico de errores
      if (err.response) {
        // Error de respuesta del servidor
        if (err.response.status === 401) {
          setError('No autorizado. Por favor, inicia sesión nuevamente.');
        } else if (err.response.status === 403) {
          setError('No tienes permisos para ver los clientes.');
        } else if (err.response.status === 500) {
          setError('Error del servidor. Intenta más tarde.');
        } else {
          setError(err.response.data?.detail || 'Error al cargar clientes');
        }
      } else if (err.request) {
        // Error de red
        setError('Error de conexión. Verifica tu conexión a internet.');
      } else {
        // Otro error
        setError('Error inesperado. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div>Cargando...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  
  return (
    <div>
      {clientes.map(cliente => (
        <div key={cliente.id}>{cliente.nombre}</div>
      ))}
    </div>
  );
}
```

### Upload de Archivos con Progreso

```javascript
import { subirArchivoRindeGastos } from '../api/rindeGastos';

function UploadSection({ clienteId }) {
  const [archivo, setArchivo] = useState(null);
  const [progreso, setProgreso] = useState(0);
  const [uploading, setUploading] = useState(false);
  
  const handleFileChange = (e) => {
    setArchivo(e.target.files[0]);
  };
  
  const handleUpload = async () => {
    if (!archivo) return;
    
    try {
      setUploading(true);
      
      const result = await subirArchivoRindeGastos(
        clienteId,
        archivo,
        (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgreso(percentCompleted);
        }
      );
      
      console.log('Upload exitoso:', result);
      // Continuar con polling de estado...
      
    } catch (error) {
      console.error('Error en upload:', error);
    } finally {
      setUploading(false);
      setProgreso(0);
    }
  };
  
  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      
      {uploading && (
        <div className="progress">
          <div 
            className="progress-bar" 
            style={{ width: `${progreso}%` }}
          >
            {progreso}%
          </div>
        </div>
      )}
      
      <button onClick={handleUpload} disabled={uploading || !archivo}>
        {uploading ? 'Subiendo...' : 'Subir Archivo'}
      </button>
    </div>
  );
}
```

---

## 6.7 Build y Deployment

### Build de Producción

```bash
# Build optimizado
npm run build

# Resultado en /dist:
dist/
├── assets/
│   ├── react-vendor-[hash].js
│   ├── ui-vendor-[hash].js
│   ├── utils-[hash].js
│   ├── index-[hash].js
│   └── index-[hash].css
└── index.html
```

**Características del Build:**
- ✅ **Minificación:** JavaScript y CSS minificados
- ✅ **Tree-shaking:** Código no usado eliminado
- ✅ **Code splitting:** Chunks separados por vendor
- ✅ **Hashing:** Nombres con hash para cache busting
- ✅ **Compression:** Archivos comprimidos con Gzip

### Integración con Django

**Configuración Django para servir el build:**

```python
# settings.py
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Directorios adicionales de static files
STATICFILES_DIRS = [
    BASE_DIR / 'dist',  # Build de Vite
]

# Whitenoise para servir static files
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Agregar esto
    # ...
]

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

**Template Django:**

```html
<!-- templates/index.html -->
{% load static %}
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SGM Contabilidad</title>
    <link rel="stylesheet" href="{% static 'dist/assets/index-[hash].css' %}">
</head>
<body>
    <div id="root"></div>
    <script type="module" src="{% static 'dist/assets/index-[hash].js' %}"></script>
</body>
</html>
```

### Script de Deployment

```bash
#!/bin/bash
# deploy-frontend.sh

echo "🚀 Iniciando deployment de frontend..."

# 1. Build de producción
echo "📦 Building..."
npm run build

# 2. Copiar build a Django static
echo "📂 Copiando archivos..."
rm -rf backend/static/dist/
cp -r dist/ backend/static/dist/

# 3. Collectstatic de Django
echo "📥 Collect static files..."
cd backend
python manage.py collectstatic --noinput

# 4. Reiniciar servicios
echo "🔄 Reiniciando servicios..."
docker compose restart django

echo "✅ Deployment completado!"
```

### CI/CD con GitHub Actions

**Workflow para build automático:**

```yaml
# .github/workflows/build-frontend.yml
name: Build Frontend

on:
  push:
    branches:
      - production
    paths:
      - 'src/**'
      - 'package.json'
      - 'vite.config.js'

jobs:
  build:
    runs-on: self-hosted
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.19.5'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build frontend
        run: npm run build
      
      - name: Copy to Django static
        run: |
          rm -rf backend/static/dist/
          cp -r dist/ backend/static/dist/
      
      - name: Collect static files
        run: |
          cd backend
          python manage.py collectstatic --noinput
      
      - name: Restart services
        run: docker compose restart django
```

### Optimización de Performance

**Configuración de Vite para producción:**

```javascript
// vite.config.js
export default defineConfig({
  build: {
    // Tamaño de chunk más pequeño para mejor caching
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react', 'react-select'],
          'utils': ['axios', 'recharts'],
        }
      }
    },
    
    // Minificación agresiva
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // Eliminar console.log en producción
        drop_debugger: true,
      }
    },
    
    // Source maps solo para debugging
    sourcemap: false,
    
    // Tamaño de advertencia
    chunkSizeWarningLimit: 1000,
  },
  
  // Optimización de dependencias
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios'],
    exclude: [],
  },
})
```

---

## Resumen del Capítulo 6

✅ **React 19 + Vite 7:** Build tool moderno con HMR instantáneo  
✅ **Estructura Modular:** Separación clara de pages, components, api, hooks  
✅ **React Router v7:** Navegación declarativa con rutas protegidas  
✅ **Estado con Hooks:** useState, useEffect, custom hooks sin Redux  
✅ **Axios con Interceptors:** Manejo automático de JWT y refresh token  
✅ **Build Optimizado:** Code splitting, tree-shaking, hashing para cache  
✅ **Integración Django:** Deployment con collectstatic y Whitenoise  

---

**📖 Navegación:**
- ⬅️ [Capítulo 5: Servidor DB Compartido](./05_servidor_db_compartida.md)
- 🏠 [Volver al Índice](../DOCUMENTACION_COMPLETA_SGM.md)
- ➡️ [Capítulo 7: Stack Backend](./07_stack_backend.md)

---

**Documento generado para BDO Chile - SGM Contabilidad**  
**Última actualización:** 28 de Noviembre 2025
