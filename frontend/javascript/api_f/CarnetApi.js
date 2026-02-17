import ApiClient from './ApiClient.js';

const CarnetApi = {
  getAll() {
    return ApiClient.get('/carnets');
  },

  getById(idCarnet) {
    return ApiClient.get(`/carnets/${idCarnet}`);
  },

  create(data) {
    return ApiClient.post('/carnets', data);
  },

  update(idCarnet, data) {
    return ApiClient.put(`/carnets/${idCarnet}`, data);
  },

  remove(idCarnet) {
    return ApiClient.delete(`/carnets/${idCarnet}`);
  }
};

export default CarnetApi;
