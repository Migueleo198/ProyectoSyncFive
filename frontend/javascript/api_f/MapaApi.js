import ApiClient from './ApiClient.js';

const MapaApi = {

  /**
   * GET /mapa
   * Parámetros opcionales: tipo, provincia, municipio, estado
   */
  getAll(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.tipo) params.append('tipo', filtros.tipo);
    if (filtros.provincia) params.append('provincia', filtros.provincia);
    if (filtros.municipio) params.append('municipio', filtros.municipio);
    if (filtros.estado) params.append('estado', filtros.estado);

    const query = params.toString();
    return ApiClient.get(`/mapa${query ? '?' + query : ''}`);
  },

  getById(codigo) {
    return ApiClient.get(`/mapa/${codigo}`);
  },

  create(data) {
    return ApiClient.post('/mapa', data);
  },

  update(codigo, data) {
    return ApiClient.put(`/mapa/${codigo}`, data);
  },

  delete(codigo) {
    return ApiClient.delete(`/mapa/${codigo}`);
  },
  // Materiales del vehículo
  getVehiculos() {
    return ApiClient.get('/vehiculos');
  }
};

export default MapaApi;