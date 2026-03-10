import PersonaApi from '../api_f/PersonaApi.js';
import GuardiaApi from '../api_f/GuardiaApi.js';
import PermisoApi from '../api_f/PermisoApi.js';
import { authGuard } from '../helpers/authGuard.js';
// import TurnoRefuerzoApi from '../api_f/TurnoRefuerzoApi.js'; // TODO: activar cuando esté listo

// ================================
// CONSTANTES
// ================================
const MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const TIPOS = {
    guardia:          { color: 'success', label: 'Guardia' },
    turno:            { color: 'purple',  label: 'Turno de refuerzo' },
    permiso_aceptado: { color: 'primary', label: 'Permiso aceptado' },
    permiso_revision: { color: 'warning', label: 'Permiso en revisión' },
    permiso_denegado: { color: 'danger',  label: 'Permiso denegado' },
};

// ================================
// ESTADO
// ================================
let hoy             = new Date();
let year            = hoy.getFullYear();
let month           = hoy.getMonth();
let personas        = [];
let guardias        = [];
let guardiaPersonas = {};
let permisos        = [];
let fechaFiltroActiva = null;

// ================================
// INICIALIZACIÓN
// ================================
document.addEventListener('DOMContentLoaded', async () => {
    const sesion = await authGuard('cuadrantes');
    if (!sesion) return;

    actualizarTituloMes();
    configurarBotones();
    construirLeyenda();
    await cargarDatosIniciales();
    renderCuadrante();
});

// ================================
// LEYENDA
// ================================
function construirLeyenda() {
    const box = document.querySelector('.leyenda-box');
    if (!box) return;
    box.innerHTML = `
        <div class="d-flex flex-wrap gap-3 align-items-center p-2 bg-light rounded">
            ${Object.values(TIPOS).map(t => `
                <div class="d-flex align-items-center gap-2">
                    <span class="d-inline-block rounded"
                          style="width:18px;height:18px;background-color:var(--bs-${t.color})"></span>
                    <small class="text-dark">${t.label}</small>
                </div>
            `).join('')}
        </div>
    `;
}

// ================================
// NAVEGACIÓN MES / AÑO
// ================================
function actualizarTituloMes() {
    document.getElementById('monthYear').textContent = `${MONTH_NAMES[month]} ${year}`;
}

function configurarBotones() {
    document.getElementById('btnPrevYear')?.addEventListener('click', () => {
        year--; fechaFiltroActiva = null; actualizarTituloMes(); renderCuadrante();
    });
    document.getElementById('btnPrevMonth')?.addEventListener('click', () => {
        month--; if (month < 0) { month = 11; year--; }
        fechaFiltroActiva = null; actualizarTituloMes(); renderCuadrante();
    });
    document.getElementById('btnNextMonth')?.addEventListener('click', () => {
        month++; if (month > 11) { month = 0; year++; }
        fechaFiltroActiva = null; actualizarTituloMes(); renderCuadrante();
    });
    document.getElementById('btnNextYear')?.addEventListener('click', () => {
        year++; fechaFiltroActiva = null; actualizarTituloMes(); renderCuadrante();
    });
}

// ================================
// CARGAR DATOS INICIALES
// ================================
async function cargarDatosIniciales() {
    try {
        await Promise.all([cargarPersonas(), cargarGuardias(), cargarPermisos()]);
    } catch (e) {
        console.error('Error cargando datos:', e);
        mostrarError('Error al cargar los datos del cuadrante');
    }
}

async function cargarPersonas() {
    try {
        const res = await PersonaApi.getAll();
        personas = res.data || res || [];
    } catch (e) { mostrarError('Error cargando personas'); personas = []; }
}

async function cargarGuardias() {
    try {
        const res = await GuardiaApi.getAll();
        guardias = res.data || res || [];
        await cargarPersonasPorGuardia();
    } catch (e) { mostrarError('Error cargando guardias'); guardias = []; }
}

async function cargarPersonasPorGuardia() {
    const promesas = guardias.map(g =>
        GuardiaApi.getPersonGuardias(g.id_guardia)
            .then(res => ({ id_guardia: g.id_guardia, personas: Array.isArray(res.data) ? res.data : [] }))
            .catch(() => ({ id_guardia: g.id_guardia, personas: [] }))
    );
    const resultados = await Promise.all(promesas);
    guardiaPersonas = {};
    resultados.forEach(r => { guardiaPersonas[r.id_guardia] = r.personas; });
}

