import ApiClient from './ApiClient.js';

const RolesApi = {
  getAll() {
    return ApiClient.get('/roles');
  },

  create(data) {
    return ApiClient.post('/roles', data);
  },

  update(idRol, data) {
    return ApiClient.put(`/roles/${idRol}`, data);
  },

  delete(idRol) {
    return ApiClient.delete(`/roles/${idRol}`);
  },
  assignToPerson(data) {
      return ApiClient.post(`/roles/asignar`, {
          id_bombero: data.id_bombero,
          id_rol: data.id_rol,
      });
  }
};

export default RolesApi;