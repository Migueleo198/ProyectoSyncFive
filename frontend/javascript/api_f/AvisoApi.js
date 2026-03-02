import ApiClient from './ApiClient.js';

const AvisoApi = {
    // AVISOS
    getAll() {
        return ApiClient.get('/avisos');
    },

    getById(idAviso) {
        return ApiClient.get(`/avisos/${idAviso}`);
    },

    create(data) {
        return ApiClient.post('/avisos', data);
    },

    remove(idAviso) {
        return ApiClient.delete(`/avisos/${idAviso}`);
    },

    // DESTINATARIOS
    
    getDestinatarios(idAviso) {
        return ApiClient.get(`/avisos/${idAviso}/destinatarios`);
    },

    setDestinatario(idAviso, idBombero) {
        return ApiClient.post(`/avisos/${idAviso}/destinatarios`, { id_bombero: idBombero });
    },

    deleteDestinatario(idAviso, idBombero) {
        return ApiClient.delete(`/avisos/${idAviso}/destinatarios/${idBombero}`);
    },

    // REMITENTES
    getRemitente(idAviso) {
        return ApiClient.get(`/avisos/${idAviso}/remitente`);
    },

    setRemitente(idAviso, idBombero) {
        return ApiClient.post(`/avisos/${idAviso}/remitente/${idBombero}`);
    },

    deleteRemitente(idAviso, idBombero) {
        return ApiClient.delete(`/avisos/${idAviso}/remitente/${idBombero}`);
    }

};

export default AvisoApi;
