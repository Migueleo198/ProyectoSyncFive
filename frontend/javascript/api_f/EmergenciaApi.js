import ApiClient from './ApiClient.js';

const EmergenciaApi = {
  getAll() {
    return ApiClient.get('/emergencias');
  },

  getById(idEmergencia) {
    return ApiClient.get(`/emergencias/${idEmergencia}`);
  },

  create(data) {
    return ApiClient.post('/emergencias', data);
  },

  update(idEmergencia, data) {
    return ApiClient.put(`/emergencias/${idEmergencia}`, data);
  },

  // Vehículos en emergencia
  getVehiculosEmergencia(idEmergencia) {
    return ApiClient.get(`/emergencias/${idEmergencia}/vehiculos`);
  },

  // getVehiculos(){
  //   return ApiClient.get('/vehiculos');
  // },

  addVehiculo(idEmergencia, data) {
    return ApiClient.post(`/emergencias/${idEmergencia}/vehiculos`, data);
  },

  removeVehiculo(idEmergencia, matricula) {
    return ApiClient.delete(
      `/emergencias/${idEmergencia}/vehiculos/${matricula}`
    );
  }
};

export default EmergenciaApi;
