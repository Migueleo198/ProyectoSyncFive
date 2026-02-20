import ApiClient from './ApiClient.js';

const EdicionApi = {
  getAll() {
    return ApiClient.get('/ediciones');
  },
  getById(idFormacion, idEdicion) {
    return ApiClient.get(`/ediciones/${idFormacion}/${idEdicion}`);
  },
  create(id_formacion, data) {
    return ApiClient.post(`/ediciones/${id_formacion}`, data);
  },
  update(idFormacion, idEdicion, data) {
    return ApiClient.put(`/ediciones/${idFormacion}/${idEdicion}`, data);
  },
  delete(idFormacion, idEdicion) {
    return ApiClient.delete(`/ediciones/${idFormacion}/${idEdicion}`);
  },

  // ── PERSONAS EN EDICIÓN ──
  getPersonas(idFormacion, idEdicion) {
    return ApiClient.get(`/ediciones/${idFormacion}/${idEdicion}/personas`);
  },
  setPersonas(idFormacion, idEdicion, data) {
    return ApiClient.post(`/ediciones/${idFormacion}/${idEdicion}/personas`, data);
  },
  deletePersona(idFormacion, idEdicion, idBombero) {
    return ApiClient.delete(`/ediciones/${idFormacion}/${idEdicion}/personas/${idBombero}`);
  }
};

export default EdicionApi;