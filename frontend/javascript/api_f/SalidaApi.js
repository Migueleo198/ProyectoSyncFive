import ApiClient from './ApiClient.js';

const SalidaApi = {

  getAll() {
    return ApiClient.get('/salidas');
  },

  getById(id_registro) {
    return ApiClient.get(`/salidas/${id_registro}`);
  },
  
  create(data) {
    return ApiClient.post('/salidas', data);
  },
  
  update(id_registro, data) {
    return ApiClient.put(`/salidas/${id_registro}`, data);
  },

  delete(id_registro) {
    return ApiClient.delete(`/salidas/${id_registro}`);
  }
};

export default SalidaApi;
