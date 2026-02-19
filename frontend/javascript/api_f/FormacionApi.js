import ApiClient from './ApiClient.js';

const FormacionApi = {
  // Obtener todas las formaciones
  getAll() {
    return ApiClient.get('/formaciones');
  },

  // Obtener una formación específica por ID
  getById(idFormacion) {
    return ApiClient.get(`/formaciones/${idFormacion}`);
  },

  // Crear una nueva formación
  create(data) {
    return ApiClient.post('/formaciones', data);
  },

  // Actualizar una formación existente
  update(idFormacion, data) {
    return ApiClient.put(`/formaciones/${idFormacion}`, data);
  },

  // Eliminar una formación
  delete(idFormacion) {
    return ApiClient.delete(`/formaciones/${idFormacion}`);
  }
};

export default FormacionApi;
