import AvisoApi from '../api_f/AvisoApi.js';
import EmergenciaApi from '../api_f/EmergenciaApi.js';
import GuardiaApi from '../api_f/GuardiaApi.js';
import VehiculoApi from '../api_f/VehiculoApi.js';
import EdicionApi from '../api_f/EdicionApi.js';
import SalidaApi from '../api_f/SalidaApi.js';
import { API_BASE_PATH } from '../../config/apiConfig.js';
import { mostrarError, formatearFecha } from '../helpers/utils.js';


// ================================
// VERIFICAR SESIÓN
// ================================
async function verificarSesion() {
    try {
        const response = await fetch(`${API_BASE_PATH}/auth/me`, { credentials: 'include' });
        if (!response.ok) {
            window.location.href = '/login';
            return null;
        }
        const data = await response.json();
        const usuario = data.data?.user ?? data.data ?? data;

        sessionStorage.setItem('user', JSON.stringify(usuario));
        return usuario;
    } catch (e) {
        window.location.href = '/login';
        return null;
    }
}

// ================================
// FECHA ACTUAL
// ================================
function renderFecha() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date().toLocaleDateString('es-ES', options);
    document.getElementById('current-date').textContent = today;
}

// ================================
// HELPERS
// ================================
function extractData(response) {
    if (!response) return null;
    return response.data ?? response;
}

function getDisponibilidadBadge(disponibilidad) {
    if (disponibilidad === null || disponibilidad === undefined) {
        return `<span class="badge bg-secondary">—</span>`;
    }
    return (disponibilidad == 1 || disponibilidad === true)
        ? `<span class="badge bg-success">Operativo</span>`
        : `<span class="badge bg-danger">No disponible</span>`;
}

function showTableError(tbodyId, cols, msg = 'Error al cargar los datos') {
    const tbody = document.getElementById(tbodyId);
    if (tbody) tbody.innerHTML = `<tr><td colspan="${cols}" class="text-center text-muted">${msg}</td></tr>`;
}

// ================================
// STAT: EMERGENCIAS ACTIVAS
// CORRECCIÓN: comparar contra 'ACTIVA' (valor del DDL), no 'ABIERTA'
// ================================
async function loadEmergenciasActivas() {
    try {
        const res = await EmergenciaApi.getAll();
        const emergencias = extractData(res);
        if (!Array.isArray(emergencias)) { document.getElementById('stat-emergencias').textContent = '—'; return; }
        document.getElementById('stat-emergencias').textContent =
            emergencias.filter(e => e.estado?.toUpperCase() === 'ACTIVA').length;
    } catch (err) {
        document.getElementById('stat-emergencias').textContent = '—';
    }
}

// ================================
// STAT: PERSONAL DE GUARDIA
// ================================
async function loadPersonalGuardia() {
    try {
        const res = await GuardiaApi.getAll();
        
        const guardias = extractData(res);
        if (!Array.isArray(guardias)) { document.getElementById('stat-personal').textContent = '—'; return; }

        const ultimaGuardia = guardias.reduce((max, g) =>
            (g.id_guardia ?? 0) > (max.id_guardia ?? 0) ? g : max
        );
        const res2 = await GuardiaApi.getPersonsGuardia(ultimaGuardia.id_guardia);
        const personas = extractData(res2);
        document.getElementById('stat-personal').textContent = Array.isArray(personas) ? personas.length : '0';
    } catch (err) {
        document.getElementById('stat-personal').textContent = '—';
    }
}


// ================================
// STAT: VEHÍCULOS OPERATIVOS
// CORRECCIÓN: disponibilidad es TINYINT(1) — comparar con == 1
// ================================
async function loadVehiculosStat() {
    try {
        const res = await VehiculoApi.getAll();
        const vehiculos = extractData(res);
        if (!Array.isArray(vehiculos)) { document.getElementById('stat-vehiculos').textContent = '—'; return; }
        const operativos = vehiculos.filter(v => v.disponibilidad == 1 || v.disponibilidad === true).length;
        document.getElementById('stat-vehiculos').textContent = `${operativos}/${vehiculos.length}`;
    } catch (err) {
        document.getElementById('stat-vehiculos').textContent = '—';
    }
}


// ================================
// STAT: AVISOS RECIBIDOS
// ================================
async function loadAvisosStat(idBombero) {
    try {
        if (!idBombero) { document.getElementById('stat-avisos').textContent = '—'; return; }
        const res = await AvisoApi.getRecibidos(idBombero);
        const avisos = extractData(res);
        document.getElementById('stat-avisos').textContent = Array.isArray(avisos) ? avisos.length : '—';
    } catch (err) {
        document.getElementById('stat-avisos').textContent = '—';
    }
}


