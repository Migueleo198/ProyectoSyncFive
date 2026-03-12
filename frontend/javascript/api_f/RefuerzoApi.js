import ApiClient from './ApiClient.js';

const RefuerzoApi = {
    getAll()              { return ApiClient.get('/refuerzos'); },
    getById(id_turno_refuerzo)     { return ApiClient.get(`/refuerzos/${id_turno_refuerzo}`); },
    create(data)          { return ApiClient.post('/refuerzos', data); },
    update(id_turno_refuerzo, data){ return ApiClient.put(`/refuerzos/${id_turno_refuerzo}`, data); },
    
    delete(id_turno_refuerzo)      { return ApiClient.delete(`/refuerzos/${id_turno_refuerzo}`); },

    getByFecha(fecha)     { return ApiClient.get(`/refuerzos/fecha/${fecha}`); },

    assignToPerson(id_bombero, id_turno_refuerzo) {
        return ApiClient.post(`/personas/${id_bombero}/turnos`, { id_bombero, id_turno_refuerzo });
    },
    unassignFromPerson(id_bombero, id_turno_refuerzo) {
        return ApiClient.delete(`/personas/${id_bombero}/turnos`, { id_bombero, id_turno_refuerzo });
    },
    getByPersona(id_bombero) {
        return ApiClient.get(`/personas/${id_bombero}/turnos`);
    }
};

export default RefuerzoApi;