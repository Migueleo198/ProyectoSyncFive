import ApiClient from './ApiClient.js';

const MotivoApi = {
    getAll() {
        return ApiClient.get('/motivos');
    },
    getById(id) {
        return ApiClient.get(`/motivos/${id}`);
    },
    create(data) {
        return ApiClient.post('/motivos', data);
    },
    update(id, data) {
        return ApiClient.put(`/motivos/${id}`, data);
    },
    remove(id) {
        return ApiClient.delete(`/motivos/${id}`);
    }
};

export default MotivoApi;