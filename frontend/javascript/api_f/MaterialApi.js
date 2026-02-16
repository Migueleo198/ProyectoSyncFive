import ApiClient from './ApiClient.js';

const MaterialApi = {
  getAll() {
    return ApiClient.get('/materiales');
  },

  getById(id_material) {
    return ApiClient.get(`/materiales/${id_material}`);
  },

  create(data) {
    return ApiClient.post('/materiales', data);
  },

  update(id_material, data) {
    return ApiClient.put(`/materiales/${id_material}`, data);
  },
  

  delete(id_material) {
    return ApiClient.delete(`/materiales/${id_material}`);
  },

  getLocalidades() {
    return ApiClient.get('/materiales/localidades');
  }
};

export default MaterialApi;