// ================================
// TABLA: AVISOS RECIENTES
// ================================
async function loadAvisosRecientes(idBombero) {
    const tbody = document.getElementById('tbody-avisos');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Cargando...</td></tr>`;

    try {
        if (!idBombero) { tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">Usuario no identificado</td></tr>`; return; }
        const res = await AvisoApi.getRecibidos(idBombero);
        const avisos = extractData(res);
        if (!Array.isArray(avisos) || !avisos.length) { tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">No hay avisos</td></tr>`; return; }
        tbody.innerHTML = avisos.slice(0, 5).map(a => `
            <tr>
                <td>${a.asunto ?? '—'}</td>
                <td><small class="text-muted">${formatearFecha(a.fecha)}</small></td>
                <td><small class="text-muted">${a.remitente ?? '—'}</small></td>
            </tr>`).join('');
    } catch (err) {
        showTableError('tbody-avisos', 3);
    }
}


// ================================
// TABLA: ESTADO DE VEHÍCULOS
// ================================
async function loadVehiculosEstado() {
    const tbody = document.getElementById('tbody-vehiculos');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Cargando...</td></tr>`;

    try {
        const res = await VehiculoApi.getAll();
        const vehiculos = extractData(res);
        if (!Array.isArray(vehiculos) || !vehiculos.length) { tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">No hay vehículos registrados</td></tr>`; return; }
        tbody.innerHTML = vehiculos.slice(0, 5).map(v => `
            <tr>
                <td>${v.matricula}${v.nombre ? ` <small class="text-muted">— ${v.nombre}</small>` : ''}</td>
                <td><small class="text-muted">${v.tipo ?? '—'}</small></td>
                <td>${getDisponibilidadBadge(v.disponibilidad)}</td>
            </tr>`).join('');
    } catch (err) {
        showTableError('tbody-vehiculos', 3);
    }
}

// ================================
// LISTA: PRÓXIMAS FORMACIONES
// ================================
async function loadProximasFormaciones() {
    const lista = document.getElementById('list-formaciones');
    if (!lista) return;
    lista.innerHTML = `<li class="list-group-item px-0 text-center text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Cargando...</li>`;

    try {
        const res = await EdicionApi.getAll();
        const ediciones = extractData(res);
        if (!Array.isArray(ediciones) || !ediciones.length) { lista.innerHTML = `<li class="list-group-item px-0 text-center text-muted">No hay formaciones próximas</li>`; return; }

        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        const proximas = ediciones
            .filter(e => e.f_inicio && new Date(e.f_inicio) >= hoy)
            .sort((a, b) => new Date(a.f_inicio) - new Date(b.f_inicio))
            .slice(0, 3);

        if (!proximas.length) { lista.innerHTML = `<li class="list-group-item px-0 text-center text-muted">No hay formaciones próximas</li>`; return; }

        lista.innerHTML = proximas.map(e => `
            <li class="list-group-item px-0">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${e.nombre_formacion ?? '—'}</h6>
                        <small class="text-muted">
                            ${e.horas ? `${e.horas}h` : ''}
                            ${e.horas && e.f_fin ? ' · ' : ''}
                            ${e.f_fin ? `Fin: ${formatearFecha(e.f_fin)}` : ''}
                        </small>
                    </div>
                    <span class="badge bg-primary">${formatearFecha(e.f_inicio)}</span>
                </div>
            </li>`).join('');
    } catch (err) {
        lista.innerHTML = `<li class="list-group-item px-0 text-center text-muted">Error al cargar formaciones</li>`;
    }
}


// ================================
// TABLA: ÚLTIMAS SALIDAS
// ================================
async function loadUltimasSalidas() {
    const tbody = document.getElementById('tbody-salidas');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Cargando...</td></tr>`;

    try {
        const res = await SalidaApi.getAll();
        const salidas = extractData(res);
        if (!Array.isArray(salidas) || !salidas.length) { tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">No hay salidas registradas</td></tr>`; return; }

        tbody.innerHTML = [...salidas]
            .sort((a, b) => new Date(b.f_salida) - new Date(a.f_salida))
            .slice(0, 3)
            .map(s => `
            <tr>
                <td>${s.matricula ?? '—'}</td>
                <td><small class="text-muted">${formatearFecha(s.f_salida)}</small></td>
                <td>${s.f_regreso
                    ? `<small class="text-muted">${formatearFecha(s.f_regreso)}</small>`
                    : `<span class="badge bg-warning text-dark">En curso</span>`
                }</td>
            </tr>`).join('');
    } catch (err) {
        showTableError('tbody-salidas', 3);
    }
}

// ──────────────────────────────────────────
// INIT
// ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const usuario = await verificarSesion();
    if (!usuario) return;

    renderFecha();

    const idBombero = usuario.id_bombero ?? null;

    await Promise.allSettled([
        loadEmergenciasActivas(),
        loadPersonalGuardia(),
        loadVehiculosStat(),
        loadAvisosStat(idBombero),
        loadAvisosRecientes(idBombero),
        loadVehiculosEstado(),
        loadProximasFormaciones(),
        loadUltimasSalidas(),
    ]);
});