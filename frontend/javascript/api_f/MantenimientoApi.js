import ApiClient from './ApiClient.js';

const MantenimientoApi = {

    // CRUD básico
    getAll() {
        return ApiClient.get('/mantenimientos');
    },
    getById(cod_mantenimiento) {
        return ApiClient.get(`/mantenimientos/${cod_mantenimiento}`);
    },
    create(data) {
        return ApiClient.post('/mantenimientos', data);
    },
    update(cod_mantenimiento, data) {
        return ApiClient.put(`/mantenimientos/${cod_mantenimiento}`, data);
    },
    delete(cod_mantenimiento) {
        return ApiClient.delete(`/mantenimientos/${cod_mantenimiento}`);
    },

};

export default MantenimientoApi;