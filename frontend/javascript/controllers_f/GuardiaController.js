import GuardiaApi from '../api_f/GuardiaApi.js';
import PersonaApi from '../api_f/PersonaApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { mostrarError, mostrarExito } from '../helpers/utils.js';
import { validarRangoFechas } from '../helpers/validacion.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';

let guardias = [];
let sesionActual = null;
const pagination = new PaginationHelper(15);
pagination.setLoadingCallback((isLoading) => {
    if (isLoading) {
        showTableLoading('#tabla tbody', 6);
    }
});

const paginacionVerGuardia = new PaginationHelper(8);
const paginacionEditGuardia = new PaginationHelper(8);
let personasVerGuardia = [];
let personasEditGuardia = [];

const cargos = [
    "BOMBERO1", "BOMBERO2", "BOMBERO3", "BOMBERO4", "BOMBERO5",
    "BOMBERO6", "BOMBERO7", "BOMBERO8", "BOMBERO9", "BOMBERO10",
    "OFICIAL1", "OFICIAL2", "CONDUCTOR1", "CONDUCTOR2"
];

const nombresCampos = ['Fecha', 'Hora Inicio', 'Hora Fin', 'Notas'];
const camposBd      = ['fecha', 'h_inicio', 'h_fin', 'notas'];

// ================================
// INICIALIZACIÓN
// ================================
document.addEventListener('DOMContentLoaded', async () => {
    sesionActual = await authGuard('guardias');
    if (!sesionActual) return;

    cargarGuardias();
    bindFiltros();
    bindModalVer();
    bindModalEditar();
    bindDiaCompletoGuardia(document.getElementById('formInsertarGuardia'));

    if (sesionActual.puedeEscribir) {
        bindCrearGuardia();
    }
});

// ================================
// CARGAR GUARDIAS
// ================================
async function cargarGuardias() {
    try {
        showTableLoading('#tabla tbody', 6);
        const res = await GuardiaApi.getAll();
        guardias = res?.data || res || [];
        pagination.setData(guardias, () => {
      renderTablaGuardias(guardias);
    });
        pagination.render('pagination-guardia');
        renderTablaGuardias(guardias);
    } catch (e) {
        guardias = [];
        pagination.setData([], () => {
      renderTablaGuardias([]);
    });
        pagination.render('pagination-guardia');
        renderTablaGuardias([]);
    }
}

// ================================
// FILTROS
// ================================
function bindFiltros() {
    document.getElementById('filtroFecha')?.addEventListener('change', aplicarFiltros);
    document.getElementById('filtroNotas')?.addEventListener('input', aplicarFiltros);
}

function aplicarFiltros() {
    pagination.goToPage(0);
    const filtroFecha = document.getElementById('filtroFecha')?.value ?? '';
    const filtroNotas = document.getElementById('filtroNotas')?.value.toLowerCase().trim() ?? '';

    const filtrados = guardias.filter(g => {
        const cumpleFecha = !filtroFecha || g.fecha === filtroFecha;
        const cumpleNotas = !filtroNotas || g.notas?.toLowerCase().includes(filtroNotas);
        return cumpleFecha && cumpleNotas;
    });
    pagination.setData(filtrados, () => {
      renderTablaGuardias(filtrados);
    });
    pagination.render('pagination-guardia');
    renderTablaGuardias(filtrados);
}

// ================================
// POBLAR SELECT CARGOS
// ================================
function crearOptionsCargos(seleccionado = '') {
    return '<option value="">Cargo...</option>' + cargos.map(c => {
        const selected = c === seleccionado ? ' selected' : '';
        return `<option value="${c}"${selected}>${c}</option>`;
    }).join('');
}

