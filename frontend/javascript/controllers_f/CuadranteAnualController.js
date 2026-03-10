import GuardiaApi from '../api_f/GuardiaApi.js';
import PermisoApi from '../api_f/PermisoApi.js';
import PersonaApi from '../api_f/PersonaApi.js';
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
    guardia:          { color: 'success', label: 'Guardia',            bgClass: 'bg-success' },
    turno:            { color: 'purple',  label: 'Turno de refuerzo',  bgClass: 'bg-purple' },
    permiso_aceptado: { color: 'primary', label: 'Permiso aceptado',   bgClass: 'bg-primary' },
    permiso_revision: { color: 'warning', label: 'Permiso en revisión',bgClass: 'bg-warning' },
    permiso_denegado: { color: 'danger',  label: 'Permiso denegado',   bgClass: 'bg-danger' },
};

// ================================
// ESTADO
// ================================
let year            = new Date().getFullYear();
let modoVista       = 'individual';
let idBomberoActual = null;
let personas        = [];
let guardias        = [];
let permisos        = [];

// ================================
// INICIALIZACIÓN
// ================================
document.addEventListener('DOMContentLoaded', async () => {
    const sesion = await authGuard('cuadrantes');
    if (!sesion) return;

    construirControlesBase();
    construirLeyenda();
    await cargarDatosIniciales();
    renderCalendario();
});

// ================================
// CONSTRUIR CONTROLES BASE
// ================================
function construirControlesBase() {
    const placeholder = document.getElementById('year_elems_placeholder');
    if (!placeholder) return;
    placeholder.innerHTML = `
        <div class="d-flex align-items-center gap-2 flex-wrap">
            <div class="btn-group" role="group">
                <button class="btn btn-outline-secondary" id="btnPrevYear"><i class="bi bi-chevron-left"></i></button>
                <span id="currentYear" class="btn btn-outline-secondary disabled" style="min-width:80px">${year}</span>
                <button class="btn btn-outline-secondary" id="btnNextYear"><i class="bi bi-chevron-right"></i></button>
            </div>
            <div class="btn-group ms-2" role="group">
                <input type="radio" class="btn-check" name="modoVista" id="modoIndividual" value="individual" autocomplete="off" checked>
                <label class="btn btn-outline-primary" for="modoIndividual">Mi cuadrante</label>
                <input type="radio" class="btn-check" name="modoVista" id="modoGlobal" value="global" autocomplete="off">
                <label class="btn btn-outline-primary" for="modoGlobal">Global</label>
            </div>
            <select class="form-select form-select-sm w-auto" id="selectBombero" style="display:none;min-width:200px">
                <option value="">Seleccione un bombero...</option>
            </select>
        </div>
    `;
    document.getElementById('btnPrevYear')?.addEventListener('click', () => cambiarAnio(-1));
    document.getElementById('btnNextYear')?.addEventListener('click', () => cambiarAnio(1));
}

// ================================
// CARGAR DATOS INICIALES
// ================================
async function cargarDatosIniciales() {
    try {
        await cargarPersonas();
        detectarBomberoLogueado();
        configurarEventosVista();
        await cargarDatosCuadrante();
    } catch (e) {
        console.error('Error en carga inicial:', e);
        mostrarError('Error al cargar los datos iniciales');
    }
}

// ================================
// CARGAR PERSONAS
// ================================
async function cargarPersonas() {
    try {
        const res = await PersonaApi.getAll();
        personas = res.data || res || [];
        if (personas.length > 0) poblarSelectBomberos();
    } catch (e) { mostrarError('Error cargando personas'); personas = []; }
}

// ================================
// POBLAR SELECT DE BOMBEROS
// ================================
function poblarSelectBomberos() {
    const select = document.getElementById('selectBombero');
    if (!select) return;
    select.innerHTML = '<option value="">Seleccione un bombero...</option>';
    personas.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id_bombero;
        option.textContent = `${p.nombre} ${p.apellidos || ''} (${p.id_bombero})`.trim();
        select.appendChild(option);
    });
}

// ================================
// DETECTAR BOMBERO LOGUEADO
// ================================
function detectarBomberoLogueado() {
    try {
        const sesion = JSON.parse(sessionStorage.getItem('user') || 'null');
        idBomberoActual = sesion?.id_bombero || sesion?.id || null;
    } catch { idBomberoActual = null; }
}

