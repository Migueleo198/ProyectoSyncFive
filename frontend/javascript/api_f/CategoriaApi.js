import ApiClient from './ApiClient.js';

const CategoriaApi = {
  getAll() {
    return ApiClient.get('/categorias');
  }
};
export default CategoriaApi;