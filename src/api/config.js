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
  try {
    const url = String(config?.url || "");
    if (url.includes('/nomina/cierres/') && url.includes('/estado-cache/')) {
      console.log('🧠 [CACHE][HTTP][REQ] Consultando estado-cache →', url, config?.params || {});
    }
    if (/\/nomina\/incidencias\/generar\//.test(url)) {
      console.log('🧠 [CACHE][HTTP][REQ] Generar incidencias →', url, config?.data || {});
    }
    if (/\/nomina\/cierres\/.+\/incidencias\/totales-variacion\//.test(url)) {
      console.log('📈 [INCIDENCIAS][VARIACION][REQ] Generar variaciones →', url, config?.data || config?.params || {});
    }
  } catch (_) {
    // noop
  }
  return config;
});

// Interceptor de respuestas: log de endpoints de caché e incidencias
api.interceptors.response.use(
  (response) => {
    try {
      const url = String(response?.config?.url || "");
      const { status, data } = response || {};
      // Estado de caché
      if (url.includes('/nomina/cierres/') && url.includes('/estado-cache/')) {
        const bloques = data?.informe_metadata?.bloques || data?.informe_metadata?.blocks || null;
        const bloquesKeys = bloques ? Object.keys(bloques) : null;
        console.log('🧠 [CACHE][HTTP] Estado cache (interceptor):', {
          url,
          status,
          informe_en_cache: data?.informe_en_cache,
          consolidados_en_cache: data?.consolidados_en_cache,
          bloques_disponibles: bloquesKeys,
          stats: data?.stats,
        });
      }
      // Generación de incidencias: indicador de uso de caché del período anterior si está disponible
      if (/\/nomina\/incidencias\/generar\//.test(url)) {
        const usadoCachePrev = data?.prev_period_cache_used ?? data?.diagnosticos?.prev_period_cache_used;
        console.log('🧠 [CACHE][HTTP] Generar incidencias (interceptor):', {
          url,
          status,
          prev_period_cache_used: usadoCachePrev,
        });
      }
      // Variaciones totales ± umbral (POST con fallback GET)
      if (/\/nomina\/cierres\/.+\/incidencias\/totales-variacion\//.test(url)) {
        const total = Array.isArray(data?.incidencias) ? data.incidencias.length : (Array.isArray(data) ? data.length : undefined);
        console.log('📈 [INCIDENCIAS][VARIACION][HTTP] Resultado:', {
          url,
          status,
          cierre_actual: data?.cierre_actual,
          cierre_anterior: data?.cierre_anterior,
          umbral_pct: data?.parametros?.umbral_pct,
          variaciones: data?.estadisticas?.variaciones,
          total_incidencias: data?.estadisticas?.total_incidencias ?? total,
        });
      }
    } catch (_) {
      // noop
    }
    return response;
  },
  (error) => {
    try {
      const url = String(error?.config?.url || "");
      const status = error?.response?.status;
      const data = error?.response?.data;
      if (url.includes('/estado-cache/')) {
        console.warn('🧠 [CACHE][HTTP] Error consultando estado-cache:', { url, status, data });
      }
      if (/\/nomina\/incidencias\/generar\//.test(url)) {
        console.warn('🧠 [CACHE][HTTP] Error generando incidencias:', { url, status, data });
      }
      if (/\/nomina\/cierres\/.+\/incidencias\/totales-variacion\//.test(url)) {
        console.warn('📈 [INCIDENCIAS][VARIACION][HTTP] Error:', { url, status, data });
      }
    } catch (_) {
      // noop
    }
    return Promise.reject(error);
  }
);

export default api;
