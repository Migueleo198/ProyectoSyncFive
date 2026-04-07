import ApiClient from './ApiClient.js';

const CarnetApi = {
  getAll() {
    return ApiClient.get('/carnets');
  },

  getById(idCarnet) {
    return ApiClient.get(`/carnets/${idCarnet}`);
  },

  removePersonFromCarnet(idCarnet, idBombero) {
    return ApiClient.delete(`/carnets/${idCarnet}/personas/${idBombero}`);
  },

  create(data) {
    return ApiClient.post('/carnets', data);
  },

  update(idCarnet, data) {
    return ApiClient.put(`/carnets/${idCarnet}`, data);
  },

  remove(idCarnet) {
    return ApiClient.delete(`/carnets/${idCarnet}`);
  },

  getPersonsByCarnet(idCarnet) {
    return ApiClient.get(`/carnets/${idCarnet}/personas`);
  },

  assignToPerson(data) {
    return ApiClient.post('/carnets/asignar', {
      id_bombero: data.id_bombero,
      ID_Carnet: data.ID_Carnet,
      f_obtencion: data.f_obtencion,
      f_vencimiento: data.f_vencimiento
    });
  },

  unassignFromPerson(idCarnet, idBombero) {
    return ApiClient.delete(`/carnets/${idCarnet}/personas/${idBombero}`);
  }
};

export default CarnetApi;
