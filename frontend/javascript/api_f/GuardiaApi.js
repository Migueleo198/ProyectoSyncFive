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
      return ApiClient.post(`/personas/${encodeURIComponent(data.id_bombero)}/guardias`, {
          id_bombero: data.id_bombero,
          id_guardia: data.id_guardia,
          cargo: data.cargo
      });
  },

  getByDate(date) {
    return ApiClient.get(`/personas/guardias/fecha/${date}`);
  },
  
  updateCargo(id_bombero, id_guardia, cargo) {
    return ApiClient.patch(`/personas/${id_bombero}/guardias/${id_guardia}`, { cargo });
  },

  getPersonsGuardia(id_guardia){
    return ApiClient.get(`/guardias/${id_guardia}/personas`);
  },

  unassignFromPerson(id_bombero, id_guardia) {
    return ApiClient.post('/guardias/desasignar', { id_bombero, id_guardia });
  },

  updateNotas(id_guardia, notas) {
    return ApiClient.patch(`/guardias/${id_guardia}`, { notas });
  },

  getTurnoRefuerzoByFecha(fecha) {
    return ApiClient.get(`/refuerzos/fecha/${fecha}`);
  }
};

export default GuardiaApi;
