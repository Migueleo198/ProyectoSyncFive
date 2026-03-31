import ApiClient from './ApiClient.js';

const MeritoApi = {
  getAll() {
    return ApiClient.get('/meritos');
  },

  create(data) {
    return ApiClient.post('/meritos', data);
  },

  remove(idMerito) {
    return ApiClient.delete(`/meritos/${idMerito}`);
  },
  getPersonsByMerito(id_merito) {
    return ApiClient.get(`/meritos/${id_merito}/personas`);
  },
  assignToPerson(data) {
      return ApiClient.post(`/meritos/asignar`, {
          id_bombero: data.id_bombero,
          id_merito: data.id_merito,
      });
  },
  unassignFromPerson(data) {
    return ApiClient.post(`/meritos/desasignar`, {
        id_bombero: data.id_bombero,
        id_merito: data.id_merito,
    });
  }
};

export default MeritoApi;
