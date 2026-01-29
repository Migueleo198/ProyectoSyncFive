// Rutas base relativas a la raíz del frontend
const BASE_PATH = ""; // Ajusta según tu servidor o entorno local

const PATHS = {
    css: `${BASE_PATH}/frontend/assets/css/`,
    js: `${BASE_PATH}/frontend/javascript/`,
    img: `${BASE_PATH}/frontend/assets/img/`,
    includes: `${BASE_PATH}/frontend/includes/`,
    pages: `${BASE_PATH}/frontend/pages/`
};

// Función para obtener ruta completa de un recurso
function getPath(type, fileName) {
    if (!PATHS[type]) {
        console.error(`Tipo de ruta desconocido: ${type}`);
        return "";
    }
    return PATHS[type] + fileName;
}

// Funciones de carga dinámica
function loadCSS(fileName) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = getPath("css", fileName);
    document.head.appendChild(link);
}

function loadJS(fileName) {
    const script = document.createElement("script");
    script.src = getPath("js", fileName);
    script.defer = true;
    document.head.appendChild(script);
}

function imgPath(fileName) {
    return getPath("img", fileName);
}
