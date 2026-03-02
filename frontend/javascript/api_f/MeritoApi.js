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
  }
};

export default MeritoApi;