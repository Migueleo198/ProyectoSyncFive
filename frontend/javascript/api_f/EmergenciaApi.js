import ApiClient from './ApiClient.js';

const EmergenciaApi = {

  // ==============================
  // Emergencias
  // ==============================
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

  // ==============================
  // Vehículos en emergencia
  // ==============================
  getVehiculosEmergencia(idEmergencia) {
    return ApiClient.get(`/emergencias/${idEmergencia}/vehiculos`);
  },
  addVehiculo(idEmergencia, data) {
    return ApiClient.post(`/emergencias/${idEmergencia}/vehiculos`, data);
  },
  deleteVehiculo(idEmergencia, matricula) {
    return ApiClient.delete(`/emergencias/${idEmergencia}/vehiculos/${matricula}`);
  },

  // ==============================
  // Personal en vehículos de emergencia
  // ==============================
  getPersonal(idEmergencia, matricula) {
    return ApiClient.get(`/emergencias/${idEmergencia}/vehiculos/${matricula}/personas`);
  },
  setPersonal(idEmergencia, matricula, data) {
    return ApiClient.post(`/emergencias/${idEmergencia}/vehiculos/${matricula}/personas`, data);
  },
  deletePersonal(idEmergencia, matricula, idBombero) {
    return ApiClient.delete(`/emergencias/${idEmergencia}/vehiculos/${matricula}/personas/${idBombero}`);
  },

};

export default EmergenciaApi;