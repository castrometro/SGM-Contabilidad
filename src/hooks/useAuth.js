// src/hooks/useAuth.js
import { getAccessToken } from "../utils/tokenStorage";

export const useAuth = () => {
  const token = getAccessToken();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  return { token, usuario };
};