// ================================
// CONFIGURAR EVENTOS DE VISTA
// ================================
function configurarEventosVista() {
    document.querySelectorAll('input[name="modoVista"]').forEach(r => {
        r.addEventListener('change', async (e) => {
            modoVista = e.target.value;
            const sel = document.getElementById('selectBombero');
            if (sel) { sel.style.display = modoVista === 'global' ? 'block' : 'none'; if (modoVista === 'global') sel.classList.add('ms-2'); }
            await cargarDatosCuadrante();
            renderCalendario();
        });
    });
    document.getElementById('selectBombero')?.addEventListener('change', async (e) => {
        await cargarDatosCuadrante(e.target.value || null);
        renderCalendario();
    });
}

// ================================
// CARGAR DATOS DEL CUADRANTE
// ================================
async function cargarDatosCuadrante(idBomberoFiltro = null) {
    const idFiltro = idBomberoFiltro || (modoVista === 'individual' ? idBomberoActual : null);
    let guardiasData = [], permisosData = [];
    try { const res = await GuardiaApi.getAll(); guardiasData = res.data || res || []; } catch (e) { mostrarError('Error cargando guardias'); }
    try { const res = await PermisoApi.getAll();  permisosData = res.data || res || []; } catch (e) { mostrarError('Error cargando permisos'); }
    if (idFiltro) {
        guardias = guardiasData.filter(g => g.id_bombero == idFiltro || (g.bomberos && g.bomberos.includes(idFiltro)));
        permisos = permisosData.filter(p => p.id_bombero == idFiltro);
    } else {
        guardias = guardiasData;
        permisos = permisosData;
    }
}

// ================================
// CONSTRUIR LEYENDA
// ================================
function construirLeyenda() {
    const box = document.querySelector('.leyenda-box');
    if (!box) return;
    box.innerHTML = `
        <div class="d-flex flex-wrap gap-3 align-items-center p-2 bg-light rounded">
            ${Object.values(TIPOS).map(t => `
                <div class="d-flex align-items-center gap-2">
                    <span class="d-inline-block rounded" style="width:18px;height:18px;background-color:var(--bs-${t.color})"></span>
                    <small class="text-dark">${t.label}</small>
                </div>
            `).join('')}
        </div>
    `;
}

// ================================
// RENDER CALENDARIO
// ================================
function renderCalendario() {
    const container = document.getElementById('calendar');
    if (!container) return;
    const yearElement = document.getElementById('currentYear');
    if (yearElement) yearElement.textContent = year;
    const mapa = construirMapaDias();
    container.innerHTML = '';
    container.classList.add('row', 'g-4');
    for (let m = 0; m < 12; m++) container.insertAdjacentHTML('beforeend', generarMes(m, year, mapa));
    document.querySelectorAll('td[data-fecha]').forEach(td => td.addEventListener('click', () => mostrarDetalleDia(td)));
    actualizarTablaDetalles();
}

// ================================
// CONSTRUIR MAPA DE DÍAS
// ================================
function construirMapaDias() {
    const mapa = {};
    const add = (fecha, tipo) => {
        if (!fecha) return;
        const key = fecha.substring(0, 10);
        if (!mapa[key]) mapa[key] = new Set();
        mapa[key].add(tipo);
    };
    guardias.forEach(g => add(g.fecha, 'guardia'));
    permisos.forEach(p => add(p.fecha, p.estado === 'ACEPTADO' ? 'permiso_aceptado' : p.estado === 'REVISION' ? 'permiso_revision' : 'permiso_denegado'));
    return mapa;
}

