import ApiClient from './ApiClient.js';

const PersonaApi = {
  getAll() {
    return ApiClient.get('/personas');
  },

  getById(idPersona) {
    return ApiClient.get(`/personas/${idPersona}`);
  },

  create(data) {
    return ApiClient.post('/personas', data);
  },

  update(idPersona, data) {
    return ApiClient.put(`/personas/${idPersona}`, data);
  },

  remove(idPersona) {
    return ApiClient.delete(`/personas/${idPersona}`);
  }
};

export default PersonaApi;
