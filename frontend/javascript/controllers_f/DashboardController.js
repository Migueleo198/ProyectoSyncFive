import AvisoApi from '../api_f/AvisoApi.js';
import EmergenciaApi from '../api_f/EmergenciaApi.js';
import GuardiaApi from '../api_f/GuardiaApi.js';
import VehiculoApi from '../api_f/VehiculoApi.js';
import EdicionApi from '../api_f/EdicionApi.js';
import SalidaApi from '../api_f/SalidaApi.js';

// ──────────────────────────────────────────
// FECHA ACTUAL
// ──────────────────────────────────────────
function renderFecha() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date().toLocaleDateString('es-ES', options);
    document.getElementById('current-date').textContent = today;
}

// ──────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────

// La API siempre devuelve { status, message, data, timestamp }
// Esta función extrae el array/objeto de data de forma segura
function extractData(response) {
    if (!response) return null;
    return response.data ?? response;
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('es-ES');
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

// ──────────────────────────────────────────
// STAT: EMERGENCIAS ACTIVAS
// estado en BD: 'ACTIVA', 'CERRADA', 'FINALIZADA' (mayúsculas)
// ──────────────────────────────────────────
async function loadEmergenciasActivas() {
    try {
        const res = await EmergenciaApi.getAll();
        const emergencias = extractData(res);
        if (!Array.isArray(emergencias)) {
            document.getElementById('stat-emergencias').textContent = '—';
            return;
        }
        const activas = emergencias.filter(e =>
            e.estado && e.estado.toUpperCase() === 'ACTIVA'
        );
        document.getElementById('stat-emergencias').textContent = activas.length;
    } catch (err) {
        document.getElementById('stat-emergencias').textContent = '—';
        console.error('Error emergencias activas:', err);
    }
}

// ──────────────────────────────────────────
// STAT: PERSONAL DE GUARDIA HOY
// Guardia campos: id_guardia, fecha (DATE), h_inicio, h_fin, notas
// ──────────────────────────────────────────
async function loadPersonalGuardia() {
    try {
        const res = await GuardiaApi.getAll();
        const guardias = extractData(res);
        if (!Array.isArray(guardias)) {
            document.getElementById('stat-personal').textContent = '—';
            return;
        }

        // Cogemos la última guardia creada (id_guardia más alto)
        const ultimaGuardia = guardias.reduce((max, g) => {
            const idActual = g.id_guardia ?? g.ID_Guardia ?? 0;
            const idMax = max.id_guardia ?? max.ID_Guardia ?? 0;
            return idActual > idMax ? g : max;
        });

        const idGuardia = ultimaGuardia.id_guardia ?? ultimaGuardia.ID_Guardia;
        const res2 = await GuardiaApi.getPersonGuardias(idGuardia);
        const personas = extractData(res2);
        document.getElementById('stat-personal').textContent =
            Array.isArray(personas) ? personas.length : '0';
    } catch (err) {
        document.getElementById('stat-personal').textContent = '—';
        console.error('Error personal guardia:', err);
    }
}

// ──────────────────────────────────────────
// STAT: VEHÍCULOS OPERATIVOS
// disponibilidad: 1 = operativo, 0 = no disponible
// ──────────────────────────────────────────
async function loadVehiculosStat() {
    try {
        const res = await VehiculoApi.getAll();
        const vehiculos = extractData(res);
        if (!Array.isArray(vehiculos)) {
            document.getElementById('stat-vehiculos').textContent = '—';
            return;
        }
        const total = vehiculos.length;
        const operativos = vehiculos.filter(v => v.disponibilidad == 1 || v.disponibilidad === true).length;
        document.getElementById('stat-vehiculos').textContent = `${operativos}/${total}`;
    } catch (err) {
        document.getElementById('stat-vehiculos').textContent = '—';
        console.error('Error vehículos stat:', err);
    }
}

// ──────────────────────────────────────────
// STAT: TOTAL DE AVISOS
// ──────────────────────────────────────────
async function loadAvisosStat() {
    try {
        const res = await AvisoApi.getAll();
        const avisos = extractData(res);
        document.getElementById('stat-avisos').textContent =
            Array.isArray(avisos) ? avisos.length : '—';
    } catch (err) {
        document.getElementById('stat-avisos').textContent = '—';
        console.error('Error avisos stat:', err);
    }
}

// ──────────────────────────────────────────
// TABLA: AVISOS RECIENTES (últimos 5 por fecha)
// Columnas: asunto | fecha | remitente
// ──────────────────────────────────────────
async function loadAvisosRecientes() {
    const tbody = document.getElementById('tbody-avisos');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">
        <span class="spinner-border spinner-border-sm me-2"></span>Cargando...</td></tr>`;

    try {
        const res = await AvisoApi.getAll();
        const avisos = extractData(res);
        if (!Array.isArray(avisos) || avisos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">No hay avisos</td></tr>`;
            return;
        }

        const recientes = [...avisos]
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .slice(0, 5);

        tbody.innerHTML = recientes.map(a => `
            <tr>
                <td>${a.asunto ?? '—'}</td>
                <td><small class="text-muted">${formatDate(a.fecha)}</small></td>
                <td><small class="text-muted">${a.remitente ?? '—'}</small></td>
            </tr>
        `).join('');
    } catch (err) {
        showTableError('tbody-avisos', 3);
        console.error('Error avisos recientes:', err);
    }
}

