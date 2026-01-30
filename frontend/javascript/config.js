// Rutas base relativas a la raíz del frontend
const BASE_PATH = "/frontend"; // Ajusta según tu servidor o entorno

const PATHS = {
    css: `${BASE_PATH}/assets/css/`,
    js: `${BASE_PATH}/javascript/`,
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

// Cargar JS dinámicamente
function loadJS(fileName) {
    const script = document.createElement("script");
    script.src = getPath("js", fileName);
    script.defer = false;
    document.head.appendChild(script); // mejor en body
}

// Obtener ruta de imágenes
function imgPath(fileName) {
    return getPath("img", fileName);
}
