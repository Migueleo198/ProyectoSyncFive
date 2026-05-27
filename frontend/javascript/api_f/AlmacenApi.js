import ApiClient from './ApiClient.js';

const buildMaterialesPath = (id_instalacion, id_almacen, id_material = null, n_serie = null) => {
  const materialPath = id_material !== null && id_material !== undefined ? `/${id_material}` : '';
  const serialQuery = n_serie !== null && n_serie !== undefined && String(n_serie).trim() !== ''
    ? `?n_serie=${encodeURIComponent(n_serie)}`
    : '';

  return `/instalaciones/${id_instalacion}/almacenes/${id_almacen}/materiales${materialPath}${serialQuery}`;
};

const AlmacenApi = {
  // CRUD básico
  getAll() {
    return ApiClient.get('/almacenes');
  },

  getById(id_instalacion, id_almacen) {
    return ApiClient.get(`/instalaciones/${id_instalacion}/almacenes/${id_almacen}`);
  },

  create(id_instalacion, data) {
    return ApiClient.post(`/instalaciones/${id_instalacion}/almacenes`, data);
  },

  update(id_instalacion, id_almacen, data) {
    return ApiClient.put(`/instalaciones/${id_instalacion}/almacenes/${id_almacen}`, data);
  },

  delete(id_instalacion, id_almacen) {
    return ApiClient.delete(`/instalaciones/${id_instalacion}/almacenes/${id_almacen}`);
  },

  // Obtener almacenes por instalación
  getByInstalacion(id_instalacion) {
    return ApiClient.get(`/instalaciones/${id_instalacion}/almacenes`);
  },

  // Material en almacén
  getMateriales(id_instalacion, id_almacen) {
    return ApiClient.get(buildMaterialesPath(id_instalacion, id_almacen));
  },

  addMaterial(id_instalacion, id_almacen, data) {
    return ApiClient.post(buildMaterialesPath(id_instalacion, id_almacen), data);
  },

  updateMaterial(id_instalacion, id_almacen, id_material, data) {
    return ApiClient.put(buildMaterialesPath(id_instalacion, id_almacen, id_material), data);
  },

  removeMaterial(id_instalacion, id_almacen, id_material, n_serie = null) {
    return ApiClient.delete(buildMaterialesPath(id_instalacion, id_almacen, id_material, n_serie));
  }
};

export default AlmacenApi;
