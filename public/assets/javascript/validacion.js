// DNI
export function validarDNI(dni) {
    const dniRegex = /^[0-9]{8}[A-Z]$/;
    if (!dniRegex.test(dni)) return false;

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


// CONTRASEÑA
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export function validarPassword(password) {
    if (!password) return false;
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
const MANTENIMIENTO = ["ABIERT", "REALIZADO"];

export function validarCheck(dato,rango) {
    dato=dato.toUpperCase();    
    return rango.includes(dato);
}


