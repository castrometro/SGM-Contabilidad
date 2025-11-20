//src/api/config.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://172.17.11.13:8000/api", // cambia esto en producción
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
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
