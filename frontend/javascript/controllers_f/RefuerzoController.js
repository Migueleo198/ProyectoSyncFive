import RefuerzoApi from '../api_f/RefuerzoApi.js';
import PersonaApi from '../api_f/PersonaApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { mostrarError, mostrarExito } from '../helpers/utils.js';
import { validarRangoFechas } from '../helpers/validacion.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';

let refuerzos = [];
let sesionActual = null;
const pagination = new PaginationHelper(15);
pagination.setLoadingCallback((isLoading) => {
    if (isLoading) {
        showTableLoading('#tabla tbody', 5);
    }
});

const paginacionVerRefuerzo = new PaginationHelper(8);
const paginacionEditRefuerzo = new PaginationHelper(8);
let personasVerRefuerzo = [];
let personasEditRefuerzo = [];

const nombresCampos = ['ID Turno', 'Fecha Inicio', 'Fecha Fin', 'Horas'];
const camposBd = ['id_turno_refuerzo', 'f_inicio', 'f_fin', 'horas'];

document.addEventListener('DOMContentLoaded', async () => {
    sesionActual = await authGuard('turnoRefuerzos');
    if (!sesionActual) return;

    cargarRefuerzos();
    bindFiltros();
    bindModalVer();
    bindModalEditar();

    if (sesionActual.puedeEscribir) {
        bindCrearRefuerzo();
    }

    if (sesionActual.puedeEliminar) {
        bindModalEliminar();
    }
});

// ================================
// CARGAR REFUERZOS
// ================================
async function cargarRefuerzos() {
    try {
    showTableLoading('#tabla tbody', 5);
    const res = await RefuerzoApi.getAll();
    refuerzos = res?.data || res || [];
        pagination.setData(refuerzos, () => {
        renderTablaRefuerzos(refuerzos);
    });
        pagination.render('pagination-refuerzo');
        renderTablaRefuerzos(refuerzos);
    } catch (e) {
        refuerzos = [];
        pagination.setData([], () => {
        renderTablaRefuerzos([]);
    });
        pagination.render('pagination-refuerzo');
        renderTablaRefuerzos([]);
    }
}

// ================================
// FILTROS
// ================================
function bindFiltros() {
    document.getElementById('filtroFecha')?.addEventListener('change', aplicarFiltros);
}

function aplicarFiltros() {
    pagination.goToPage(0);
    const filtroFecha = document.getElementById('filtroFecha')?.value ?? '';

    const filtrados = refuerzos.filter(r => {
        const cumpleFecha = !filtroFecha || r.f_inicio?.startsWith(filtroFecha);
        return cumpleFecha;
    });
    pagination.setData(filtrados, () => {
        renderTablaRefuerzos(filtrados);
    });
    pagination.render('pagination-refuerzo');
    renderTablaRefuerzos(filtrados);
}

