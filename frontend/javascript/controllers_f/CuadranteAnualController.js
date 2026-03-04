import GuardiaApi from '../api_f/GuardiaApi.js';
import PermisoApi from '../api_f/PermisoApi.js';
import PersonaApi from '../api_f/PersonaApi.js';
// import TurnoRefuerzoApi from '../api_f/TurnoRefuerzoApi.js'; // TODO: activar cuando esté listo

// ============================================================
// CONSTANTES
// ============================================================
const MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const TIPOS = {
    guardia:          { color: '#2ecc71', label: 'Guardia' },
    permiso_aceptado: { color: '#3498db', label: 'Permiso aceptado' },
    permiso_revision: { color: '#868686', label: 'Permiso en revisión' },
    permiso_denegado: { color: '#e74c3c', label: 'Permiso denegado' },
    // turno:         { color: '#9b59b6', label: 'Turno de refuerzo' }, // TODO: activar cuando esté listo
    festivo:          { color: '#e67e22', label: 'Festivo' },
};

// ============================================================
// VARIABLES GLOBALES
// ============================================================
let year            = new Date().getFullYear();
let modoVista       = 'individual';
let idBomberoActual = null;
let personas        = [];
let guardias        = [];
let permisos        = [];
// let turnos       = []; // TODO: activar cuando esté listo

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    construirControlesBase();
    construirLeyenda();
    await cargarDatosIniciales();
    renderCalendario();
});

// ============================================================
// CONSTRUIR CONTROLES BASE
// ============================================================
function construirControlesBase() {
    const placeholder = document.getElementById('year_elems_placeholder');
    if (!placeholder) return;

    placeholder.innerHTML = `
        <button class="btn btn-outline-secondary" id="btnPrevYear">&lt;</button>
        <span id="currentYear" class="mb-0 fw-bold fs-5" style="min-width:60px;text-align:center">${year}</span>
        <button class="btn btn-outline-secondary" id="btnNextYear">&gt;</button>
        <div class="d-flex align-items-center gap-2 ms-4">
            <div class="form-check form-check-inline mb-0">
                <input class="form-check-input" type="radio" name="modoVista" id="modoIndividual" value="individual" checked>
                <label class="form-check-label" for="modoIndividual">Mi cuadrante</label>
            </div>
            <div class="form-check form-check-inline mb-0">
                <input class="form-check-input" type="radio" name="modoVista" id="modoGlobal" value="global">
                <label class="form-check-label" for="modoGlobal">Global</label>
            </div>
            <select class="form-select form-select-sm" id="selectBombero" style="display:none;min-width:200px">
                <option value="">Seleccione un bombero...</option>
            </select>
        </div>
    `;

    document.getElementById('btnPrevYear')?.addEventListener('click', () => cambiarAnio(-1));
    document.getElementById('btnNextYear')?.addEventListener('click', () => cambiarAnio(1));
}

// ============================================================
// CARGAR DATOS INICIALES
// ============================================================
async function cargarDatosIniciales() {
    try {
        await cargarPersonas();
        detectarBomberoLogueado();
        configurarEventosVista();
        await cargarDatosCuadrante();
    } catch (e) {
        console.error('Error en carga inicial:', e);
    }
}

// ============================================================
// CARGAR PERSONAS
// ============================================================
async function cargarPersonas() {
    try {
        const res = await PersonaApi.getAll();
        personas = res.data || res || [];
        if (personas.length > 0) poblarSelectBomberos();
    } catch (e) {
        mostrarError(e.message || 'Error cargando personas');
        personas = [];
    }
}

// ============================================================
// POBLAR SELECT DE BOMBEROS
// ============================================================
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

// ============================================================
// DETECTAR BOMBERO LOGUEADO
// ============================================================
function detectarBomberoLogueado() {
    try {
        const sesion = JSON.parse(sessionStorage.getItem('usuario') || localStorage.getItem('usuario') || 'null');
        idBomberoActual = sesion?.id_bombero || sesion?.id || null;
    } catch {
        idBomberoActual = null;
    }
}

// ============================================================
// CONFIGURAR EVENTOS DE VISTA
// ============================================================
function configurarEventosVista() {
    document.querySelectorAll('input[name="modoVista"]').forEach(r => {
        r.addEventListener('change', async (e) => {
            modoVista = e.target.value;
            const sel = document.getElementById('selectBombero');
            if (sel) sel.style.display = modoVista === 'global' ? 'block' : 'none';
            await cargarDatosCuadrante();
            renderCalendario();
        });
    });

    document.getElementById('selectBombero')?.addEventListener('change', async (e) => {
        await cargarDatosCuadrante(e.target.value || null);
        renderCalendario();
    });
}

