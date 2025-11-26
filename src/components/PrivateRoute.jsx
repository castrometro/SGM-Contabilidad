// src/components/PrivateRoute.jsx
import { Navigate } from "react-router-dom";
import { getAccessToken } from "../utils/tokenStorage";

export default function PrivateRoute({ children }) {
  const token = getAccessToken();
  return token ? children : <Navigate to="/" />;
}