async function cargarPermisos() {
    try {
        const res = await PermisoApi.getAll();
        permisos = res.data || res || [];
    } catch (e) { mostrarError('Error cargando permisos'); permisos = []; }
}

// ================================
// RENDER PRINCIPAL
// ================================
function renderCuadrante() {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const tabla = document.querySelector('#calendario table');
    if (tabla) tabla.style.tableLayout = 'fixed';
    renderCabeceraDias(daysInMonth);
    renderFilasBomberos(daysInMonth);
}

// ================================
// CABECERA DE DÍAS
// ================================
function renderCabeceraDias(daysInMonth) {
    const daysHeader = document.getElementById('daysHeader');
    if (!daysHeader) return;
    const thNombre = daysHeader.querySelector('th:first-child');
    if (thNombre) { thNombre.style.minWidth = '100px'; thNombre.style.width = '100px'; }
    while (daysHeader.children.length > 1) daysHeader.removeChild(daysHeader.lastChild);
    for (let day = 1; day <= daysInMonth; day++) {
        const th = document.createElement('th');
        th.textContent = day;
        th.classList.add('text-center', 'p-1');
        th.style.minWidth = th.style.maxWidth = th.style.width = '42px';
        if (esDiaDeHoy(day)) th.classList.add('bg-primary', 'text-white');
        daysHeader.appendChild(th);
    }
}

