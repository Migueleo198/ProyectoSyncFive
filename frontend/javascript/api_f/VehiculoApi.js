import ApiClient from './ApiClient.js';

const VehiculoApi = {
  // CRUD básico
  getAll() {
    return ApiClient.get('/vehiculos');
  },

  getByMatricula(matricula) {
    return ApiClient.get(`/vehiculos/${matricula}`);
  },

  create(data) {
    return ApiClient.post('/vehiculos', data);
  },

  update(matricula, data) {
    return ApiClient.put(`/vehiculos/${matricula}`, data);
  },

  delete(matricula) {
    return ApiClient.delete(`/vehiculos/${matricula}`);
  },

  // Instalación del vehículo
  getInstalacion(matricula) {
    return ApiClient.get(`/vehiculos/${matricula}/instalacion`);
  },

  setInstalacion(matricula, id_instalacion) {
    return ApiClient.post(`/vehiculos/${matricula}/instalacion`, { id_instalacion });
  },

  deleteInstalacion(matricula) {
    return ApiClient.delete(`/vehiculos/${matricula}/instalacion`);
  },

  // Materiales del vehículo
  getMateriales(matricula) {
    return ApiClient.get(`/vehiculos/${matricula}/materiales`);
  },

  addMaterial(matricula, id_material, data) {
    return ApiClient.post(`/vehiculos/${matricula}/materiales/${id_material}`, data);
  },

  updateMaterial(matricula, id_material, data) {
    return ApiClient.put(`/vehiculos/${matricula}/materiales/${id_material}`, data);
  },

  deleteMaterial(matricula, id_material) {
    return ApiClient.delete(`/vehiculos/${matricula}/materiales/${id_material}`);
  }
};

export default VehiculoApi;