import ApiClient from './ApiClient.js';

const GuardiaApi = {
  getAll() {
    return ApiClient.get('/guardias');
  },

  getById(idGuardia) {
    return ApiClient.get(`/guardias/${idGuardia}`);
  },

  create(data) {
    return ApiClient.post('/guardias', data);
  },

  update(idGuardia, data) {
    return ApiClient.put(`/guardias/${idGuardia}`, data);
  },
  assignToPerson(data) {
    return ApiClient.post(`/personas/${data.id_bombero}/guardias`, {
      id_bombero: data.id_bombero,
      id_guardia: data.id_guardia,
      cargo: data.cargo
    });
  },
  getPersonGuardias(idGuardia) {
    return ApiClient.get(`/guardias/${idGuardia}/personas`);
  }
};

export default GuardiaApi;
