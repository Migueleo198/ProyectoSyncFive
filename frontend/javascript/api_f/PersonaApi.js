import ApiClient from './ApiClient.js';

const PersonaApi = {
    getAll() {
        return ApiClient.get('/personas');
    },
    getById(idBombero) {
        return ApiClient.get(`/personas/${idBombero}`);
    }
};

export default PersonaApi;