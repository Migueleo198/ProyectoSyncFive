import ApiClient from './ApiClient.js';

const TurnoRefuerzoApi = {
  getAll() {
    return ApiClient.get('/turnos-refuerzo');
  },

  getById(id_turno_refuerzo) {
    return ApiClient.get(`/turnos-refuerzo/${id_turno_refuerzo}`);
  },

  create(data) {
    return ApiClient.post('/turnos-refuerzo', data);
  },

  update(id_turno_refuerzo, data) {
    return ApiClient.put(`/turnos-refuerzo/${id_turno_refuerzo}`, data);
  },


  remove(id_turno_refuerzo) {
    return ApiClient.delete(
      `/turnos-refuerzo/${id_turno_refuerzo}`
    );
  }
};

export default TurnoRefuerzoApi;
