import ApiClient from './ApiClient.js';

const EdicionApi = {
  // Obtener todas las ediciones
  getAll() {
    return ApiClient.get('/ediciones');
  },

  // Obtener una formación específica por ID
  getById(idFormacion,idEdicion) {
    return ApiClient.get(`/ediciones/${idFormacion}/${idEdicion}`);
  },

  // Crear una nueva formación
  create(id_formacion, data) {
    return ApiClient.post(`/ediciones/${id_formacion}`, data);
  },

  // Actualizar una formación existente
  update(idFormacion,idEdicion, data) {
    return ApiClient.put(`/ediciones/${idFormacion}/${idEdicion}`, data);
  },

  // Eliminar una formación
  delete(idFormacion,idEdicion) {
    return ApiClient.delete(`/ediciones/${idFormacion}/${idEdicion}`);
  }
};

export default EdicionApi;