// ============================================================
// CARGAR DATOS DEL CUADRANTE
// ============================================================
async function cargarDatosCuadrante(idBomberoFiltro = null) {
    const idFiltro = idBomberoFiltro || (modoVista === 'individual' ? idBomberoActual : null);

    let guardiasData = [];
    let permisosData = [];

    try {
        const res = await GuardiaApi.getAll();
        guardiasData = res.data || res || [];
    } catch (e) {
        mostrarError(e.message || 'Error cargando guardias');
    }

    try {
        const res = await PermisoApi.getAll();
        permisosData = res.data || res || [];
    } catch (e) {
        mostrarError(e.message || 'Error cargando permisos');
    }

    // TODO: activar cuando TurnoRefuerzoApi esté listo
    // try {
    //     const res = await TurnoRefuerzoApi.getAll();
    //     turnosData = res.data || res || [];
    // } catch (e) {
    //     mostrarError(e.message || 'Error cargando turnos de refuerzo');
    // }

    if (idFiltro) {
        guardias = guardiasData.filter(g =>
            g.id_bombero == idFiltro || (g.bomberos && g.bomberos.includes(idFiltro))
        );
        permisos = permisosData.filter(p => p.id_bombero == idFiltro);
        // turnos = turnosData.filter(...); // TODO
    } else {
        guardias = guardiasData;
        permisos = permisosData;
        // turnos = turnosData; // TODO
    }
}

// ============================================================
// CONSTRUIR LEYENDA
// ============================================================
function construirLeyenda() {
    const box = document.querySelector('.leyenda-box');
    if (!box) return;

    box.innerHTML = `
        <div class="d-flex flex-wrap gap-3 align-items-center px-3 py-2">
            ${Object.values(TIPOS).map(t => `
                <div class="d-flex align-items-center gap-1">
                    <span style="width:18px;height:18px;border-radius:3px;background:${t.color};display:inline-block;"></span>
                    <small>${t.label}</small>
                </div>
            `).join('')}
        </div>
    `;
}

// ============================================================
// RENDER CALENDARIO
// ============================================================
function renderCalendario() {
    const container = document.getElementById('calendar');
    if (!container) return;

    const yearElement = document.getElementById('currentYear');
    if (yearElement) yearElement.textContent = year;

    const mapa     = construirMapaDias();
    const festivos = getFestivos(year);

    container.innerHTML = '';
    for (let m = 0; m < 12; m++) {
        container.insertAdjacentHTML('beforeend', generarMes(m, year, mapa, festivos));
    }

    document.querySelectorAll('td[data-fecha]').forEach(td => {
        td.addEventListener('click', () => mostrarDetalleDia(td));
    });

    actualizarTablaDetalles();
}

// ============================================================
// FESTIVOS ARAGÓN
// ============================================================
function getFestivos(y) {
    return new Set([
        `${y}-01-01`, `${y}-01-06`, `${y}-04-23`, `${y}-05-01`,
        `${y}-08-15`, `${y}-10-12`, `${y}-11-01`, `${y}-12-06`,
        `${y}-12-08`, `${y}-12-25`,
    ]);
}

// ============================================================
// CONSTRUIR MAPA DE DÍAS
// ============================================================
function construirMapaDias() {
    const mapa = {};

    const add = (fecha, tipo) => {
        if (!fecha) return;
        const key = fecha.substring(0, 10);
        if (!mapa[key]) mapa[key] = new Set();
        mapa[key].add(tipo);
    };

    guardias.forEach(g => add(g.fecha, 'guardia'));

    permisos.forEach(p => {
        const tipo = p.estado === 'ACEPTADO' ? 'permiso_aceptado'
                   : p.estado === 'REVISION' ? 'permiso_revision'
                   : 'permiso_denegado';
        add(p.fecha, tipo);
    });

    // TODO: activar cuando TurnoRefuerzoApi esté listo
    // turnos.forEach(t => add(t.f_inicio || t.fecha || t.dia, 'turno'));

    return mapa;
}

