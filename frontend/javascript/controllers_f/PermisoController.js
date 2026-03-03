import PermisoApi from '../api_f/PermisoApi.js';
import MotivoApi from '../api_f/MotivoApi.js';
import { truncar, mostrarError, mostrarExito } from '../helpers/utils.js';
import { validarNumero } from '../helpers/validacion.js';

let permisos = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarPermisos();
    bindCrearPermiso();
    bindModalVer();
    bindModalEditar();
    bindGestionarEstado();
    cargarSelectPermisos();
    cargarSelectMotivos(null, 'motivo'); 
    cargarSelectEstados();
});

// ================================
// CARGAR PERMISOS
// ================================
async function cargarPermisos() {
    try {
        const response = await PermisoApi.getAll();
        permisos = response.data;
        renderTablaPermisos(permisos);
    } catch (e) {
        mostrarError(e.message || 'Error cargando permisos', 'danger');
    }
}


// ================================
// CARGAR SELECTS
// ================================
async function cargarSelectPermisos() {
    const select = document.getElementById('permiso');
    if (!select) return;

    try {
        const res = await PermisoApi.getAll();
        select.innerHTML = '<option value="">Seleccione permiso...</option>';

        res.data.forEach(r => {
            const option = document.createElement('option');
            option.value = r.id_permiso;
            option.textContent = `${r.id_permiso} - ${r.fecha} (${r.estado})`;
            select.appendChild(option);
        });
    } catch (e) {
        mostrarError(e.message || 'Error cargando permisos');
    }
}

async function cargarSelectMotivos(seleccionado, id_select) {
    const select = document.getElementById(id_select);
    if (!select) return;

    try {
        const res = await MotivoApi.getAll();
        select.innerHTML = '<option value="">Seleccione motivo...</option>';

        res.data.forEach(m => {
            const option = document.createElement('option');
            option.value = m.cod_motivo;
            option.textContent = `${m.nombre} (${m.dias} días)`;
            if (seleccionado && m.cod_motivo == seleccionado) option.selected = true;
            select.appendChild(option);
        });
    } catch (e) {
        mostrarError(e.message || 'Error cargando motivos');
    }
}

