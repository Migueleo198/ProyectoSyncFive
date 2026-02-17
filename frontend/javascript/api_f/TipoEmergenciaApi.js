import ApiClient from './ApiClient.js';

const TipoEmergenciaApi = {
  // Obtener todos los tipos de emergencia
  getAll() {
    return ApiClient.get('/tipos-emergencia');
  },

  // Obtener un tipo de emergencia por ID
  getById(idTipo) {
    return ApiClient.get(`/tipos-emergencia/${idTipo}`);
  },

  // Crear un nuevo tipo de emergencia
  create(data) {
    return ApiClient.post('/tipos-emergencia', data);
  },

  // Actualizar un tipo de emergencia por ID
  update(idTipo, data) {
    return ApiClient.put(`/tipos-emergencia/${idTipo}`, data);
  },

  // Eliminar un tipo de emergencia por ID
  delete(idTipo) {
    return ApiClient.delete(`/tipos-emergencia/${idTipo}`);
  }
};

export default TipoEmergenciaApi;
