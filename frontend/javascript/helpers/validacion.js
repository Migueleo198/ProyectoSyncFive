// DNI
export function validarDNI(dni) {
    const dniRegex = /^[0-9]{8}[A-Z]$/;
    if (!dniRegex.test(dni)) return false;
    dni = dni.toUpperCase();
    
    const letras = "TRWAGMYFPDXBNJZSQVHLCKE";
    const numero = parseInt(dni.substring(0, 8), 10);
    const letraCorrecta = letras[numero % 23];

    return dni.charAt(8) === letraCorrecta;
}


// Es número (positivo)
export function validarNumero(valor) {
    if (valor === "" || valor === null) return false;
    return Number.isInteger(Number(valor)) && Number(valor) > 0;
}


// EMAIL
export function validarEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}


// F_FIN > F_INICIO
export function validarRangoFechas(fechaInicio, fechaFin) {
    if (!fechaInicio || !fechaFin) return false;

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) return false;

    return fin > inicio;
}

// Teléfono español: 9 dígitos, empieza por 6, 7, 8 o 9
export function validarTelefono(telefono) {
    if (!telefono) return false;
    const telRegex = /^[6789]\d{8}$/;
    return telRegex.test(telefono.trim());
}

// CONTRASEÑA
export function validarPassword(password) {
    if (!password) return false;
    const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    return PASSWORD_REGEX.test(password);
}


// CAMPOS CHECK
// PROVINCIAS
const PROVINCIAS_PENINSULA = [
    "ÁLAVA", "ALBACETE", "ALICANTE", "ALMERÍA", "ASTURIAS", "ÁVILA",
    "BADAJOZ", "BARCELONA", "BURGOS", "CÁCERES", "CÁDIZ", "CANTABRIA",
    "CASTELLÓN", "CIUDAD REAL", "CÓRDOBA", "CUENCA", "GERONA", "GRANADA",
    "GUADALAJARA", "GUIPÚZCOA", "HUELVA", "HUESCA", "JAÉN", "LA RIOJA",
    "LEÓN", "LÉRIDA", "LUGO", "MADRID", "MÁLAGA", "MURCIA", "NAVARRA",
    "OURENSE", "PALENCIA", "PONTEVEDRA", "SALAMANCA", "SEGOVIA", "SEVILLA",
    "SORIA", "TARRAGONA", "TERUEL", "TOLEDO", "VALENCIA", "VALLADOLID",
    "VIZCAYA", "ZAMORA", "ZARAGOZA"
];

// MATERIAL
const ESTADOS_MATERIAL = ["ALTA", "BAJA"];

// DISPONIBILIDAD
const DISPONIBILIDAD = ["SI", "NO"];

// EMERGENCIA
const EMERGENCIA = ["ABIERTA", "CERRADA"];

// PERMISO
const PERMISO = ["ACEPTADO", "REVISIÓN", "DENEGADO"];

// INCIDENCIA
const INCIDENCIA = ["ABIERTA", "CERRADA"];

// MANTENIMIENTO
const MANTENIMIENTO = ["ABIERTO", "REALIZADO"];

export function validarCheck(dato,rango) {
    dato=dato.toUpperCase();    
    return rango.includes(dato);
}


