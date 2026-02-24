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
    return ApiClient.post(`/personas/${data.n_funcionario}/guardias`, {
      n_funcionario: data.n_funcionario,
      id_guardia: data.id_guardia,
      cargo: data.cargo
    });
  }
};

export default GuardiaApi;
