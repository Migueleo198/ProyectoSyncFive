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
        return ApiClient.patch(`/personas/${id_bombero}/me`, data);
    },

    /**
     * Sube la foto de perfil como multipart/form-data.
     * El backend debe tener el endpoint POST /personas/{id}/foto.
     */
    uploadFotoPerfil(id_bombero, file) {
        const formData = new FormData();
        formData.append('foto', file);
        return ApiClient.patchFormData(`/personas/${id_bombero}/foto`, formData);
    },

    /**
     * Obtiene la foto de perfil como Object URL (blob).
     * Necesario porque la ruta está protegida por sesión y el navegador
     * no puede cargarla directamente en un <img src="...">.
     */
    async getFotoPerfil(filename) {
        const { API_BASE_PATH } = await import('../../config/apiConfig.js');
        const response = await fetch(`${API_BASE_PATH}/storage/fotos/${filename}`, {
            credentials: 'include'
        });
        if (!response.ok) return null;
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    },
};

export default AreaPersonalApi;