// ================================
// RENDER TABLA
// ================================
function renderTablaGuardias(lista) {
    const tbody = document.querySelector('#tabla tbody');
    tbody.innerHTML = '';

    const puedeEscribir = sesionActual?.puedeEscribir ?? false;
    const itemsPagina = pagination.getPageItems(lista);

    itemsPagina.forEach(g => {
        const tr = document.createElement('tr');

        const botonesAccion = puedeEscribir
            ? `<button type="button" class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${g.id_guardia}"><i class="bi bi-eye"></i></button>
               <button type="button" class="btn p-0 btn-editar" data-bs-toggle="modal" data-bs-target="#modalEditar" data-id="${g.id_guardia}"><i class="bi bi-pencil"></i></button>`
            : `<button type="button" class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${g.id_guardia}"><i class="bi bi-eye"></i></button>`;

        tr.innerHTML = `
            <td class="d-none d-md-table-cell">${g.id_guardia}</td>
            <td>${g.fecha}</td>
            <td>${g.h_inicio}</td>
            <td>${g.h_fin}</td>
            <td class="d-none d-md-table-cell">${g.notas || ''}</td>
            <td class="celda-acciones">
                <div class="acciones-tabla">
                    ${botonesAccion}
                </div>  
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ================================
// VALIDAR DATOS DE GUARDIA
// ================================
function validarDatosGuardia(data) {
    if (!data.fecha) {
        mostrarError('La fecha es obligatoria'); return false;
    }
    // CORRECCIÓN: validar formato de fecha
    if (isNaN(Date.parse(data.fecha))) {
        mostrarError('La fecha no tiene un formato válido'); return false;
    }
    if (!data.h_inicio) {
        mostrarError('La hora de inicio es obligatoria'); return false;
    }
    if (!data.h_fin) {
        mostrarError('La hora de fin es obligatoria'); return false;
    }
    // CORRECCIÓN: validar formato HH:MM para horas
    const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!horaRegex.test(data.h_inicio)) {
        mostrarError('La hora de inicio no tiene un formato válido (HH:MM)'); return false;
    }
    if (!horaRegex.test(data.h_fin)) {
        mostrarError('La hora de fin no tiene un formato válido (HH:MM)'); return false;
    }
    if (data.notas && data.notas.length > 500) {
        mostrarError('Las notas no pueden superar los 500 caracteres'); return false;
    }
    return true;
}

function bindDiaCompletoGuardia(form) {
    if (!form) return;

    const checkbox = form.querySelector('[name="dia_completo"]');
    const hInicio = form.querySelector('[name="h_inicio"]');
    const hFin = form.querySelector('[name="h_fin"]');

    if (!checkbox || !hInicio || !hFin) return;

    const aplicarDiaCompleto = () => {
        if (checkbox.checked) {
            aplicarHorasDiaCompleto(form);
            hInicio.readOnly = true;
            hFin.readOnly = true;
        } else {
            hInicio.readOnly = false;
            hFin.readOnly = false;
        }
    };

    checkbox.addEventListener('change', aplicarDiaCompleto);
    form.addEventListener('reset', () => setTimeout(aplicarDiaCompleto, 0));
    aplicarDiaCompleto();
}

function aplicarHorasDiaCompleto(form) {
    const hInicio = form?.querySelector('[name="h_inicio"]');
    const hFin = form?.querySelector('[name="h_fin"]');

    if (!hInicio || !hFin) return;

    hInicio.value = '08:00';
    hFin.value = '08:00';
}

function normalizarDiaCompletoAntesDeEnviar(form, data) {
    const diaCompleto = form?.querySelector('[name="dia_completo"]')?.checked ?? false;

    if (!diaCompleto) return;

    aplicarHorasDiaCompleto(form);
    data.h_inicio = '08:00';
    data.h_fin = '08:00';
}

function escaparHtml(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function esGuardiaDiaCompleto(guardia) {
    return (guardia.h_inicio || '').substring(0, 5) === '08:00'
        && (guardia.h_fin || '').substring(0, 5) === '08:00';
}

async function obtenerPersonasGuardia(idGuardia) {
    const res = await GuardiaApi.getPersonsGuardia(idGuardia);
    return res?.data || res || [];
}

function nombrePersonaAsignada(a) {
    const nombre = `${a.nombre || ''} ${a.apellidos || ''}`.trim();
    return nombre || a.id_bombero || '-';
}

function crearArmazonPersonasGuardia(editable, tbodyId, paginacionId) {
    const accionHeader = editable ? '<th class="text-center">Acción</th>' : '';
    return `
        <div class="mt-4">
            <h6 class="fw-bold">Personas asignadas</h6>
            <table class="table table-bordered table-striped table-sm">
                <thead class="table-dark">
                    <tr><th>ID</th><th>Nombre</th><th>Nº Funcionario</th><th>Cargo</th>${accionHeader}</tr>
                </thead>
                <tbody id="${tbodyId}"></tbody>
            </table>
            <div id="${paginacionId}" class="mt-2"></div>
        </div>`;
}

function filaPersonaGuardia(a, editable) {
    const accion = editable
        ? `<td class="text-center"><button type="button" class="btn btn-sm btn-outline-danger btn-desasignar-guardia" data-id-bombero="${a.id_bombero}" title="Desasignar persona"><i class="bi bi-person-dash"></i></button></td>`
        : '';
    return `
        <tr>
            <td>${a.id_bombero || '-'}</td>
            <td>${nombrePersonaAsignada(a)}</td>
            <td>${a.n_funcionario || '-'}</td>
            <td>${a.cargo || '-'}</td>
            ${accion}
        </tr>`;
}

function renderFilasVerGuardia() {
    const tbody = document.getElementById('tbodyPersonasVerGuardia');
    if (!tbody) return;
    if (!personasVerGuardia.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Sin personas asignadas</td></tr>';
        return;
    }
    tbody.innerHTML = paginacionVerGuardia.getPageItems(personasVerGuardia)
        .map(a => filaPersonaGuardia(a, false)).join('');
}

function renderFilasEditGuardia() {
    const tbody = document.getElementById('tbodyPersonasEditGuardia');
    if (!tbody) return;
    if (!personasEditGuardia.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Sin personas asignadas</td></tr>';
        return;
    }
    tbody.innerHTML = paginacionEditGuardia.getPageItems(personasEditGuardia)
        .map(a => filaPersonaGuardia(a, true)).join('');
}

async function crearOptionsPersonasAsignables() {
    const res = await PersonaApi.getAll();
    const personas = res?.data || res || [];

    return '<option value="">Persona...</option>' + personas.map(p => {
        const nombre = `${p.nombre || ''} ${p.apellidos || ''}`.trim();
        return `<option value="${p.id_bombero}">${p.n_funcionario || p.id_bombero} - ${nombre}</option>`;
    }).join('');
}

// ================================
// CREAR GUARDIA
// ================================
function bindCrearGuardia() {
    const form = document.getElementById('formInsertarGuardia');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = new FormData(form);
        const data = {
            fecha:    f.get('fecha'),
            h_inicio: f.get('h_inicio'),
            h_fin:    f.get('h_fin'),
            notas:    f.get('notas') || ''
        };
        normalizarDiaCompletoAntesDeEnviar(form, data);
        // CORRECCIÓN: validar antes de enviar
        if (!validarDatosGuardia(data)) return;
        try {
            await GuardiaApi.create(data);
            await cargarGuardias();
            form.reset();
            mostrarExito('Guardia creada correctamente. Abre el lápiz para asignar personas y que aparezca en el cuadrante.');
        } catch (err) {
            mostrarError(err.message || 'Error creando guardia');
        }
    });
}

// ================================
// MODAL VER
// ================================
function bindModalVer() {
    document.addEventListener('click', async function (e) {
        const btn = e.target.closest('.btn-ver');
        if (!btn) return;
        const guardia = guardias.find(g => g.id_guardia == btn.dataset.id);
        if (!guardia) return;
        const modalBody = document.getElementById('modalVerBody');
        modalBody.innerHTML = '';
        nombresCampos.forEach((nombre, i) => {
            const p = document.createElement('p');
            const strong = document.createElement('strong');
            strong.textContent = nombre + ': ';
            p.appendChild(strong);
            p.appendChild(document.createTextNode(guardia[camposBd[i]] || ''));
            modalBody.appendChild(p);
        });
        try {
            modalBody.insertAdjacentHTML('beforeend', crearArmazonPersonasGuardia(false, 'tbodyPersonasVerGuardia', 'pagination-ver-guardia'));
            personasVerGuardia = await obtenerPersonasGuardia(guardia.id_guardia);
            paginacionVerGuardia.setData(personasVerGuardia, () => renderFilasVerGuardia());
            paginacionVerGuardia.render('pagination-ver-guardia');
            renderFilasVerGuardia();
        } catch (error) {
            modalBody.insertAdjacentHTML('beforeend', '<p class="text-danger mt-3">Error cargando personas asignadas</p>');
        }
    });
}

// ================================
// MODAL EDITAR
// ================================
function bindModalEditar() {
    document.addEventListener('click', async function (e) {
        const btn = e.target.closest('.btn-editar');
        if (!btn) return;
        const id = btn.dataset.id;
        const response = await GuardiaApi.getById(id);
        const guardia = response.data;
        if (!guardia) return;
        const form = document.getElementById('formEditar');
        const personasOptions = await crearOptionsPersonasAsignables();
        form.innerHTML = `
            <div class="row mb-3">
                <div class="col-lg-4">
                    <label class="form-label">Fecha</label>
                    <input type="date" class="form-control" name="fecha" value="${guardia.fecha || ''}">
                </div>
                <div class="col-lg-4">
                    <label class="form-label">Hora inicio</label>
                    <input type="time" class="form-control" name="h_inicio" value="${guardia.h_inicio || ''}">
                </div>
                <div class="col-lg-4">
                    <label class="form-label">Hora fin</label>
                    <input type="time" class="form-control" name="h_fin" value="${guardia.h_fin || ''}">
                </div>
                <div class="col-12 mt-2">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="editar_dia_completo" name="dia_completo" ${esGuardiaDiaCompleto(guardia) ? 'checked' : ''}>
                        <label class="form-check-label" for="editar_dia_completo">Día completo (08:00 a 08:00 del día siguiente)</label>
                    </div>
                </div>
                <div class="col-12 mt-2">
                    <label class="form-label">Notas</label>
                    <textarea class="form-control" name="notas" rows="4" maxlength="500" style="resize: vertical;">${escaparHtml(guardia.notas)}</textarea>
                </div>
            </div>
            <div class="text-center">
                <button type="button" id="btnGuardarCambios" class="btn btn-primary">Guardar cambios</button>
            </div>

            <hr class="my-4">
            <h6 class="fw-bold">Personas asignadas a esta guardia</h6>
            <div class="row g-2 align-items-end mb-3">
                <div class="col-md-5">
                    <label class="form-label" for="asigGuardiaPersona">Persona</label>
                    <select class="form-select" id="asigGuardiaPersona">${personasOptions}</select>
                </div>
                <div class="col-md-5">
                    <label class="form-label" for="asigGuardiaCargo">Cargo</label>
                    <select class="form-select" id="asigGuardiaCargo">${crearOptionsCargos()}</select>
                </div>
                <div class="col-md-2">
                    <button type="button" class="btn btn-success w-100" id="btnAsignarPersonaGuardia">Asignar</button>
                </div>
            </div>
            <div id="tablaPersonasGuardia">
                ${crearArmazonPersonasGuardia(true, 'tbodyPersonasEditGuardia', 'pagination-edit-guardia')}
            </div>`;
        bindDiaCompletoGuardia(form);

        const refrescarPersonasGuardia = async () => {
            personasEditGuardia = await obtenerPersonasGuardia(id);
            paginacionEditGuardia.setData(personasEditGuardia, () => renderFilasEditGuardia());
            paginacionEditGuardia.render('pagination-edit-guardia');
            renderFilasEditGuardia();
        };
        await refrescarPersonasGuardia();

        form.querySelector('#btnAsignarPersonaGuardia').addEventListener('click', async () => {
            const id_bombero = form.querySelector('#asigGuardiaPersona').value;
            const cargo = form.querySelector('#asigGuardiaCargo').value;

            if (!id_bombero || !cargo) {
                mostrarError('Seleccione persona y cargo');
                return;
            }

            try {
                await GuardiaApi.assignToPerson({ id_bombero, id_guardia: id, cargo });
                form.querySelector('#asigGuardiaPersona').value = '';
                form.querySelector('#asigGuardiaCargo').value = '';
                await refrescarPersonasGuardia();
                await cargarGuardias();
                mostrarExito('Persona asignada correctamente');
            } catch (error) {
                mostrarError(error.message || 'Error asignando persona a guardia');
            }
        });

        form.querySelector('#tablaPersonasGuardia').addEventListener('click', async (event) => {
            const boton = event.target.closest('.btn-desasignar-guardia');
            if (!boton) return;

            const idBombero = boton.dataset.idBombero;
            if (!idBombero) {
                mostrarError('No se pudo identificar la persona a desasignar');
                return;
            }

            try {
                boton.disabled = true;
                await GuardiaApi.unassignFromPerson(idBombero, id);
                await refrescarPersonasGuardia();
                await cargarGuardias();
                mostrarExito('Persona desasignada correctamente');
            } catch (error) {
                boton.disabled = false;
                mostrarError(error.message || 'Error desasignando persona de guardia');
            }
        });

        document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
            const data = {};
            camposBd.forEach(c => {
                const input = form.querySelector(`[name="${c}"]`);
                if (input) data[c] = input.value;
            });
            normalizarDiaCompletoAntesDeEnviar(form, data);
            // CORRECCIÓN: validar antes de guardar
            if (!validarDatosGuardia(data)) return;
            await GuardiaApi.update(id, data);
            await cargarGuardias();
            bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
            mostrarExito('Guardia actualizada correctamente');
        });
    });
}
