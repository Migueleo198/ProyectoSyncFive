import ApiClient from './ApiClient.js';

const MaterialApi = {
  // CRUD básico de materiales
  getAll() {
    return ApiClient.get('/materiales');
  },

  getById(id_material) {
    return ApiClient.get(`/materiales/${id_material}`);
  },

  create(data) {
    return ApiClient.post('/materiales', data);
  },

  update(id_material, data) {
    return ApiClient.put(`/materiales/${id_material}`, data);
  },

  delete(id_material) {
    return ApiClient.delete(`/materiales/${id_material}`);
  },

  getLocalidades() {
    return ApiClient.get('/materiales/localidades');
  },

  // MATERIAL ASIGNADO A PERSONAS
  getMaterialByPersona(id_bombero) {
    return ApiClient.get(`/personas/${id_bombero}/material`);
  },

  assignToPersona(id_bombero, id_material, nserie) {
    return ApiClient.post(`/personas/${id_bombero}/material/${id_material}/${nserie}`);
  },

  removeFromPersona(id_bombero, id_material) {
    return ApiClient.delete(`/personas/${id_bombero}/material/${id_material}`);
  },

  // MATERIAL CARGADO EN VEHÍCULOS
  getMaterialByVehiculo(matricula) {
    return ApiClient.get(`/vehiculos/${matricula}/materiales`);
  },

  assignToVehiculo(matricula, id_material) {
    return ApiClient.post(`/vehiculos/${matricula}/materiales/${id_material}`);
  },

  updateMaterialInVehiculo(matricula, id_material, data) {
    return ApiClient.put(`/vehiculos/${matricula}/materiales/${id_material}`, data);
  },

  removeFromVehiculo(matricula, id_material) {
    return ApiClient.delete(`/vehiculos/${matricula}/materiales/${id_material}`);
  },

  // MATERIAL EN ALMACÉN
  getMaterialByAlmacen(id_almacen) {
    return ApiClient.get(`/almacenes/${id_almacen}/material`);
  },

  assignToAlmacen(id_almacen, data) {
    return ApiClient.post(`/almacenes/${id_almacen}/material`, data);
  },

  updateMaterialInAlmacen(id_almacen, id_material, data) {
    return ApiClient.put(`/almacenes/${id_almacen}/material/${id_material}`, data);
  },

  removeFromAlmacen(id_almacen, id_material) {
    return ApiClient.delete(`/almacenes/${id_almacen}/material/${id_material}`);
  }
};

export default MaterialApi;