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
  }
};

export default RolesApi;