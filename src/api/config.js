//src/api/config.js
import axios from "axios";
import { getAccessToken } from "../utils/tokenStorage";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;
