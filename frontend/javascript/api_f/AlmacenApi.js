import ApiClient from './ApiClient.js';

const AlmacenApi = {
  // CRUD básico
  getAll() {
    return ApiClient.get('/almacenes');
  },

  getById(id) {
    return ApiClient.get(`/almacenes/${id}`);
  },

  create(data) {
    return ApiClient.post('/almacenes', data);
  },

  update(id, data) {
    return ApiClient.put(`/almacenes/${id}`, data);
  },

  delete(id) {
    return ApiClient.delete(`/almacenes/${id}`);
  },

  // Obtener almacenes por instalación
  getByInstalacion(id_instalacion) {
    return ApiClient.get(`/instalaciones/${id_instalacion}/almacenes`);
  },

  // Material en almacén
  getMateriales(id_almacen) {
    return ApiClient.get(`/almacenes/${id_almacen}/material`);
  },

  addMaterial(id_almacen, data) {
    return ApiClient.post(`/almacenes/${id_almacen}/material`, data);
  },

  updateMaterial(id_almacen, id_material, data) {
    return ApiClient.put(`/almacenes/${id_almacen}/material/${id_material}`, data);
  },

  removeMaterial(id_almacen, id_material, data) {
    return ApiClient.delete(`/almacenes/${id_almacen}/material/${id_material}`, { data });
  }
};

export default AlmacenApi;