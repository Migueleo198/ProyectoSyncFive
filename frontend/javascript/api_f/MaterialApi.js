import ApiClient from './ApiClient.js';
import AlmacenApi from './AlmacenApi.js';

const MaterialApi = {
  // CRUD básico de materiales
  getAll() {
    return ApiClient.get('/materiales');
  },

  getById(id_material) {
    return ApiClient.get(`/materiales/${id_material}`);
  },

  create(data) {
    return ApiClient.post('/materiales', { ...data, estado: 'ALTA' });
  },

  update(id_material, data) {
    return ApiClient.put(`/materiales/${id_material}`, data);
  },

  delete(id_material) {
    return ApiClient.delete(`/materiales/${id_material}`);
  },

  // MATERIAL ASIGNADO A PERSONAS
  getMaterialByPersona(id_bombero) {
    return ApiClient.get(`/personas/${encodeURIComponent(id_bombero)}/material`);
  },

  assignToPersona(id_bombero, id_material, nserie) {
    return ApiClient.post(`/personas/${encodeURIComponent(id_bombero)}/material/${id_material}/${encodeURIComponent(nserie)}`);
  },

  removeFromPersona(id_bombero, id_material) {
    return ApiClient.delete(`/personas/${encodeURIComponent(id_bombero)}/material/${id_material}`);
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
    return AlmacenApi.getMateriales(id_instalacion, id_almacen);
  },

  assignToAlmacen(id_instalacion, id_almacen, data) {
    return AlmacenApi.addMaterial(id_instalacion, id_almacen, data);
  },

  updateMaterialInAlmacen(id_instalacion, id_almacen, id_material, data) {
    return AlmacenApi.updateMaterial(id_instalacion, id_almacen, id_material, data);
  },

  removeFromAlmacen(id_instalacion, id_almacen, id_material, n_serie = null) {
    return AlmacenApi.removeMaterial(id_instalacion, id_almacen, id_material, n_serie);
  },
  
  getCompleto() {
    return ApiClient.get('/materiales/completo');
  }
};

export default MaterialApi;
