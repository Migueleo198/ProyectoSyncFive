import ApiClient from './ApiClient.js';

/**
 * AreaPersonalApi.js
 * Métodos de API para el área personal del bombero.
 */
const AreaPersonalApi = {

    /**
     * Obtiene todos los datos y estadísticas del área personal en una sola llamada.
     */
    getStats(id_bombero) {
        return ApiClient.get(`/personas/${id_bombero}/stats`);
    },

    /**
     * Actualiza los datos editables de la persona (PATCH).
     * Campos permitidos: correo, telefono, telefono_emergencia,
     *   talla_superior, talla_inferior, talla_calzado,
     *   domicilio, localidad, nombre_usuario
     */
    updateDatosPersonales(id_bombero, data) {
        return ApiClient.patch(`/personas/${id_bombero}`, data);
    },

    /**
     * Sube la foto de perfil como multipart/form-data.
     * El backend debe tener el endpoint POST /personas/{id}/foto.
     */
    uploadFotoPerfil(id_bombero, file) {
        const formData = new FormData();
        formData.append('foto', file);
        return ApiClient.postFormData(`/personas/${id_bombero}/foto`, formData);
    },
};

export default AreaPersonalApi;