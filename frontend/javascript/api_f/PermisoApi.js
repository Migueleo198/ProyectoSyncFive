import ApiClient from './ApiClient.js';

const PermisoApi = {
  getAll() {
    return ApiClient.get('/permisos');
  },

  create(data) {
    return ApiClient.post('/permisos', data);
  },

  getPersonsByPermiso(id_permiso) {
      return ApiClient.get(`/permisos/${id_permiso}/personas`);
  },
  update(idPermiso, data) {
    return ApiClient.patch(`/permisos/${idPermiso}`, data);
  }
};

export default PermisoApi;