// ============================================================
// GENERAR MES
// ============================================================
function generarMes(month, y, mapa, festivos) {
    const FIRST_DAY     = new Date(y, month, 1).getDay() || 7;
    const DAYS_IN_MONTH = new Date(y, month + 1, 0).getDate();

    let html = `
        <div class="col-xl-3 col-lg-4 col-md-6 mb-4">
            <table class="table table-bordered text-center align-middle mb-0">
                <thead class="table-dark">
                    <tr><th colspan="7">${MONTH_NAMES[month]} ${y}</th></tr>
                    <tr class="table-secondary">
                        <th>L</th><th>M</th><th>X</th><th>J</th><th>V</th>
                        <th style="color:#e74c3c">S</th><th style="color:#e74c3c">D</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let day = 1;
    for (let row = 0; row < 6; row++) {
        html += '<tr>';
        for (let col = 1; col <= 7; col++) {
            if ((row === 0 && col < FIRST_DAY) || day > DAYS_IN_MONTH) {
                html += '<td></td>';
            } else {
                const mm  = String(month + 1).padStart(2, '0');
                const dd  = String(day).padStart(2, '0');
                const key = `${y}-${mm}-${dd}`;
                const tipos = new Set(mapa[key] || []);
                if (festivos.has(key)) tipos.add('festivo');
                html += `<td data-fecha="${key}" style="${buildCellStyle(tipos)}" class="dia-celda">${day}</td>`;
                day++;
            }
        }
        html += '</tr>';
        if (day > DAYS_IN_MONTH) break;
    }

    html += '</tbody></table></div>';
    return html;
}

// ============================================================
// ESTILO DE CELDA
// ============================================================
function buildCellStyle(tipos) {
    let bg = '';
    if      (tipos.has('guardia'))          bg = TIPOS.guardia.color;
    else if (tipos.has('permiso_aceptado')) bg = TIPOS.permiso_aceptado.color;
    else if (tipos.has('permiso_revision')) bg = TIPOS.permiso_revision.color;
    else if (tipos.has('permiso_denegado')) bg = TIPOS.permiso_denegado.color;
    else if (tipos.has('festivo'))          bg = TIPOS.festivo.color;
    // else if (tipos.has('turno'))         bg = TIPOS.turno.color; // TODO

    const color = bg && isColorDark(bg) ? '#fff' : '#222';
    return `background:${bg || 'transparent'};color:${color};cursor:${tipos.size ? 'pointer' : 'default'};`;
}

function isColorDark(hex) {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

// ============================================================
// MOSTRAR DETALLE DEL DÍA
// ============================================================
function mostrarDetalleDia(td) {
    const fecha = td.dataset.fecha;
    if (!fecha) return;

    const guardiasDelDia = guardias.filter(g => (g.fecha || '').substring(0, 10) === fecha);
    const permisosDelDia = permisos.filter(p => (p.fecha || '').substring(0, 10) === fecha);
    // const turnosDelDia = turnos.filter(...); // TODO

    let html = `<div class="fw-bold mb-2">${fecha}</div>`;

    guardiasDelDia.forEach(g => {
        html += `<div class="mb-1">🟢 <b>Guardia</b> ${g.h_inicio || ''} - ${g.h_fin || ''}</div>`;
    });
    permisosDelDia.forEach(p => {
        html += `<div class="mb-1">🔵 <b>Permiso</b> (${p.estado})</div>`;
    });

    if (!guardiasDelDia.length && !permisosDelDia.length) {
        html += '<div class="text-muted">Sin eventos</div>';
    }

    let panel = document.getElementById('diaDetalle');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'diaDetalle';
        panel.className = 'position-fixed bottom-0 end-0 m-3 p-3 bg-white border rounded shadow';
        panel.style.cssText = 'z-index:2000;max-width:320px;font-size:13px';
        document.body.appendChild(panel);
    }

    panel.innerHTML = html + `
        <div class="mt-2 text-end">
            <button onclick="document.getElementById('diaDetalle').remove()" class="btn btn-sm btn-secondary">Cerrar</button>
        </div>`;

    clearTimeout(panel._timer);
    panel._timer = setTimeout(() => panel.remove(), 8000);
}

// ============================================================
// ACTUALIZAR TABLA DE DETALLES
// ============================================================
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
            <td>${guardias.length}</td>
            <td>${Math.round(horasGuardia)}h</td>
            <td>-</td>
            <td>${permisos.filter(p => p.estado === 'ACEPTADO').length}</td>
            <td>-</td>
        </tr>
        <tr>
            <td colspan="5" class="text-muted text-start px-2" style="font-size:11px">
                Año ${year}${modoVista === 'individual' && idBomberoActual ? ` · ID: ${idBomberoActual}` : ' · Vista global'}
            </td>
        </tr>
    `;
}

// ============================================================
// CAMBIAR AÑO
// ============================================================
async function cambiarAnio(delta) {
    year += delta;
    const selectBombero   = document.getElementById('selectBombero');
    const idBomberoFiltro = modoVista === 'global' ? (selectBombero?.value || null) : idBomberoActual;
    await cargarDatosCuadrante(idBomberoFiltro);
    renderCalendario();
}

// ============================================================
// ALERTAS
// ============================================================
function mostrarError(msg) {
    const container = document.getElementById('alert-container');
    if (!container) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show shadow" role="alert">
            <strong>Error:</strong> ${msg}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>`;
    container.appendChild(wrapper);
    setTimeout(() => wrapper.remove(), 5000);
}

function mostrarExito(msg) {
    const container = document.getElementById('alert-container');
    if (!container) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show shadow" role="alert">
            <strong>OK:</strong> ${msg}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>`;
    container.appendChild(wrapper);
    setTimeout(() => wrapper.remove(), 3000);
}

window.refrescarCuadrante = async function () {
    await cargarDatosIniciales();
    renderCalendario();
    mostrarExito('Cuadrante actualizado');
};