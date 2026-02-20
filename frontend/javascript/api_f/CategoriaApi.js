import ApiClient from './ApiClient.js';

const CategoriaApi = {
  // Obtener todas las categorías
  getAll() {
    return ApiClient.get('/categorias');
  },

  // Crear una nueva categoría
  create(data) {
    return ApiClient.post('/categorias', data);
  },

  // Eliminar una categoría por ID
  delete(id_categoria) {
    return ApiClient.delete(`/categorias/${id_categoria}`);
  }
};

export default CategoriaApi;