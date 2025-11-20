import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import PrivateRoute from "./components/PrivateRoute";
import Layout from "./components/Layout";
import MenuUsuario from "./pages/MenuUsuario";
import Tools from "./pages/Tools";
import CapturaMasivaGastos from "./pages/CapturaMasivaGastos";
import Clientes from "./pages/Clientes";
import ClienteDetalle from "./pages/ClienteDetalle";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/menu"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<MenuUsuario />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/:clienteId" element={<ClienteDetalle />} />
          <Route path="tools" element={<Tools />} />
          <Route path="tools/captura-masiva-gastos" element={<CapturaMasivaGastos />} />
          <Route path="*" element={<h1 className="text-white">404 - Página no encontrada</h1>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
