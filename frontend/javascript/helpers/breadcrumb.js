// Mapa URL → nombre legible
const BREADCRUMB_NAMES = {
    // Raíz
    "home.html":                    "Inicio",

    // Páginas
    "vistaAlineacion.html":         "Alineación",
    "vistaAlmacen.html":            "Almacenes",
    "vistaAreaPersonal.html":       "Área Personal",
    "vistaAviso.html":              "Avisos",
    "vistaCalendario.html":         "Calendario",
    "vistaCarnet.html":             "Carnets",
    "vistaCuadranteAnual.html":     "Cuadrante Anual",
    "vistaCuadranteMensual.html":   "Cuadrante Mensual",
    "vistaEdicion.html":            "Ediciones",
    "vistaEmergencia.html":         "Emergencias",
    "vistaEmergenciaActiva.html":   "Emergencias Activas",
    "vistaTipoEmergencia.html":     "Tipos de Emergencia",
    "vistaFormacion.html":          "Formaciones",
    "vistaGuardia.html":            "Guardias",
    "vistaIncidencia.html":         "Incidencias",
    "vistaInstalacion.html":        "Instalaciones",
    "vistaMantenimiento.html":      "Mantenimiento",
    "vistaMapa.html":               "Mapa",
    "vistaCategoria.html":          "Categorías",
    "vistaMaterial.html":           "Materiales",
    "vistaMerito.html":             "Méritos",
    "vistaMotivo.html":             "Motivos",
    "vistaPermiso.html":            "Permisos",
    "vistaPersona.html":            "Personas",
    "vistaRol.html":                "Roles",
    "vistaSalida.html":             "Salidas",
    "vistaRefuerzo.html":           "Turnos de Refuerzo",
    "vistaVehiculo.html":           "Vehículos",
};

// Ruta absoluta al home
const HOME_PATH = "/frontend/pages/home.html";

function renderBreadcrumb() {
    const container = document.getElementById("breadcrumb-placeholder");
    if (!container) return;

    // Nombre del archivo actual
    const filename = window.location.pathname.split("/").pop();

    // Si estamos en el home no mostramos migas
    if (filename === "home.html") {
        container.innerHTML = "";
        return;
    }

    const pageName = BREADCRUMB_NAMES[filename] || filename;

    container.innerHTML = `
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb mb-0">
                <li class="breadcrumb-item">
                    <a href="${HOME_PATH}">
                        <i class="bi bi-house-door"></i> Inicio
                    </a>
                </li>
                <li class="breadcrumb-item active" aria-current="page">
                    ${pageName}
                </li>
            </ol>
        </nav>
    `;
}

// Funciona tanto si el DOM ya está listo como si no
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderBreadcrumb);
} else {
    renderBreadcrumb();
}