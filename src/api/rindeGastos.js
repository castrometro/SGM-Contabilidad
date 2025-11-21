// src/api/rindeGastos.js

const API_BASE_URL = 'http://172.17.11.13:8000/api/contabilidad';
const API_RINDE_GASTOS_BASE_URL = 'http://172.17.11.13:8000/api/rindegastos';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const fetchRindeGastos = async (endpoint) => {
  const response = await fetch(`${API_RINDE_GASTOS_BASE_URL}${endpoint}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    let errorText = 'Error consultando servicio RindeGastos';
    try {
      const err = await response.json();
      errorText = err.error || errorText;
    } catch (_) {}
    throw new Error(errorText);
  }

  return response.json();
};

const enviarRindeGastos = async (endpoint, payload, method = 'POST') => {
  const response = await fetch(`${API_RINDE_GASTOS_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload || {}),
  });

  if (!response.ok) {
    let errorText = 'Error consultando servicio RindeGastos';
    try {
      const err = await response.json();
      errorText = err.error || errorText;
    } catch (_) {}
    throw new Error(errorText);
  }

  return response.json();
};

export const rgLeerHeadersExcel = async (archivo) => {
  const formData = new FormData();
  formData.append('archivo', archivo);

  // Console logs para entender qué enviamos
  console.log('[RG API] Enviando a leer-headers:', {
    nombre: archivo?.name,
    size: archivo?.size,
    type: archivo?.type,
  });

  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/rindegastos/leer-headers/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    let errorText = 'Error leyendo headers (RG)';
    try {
      const errorData = await response.json();
      errorText = errorData.error || errorText;
    } catch (_) {}
    console.error('[RG API] Error response:', response.status, errorText);
    throw new Error(errorText);
  }

  const data = await response.json();
  console.log('[RG API] Respuesta leer-headers:', data);
  return data;
};

export const rgProcesarStep1 = async (archivo) => {
  const formData = new FormData();
  formData.append('archivo', archivo);

  console.log('[RG API] Enviando a procesar-step1:', {
    nombre: archivo?.name,
    size: archivo?.size,
    type: archivo?.type,
  });

  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/rindegastos/procesar-step1/`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    let errorText = 'Error en procesamiento step1 (RG)';
    try {
      const errorData = await response.json();
      errorText = errorData.error || errorText;
    } catch (_) {}
    console.error('[RG API] Error response step1:', response.status, errorText);
    throw new Error(errorText);
  }

  // Descargar blob
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rg_step1_${Date.now()}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

  console.log('[RG API] Descarga step1 completada');
  return true;
};

// === Flujo asíncrono Step1 (Redis) ===
export const rgIniciarStep1 = async (archivo, cuentasGlobales = {}, mapeoCC = {}) => {
  const formData = new FormData();
  formData.append('archivo', archivo);
  // Backend espera 'parametros_contables' como JSON string
  const payloadParam = {
    cuentasGlobales: {
      iva: cuentasGlobales.cuentaIVA || cuentasGlobales.iva || '',
      proveedores: cuentasGlobales.cuentaProveedores || cuentasGlobales.proveedores || '',
      gasto_default: cuentasGlobales.cuentaGasto || cuentasGlobales.gasto_default || ''
    },
    mapeoCC: mapeoCC || {}
  };
  console.log('[RG API] Enviando parametros_contables:', payloadParam);
  formData.append('parametros_contables', JSON.stringify(payloadParam));
  // Fallback: enviar también campos individuales para compatibilidad / depuración
  formData.append('cuentaIva', cuentasGlobales.cuentaIVA || '');
  formData.append('cuentaProveedores', cuentasGlobales.cuentaProveedores || '');
  formData.append('cuentaGasto', cuentasGlobales.cuentaGasto || '');
  // Variante con otros nombres por si el backend cambia (defensivo)
  formData.append('cuenta_iva', cuentasGlobales.cuentaIVA || '');
  formData.append('cuenta_proveedores', cuentasGlobales.cuentaProveedores || '');
  formData.append('cuenta_gasto', cuentasGlobales.cuentaGasto || '');

  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/rindegastos/step1/iniciar/`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    let errorText = 'Error iniciando Step1 (RG)';
    try { const err = await response.json(); errorText = err.error || errorText; } catch (_) {}
    throw new Error(errorText);
  }
  const data = await response.json();
  console.log('[RG API] Step1 iniciado:', data);
  return data; // { task_id, estado, archivo_nombre }
};

export const rgEstadoStep1 = async (taskId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/rindegastos/step1/estado/${taskId}/`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    let errorText = 'Error consultando estado Step1 (RG)';
    try { const err = await response.json(); errorText = err.error || errorText; } catch (_) {}
    throw new Error(errorText);
  }
  const data = await response.json();
  console.log('[RG API] Estado Step1:', data);
  return data; // { estado, ... }
};

export const rgDescargarStep1 = async (taskId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/rindegastos/step1/descargar/${taskId}/`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    let errorText = 'Error descargando Step1 (RG)';
    try { const err = await response.json(); errorText = err.error || errorText; } catch (_) {}
    throw new Error(errorText);
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rg_step1_${taskId}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  return true;
};

export const obtenerRendiciones = async (clienteServicioId) => {
  const query = clienteServicioId ? `?cliente_servicio=${clienteServicioId}` : '';
  return fetchRindeGastos(`/rendiciones/${query}`);
};

export const obtenerCentrosCosto = async (clienteServicioId) => {
  const query = clienteServicioId ? `?cliente_servicio=${clienteServicioId}` : '';
  return fetchRindeGastos(`/centros-costo/${query}`);
};

export const obtenerTiposDocumento = async (clienteServicioId) => {
  const query = clienteServicioId ? `?cliente_servicio=${clienteServicioId}` : '';
  return fetchRindeGastos(`/tipos-documento/${query}`);
};

export const obtenerCuentasGlobales = async (clienteServicioId) => {
  const query = clienteServicioId ? `?cliente_servicio=${clienteServicioId}` : '';
  return fetchRindeGastos(`/cuentas-globales/${query}`);
};

export const crearCentroCosto = async (clienteServicioId, payload) => {
  return enviarRindeGastos('/centros-costo/', {
    ...payload,
    cliente_servicio: clienteServicioId,
  });
};

export const actualizarCentroCosto = async (id, payload) => {
  return enviarRindeGastos(`/centros-costo/${id}/`, payload, 'PUT');
};

export const crearTipoDocumento = async (clienteServicioId, payload) => {
  return enviarRindeGastos('/tipos-documento/', {
    ...payload,
    cliente_servicio: clienteServicioId,
  });
};

export const actualizarTipoDocumento = async (id, payload) => {
  return enviarRindeGastos(`/tipos-documento/${id}/`, payload, 'PUT');
};

export const crearCuentaGlobal = async (clienteServicioId, payload) => {
  return enviarRindeGastos('/cuentas-globales/', {
    ...payload,
    cliente_servicio: clienteServicioId,
  });
};

export const actualizarCuentaGlobal = async (id, payload) => {
  return enviarRindeGastos(`/cuentas-globales/${id}/`, payload, 'PUT');
};
