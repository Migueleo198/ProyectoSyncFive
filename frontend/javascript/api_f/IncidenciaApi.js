import ApiClient from './ApiClient.js';

const IncidenciaApi = {
  // CRUD básico
  getAll() {
    return ApiClient.get('/incidencias');
  },

  getById(id) {
    return ApiClient.get(`/incidencias/${id}`);
  },

  create(data) {
    return ApiClient.post('/incidencias', data);
  },

  update(id, data) {
    return ApiClient.put(`/incidencias/${id}`, data);
  },

  delete(id) {
    return ApiClient.delete(`/incidencias/${id}`);
  },

  // Parchear incidencia (para cambios parciales)
  patch(id, data) {
    return ApiClient.patch(`/incidencias/${id}`, data);
  }
};

export default IncidenciaApi;