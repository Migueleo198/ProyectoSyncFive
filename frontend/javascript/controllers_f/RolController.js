import RolesApi from '../api_f/RolApi.js';
import { truncar, mostrarExito, mostrarError } from '../helpers/utils.js';

let roles = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarRoles();
    bindCrearRol();
    bindModalVer();
    bindModalEditar();
});

// ================================
// CARGAR ROLES
// ================================
async function cargarRoles() {
    try {
        const response = await RolesApi.getAll();
        roles = response.data;
        renderTablaRoles(roles);
    } catch (e) {
        mostrarAlerta(e.message || 'Error cargando roles', 'danger');
    }
}

// ================================
// RENDER TABLA
// ================================
function renderTablaRoles(lista) {
    const tbody = document.querySelector('#tabla tbody');
    tbody.innerHTML = '';

    if (!lista.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted py-4">
                    No hay roles registrados
                </td>
            </tr>`;
        return;
    }

    lista.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="d-none d-md-table-cell">${r.id_rol}</td>
            <td>${r.nombre ?? ''}</td>
            <td class="d-none d-md-table-cell">${truncar(r.descripcion, 80)}</td>
            <td class="d-flex justify-content-around">
                <button type="button" class="btn p-0 btn-ver"
                        data-bs-toggle="modal"
                        data-bs-target="#modalVer"
                        data-id="${r.id_rol}"
                        title="Ver detalle">
                    <i class="bi bi-eye"></i>
                </button>
                <button type="button" class="btn p-0 btn-editar"
                        data-bs-toggle="modal"
                        data-bs-target="#modalEditar"
                        data-id="${r.id_rol}"
                        title="Editar">
                    <i class="bi bi-pencil text-primary"></i>
                </button>
                <button type="button" class="btn p-0 btn-eliminar"
                        data-id="${r.id_rol}"
                        title="Eliminar">
                    <i class="bi bi-trash3 text-danger"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Bind delete después de renderizar
    bindEliminarRol();
}

// ================================
// CREAR ROL
// ================================
function bindCrearRol() {
    const form = document.getElementById('formRol');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre      = document.getElementById('nombre').value.trim();
        const descripcion = document.getElementById('descripcion').value.trim();

        // Validación básica
        if (!nombre) {
            mostrarError('El nombre es obligatorio');
            return;
        }

        try {
            await RolesApi.create({
                nombre,
                descripcion: descripcion || null
            });

            await cargarRoles();
            form.reset();
            mostrarExito('Rol creado correctamente', 'success');

        } catch (err) {
            if (err.errors) {
                const msgs = Object.values(err.errors).flat().join(', ');
                mostrarError(msgs, 'danger');
            } else {
                mostrarError(err.message || 'Error creando rol', 'danger');
            }
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

        const id  = btn.dataset.id;
        const rol = roles.find(r => String(r.id_rol) === String(id));
        if (!rol) return;

        const modalBody = document.getElementById('modalVerBody');
        modalBody.innerHTML = '';

        const campos = [
            { label: 'ID',          valor: rol.id_rol },
            { label: 'Nombre',      valor: rol.nombre },
            { label: 'Descripción', valor: rol.descripcion ?? '—' },
        ];

        campos.forEach(({ label, valor }) => {
            const p = document.createElement('p');
            p.innerHTML = `<strong>${label}:</strong> ${valor}`;
            modalBody.appendChild(p);
        });
    });
}

// ================================
// MODAL EDITAR
// ================================
function bindModalEditar() {
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.btn-editar');
        if (!btn) return;

        const id  = btn.dataset.id;
        const rol = roles.find(r => String(r.id_rol) === String(id));
        if (!rol) return;

        const formEditar = document.getElementById('formEditar');
        formEditar.innerHTML = `
            <input type="hidden" id="editIdRol" value="${rol.id_rol}">

            <div class="mb-3">
                <label class="form-label">Nombre</label>
                <input type="text"
                    class="form-control"
                    id="editNombre"
                    value="${rol.nombre}"
                    disabled>
            </div>

            <div class="mb-3">
                <label for="editDescripcion" class="form-label">Descripción</label>
                <textarea class="form-control" 
                          id="editDescripcion" 
                          rows="3">${rol.descripcion ?? ''}</textarea>
            </div>

            <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                    Cancelar
                </button>
                <button type="button" class="btn btn-primary" id="btnGuardarCambios">
                    Guardar cambios
                </button>
            </div>
        `;

        // Bind guardar cambios
        document.getElementById('btnGuardarCambios')
            .addEventListener('click', async () => {
                const idRol       = document.getElementById('editIdRol').value;
                const nombre      = document.getElementById('editNombre').value.trim();
                const descripcion = document.getElementById('editDescripcion').value.trim();

                if (!nombre) {
                    mostrarAlerta('El nombre es obligatorio', 'warning');
                    return;
                }

                try {
                    await RolesApi.update(idRol, {
                        nombre,
                        descripcion: descripcion || null
                    });

                    await cargarRoles();

                    bootstrap.Modal.getInstance(
                        document.getElementById('modalEditar')
                    ).hide();

                    mostrarExito('Rol actualizado correctamente', 'success');

                } catch (err) {
                    if (err.errors) {
                        const msgs = Object.values(err.errors).flat().join(', ');
                        mostrarError(msgs, 'danger');
                    } else {
                        mostrarError(err.message || 'Error actualizando rol', 'danger');
                    }
                }
            });
    });
}

// ================================
// ELIMINAR ROL CON MODAL
// ================================
function bindEliminarRol() {
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.dataset.id;
            if (!id) return;

            // Asignar id al botón de confirmación del modal
            const btnConfirm = document.getElementById('btnConfirmarEliminar');
            btnConfirm.dataset.id = id;

            // Mostrar el modal
            const modal = new bootstrap.Modal(document.getElementById('modalEliminar'));
            modal.show();
        });
    });

    // Evento del botón confirmar eliminar
    const btnConfirm = document.getElementById('btnConfirmarEliminar');
    btnConfirm.addEventListener('click', async function () {
        const id = this.dataset.id;
        if (!id) return;

        try {
            await RolesApi.delete(id);
            await cargarRoles();

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalEliminar'));
            modal.hide();

            mostrarExito('Rol eliminado correctamente', 'success');

        } catch (error) {
            if (error.status === 409) {
                mostrarError('No se puede eliminar: el rol está asignado a usuarios', 'warning');
            } else {
                mostrarError(error.message || 'Error al eliminar el rol', 'danger');
            }
        }
    });
}