function cargarSelectEstados() {
    const select = document.getElementById('estado');
    if (!select) return;

    const estados = ['ACEPTADO', 'REVISION', 'DENEGADO'];
    select.innerHTML = '<option value="">Seleccione el estado...</option>';

    estados.forEach(e => {
        const option = document.createElement('option');
        option.value = e;
        option.textContent = e;
        select.appendChild(option);
    });
}
// ================================
// RENDER TABLA
// ================================
function renderTablaPermisos(lista) {
    const tbody = document.querySelector('#tabla tbody');
    tbody.innerHTML = '';

    if (!lista.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    No hay permisos registrados
                </td>
            </tr>`;
        return;
    }

    lista.forEach(m => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="d-none d-md-table-cell">${m.id_permiso}</td>
            <td>${m.cod_motivo ?? '—'}</td>
            <td class="d-none d-md-table-cell">${m.fecha ?? '—'}</td>
            <td>${m.h_inicio ?? '—'}</td>
            <td>${m.h_fin ?? '—'}</td>
            <td>${m.estado ?? '—'}</td>
            <td class="d-none d-md-table-cell">${truncar(m.descripcion, 80)}</td>
            <td class="d-flex justify-content-around">
                <button type="button" class="btn p-0 btn-ver"
                        data-bs-toggle="modal"
                        data-bs-target="#modalVer"
                        data-id="${m.id_permiso}"
                        title="Ver detalle">
                    <i class="bi bi-eye"></i>
                </button>
                <button type="button" class="btn p-0 btn-editar"
                        data-bs-toggle="modal"
                        data-bs-target="#modalEditar"
                        data-id="${m.id_permiso}"
                        title="Editar">
                    <i class="bi bi-pencil text-primary"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
// ================================
// CREAR PERMISO
// ================================
function bindCrearPermiso() {
    const form = document.getElementById('formInsertar');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = new FormData(form);

        const data = {
            cod_motivo:  f.get('cod_motivo'),
            h_inicio:    f.get('h_inicio') || null,
            h_fin:       f.get('h_fin') || null,
            descripcion: f.get('descripcion') || null
        };

        if (!data.cod_motivo) {
            mostrarError('El motivo es obligatorio');
            return;
        }

        try {
            await PermisoApi.create(data);
            await cargarPermisos();
            form.reset();
            mostrarExito('Permiso creado correctamente');
        } catch (err) {
            mostrarError(err.message || 'Error creando permiso');
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

        const id     = btn.dataset.id;
        const permiso = permisos.find(p => String(p.id_permiso) === String(id));
        if (!permiso) return;

        // Detalle del permiso
        const detalles = document.getElementById('detallesPermiso');
        detalles.innerHTML = '';
        [
            { label: 'ID',          valor: permiso.id_permiso },
            { label: 'Nombre',      valor: permiso.nombre },
            { label: 'Descripción', valor: permiso.descripcion ?? '—' },
        ].forEach(({ label, valor }) => {
            const p = document.createElement('p');
            p.innerHTML = `<strong>${label}:</strong> ${valor}`;
            detalles.appendChild(p);
        });

        // Cargar personas
        const tbody = document.querySelector('#tablaPersonasPermiso tbody');
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Cargando...</td></tr>';

        try {
            const res = await PermisoApi.getPersonsByPermiso(id);
            tbody.innerHTML = '';

            if (!res.data.length) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay personas asignadas</td></tr>';
                return;
            }

            res.data.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${p.id_bombero}</td>
                    <td>${p.n_funcionario}</td>
                    <td>${p.nombre} ${p.apellidos}</td>
                    <td>
                        <button type="button" class="btn btn-sm btn-danger btn-desasignar-persona"
                                data-id-bombero="${p.id_bombero}"
                                data-id-permiso="${id}">
                            <i class="bi bi-person-dash"></i> Desasignar
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-danger text-center">${err.message || 'Error cargando personas'}</td></tr>`;
        }
    });
}
// ================================
// MODAL EDITAR
// ================================
function bindModalEditar() {
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.btn-editar');
        if (!btn) return;

        const id      = btn.dataset.id;
        const permiso = permisos.find(p => String(p.id_permiso) === String(id));
        if (!permiso) return;

        const formEditar = document.getElementById('formEditar');
        formEditar.innerHTML = `
            <input type="hidden" id="editIdPermiso" value="${permiso.id_permiso}">

            <div class="mb-3">
                <label class="form-label">Motivo</label>
                <input type="text" class="form-control" value="${permiso.cod_motivo ?? '—'}" readonly>
            </div>
            <div class="mb-3">
                <label class="form-label">Fecha solicitud</label>
                <input type="text" class="form-control" value="${permiso.fecha ?? '—'}" readonly>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Hora inicio</label>
                    <input type="time" class="form-control" id="editHInicio" value="${permiso.h_inicio ?? ''}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Hora fin</label>
                    <input type="time" class="form-control" id="editHFin" value="${permiso.h_fin ?? ''}">
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Estado</label>
                <select class="form-select" id="editEstado">
                    <option value="ACEPTADO"  ${permiso.estado === 'ACEPTADO'  ? 'selected' : ''}>ACEPTADO</option>
                    <option value="REVISION"  ${permiso.estado === 'REVISION'  ? 'selected' : ''}>REVISION</option>
                    <option value="DENEGADO"  ${permiso.estado === 'DENEGADO'  ? 'selected' : ''}>DENEGADO</option>
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">Descripción</label>
                <textarea class="form-control" id="editDescripcion" rows="3">${permiso.descripcion ?? ''}</textarea>
            </div>
            <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-primary" id="btnGuardarCambios">Guardar cambios</button>
            </div>
        `;

        document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
            const idPermiso   = document.getElementById('editIdPermiso').value;
            const h_inicio    = document.getElementById('editHInicio').value || null;
            const h_fin       = document.getElementById('editHFin').value || null;
            const estado      = document.getElementById('editEstado').value;
            const descripcion = document.getElementById('editDescripcion').value.trim() || null;

            try {
                await PermisoApi.update(idPermiso, { h_inicio, h_fin, estado, descripcion });
                await cargarPermisos();
                bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
                mostrarExito('Permiso actualizado correctamente');
            } catch (err) {
                mostrarError(err.message || 'Error actualizando permiso');
            }
        });
    });
}
// ================================
// GESTIONAR ESTADO PERMISO
// ================================
function bindGestionarEstado() {
    const form = document.getElementById('formGestionarEstado');
   if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = new FormData(form);

        const data = {
            id_permiso: f.get('id_permiso'),
            estado:     f.get('estado')
        };

        console.log('Datos enviados:', data);

        if (!data.id_permiso || !data.estado) {
            mostrarError('Seleccione un permiso y un estado');
            return;
        }

        try {
            await PermisoApi.update(data.id_permiso, { estado: data.estado });
            await cargarPermisos();
            await cargarSelectPermisos();
            form.reset();
            mostrarExito('Estado actualizado correctamente');
        } catch (err) {
            mostrarError(err.message || 'Error actualizando estado');
        }
    });
}