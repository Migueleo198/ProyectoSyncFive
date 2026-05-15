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

  assignToVehiculo(matricula, id_material, data) {
    return ApiClient.post(`/vehiculos/${matricula}/materiales/${id_material}`, data);
  },

  updateMaterialInVehiculo(matricula, id_material, data) {
    return ApiClient.put(`/vehiculos/${matricula}/materiales/${id_material}`, data);
  },

  removeFromVehiculo(matricula, id_material) {
    return ApiClient.delete(`/vehiculos/${matricula}/materiales/${id_material}`);
  },

  // MATERIAL EN ALMACÉN
  getMaterialByAlmacen(id_instalacion, id_almacen) {
    return ApiClient.get(`/instalaciones/${id_instalacion}/almacenes/${id_almacen}/materiales`);
  },

  assignToAlmacen(id_instalacion, id_almacen, data) {
    return ApiClient.post(`/instalaciones/${id_instalacion}/almacenes/${id_almacen}/materiales`, data);
  },

  updateMaterialInAlmacen(id_instalacion, id_almacen, id_material, data) {
    return ApiClient.put(`/instalaciones/${id_instalacion}/almacenes/${id_almacen}/materiales/${id_material}`, data);
  },

  removeFromAlmacen(id_instalacion, id_almacen, id_material) {
    return ApiClient.delete(`/instalaciones/${id_instalacion}/almacenes/${id_almacen}/materiales/${id_material}`);
  },
  
  getCompleto() {
    return ApiClient.get('/materiales/completo');
  }
};

export default MaterialApi;
