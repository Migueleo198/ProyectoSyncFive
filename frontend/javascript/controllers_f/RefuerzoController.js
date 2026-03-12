import RefuerzoApi from '../api_f/RefuerzoApi.js';
import PersonaApi from '../api_f/PersonaApi.js';

let refuerzos = [];

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
        const res = await RefuerzoApi.getAll();
        refuerzos = res.data;
        renderTablaRefuerzos(refuerzos);
    } catch (e) {
        mostrarError(e.message || 'Error cargando turnos de refuerzo');
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
    const filtroFecha = document.getElementById('filtroFecha')?.value ?? '';
    const filtroHoras = document.getElementById('filtroHoras')?.value.trim() ?? '';

    renderTablaRefuerzos(refuerzos.filter(r => {
        const cumpleFecha = !filtroFecha || r.f_inicio?.startsWith(filtroFecha);
        const cumpleHoras = !filtroHoras || String(r.horas) === String(filtroHoras);
        return cumpleFecha && cumpleHoras;
    }));
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
        res.data.forEach(r => {
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

async function cargarSelectPersonas(seleccionado, id_select) {
    const select = document.getElementById(id_select);
    if (!select) return;
    try {
        const res = await PersonaApi.getAll();
        select.innerHTML = '<option value="">Seleccione persona...</option>';
        res.data.forEach(p => {
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
    lista.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="d-none d-md-table-cell">${r.id_turno_refuerzo}</td>
            <td>${r.f_inicio}</td>
            <td>${r.f_fin}</td>
            <td>${r.horas || ''}</td>
            <td class="d-flex justify-content-around">
                <button type="button" class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${r.id_turno_refuerzo}">
                    <i class="bi bi-eye"></i>
                </button>
                <button type="button" class="btn p-0 btn-editar" data-bs-toggle="modal" data-bs-target="#modalEditar" data-id="${r.id_turno_refuerzo}">
                    <i class="bi bi-pencil"></i>
                </button>
            </td>`;
        tbody.appendChild(tr);
    });
}

// ================================
// CREAR REFUERZO
// ================================
function bindCrearRefuerzo() {
    const form = document.getElementById('formInsertarTurnoRefuerzo');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = new FormData(form);
        const data = {
            f_inicio: f.get('f_inicio'),
            f_fin:    f.get('f_fin'),
            horas:    f.get('horas') || null
        };
        try {
            await RefuerzoApi.create(data);
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
// ASIGNAR REFUERZO
// ================================
function bindAsignarRefuerzo() {
    const form = document.getElementById('formInsertarUsuario');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = new FormData(form);
        const id_bombero = f.get('ID_persona');
        const id_turno_refuerzo = f.get('ID_Turno_Refuerzo');
        if (!id_bombero || !id_turno_refuerzo) {
            mostrarError('Seleccione turno de refuerzo y persona');
            return;
        }
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
// MODALES
// ================================
document.addEventListener('click', async (e) => {
    const btnVer = e.target.closest('.btn-ver');
    if (btnVer) {
        const id = btnVer.dataset.id;
        const refuerzo = refuerzos.find(r => r.id_turno_refuerzo == id);
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
    }

    const btnEditar = e.target.closest('.btn-editar');
    if (btnEditar) {
        const id = btnEditar.dataset.id;
        const response = await RefuerzoApi.getById(id);
        const refuerzo = response.data;
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
            </div>`;
        document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
            const data = {
                f_inicio: form.querySelector('[name="f_inicio"]').value,
                f_fin:    form.querySelector('[name="f_fin"]').value,
                horas:    form.querySelector('[name="horas"]').value || null
            };
            try {
                await RefuerzoApi.update(id, data);
                await cargarRefuerzos();
                bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
                mostrarExito('Turno de refuerzo actualizado correctamente');
            } catch (err) {
                mostrarError(err.message || 'Error actualizando turno de refuerzo');
            }
        });
    }

    const btnEliminar = e.target.closest('.btn-eliminar');
    if (btnEliminar) {
        document.getElementById('btnConfirmarEliminar').dataset.id = btnEliminar.dataset.id;
    }

    const btnConfirmar = e.target.closest('#btnConfirmarEliminar');
    if (btnConfirmar) {
        const id = btnConfirmar.dataset.id;
        try {
            const id_bombero = btnConfirmar.dataset.idBombero;
            if (id_bombero) await RefuerzoApi.unassignFromPerson(id_bombero, id);
            await cargarRefuerzos();
            bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
            mostrarExito('Turno de refuerzo eliminado correctamente');
        } catch (err) {
            mostrarError(err.message || 'Error eliminando turno de refuerzo');
        }
    }
});

// ================================
// ALERTAS
// ================================
function mostrarError(msg) {
    const container = document.getElementById('alert-container');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `<div class="alert alert-danger alert-dismissible fade show shadow" role="alert">
        <strong>Error:</strong> ${msg}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
    container.append(wrapper);
}

function mostrarExito(msg) {
    const container = document.getElementById('alert-container');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `<div class="alert alert-success alert-dismissible fade show shadow" role="alert">
        <strong>OK:</strong> ${msg}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
    container.append(wrapper);
}