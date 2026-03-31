
// Rutas base relativas a la raíz del frontend
const BASE_PATH = "/frontend"; // Ajusta según tu servidor o entorno

const PATHS = {
    css: `${BASE_PATH}/assets/css/`,
    img: `${BASE_PATH}/assets/img/`,
    includes: `${BASE_PATH}/includes/`,
    pages: `${BASE_PATH}/pages/`
};

// Obtener ruta completa de un recurso
function getPath(type, fileName) {
    if (!PATHS[type]) {
        console.error(`Tipo de ruta desconocido: ${type}`);
        return "";
    }
    return PATHS[type] + fileName;
}

// Obtener ruta de página específica
function pagePath(fileName) {
    return getPath("pages", fileName);
}

// Cargar CSS dinámicamente
function loadCSS(fileName) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = getPath("css", fileName);
    document.head.appendChild(link);
}

// Cargar favicon dinámicamente
function loadFavicon(faviconPath) {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = `${BASE_PATH}/assets/img/${faviconPath}`;
    document.head.appendChild(link);
}


// Obtener ruta de imágenes
function imgPath(fileName) {
    return getPath("img", fileName);
}

// ─────────────────────────────────────────────
// loadHead(): inyecta todo lo común del <head>
// Opciones disponibles:
//   layout:       boolean (default: true)  → carga header_footer.css, plantilla_css.css y header_footer.js
//   filtroTabla:  boolean (default: true)  → carga script_filtro_tabla.js
//   extraCSS:     string[]  (default: [])  → CSS adicionales del proyecto (nombre de archivo)
//   fullcalendar: boolean (default: false) → carga FullCalendar CSS + JS
//   leaflet:      boolean (default: false) → carga Leaflet CSS + JS
function loadHead(title, options = {}) {

    const cfg = {
        layout:       true,
        filtroTabla:  true,
        extraCSS:     [],
        fullcalendar: false,
        leaflet:      false,
        ...options
    };

    // ── Título
    document.title = title;

    // ── Meta viewport
    if (!document.querySelector('meta[name="viewport"]')) {
        const meta = document.createElement('meta');
        meta.name    = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0';
        document.head.appendChild(meta);
    }

    // ── Bootstrap CSS
    const bsCss = document.createElement('link');
    bsCss.rel  = 'stylesheet';
    bsCss.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css';
    document.head.appendChild(bsCss);

    // ── Bootstrap Icons
    const bsIcons = document.createElement('link');
    bsIcons.rel  = 'stylesheet';
    bsIcons.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css';
    document.head.appendChild(bsIcons);

    // ── Bootstrap Bundle JS
    const bsJs = document.createElement('script');
    bsJs.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js';
    document.head.appendChild(bsJs);

    // ── Favicon
    loadFavicon('favicon.png');

    // ── CSS y scripts del layout (header, sidebar, footer)
    if (cfg.layout) {
        loadCSS('header_footer.css');
        loadCSS('plantilla_css.css');
        loadCSS('view-custom.css');

        const hf = document.createElement('script');
        hf.type = 'module';
        hf.src  = '/frontend/javascript/helpers/header_footer.js';
        document.head.appendChild(hf);

        // ── Breadcrumb
        const bc = document.createElement('script');
        bc.type = 'module';
        bc.src  = '/frontend/javascript/helpers/breadcrumb.js';
        document.head.appendChild(bc);
    }

    // ── CSS extra opcionales del proyecto
    cfg.extraCSS.forEach(css => loadCSS(css));

    // ── script_filtro_tabla.js
    if (cfg.filtroTabla) {
        const filtro = document.createElement('script');
        filtro.src   = '/frontend/javascript/helpers/script_filtro_tabla.js';
        filtro.defer = true;
        document.head.appendChild(filtro);
    }

    // ── FullCalendar
    if (cfg.fullcalendar) {
        const fcCss = document.createElement('link');
        fcCss.rel  = 'stylesheet';
        fcCss.href = 'https://cdn.jsdelivr.net/npm/fullcalendar@latest/main.min.css';
        document.head.appendChild(fcCss);

        const fcJs = document.createElement('script');
        fcJs.src = 'https://cdn.jsdelivr.net/npm/fullcalendar@latest/index.global.min.js';
        document.head.appendChild(fcJs);
    }

    // ── Leaflet
    if (cfg.leaflet) {
        const lfCss = document.createElement('link');
        lfCss.rel  = 'stylesheet';
        lfCss.href = 'https://unpkg.com/leaflet/dist/leaflet.css';
        document.head.appendChild(lfCss);

        const lfJs = document.createElement('script');
        lfJs.src = 'https://unpkg.com/leaflet/dist/leaflet.js';
        document.head.appendChild(lfJs);
    }
}