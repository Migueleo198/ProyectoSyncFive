import ApiClient from './ApiClient.js';

const PersonaApi = {
  getAll() {
    return ApiClient.get('/personas');
  },

  getById(idPersona) {
    return ApiClient.get(`/personas/${idPersona}`);
  },

  create(data) {
    return ApiClient.post('/personas', data);
  },

  update(idPersona, data) {
    return ApiClient.put(`/personas/${idPersona}`, data);
  },

  remove(idPersona) {
    return ApiClient.delete(`/personas/${idPersona}`);
  },
    // MATERIAL DE LA PERSONA
  getMaterial(idBombero) {
    return ApiClient.get(`/personas/${encodeURIComponent(idBombero)}/material`);
  },

  assignMaterial(idBombero, idMaterial, nserie) {
    return ApiClient.post(`/personas/${encodeURIComponent(idBombero)}/material/${idMaterial}/${encodeURIComponent(nserie)}`);
  },

  removeMaterial(idBombero, idMaterial) {
    return ApiClient.delete(`/personas/${encodeURIComponent(idBombero)}/material/${idMaterial}`);
  }
};

export default PersonaApi;