// ================================
// RENDER TABLA
// ================================
function renderTablaRefuerzos(lista) {
    const tbody = document.querySelector('#tabla tbody');
    tbody.innerHTML = '';

    const puedeEscribir = sesionActual?.puedeEscribir ?? false;
    const puedeEliminar = sesionActual?.puedeEliminar ?? false;
    const itemsPagina = pagination.getPageItems(lista);

    itemsPagina.forEach(r => {
        const tr = document.createElement('tr');

        const botonVer = `<button type="button" class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${r.id_turno_refuerzo}"><i class="bi bi-eye"></i></button>`;
        const botonEditar = puedeEscribir
            ? `<button type="button" class="btn p-0 btn-editar" data-bs-toggle="modal" data-bs-target="#modalEditar" data-id="${r.id_turno_refuerzo}"><i class="bi bi-pencil"></i></button>`
            : '';
        const botonEliminar = puedeEliminar
            ? `<button type="button" class="btn p-0 btn-eliminar text-danger" data-bs-toggle="modal" data-bs-target="#modalEliminar" data-id="${r.id_turno_refuerzo}"><i class="bi bi-trash"></i></button>`
            : '';
        const botonesAccion = `${botonVer}${botonEditar}${botonEliminar}`;

        tr.innerHTML = `
            <td class="d-none d-md-table-cell">${r.id_turno_refuerzo}</td>
            <td>${r.f_inicio}</td>
            <td>${r.f_fin}</td>
            <td>${r.horas || ''}</td>
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
// VALIDAR TURNO DE REFUERZO
// Según DDL Turno_refuerzo:
//   f_inicio TIMESTAMP NOT NULL
//   f_fin    TIMESTAMP NOT NULL  CHECK (f_fin >= f_inicio)
//   horas    INT       NOT NULL  CHECK (horas > 0)
// ================================
function validarRefuerzo(f_inicio, f_fin) {
    if (!f_inicio) {
        mostrarError('La fecha de inicio es obligatoria.');
        return false;
    }
    if (!f_fin) {
        mostrarError('La fecha de fin es obligatoria.');
        return false;
    }
    // CHECK (f_fin >= f_inicio)
    if (!validarRangoFechas(f_inicio, f_fin)) {
        mostrarError('La fecha de fin debe ser igual o posterior a la fecha de inicio.');
        return false;
    }
    return true;
}

function toDatetimeLocal(valor) {
    if (!valor) return '';
    return String(valor).replace(' ', 'T').substring(0, 16);
}

async function obtenerPersonasRefuerzo(idRefuerzo) {
    const res = await RefuerzoApi.getPersonsRefuerzo(idRefuerzo);
    return res?.data || res || [];
}

function nombrePersonaAsignada(a) {
    const nombre = `${a.nombre || ''} ${a.apellidos || ''}`.trim();
    return nombre || a.id_bombero || '-';
}

function crearArmazonPersonasRefuerzo(editable, tbodyId, paginacionId) {
    const accionHeader = editable ? '<th class="text-center">Acción</th>' : '';
    return `
        <div class="mt-4">
            <h6 class="fw-bold">Personas asignadas</h6>
            <table class="table table-bordered table-striped table-sm">
                <thead class="table-dark">
                    <tr><th>ID</th><th>Nombre</th><th>Nº Funcionario</th>${accionHeader}</tr>
                </thead>
                <tbody id="${tbodyId}"></tbody>
            </table>
            <div id="${paginacionId}" class="mt-2"></div>
        </div>`;
}

function filaPersonaRefuerzo(a, editable) {
    const accion = editable
        ? `<td class="text-center"><button type="button" class="btn btn-sm btn-outline-danger btn-desasignar-refuerzo" data-id-bombero="${a.id_bombero}" title="Desasignar persona"><i class="bi bi-trash"></i></button></td>`
        : '';
    return `
        <tr>
            <td>${a.id_bombero || '-'}</td>
            <td>${nombrePersonaAsignada(a)}</td>
            <td>${a.n_funcionario || '-'}</td>
            ${accion}
        </tr>`;
}

function renderFilasVerRefuerzo() {
    const tbody = document.getElementById('tbodyPersonasVerRefuerzo');
    if (!tbody) return;
    if (!personasVerRefuerzo.length) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Sin personas asignadas</td></tr>';
        return;
    }
    tbody.innerHTML = paginacionVerRefuerzo.getPageItems(personasVerRefuerzo)
        .map(a => filaPersonaRefuerzo(a, false)).join('');
}

function renderFilasEditRefuerzo() {
    const tbody = document.getElementById('tbodyPersonasEditRefuerzo');
    if (!tbody) return;
    if (!personasEditRefuerzo.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Sin personas asignadas</td></tr>';
        return;
    }
    tbody.innerHTML = paginacionEditRefuerzo.getPageItems(personasEditRefuerzo)
        .map(a => filaPersonaRefuerzo(a, true)).join('');
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
// CREAR TURNO DE REFUERZO
// ================================
function bindCrearRefuerzo() {
    const form = document.getElementById('formInsertarTurnoRefuerzo');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = new FormData(form);
        const f_inicio = f.get('f_inicio');
        const f_fin    = f.get('f_fin');

        // ── Validación ──
        if (!validarRefuerzo(f_inicio, f_fin)) return;

        try {
            await RefuerzoApi.create({ f_inicio, f_fin });
            await cargarRefuerzos();
            form.reset();
            mostrarExito('Turno de refuerzo creado correctamente. Abre el lápiz para asignar personas.');
        } catch (err) {
            mostrarError(err.message || 'Error creando turno de refuerzo');
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
        const refuerzo = refuerzos.find(r => r.id_turno_refuerzo == btn.dataset.id);
        if (!refuerzo) return;
        const modalBody = document.getElementById('modalVerBody');
        modalBody.innerHTML = '';
        nombresCampos.forEach((nombre, i) => {
            const p = document.createElement('p');
            const strong = document.createElement('strong');
            strong.textContent = nombre + ': ';
            p.appendChild(strong);
            p.appendChild(document.createTextNode(refuerzo[camposBd[i]] || ''));
            modalBody.appendChild(p);
        });
        try {
            modalBody.insertAdjacentHTML('beforeend', crearArmazonPersonasRefuerzo(false, 'tbodyPersonasVerRefuerzo', 'pagination-ver-refuerzo'));
            personasVerRefuerzo = await obtenerPersonasRefuerzo(refuerzo.id_turno_refuerzo);
            paginacionVerRefuerzo.setData(personasVerRefuerzo, () => renderFilasVerRefuerzo());
            paginacionVerRefuerzo.render('pagination-ver-refuerzo');
            renderFilasVerRefuerzo();
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
        const response = await RefuerzoApi.getById(id);
        const refuerzo = response?.data || response;
        if (!refuerzo) return;

        const form = document.getElementById('formEditar');
        const personasOptions = await crearOptionsPersonasAsignables();

        form.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <label class="form-label">Fecha inicio</label>
                    <input type="datetime-local" class="form-control" name="f_inicio" value="${toDatetimeLocal(refuerzo.f_inicio)}">
                </div>
                <div class="col-md-6">
                    <label class="form-label">Fecha fin</label>
                    <input type="datetime-local" class="form-control" name="f_fin" value="${toDatetimeLocal(refuerzo.f_fin)}">
                </div>
            </div>
            <div class="text-center">
                <button type="button" id="btnGuardarCambios" class="btn btn-primary">Guardar cambios</button>
            </div>

            <hr class="my-4">
            <h6 class="fw-bold">Personas asignadas a este refuerzo</h6>
            <div class="row g-2 align-items-end mb-3">
                <div class="col-md-10">
                    <label class="form-label" for="asigRefuerzoPersona">Persona</label>
                    <select class="form-select" id="asigRefuerzoPersona">${personasOptions}</select>
                </div>
                <div class="col-md-2">
                    <button type="button" class="btn btn-success w-100" id="btnAsignarPersonaRefuerzo">Asignar</button>
                </div>
            </div>
            <div id="tablaPersonasRefuerzo">
                ${crearArmazonPersonasRefuerzo(true, 'tbodyPersonasEditRefuerzo', 'pagination-edit-refuerzo')}
            </div>
        `;

        const refrescarPersonasRefuerzo = async () => {
            personasEditRefuerzo = await obtenerPersonasRefuerzo(id);
            paginacionEditRefuerzo.setData(personasEditRefuerzo, () => renderFilasEditRefuerzo());
            paginacionEditRefuerzo.render('pagination-edit-refuerzo');
            renderFilasEditRefuerzo();
        };
        await refrescarPersonasRefuerzo();

        form.querySelector('#btnAsignarPersonaRefuerzo').addEventListener('click', async () => {
            const id_bombero = form.querySelector('#asigRefuerzoPersona').value;

            if (!id_bombero) {
                mostrarError('Seleccione una persona');
                return;
            }

            try {
                await RefuerzoApi.assignToPerson(id_bombero, id);
                form.querySelector('#asigRefuerzoPersona').value = '';
                await refrescarPersonasRefuerzo();
                await cargarRefuerzos();
                mostrarExito('Persona asignada correctamente');
            } catch (error) {
                mostrarError(error.message || 'Error asignando persona al turno de refuerzo');
            }
        });

        form.querySelector('#tablaPersonasRefuerzo').addEventListener('click', async (event) => {
            const boton = event.target.closest('.btn-desasignar-refuerzo');
            if (!boton) return;

            const idBombero = boton.dataset.idBombero;
            if (!idBombero) {
                mostrarError('No se pudo identificar la persona a desasignar');
                return;
            }

            try {
                boton.disabled = true;
                await RefuerzoApi.unassignFromPerson(idBombero, id);
                await refrescarPersonasRefuerzo();
                await cargarRefuerzos();
                mostrarExito('Persona desasignada correctamente');
            } catch (error) {
                boton.disabled = false;
                mostrarError(error.message || 'Error desasignando persona del turno de refuerzo');
            }
        });

        document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
            const f_inicio = form.querySelector('[name="f_inicio"]').value;
            const f_fin    = form.querySelector('[name="f_fin"]').value;

            // ── Validación ──
            if (!validarRefuerzo(f_inicio, f_fin)) return;

            try {
                await RefuerzoApi.update(id, { f_inicio, f_fin });
                await cargarRefuerzos();
                bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
                mostrarExito('Turno de refuerzo actualizado correctamente');
            } catch (err) {
                mostrarError(err.message || 'Error actualizando turno de refuerzo');
            }
        });
    });
}

// ================================
// MODAL ELIMINAR
// ================================
function bindModalEliminar() {
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.btn-eliminar');
        if (!btn) return;
        document.getElementById('btnConfirmarEliminar').dataset.id = btn.dataset.id;
    });

    document.getElementById('btnConfirmarEliminar')?.addEventListener('click', async function () {
        const id = this.dataset.id;
        try {
            await RefuerzoApi.delete(id);
            await cargarRefuerzos();
            bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
            mostrarExito('Turno de refuerzo eliminado correctamente');
        } catch (err) {
            mostrarError(err.message || 'Error eliminando turno de refuerzo');
        }
    });
}
