
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

function normalizeUrl(url) {
    const anchor = document.createElement("a");
    anchor.href = url;
    return anchor.href;
}

function ensureStylesheet(href) {
    const normalizedHref = normalizeUrl(href);
    const existing = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find(link => {
        return normalizeUrl(link.href) === normalizedHref;
    });

    if (existing) {
        return existing;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
    return link;
}

function ensureScript(src, options = {}) {
    const normalizedSrc = normalizeUrl(src);
    const existing = Array.from(document.scripts).find(script => normalizeUrl(script.src) === normalizedSrc);

    if (existing) {
        return existing;
    }

    const script = document.createElement('script');
    script.src = src;

    if (options.type) {
        script.type = options.type;
    }

    if (options.defer) {
        script.defer = true;
    }

    document.head.appendChild(script);
    return script;
}

// Cargar CSS dinámicamente
function loadCSS(fileName) {
    return ensureStylesheet(getPath("css", fileName));
}

// Cargar favicon dinámicamente
function loadFavicon(faviconPath) {
    const href = `${BASE_PATH}/assets/img/${faviconPath}`;
    let link = document.querySelector('link[rel="icon"]');

    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        document.head.appendChild(link);
    }

    link.href = href;
}


// Obtener ruta de imágenes
function imgPath(fileName) {
    return getPath("img", fileName);
}

// ─────────────────────────────────────────────
// loadHead(): inyecta todo lo común del <head>
// Opciones disponibles:
//   layout:       boolean (default: true)  → carga header_footer.css, plantilla_css.css y header_footer.js
//   accessibility:boolean (default: false) → restaura alto contraste/tamano en paginas sin layout
//   filtroTabla:  boolean (default: true)  → carga script_filtro_tabla.js
//   extraCSS:     string[]  (default: [])  → CSS adicionales del proyecto (nombre de archivo)
//   fullcalendar: boolean (default: false) → carga FullCalendar CSS + JS
//   leaflet:      boolean (default: false) → carga Leaflet CSS + JS
function loadHead(title, options = {}) {

    const cfg = {
        layout:       true,
        accessibility:false,
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
    ensureStylesheet('https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css');

    // ── Bootstrap Icons
    ensureStylesheet('https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css');

    // ── Bootstrap Bundle JS
    ensureScript('https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js');

    // ── Favicon
    loadFavicon('favicon.png');

    // ── CSS y scripts del layout (header, sidebar, footer)
    const shouldLoadAccessibility = cfg.layout || cfg.accessibility;

    if (cfg.layout) {
        loadCSS('header_footer.css');
        loadCSS('plantilla_css.css');
        loadCSS('view-custom.css');

        // ── Breadcrumb
        ensureScript('/frontend/javascript/helpers/breadcrumb.js', { type: 'module' });
    }

    if (shouldLoadAccessibility) {
        loadCSS('altoContraste.css');
        ensureScript('/frontend/javascript/helpers/header_footer.js', { type: 'module' });
    }

    // ── CSS extra opcionales del proyecto
    cfg.extraCSS.forEach(css => loadCSS(css));

    // ── script_filtro_tabla.js
    if (cfg.filtroTabla) {
        ensureScript('/frontend/javascript/helpers/script_filtro_tabla.js', { defer: true });
    }

    // ── FullCalendar
    if (cfg.fullcalendar) {
        ensureStylesheet('https://cdn.jsdelivr.net/npm/fullcalendar@latest/main.min.css');
        ensureScript('https://cdn.jsdelivr.net/npm/fullcalendar@latest/index.global.min.js');
    }

    // ── Leaflet
    if (cfg.leaflet) {
        ensureStylesheet('https://unpkg.com/leaflet/dist/leaflet.css');
        ensureScript('https://unpkg.com/leaflet/dist/leaflet.js');
    }
}
