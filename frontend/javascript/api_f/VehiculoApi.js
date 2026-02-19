import ApiClient from './ApiClient.js';

const VehiculoApi = {
  getAll() {
    return ApiClient.get('/vehiculos');
  }
};
export default VehiculoApi;