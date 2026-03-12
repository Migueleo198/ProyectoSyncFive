import ApiClient from './ApiClient.js';

const InfraestructuraAguaApi = {

  /**
   * GET /infraestructuras-agua
   * Parámetros opcionales: tipo, provincia, municipio, estado
   */
  getAll(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.tipo)      params.append('tipo',      filtros.tipo);
    if (filtros.provincia) params.append('provincia', filtros.provincia);
    if (filtros.municipio) params.append('municipio', filtros.municipio);
    if (filtros.estado)    params.append('estado',    filtros.estado);

    const query = params.toString();
    return ApiClient.get(`/infraestructuras-agua${query ? '?' + query : ''}`);
  },

  getById(codigo) {
    return ApiClient.get(`/infraestructuras-agua/${codigo}`);
  },

  create(data) {
    return ApiClient.post('/infraestructuras-agua', data);
  },

  update(codigo, data) {
    return ApiClient.put(`/infraestructuras-agua/${codigo}`, data);
  },

  delete(codigo) {
    return ApiClient.delete(`/infraestructuras-agua/${codigo}`);
  },

};

export default InfraestructuraAguaApi;