// ================================
// FILAS DE BOMBEROS
// ================================
function renderFilasBomberos(daysInMonth) {
    const tbody = document.getElementById('calendarBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const bomberosActivos = getBomberosActivos();
    aplicarFiltroBomberos(bomberosActivos).forEach(persona => {
        tbody.appendChild(crearFilaBombero(persona, daysInMonth));
    });
    renderFilaTotales(daysInMonth, bomberosActivos);
}

function getBomberosActivos() {
    return personas
        .filter(p => p.activo === 1 || p.activo === true)
        .sort((a, b) => (a.id_bombero || '').localeCompare(b.id_bombero || ''));
}

function aplicarFiltroBomberos(bomberosActivos) {
    if (!fechaFiltroActiva) return bomberosActivos;
    return bomberosActivos.filter(p =>
        tieneBomberoGuardiaEnFecha(p.id_bombero, fechaFiltroActiva) &&
        !tieneBomberoPermisoAceptadoEnFecha(p.id_bombero, fechaFiltroActiva)
    );
}

function crearFilaBombero(persona, daysInMonth) {
    const tr = document.createElement('tr');
    const tdNombre = document.createElement('td');
    tdNombre.className = 'fw-bold';
    tdNombre.textContent = persona.id_bombero || '?';
    tdNombre.style.minWidth = tdNombre.style.width = '100px';
    tr.appendChild(tdNombre);
    for (let day = 1; day <= daysInMonth; day++) tr.appendChild(crearCeldaDia(persona.id_bombero, day));
    return tr;
}

function crearCeldaDia(idBombero, day) {
    const fecha  = getFecha(day);
    const td     = document.createElement('td');
    const eventos = obtenerEventosDia(idBombero, fecha);
    td.style.minWidth = td.style.maxWidth = td.style.width = '42px';
    td.style.overflow = 'hidden'; td.style.textAlign = 'center';
    if (eventos.length > 0) {
        td.className = getClaseEvento(eventos);
        td.setAttribute('data-fecha', fecha);
        td.setAttribute('data-bombero', idBombero);
        td.style.cursor = 'pointer';
        td.textContent = getTextoEvento(eventos, idBombero, fecha);
        td.addEventListener('click', e => { e.stopPropagation(); mostrarDetalleDia(idBombero, fecha); });
    } else if (esDiaDeHoy(day)) {
        td.classList.add('bg-primary', 'bg-opacity-10');
    }
    return td;
}

// ================================
// LÓGICA DE EVENTOS
// ================================
function obtenerEventosDia(idBombero, fecha) {
    const eventos = [];
    if (tieneBomberoGuardiaEnFecha(idBombero, fecha)) eventos.push('guardia');
    const permiso = getPermisoEnFecha(idBombero, fecha);
    if (permiso) {
        const estado = (permiso.estado || '').toUpperCase();
        eventos.push(estado === 'ACEPTADO' ? 'permiso_aceptado' : estado === 'REVISION' ? 'permiso_revision' : 'permiso_denegado');
    }
    return eventos;
}

function tieneBomberoGuardiaEnFecha(idBombero, fecha) {
    return guardias.some(g => {
        if ((g.fecha || '').substring(0, 10) !== fecha) return false;
        return (guardiaPersonas[g.id_guardia] || []).some(p => p.id_bombero == idBombero);
    });
}

function tieneBomberoPermisoAceptadoEnFecha(idBombero, fecha) {
    return permisos.some(p =>
        (p.fecha || '').substring(0, 10) === fecha && p.id_bombero == idBombero &&
        (p.estado || '').toUpperCase() === 'ACEPTADO'
    );
}

function getPermisoEnFecha(idBombero, fecha) {
    return permisos.find(p => (p.fecha || '').substring(0, 10) === fecha && p.id_bombero == idBombero) || null;
}

function getClaseEvento(eventos) {
    if (eventos.includes('permiso_revision')) return 'bg-warning text-dark text-center';
    if (eventos.includes('permiso_denegado')) return 'bg-danger text-white text-center';
    if (eventos.includes('permiso_aceptado')) return 'bg-primary text-white text-center';
    if (eventos.includes('guardia'))          return 'bg-success text-white text-center';
    if (eventos.includes('turno'))            return 'bg-purple text-white text-center';
    return 'text-center';
}

function getTextoEvento(eventos, idBombero, fecha) {
    const tieneGuardia = eventos.includes('guardia');
    if (eventos.includes('permiso_revision')) return tieneGuardia ? calcularHorasGuardia(idBombero, fecha) : '?';
    if (eventos.includes('permiso_denegado')) return tieneGuardia ? calcularHorasGuardia(idBombero, fecha) : '✗';
    if (eventos.includes('permiso_aceptado')) return '✓';
    if (tieneGuardia)                         return calcularHorasGuardia(idBombero, fecha);
    if (eventos.includes('turno'))            return 'R';
    return '';
}

function calcularHorasGuardia(idBombero, fecha) {
    let totalMinutos = 0;
    guardias.forEach(g => {
        if ((g.fecha || '').substring(0, 10) !== fecha) return;
        if (!(guardiaPersonas[g.id_guardia] || []).some(p => p.id_bombero == idBombero)) return;
        if (!g.h_inicio || !g.h_fin) return;
        const [hI, mI] = g.h_inicio.split(':').map(Number);
        const [hF, mF] = g.h_fin.split(':').map(Number);
        let fin = hF * 60 + mF, inicio = hI * 60 + mI;
        if (fin <= inicio) fin += 24 * 60;
        totalMinutos += fin - inicio;
    });
    if (totalMinutos <= 0) return 'G';
    const h = Math.floor(totalMinutos / 60), m = totalMinutos % 60;
    return m > 0 ? `${h}h${m}` : `${h}h`;
}

// ================================
// FILA DE TOTALES
// ================================
function renderFilaTotales(daysInMonth, bomberosActivos) {
    const tbody = document.getElementById('calendarBody');
    const trTotales = document.createElement('tr');
    trTotales.className = 'table-secondary fw-bold';
    const tdLabel = document.createElement('td');
    tdLabel.style.minWidth = tdLabel.style.width = '100px';
    trTotales.appendChild(tdLabel);
    for (let day = 1; day <= daysInMonth; day++) trTotales.appendChild(crearCeldaTotal(day, bomberosActivos));
    tdLabel.textContent = fechaFiltroActiva ? `filtro: ${fechaFiltroActiva} ✕` : 'total guardia';
    if (fechaFiltroActiva) {
        tdLabel.style.cursor = 'pointer';
        tdLabel.title = 'Clic para quitar filtro';
        tdLabel.addEventListener('click', () => { fechaFiltroActiva = null; renderCuadrante(); });
    }
    tbody.appendChild(trTotales);
}

function crearCeldaTotal(day, bomberosActivos) {
    const fecha = getFecha(day);
    const total = contarBomberosEnFecha(fecha, bomberosActivos);
    const td = document.createElement('td');
    td.textContent = total || '';
    td.className = 'text-center';
    td.style.minWidth = td.style.maxWidth = td.style.width = '42px';
    if (esDiaDeHoy(day)) td.classList.add('bg-primary', 'bg-opacity-10');
    if (total > 0) {
        td.style.cursor = 'pointer';
        td.title = 'Clic para filtrar / quitar filtro';
        if (fechaFiltroActiva === fecha) td.classList.add('bg-warning', 'text-dark');
        td.addEventListener('click', () => {
            fechaFiltroActiva = (fechaFiltroActiva === fecha) ? null : fecha;
            renderCuadrante();
        });
    }
    return td;
}

function contarBomberosEnFecha(fecha, bomberosActivos) {
    return bomberosActivos.filter(p =>
        tieneBomberoGuardiaEnFecha(p.id_bombero, fecha) &&
        !tieneBomberoPermisoAceptadoEnFecha(p.id_bombero, fecha)
    ).length;
}

// ================================
// DETALLE DEL DÍA (TOAST)
// ================================
function mostrarDetalleDia(idBombero, fecha) {
    const bombero = personas.find(p => p.id_bombero == idBombero);
    const nombreBombero = bombero ? `${bombero.nombre} ${bombero.apellidos || ''}`.trim() : idBombero;
    const guardiasDelDia = guardias.filter(g => {
        if ((g.fecha || '').substring(0, 10) !== fecha) return false;
        return (guardiaPersonas[g.id_guardia] || []).some(p => p.id_bombero == idBombero);
    });
    const permisosDelDia = permisos.filter(p => (p.fecha || '').substring(0, 10) === fecha && p.id_bombero == idBombero);
    const toastContainer = document.getElementById('toastContainer') || crearToastContainer();
    const toastId = 'toast-' + Date.now();
    toastContainer.insertAdjacentHTML('beforeend', `
        <div id="${toastId}" class="toast" role="alert" data-bs-autohide="true" data-bs-delay="8000">
            <div class="toast-header bg-primary text-white">
                <strong class="me-auto">Detalles - ${nombreBombero}</strong>
                <small>${fecha}</small>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">${generarContenidoDetalle(guardiasDelDia, permisosDelDia)}</div>
        </div>
    `);
    const toastElement = document.getElementById(toastId);
    new bootstrap.Toast(toastElement).show();
    toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
}

function crearToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = '2000';
    document.body.appendChild(container);
    return container;
}