// ================================
// GENERAR MES
// ================================
function generarMes(month, y, mapa) {
    const FIRST_DAY = new Date(y, month, 1).getDay() || 7;
    const DAYS_IN_MONTH = new Date(y, month + 1, 0).getDate();
    let html = `
        <div class="col-xl-4 col-md-6">
            <div class="card shadow-sm">
                <div class="card-header gris text-white text-center py-2"><h6 class="mb-0">${MONTH_NAMES[month]} ${y}</h6></div>
                <div class="card-body p-0">
                    <table class="table table-bordered text-center mb-0">
                        <thead><tr class="table-dark"><th class="p-1">L</th><th class="p-1">M</th><th class="p-1">X</th><th class="p-1">J</th><th class="p-1">V</th><th class="p-1">S</th><th class="p-1">D</th></tr></thead>
                        <tbody>
    `;
    let day = 1;
    for (let row = 0; row < 6; row++) {
        html += '<tr>';
        for (let col = 1; col <= 7; col++) {
            if ((row === 0 && col < FIRST_DAY) || day > DAYS_IN_MONTH) {
                html += '<td class="p-2 bg-light"></td>';
            } else {
                const key = `${y}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const tipos = new Set(mapa[key] || []);
                html += `<td data-fecha="${key}" class="p-2 ${getTipoClass(tipos)} dia-celda" style="cursor:${tipos.size ? 'pointer' : 'default'}">${day}</td>`;
                day++;
            }
        }
        html += '</tr>';
        if (day > DAYS_IN_MONTH) break;
    }
    html += '</tbody></table></div></div></div>';
    return html;
}

// ================================
// CLASE PARA EL TIPO DE DÍA
// ================================
function getTipoClass(tipos) {
    if (tipos.has('guardia'))          return 'bg-success text-white';
    if (tipos.has('permiso_aceptado')) return 'bg-primary text-white';
    if (tipos.has('permiso_revision')) return 'bg-warning';
    if (tipos.has('permiso_denegado')) return 'bg-danger text-white';
    if (tipos.has('turno'))            return 'bg-purple text-white';
    return '';
}

// ================================
// DETALLE DEL DÍA (TOAST)
// ================================
function mostrarDetalleDia(td) {
    const fecha = td.dataset.fecha;
    if (!fecha) return;
    const guardiasDelDia = guardias.filter(g => (g.fecha || '').substring(0, 10) === fecha);
    const permisosDelDia = permisos.filter(p => (p.fecha || '').substring(0, 10) === fecha);
    const toastContainer = document.getElementById('toastContainer') || crearToastContainer();
    const toastId = 'toast-' + Date.now();
    toastContainer.insertAdjacentHTML('beforeend', `
        <div id="${toastId}" class="toast" role="alert" data-bs-autohide="true" data-bs-delay="8000">
            <div class="toast-header bg-primary text-white">
                <strong class="me-auto">Detalles del día</strong>
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
        html += `<div class="mb-2 pb-2 border-bottom"><span class="badge bg-success me-2">Guardia</span><span>${g.h_inicio || '??:??'} - ${g.h_fin || '??:??'}</span></div>`;
    });
    permisosDelDia.forEach(p => {
        const badgeClass = p.estado === 'ACEPTADO' ? 'bg-primary' : p.estado === 'REVISION' ? 'bg-warning text-dark' : 'bg-danger';
        html += `<div class="mb-2 pb-2 border-bottom"><span class="badge ${badgeClass} me-2">Permiso</span><span>${p.estado}</span></div>`;
    });
    return html;
}

// ================================
// TABLA DE DETALLES RESUMEN
// ================================
function actualizarTablaDetalles() {
    const tbody = document.querySelector('.detalles-table tbody');
    if (!tbody) return;
    let horasGuardia = 0;
    guardias.forEach(g => {
        if (g.h_inicio && g.h_fin) {
            const [hi, mi] = g.h_inicio.split(':').map(Number);
            const [hf, mf] = g.h_fin.split(':').map(Number);
            let diff = (hf * 60 + mf) - (hi * 60 + mi);
            if (diff < 0) diff += 24 * 60;
            horasGuardia += diff / 60;
        }
    });
    tbody.innerHTML = `
        <tr>
            <td class="text-center"><span class="badge bg-info">${guardias.length}</span></td>
            <td class="text-center"><span class="badge bg-success">${Math.round(horasGuardia)}h</span></td>
            <td class="text-center">-</td>
            <td class="text-center"><span class="badge bg-primary">${permisos.filter(p => p.estado === 'ACEPTADO').length}</span></td>
            <td class="text-center">-</td>
        </tr>
        <tr class="table-light">
            <td colspan="5" class="text-muted small px-3 py-2">
                <i class="bi bi-calendar3 me-1"></i> Año ${year}
                ${modoVista === 'individual' && idBomberoActual ? ` · <i class="bi bi-person me-1"></i>ID: ${idBomberoActual}` : ' · Vista global'}
            </td>
        </tr>
    `;
}

// ================================
// CAMBIAR AÑO
// ================================
async function cambiarAnio(delta) {
    year += delta;
    const selectBombero = document.getElementById('selectBombero');
    const idBomberoFiltro = modoVista === 'global' ? (selectBombero?.value || null) : idBomberoActual;
    await cargarDatosCuadrante(idBomberoFiltro);
    renderCalendario();
    mostrarExito(`Año cambiado a ${year}`);
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
            <i class="bi bi-${tipo === 'danger' ? 'exclamation-triangle' : 'check-circle'} me-2"></i>
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
    await cargarDatosIniciales(); renderCalendario(); mostrarExito('Cuadrante actualizado correctamente');
};
window.CuadranteMensualController = { cargarDatosIniciales, renderCalendario };