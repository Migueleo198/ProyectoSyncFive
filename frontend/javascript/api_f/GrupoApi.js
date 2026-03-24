import ApiClient from './ApiClient.js';

const CategoriaCarnetApi = {
  getAll() {
    return ApiClient.get('/categorias-carnet');
  },

  getById(id) {
    return ApiClient.get(`/categorias-carnet/${id}`);
  },

  create(data) {
    return ApiClient.post('/categorias-carnet', data);
  },

  update(id, data) {
    return ApiClient.put(`/categorias-carnet/${id}`, data);
  },

  delete(id) {
    return ApiClient.delete(`/categorias-carnet/${id}`);
  }
};

export default CategoriaCarnetApi;
