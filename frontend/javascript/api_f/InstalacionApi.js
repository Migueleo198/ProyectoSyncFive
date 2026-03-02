import ApiClient from './ApiClient.js';

const InstalacionApi = {
  getAll() {
    return ApiClient.get('/instalaciones');
  },

  getById(id_Instalacion) {
    return ApiClient.get(`/instalaciones/${id_Instalacion}`);
  },

  create(data) {
    return ApiClient.post('/instalaciones', data);
  },

  update(id_Instalacion, data) {
    return ApiClient.put(`/instalaciones/${id_Instalacion}`, data);
  },
  

  delete(id_Instalacion) {
    return ApiClient.delete(`/instalaciones/${id_Instalacion}`);
  },

  getLocalidades() {
    return ApiClient.get('/instalaciones/localidades');
  }
};

export default InstalacionApi;