function generarContenidoDetalle(guardiasDelDia, permisosDelDia) {
    if (!guardiasDelDia.length && !permisosDelDia.length) return '<p class="text-muted mb-0">Sin eventos para este día</p>';
    let html = '';
    guardiasDelDia.forEach(g => {
        html += `<div class="mb-2 pb-2 border-bottom"><span class="badge bg-success me-2">Guardia</span><span>${g.h_inicio || '??:??'} - ${g.h_fin || '??:??'}</span>${g.notas ? `<div class="text-muted small mt-1">${g.notas}</div>` : ''}</div>`;
    });
    permisosDelDia.forEach(p => {
        const badge = p.estado === 'ACEPTADO' ? 'bg-primary' : p.estado === 'REVISION' ? 'bg-warning text-dark' : 'bg-danger';
        html += `<div class="mb-2 pb-2 border-bottom"><span class="badge ${badge} me-2">Permiso</span><span>${p.estado}</span>${p.descripcion ? `<div class="text-muted small mt-1">${p.descripcion}</div>` : ''}</div>`;
    });
    return html;
}

// ================================
// UTILIDADES
// ================================
function getFecha(day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function esDiaDeHoy(day) {
    return year === hoy.getFullYear() && month === hoy.getMonth() && day === hoy.getDate();
}

// ================================
// ALERTAS
// ================================
function mostrarError(msg) { mostrarAlerta(msg, 'danger'); }
function mostrarExito(msg) { mostrarAlerta(msg, 'success'); }

function mostrarAlerta(msg, tipo) {
    const container = document.getElementById('alert-container');
    if (!container) return;
    const alertId = 'alert-' + Date.now();
    container.insertAdjacentHTML('beforeend', `
        <div id="${alertId}" class="alert alert-${tipo} alert-dismissible fade show shadow" role="alert">
            <strong>${tipo === 'danger' ? 'Error:' : 'Éxito:'}</strong> ${msg}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `);
    setTimeout(() => {
        const alert = document.getElementById(alertId);
        if (alert) { alert.classList.remove('show'); setTimeout(() => alert.remove(), 150); }
    }, 5000);
}

window.refrescarCuadrante = async function () {
    await cargarDatosIniciales(); renderCuadrante(); mostrarExito('Cuadrante actualizado correctamente');
};
window.CuadranteMensualController = { cargarDatosIniciales, renderCuadrante };