// ──────────────────────────────────────────
// TABLA: ESTADO DE VEHÍCULOS (primeros 5)
// Columnas: matrícula + nombre | tipo | disponibilidad
// ──────────────────────────────────────────
async function loadVehiculosEstado() {
    const tbody = document.getElementById('tbody-vehiculos');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">
        <span class="spinner-border spinner-border-sm me-2"></span>Cargando...</td></tr>`;

    try {
        const res = await VehiculoApi.getAll();
        const vehiculos = extractData(res);
        if (!Array.isArray(vehiculos) || vehiculos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">No hay vehículos registrados</td></tr>`;
            return;
        }

        tbody.innerHTML = vehiculos.slice(0, 5).map(v => `
            <tr>
                <td>
                    ${v.matricula}
                    ${v.nombre ? `<small class="text-muted">— ${v.nombre}</small>` : ''}
                </td>
                <td><small class="text-muted">${v.tipo ?? '—'}</small></td>
                <td>${getDisponibilidadBadge(v.disponibilidad)}</td>
            </tr>
        `).join('');
    } catch (err) {
        showTableError('tbody-vehiculos', 3);
        console.error('Error vehículos estado:', err);
    }
}

// ──────────────────────────────────────────
// LISTA: PRÓXIMAS FORMACIONES (máx. 3)
// EdicionApi.getAll() → id_edicion, id_formacion, f_inicio, f_fin, horas, nombre_formacion
// ──────────────────────────────────────────
async function loadProximasFormaciones() {
    const lista = document.getElementById('list-formaciones');
    if (!lista) return;
    lista.innerHTML = `<li class="list-group-item px-0 text-center text-muted">
        <span class="spinner-border spinner-border-sm me-2"></span>Cargando...</li>`;

    try {
        const res = await EdicionApi.getAll();
        const ediciones = extractData(res);
        if (!Array.isArray(ediciones) || ediciones.length === 0) {
            lista.innerHTML = `<li class="list-group-item px-0 text-center text-muted">No hay formaciones próximas</li>`;
            return;
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const proximas = ediciones
            .filter(e => e.f_inicio && new Date(e.f_inicio) >= hoy)
            .sort((a, b) => new Date(a.f_inicio) - new Date(b.f_inicio))
            .slice(0, 3);

        if (proximas.length === 0) {
            lista.innerHTML = `<li class="list-group-item px-0 text-center text-muted">No hay formaciones próximas</li>`;
            return;
        }

        lista.innerHTML = proximas.map(e => `
            <li class="list-group-item px-0">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${e.nombre_formacion ?? '—'}</h6>
                        <small class="text-muted">
                            ${e.horas ? `${e.horas}h` : ''}
                            ${e.horas && e.f_fin ? ' · ' : ''}
                            ${e.f_fin ? `Fin: ${formatDate(e.f_fin)}` : ''}
                        </small>
                    </div>
                    <span class="badge bg-primary">${formatDate(e.f_inicio)}</span>
                </div>
            </li>
        `).join('');
    } catch (err) {
        lista.innerHTML = `<li class="list-group-item px-0 text-center text-muted">Error al cargar formaciones</li>`;
        console.error('Error formaciones:', err);
    }
}

// ──────────────────────────────────────────
// TABLA: ÚLTIMAS SALIDAS (últimas 3 por f_salida)
// Campos: id_registro, matricula, id_bombero, f_salida, f_regreso, km_inicio, km_fin
// ──────────────────────────────────────────
async function loadUltimasSalidas() {
    const tbody = document.getElementById('tbody-salidas');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">
        <span class="spinner-border spinner-border-sm me-2"></span>Cargando...</td></tr>`;

    try {
        const res = await SalidaApi.getAll();
        const salidas = extractData(res);
        if (!Array.isArray(salidas) || salidas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">No hay salidas registradas</td></tr>`;
            return;
        }

        const ultimas = [...salidas]
            .sort((a, b) => new Date(b.f_salida) - new Date(a.f_salida))
            .slice(0, 3);

        tbody.innerHTML = ultimas.map(s => `
            <tr>
                <td>${s.matricula ?? '—'}</td>
                <td><small class="text-muted">${formatDate(s.f_salida)}</small></td>
                <td>
                    ${s.f_regreso
                        ? `<small class="text-muted">${formatDate(s.f_regreso)}</small>`
                        : `<span class="badge bg-warning text-dark">En curso</span>`
                    }
                </td>
            </tr>
        `).join('');
    } catch (err) {
        showTableError('tbody-salidas', 3);
        console.error('Error últimas salidas:', err);
    }
}

// ──────────────────────────────────────────
// INIT
// ──────────────────────────────────────────
async function initDashboard() {
    renderFecha();

    await Promise.allSettled([
        loadEmergenciasActivas(),
        loadPersonalGuardia(),
        loadVehiculosStat(),
        loadAvisosStat(),
        loadAvisosRecientes(),
        loadVehiculosEstado(),
        loadProximasFormaciones(),
        loadUltimasSalidas(),
    ]);
}

document.addEventListener('DOMContentLoaded', initDashboard);