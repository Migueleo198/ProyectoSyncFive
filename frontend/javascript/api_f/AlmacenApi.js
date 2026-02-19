import ApiClient from './ApiClient.js';

const AlmacenApi = {
  // En AlmacenApi.js, dentro del objeto exportado:
  getByInstalacion(id_instalacion) {
    return ApiClient.get(`/instalaciones/${id_instalacion}/almacenes`);
  }
};
export default AlmacenApi;