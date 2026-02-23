import ApiClient from './ApiClient.js';

const GuardiaApi = {
  getAll() {
    return ApiClient.get('/guardias');
  },

  getById(idPersona) {
    return ApiClient.get(`/guardias/${idPersona}`);
  },

  create(data) {
    return ApiClient.post('/guardias', data);
  },

  update(idPersona, data) {
    return ApiClient.put(`/guardias/${idPersona}`, data);
  },

  remove(idPersona) {
    return ApiClient.delete(`/guardias/${idPersona}`);
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
