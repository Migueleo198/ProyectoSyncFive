import RefuerzoApi from '../api_f/RefuerzoApi.js';
import PersonaApi from '../api_f/PersonaApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { mostrarError, mostrarExito } from '../helpers/utils.js';
import { validarNumero, validarRangoFechas } from '../helpers/validacion.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';

let refuerzos = [];
let sesionActual = null;
const pagination = new PaginationHelper(15);
pagination.setLoadingCallback((isLoading) => {
    if (isLoading) {
        showTableLoading('#tabla tbody', 5);
    }
});

const nombresCampos = ['ID Turno', 'Fecha Inicio', 'Fecha Fin', 'Horas'];
const camposBd = ['id_turno_refuerzo', 'f_inicio', 'f_fin', 'horas'];

document.addEventListener('DOMContentLoaded', () => {
    cargarRefuerzos();
    cargarSelectRefuerzos(null, 'ID_Turno_Refuerzo');
    cargarSelectPersonas(null, 'ID_persona');
    bindCrearRefuerzo();
    bindAsignarRefuerzo();
    bindFiltros();
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
    document.getElementById('filtroHoras')?.addEventListener('input', aplicarFiltros);
}

function aplicarFiltros() {
    pagination.goToPage(0);
    const filtroFecha = document.getElementById('filtroFecha')?.value ?? '';
    const filtroHoras = document.getElementById('filtroHoras')?.value.trim() ?? '';

    const filtrados = refuerzos.filter(r => {
        const cumpleFecha = !filtroFecha || r.f_inicio?.startsWith(filtroFecha);
        const cumpleHoras = !filtroHoras || String(r.horas) === String(filtroHoras);
        return cumpleFecha && cumpleHoras;
    });
    pagination.setData(filtrados, () => {
        renderTablaRefuerzos(filtrados);
    });
    pagination.render('pagination-refuerzo');
    renderTablaRefuerzos(filtrados);
}

// ================================
// CARGAR SELECTS
// ================================
async function cargarSelectRefuerzos(seleccionado, id_select) {
    const select = document.getElementById(id_select);
    if (!select) return;
    try {
    const res = await RefuerzoApi.getAll();
    select.innerHTML = '<option value="">Seleccione turno de refuerzo...</option>';
    (res?.data || res || []).forEach(r => {
            const option = document.createElement('option');
            option.value = r.id_turno_refuerzo;
            option.textContent = `${r.id_turno_refuerzo} - ${r.f_inicio} / ${r.f_fin}`;
            if (seleccionado && r.id_turno_refuerzo === seleccionado) option.selected = true;
            select.appendChild(option);
        });
    } catch (e) {
        mostrarError(e.message || 'Error cargando turnos de refuerzo');
    }
}

// ================================
// POBLAR SELECT PERSONAS
// ================================
async function cargarSelectPersonas(seleccionado, id_select) {
    const select = document.getElementById(id_select);
    if (!select) return;
    try {
    const res = await PersonaApi.getAll();
    select.innerHTML = '<option value="">Seleccione persona...</option>';
    (res?.data || res || []).forEach(p => {
            const option = document.createElement('option');
            option.value = p.id_bombero;
            option.textContent = `${p.n_funcionario} - ${p.nombre} ${p.apellidos}`;
            if (seleccionado && p.id_bombero === seleccionado) option.selected = true;
            select.appendChild(option);
        });
    } catch (e) {
        mostrarError(e.message || 'Error cargando personas');
    }
}

// ================================
// RENDER TABLA
// ================================
function renderTablaRefuerzos(lista) {
    const tbody = document.querySelector('#tabla tbody');
    tbody.innerHTML = '';

    const puedeEscribir = sesionActual?.puedeEscribir ?? false;
    const itemsPagina = pagination.getPageItems(lista);

    itemsPagina.forEach(r => {
        const tr = document.createElement('tr');

        const botonesAccion = puedeEscribir
            ? `<button type="button" class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${r.id_turno_refuerzo}"><i class="bi bi-eye"></i></button>
               <button type="button" class="btn p-0 btn-editar" data-bs-toggle="modal" data-bs-target="#modalEditar" data-id="${r.id_turno_refuerzo}"><i class="bi bi-pencil"></i></button>`
            : `<button type="button" class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${r.id_turno_refuerzo}"><i class="bi bi-eye"></i></button>`;

        tr.innerHTML = `
            <td class="d-none d-md-table-cell">${r.id_turno_refuerzo}</td>
            <td>${r.f_inicio}</td>
            <td>${r.f_fin}</td>
            <td>${r.horas || ''}</td>
            <td>
                <div class="d-flex justify-content-around">
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
function validarRefuerzo(f_inicio, f_fin, horas) {
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
    // horas INT NOT NULL CHECK (horas > 0)
    if (!validarNumero(horas)) {
        mostrarError('Las horas deben ser un número entero positivo.');
        return false;
    }
    return true;
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
        const horas    = f.get('horas');

        // ── Validación ──
        if (!validarRefuerzo(f_inicio, f_fin, horas)) return;

        try {
            await RefuerzoApi.create({ f_inicio, f_fin, horas: Number(horas) });
            await cargarRefuerzos();
            await cargarSelectRefuerzos(null, 'ID_Turno_Refuerzo');
            form.reset();
            mostrarExito('Turno de refuerzo creado correctamente');
        } catch (err) {
            mostrarError(err.message || 'Error creando turno de refuerzo');
        }
    });
}

// ================================
// ASIGNAR PERSONA A TURNO DE REFUERZO
// ================================
function bindAsignarRefuerzo() {
    const form = document.getElementById('formInsertarUsuario');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = new FormData(form);
        const id_bombero        = f.get('ID_persona');
        const id_turno_refuerzo = f.get('ID_Turno_Refuerzo');

        if (!id_bombero)        { mostrarError('Seleccione una persona.'); return; }
        if (!id_turno_refuerzo) { mostrarError('Seleccione un turno de refuerzo.'); return; }

        try {
            await RefuerzoApi.assignToPerson(id_bombero, id_turno_refuerzo);
            mostrarExito('Persona asignada al turno de refuerzo correctamente');
            form.reset();
            await cargarRefuerzos();
        } catch (err) {
            mostrarError(err.message || 'Error asignando persona al turno de refuerzo');
        }
    });
}

// ================================
// MODAL VER
// ================================
function bindModalVer() {
    document.addEventListener('click', function (e) {
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
        form.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-4">
                    <label class="form-label">Fecha inicio</label>
                    <input type="datetime-local" class="form-control" name="f_inicio" value="${refuerzo.f_inicio || ''}">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Fecha fin</label>
                    <input type="datetime-local" class="form-control" name="f_fin" value="${refuerzo.f_fin || ''}">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Horas</label>
                    <input type="number" class="form-control" name="horas" value="${refuerzo.horas || ''}">
                </div>
            </div>
            <div class="text-center">
                <button type="button" id="btnGuardarCambios" class="btn btn-primary">Guardar cambios</button>
            </div>
        `;

        document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
            const f_inicio = form.querySelector('[name="f_inicio"]').value;
            const f_fin    = form.querySelector('[name="f_fin"]').value;
            const horas    = form.querySelector('[name="horas"]').value;

            // ── Validación ──
            if (!validarRefuerzo(f_inicio, f_fin, horas)) return;

            try {
                await RefuerzoApi.update(id, { f_inicio, f_fin, horas: Number(horas) });
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
        const id         = this.dataset.id;
        const id_bombero = this.dataset.idBombero;
        try {
            if (id_bombero) await RefuerzoApi.unassignFromPerson(id_bombero, id);
            await cargarRefuerzos();
            bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
            mostrarExito('Turno de refuerzo eliminado correctamente');
        } catch (err) {
            mostrarError(err.message || 'Error eliminando turno de refuerzo');
        }
    });
}