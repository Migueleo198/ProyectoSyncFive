import GuardiaApi from '../api_f/GuardiaApi.js';
import PersonaApi from '../api_f/PersonaApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { mostrarError, mostrarExito, formatearFechaHora } from '../helpers/utils.js';

let guardias = [];
let sesionActual = null;

// ================================
// CONSTANTES
// ================================
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
    cargarSelectGuardias(null, 'seleccionarGuardia');
    cargarSelectPersonas(null, 'n_funcionario');
    cargarSelectCargos();
    bindModalVer();
    bindModalEditar();

    if (sesionActual.puedeEscribir) {
        bindCrearGuardia();
        bindAsignarGuardia();
    }
});

// ================================
// CARGAR GUARDIAS
// ================================
async function cargarGuardias() {
    try {
        const res = await GuardiaApi.getAll();
        guardias = res.data;
        renderTablaGuardias(guardias);
    } catch (e) {
        mostrarError(e.message || 'Error cargando guardias');
    }
}

// ================================
// POBLAR SELECT GUARDIAS
// ================================
async function cargarSelectGuardias(seleccionado, id_select) {
    const select = document.getElementById(id_select);
    if (!select) return;

    try {
        const res = await GuardiaApi.getAll();
        select.innerHTML = '<option value="">Seleccione guardia...</option>';
        res.data.forEach(g => {
            const option = document.createElement('option');
            option.value = g.id_guardia;
            option.textContent = `${g.id_guardia} - ${g.fecha} (${g.h_inicio} - ${g.h_fin})`;
            if (seleccionado && g.id_guardia === seleccionado) option.selected = true;
            select.appendChild(option);
        });
    } catch (e) {
        mostrarError(e.message || 'Error cargando guardias');
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
        res.data.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id_bombero;
            option.textContent = `${p.n_funcionario} - ${p.nombre} ${p.apellidos}`;
            if (seleccionado && p.n_funcionario === seleccionado) option.selected = true;
            select.appendChild(option);
        });
    } catch (e) {
        mostrarError(e.message || 'Error cargando personas');
    }
}

// ================================
// POBLAR SELECT CARGOS
// ================================
function cargarSelectCargos() {
    const select = document.getElementById('cargo');
    if (!select) return;
    select.innerHTML = '<option value="">Seleccione cargo...</option>';
    cargos.forEach(c => {
        const option = document.createElement('option');
        option.value = c;
        option.textContent = c;
        select.appendChild(option);
    });
}

// ================================
// RENDER TABLA
// ================================
function renderTablaGuardias(lista) {
    const tbody = document.querySelector('#tabla tbody');
    tbody.innerHTML = '';

    const puedeEscribir = sesionActual?.puedeEscribir ?? false;

    lista.forEach(g => {
        const tr = document.createElement('tr');

        const botones = puedeEscribir
            ? `<button type="button" class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${g.id_guardia}"><i class="bi bi-eye"></i></button>
               <button type="button" class="btn p-0 btn-editar" data-bs-toggle="modal" data-bs-target="#modalEditar" data-id="${g.id_guardia}"><i class="bi bi-pencil"></i></button>`
            : `<button type="button" class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${g.id_guardia}"><i class="bi bi-eye"></i></button>`;

        tr.innerHTML = `
            <td class="d-none d-md-table-cell">${g.id_guardia}</td>
            <td>${g.fecha}</td>
            <td>${g.h_inicio}</td>
            <td>${g.h_fin}</td>
            <td class="d-none d-md-table-cell">${g.notas || ''}</td>
            <td class="d-flex justify-content-around">${botones}</td>
        `;
        tbody.appendChild(tr);
    });
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
        try {
            await GuardiaApi.create(data);
            await cargarGuardias();
            form.reset();
            mostrarExito('Guardia creada correctamente');
        } catch (err) {
            mostrarError(err.message || 'Error creando guardia');
        }
    });
}

// ================================
// ASIGNAR PERSONA A GUARDIA
// ================================
function bindAsignarGuardia() {
    const form = document.getElementById('formAsignarGuardia');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = new FormData(form);
        const data = {
            id_bombero: f.get('n_funcionario'),
            id_guardia: f.get('id_guardia'),
            cargo:      f.get('cargo')
        };
        if (!data.id_bombero || !data.id_guardia || !data.cargo) {
            mostrarError('Seleccione guardia, persona y cargo');
            return;
        }
        try {
            await GuardiaApi.assignToPerson(data);
            mostrarExito('Persona asignada a la guardia correctamente');
            form.reset();
            await cargarGuardias();
        } catch (err) {
            mostrarError(err.message || 'Error asignando persona a guardia');
        }
    });
}

// ================================
// MODAL VER
// ================================
function bindModalVer() {
    document.addEventListener('click', function (e) {
        const btnVer = e.target.closest('.btn-ver');
        if (!btnVer) return;

        const guardia = guardias.find(g => g.id_guardia == btnVer.dataset.id);
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
    });
}

// ================================
// MODAL EDITAR
// ================================
function bindModalEditar() {
    document.addEventListener('click', async function (e) {
        const btnEditar = e.target.closest('.btn-editar');
        if (!btnEditar) return;

        const id = btnEditar.dataset.id;
        const response = await GuardiaApi.getById(id);
        const guardia = response.data;
        if (!guardia) return;

        const form = document.getElementById('formEditar');
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
                <div class="col-lg-4">
                    <label class="form-label">Notas</label>
                    <input type="text" class="form-control" name="notas" value="${guardia.notas || ''}">
                </div>
            </div>
            <div class="text-center">
                <button type="button" id="btnGuardarCambios" class="btn btn-primary">Guardar cambios</button>
            </div>
        `;

        document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
            const data = {};
            camposBd.forEach(c => {
                const input = form.querySelector(`[name="${c}"]`);
                if (input) data[c] = input.value;
            });
            await GuardiaApi.update(id, data);
            await cargarGuardias();
            bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
        });
    });
}

