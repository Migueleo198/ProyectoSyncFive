/**
 * Archivo de configuración de rutas para el proyecto MVC
 * Estructura de rutas relativas organizadas por categorías
 */

const ROUTES = {
    // Configuración base
    BASE_URL: window.location.origin,
    API_BASE: '/api',

    // Rutas de Assets
    ASSETS: {
        CSS: {
            HEADER_FOOTER: '/public/assets/css/header_footer.css',
            PALETA_COLORES: '/public/assets/css/paleta_colores.css',
            PLANTILLA: '/public/assets/css/plantilla_css.css'
        },
        IMG: {
            LOGO: '/public/assets/img/Logo.jpg',
            IMAGES_1: '/public/assets/img/images1.png',
            IMAGES_2: '/public/assets/img/images.png'
        },
        JS: {
            CONFIG: '/public/assets/javascript/config.js',
            HEADER_FOOTER: '/public/assets/javascript/header_footer.js',
            MAIN: '/public/assets/javascript/main.js',
            FILTRO_TABLA: '/public/assets/javascript/script_filtro_tabla.js',
            VALIDACION: '/public/assets/javascript/validacion.js'
        }
    },

    // Rutas de Includes
    INCLUDES: {
        HEADER: '/public/includes/header.html',
        FOOTER: '/public/includes/footer.html',
        SIDEBAR: '/public/includes/sidebar.html'
    },

    // Rutas de Páginas/Vistas
    PAGES: {
        HOME: '/public/pages/home.html',
        ALINEACION: '/public/pages/Alineacion/vistaAlineacion.html',
        ALMACENES: '/public/pages/Almacenes/vistaAlmacenes.html',
        AREA_PERSONAL: '/public/pages/AreaPersonal/vistaAreaPersonal.html',
        AVISOS: '/public/pages/Avisos/vistaAvisos.html',
        CARNET: '/public/pages/Carnet/CarnetCRUD.html',
        EDICION: '/public/pages/Edicion/vistaEdiciones.html',
        EMERGENCIA: {
            LISTA: '/public/pages/Emergencia/vistaEmergencias.html',
            ACTIVAS: '/public/pages/Emergencia/vistaEmergenciasActivas.html',
            TIPO: '/public/pages/Emergencia/vistaTipoEmergencia.html'
        },
        FORMACION: '/public/pages/Formacion/vistaFormaciones.html',
        GUARDIA: {
            CRUD: '/public/pages/Guardia/GuardiaCRUD.html',
            CALENDARIO: '/public/pages/Guardia/calendario.html'
        },
        INCIDENCIAS: '/public/pages/Incidencias/vistaIncidancias.html',
        INSTALACIONES: '/public/pages/Instalaciones/vistaInstalaciones.html',
        MANTENIMIENTO: {
            VISTA: '/public/pages/Mantenimiento/vistaMantenimiento.html',
            JS: '/public/pages/Mantenimiento/mantenimiento.js'
        },
        MAPA: '/public/pages/Mapa/mapaEjemplo.html',
        MATERIALES: {
            LISTA: '/public/pages/Materiales/vistaMateriales.html',
            CATEGORIAS: '/public/pages/Materiales/vistaCategorias.html'
        },
        MOTIVO: '/public/pages/Motivo/permisoCRUD.html',
        PERMISO: '/public/pages/Permiso/permisoCRUD.html',
        PERSONA: '/public/pages/Persona/PersonaCRUD.html',
        SALIDAS: '/public/pages/Salidas/vistaSalidas.html',
        TURNO_REFUERZO: '/public/pages/TurnoRefuerzo/TurnoRefuerzoCRUD.html',
        VEHICULO: '/public/pages/Vehiculo/vistaVehiculo.html'
    },

    // Rutas de API/Controllers
    API: {
        ALMACEN: '/api/almacen',
        AUTH: '/api/auth',
        AVISO: '/api/aviso',
        CARNET: '/api/carnet',
        CATEGORIA: '/api/categoria',
        EDICION: '/api/edicion',
        EMERGENCIA: '/api/emergencia',
        FORMACION: '/api/formacion',
        GUARDIA: '/api/guardia',
        INCIDENCIA: '/api/incidencia',
        INSTALACION: '/api/instalacion',
        MANTENIMIENTO: '/api/mantenimiento',
        MATERIAL: '/api/material',
        MERITO: '/api/merito',
        MOTIVO: '/api/motivo',
        PERMISO: '/api/permiso',
        PERSONA: '/api/persona',
        ROL: '/api/rol',
        SALIDA: '/api/salida',
        TURNO: '/api/turno',
        VEHICULO: '/api/vehiculo'
    },

    // Rutas de errores
    ERROR: {
        403: '/errores/err403.html',
        404: '/errores/err404.html',
        500: '/errores/err500.html'
    },

    // Métodos Helper
    getFullUrl: function(relativePath) {
        return this.BASE_URL + relativePath;
    },

    getApiUrl: function(endpoint) {
        return this.BASE_URL + this.API_BASE + endpoint;
    },

    // Método para construir URLs con parámetros
    buildUrl: function(base, params = {}) {
        const url = new URL(this.getFullUrl(base));
        Object.keys(params).forEach(key => {
            url.searchParams.append(key, params[key]);
        });
        return url.toString();
    },

    // Método para obtener ruta de API específica
    getApiRoute: function(resource, id = null, action = null) {
        let route = this.API[resource.toUpperCase()];
        if (id) route += '/' + id;
        if (action) route += '/' + action;
        return route;
    }
};

// Exportar para uso en módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ROUTES;
}

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.ROUTES = ROUTES;
}

// Ejemplo de uso:
// const urlCarnet = ROUTES.PAGES.CARNET;
// const apiPersona = ROUTES.API.PERSONA;
// const fullUrl = ROUTES.getFullUrl(ROUTES.PAGES.HOME);
// const apiUrl = ROUTES.getApiUrl('/persona/1');
// const urlWithParams = ROUTES.buildUrl(ROUTES.API.PERSONA, { page: 1, limit: 10 });