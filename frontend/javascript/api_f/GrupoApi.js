import ApiClient from './ApiClient.js';

const GrupoApi = {
  getAll() {
    return ApiClient.get('/grupos');
  },

  getById(id) {
    return ApiClient.get(`/grupos/${id}`);
  },

  create(data) {
    return ApiClient.post('/grupos', data);
  },

  update(id, data) {
    return ApiClient.put(`/grupos/${id}`, data);
  },

  delete(id) {
    return ApiClient.delete(`/grupos/${id}`);
  }
};

export default GrupoApi;
