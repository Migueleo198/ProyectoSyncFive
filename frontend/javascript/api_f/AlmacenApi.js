import ApiClient from './ApiClient.js';

const AlmacenApi = {
  getAll() {
    return ApiClient.get('/almacenes');
  },

  getById(id_instalacion, id_almacen) {
    return ApiClient.get(`/instalaciones/${id_instalacion}/almacenes/${id_almacen}`);
  },

  create(id_instalacion, data) {
    return ApiClient.post(`/instalaciones/${id_instalacion}/almacenes`, data);
  },

  update(id_instalacion, id_almacen, data) {
    return ApiClient.put(`/instalaciones/${id_instalacion}/almacenes/${id_almacen}`, data);
  },

  delete(id_instalacion, id_almacen) {
    return ApiClient.delete(`/instalaciones/${id_instalacion}/almacenes/${id_almacen}`);
  },

  getByInstalacion(id_instalacion) {
    return ApiClient.get(`/instalaciones/${id_instalacion}/almacenes`);
  }
};

export default AlmacenApi;
