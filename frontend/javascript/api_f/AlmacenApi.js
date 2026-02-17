import ApiClient from './ApiClient.js';

const AlmacenApi = {
  getAll() {
    return ApiClient.get('/almacenes');
  }
};
export default AlmacenApi;