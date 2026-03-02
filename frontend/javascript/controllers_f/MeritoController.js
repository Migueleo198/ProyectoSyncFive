import MeritosApi from '../api_f/MeritoApi.js';
import PersonaApi from '../api_f/PersonaApi.js';
import { truncar, mostrarError, mostrarExito } from '../helpers/utils.js';
import { validarNumero } from '../helpers/validacion.js';

let meritos = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarMeritos();
    bindCrearMerito();
    bindModalVer();
    cargarSelectMeritos();
    cargarSelectPersonas(null, 'n_funcionario');
    bindAsignarMerito();
    bindDesasignarMerito();                              // ← añade esto
    cargarSelectPersonas(null, 'desasignar_persona');    // ← añade esto
    cargarSelectMeritos('desasignar_merito');            // ← añade esto
});

// ================================
// CARGAR MÉRITOS
// ================================
async function cargarMeritos() {
    try {
        const response = await MeritosApi.getAll();
        meritos = response.data;
        renderTablaMeritos(meritos);
    } catch (e) {
        mostrarError(e.message || 'Error cargando méritos', 'danger');
    }
}

// ================================
// CARGAR SELECTS
// ================================

async function cargarSelectMeritos(id_select = 'merito') {
    const select = document.getElementById(id_select);
    if (!select) return;

    try {
        const res = await MeritosApi.getAll();
        select.innerHTML = '<option value="">Seleccione mérito...</option>';

        res.data.forEach(r => {
            const option = document.createElement('option');
            option.value = r.id_merito;
            option.textContent = r.nombre;
            select.appendChild(option);
        });
    } catch (e) {
        mostrarError(e.message || 'Error cargando méritos');
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
            if (seleccionado && p.n_funcionario === seleccionado) option.selected = true;
            select.appendChild(option);
        });
    } catch (e) {
        mostrarError(e.message || 'Error cargando personas');
    }
}
// ================================
// RENDER TABLA
// ================================
function renderTablaMeritos(lista) {
    const tbody = document.querySelector('#tabla tbody');
    tbody.innerHTML = '';

    if (!lista.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted py-4">
                    No hay méritos registrados
                </td>
            </tr>`;
        return;
    }

    lista.forEach(m => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${m.id_merito}</td>
            <td>${m.nombre ?? ''}</td>
            <td class="d-none d-md-table-cell">${truncar(m.descripcion, 80)}</td>
            <td class="d-flex justify-content-around">
                <button type="button" class="btn p-0 btn-ver"
                        data-bs-toggle="modal"
                        data-bs-target="#modalVer"
                        data-id="${m.id_merito}"
                        title="Ver detalle">
                    <i class="bi bi-eye"></i>
                </button>
                <button type="button" class="btn p-0 btn-eliminar"
                        data-bs-toggle="modal"
                        data-bs-target="#modalEliminar"
                        data-id="${m.id_merito}"
                        title="Eliminar">
                    <i class="bi bi-trash3 text-danger"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
// ================================
// ASIGNAR MERITO A PERSONA
// ================================
function bindAsignarMerito() {
    const form = document.getElementById('formAsignarMerito');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = new FormData(form);

        const data = {
            id_bombero: f.get('n_funcionario'),
            id_merito: f.get('merito'),
        };

        if (!data.id_bombero || !data.id_merito) {
            mostrarError('Seleccione persona y merito'); // ← era mostrarAlerta
            return;
        }

        try {
            await MeritosApi.assignToPerson(data);
            mostrarExito('Merito asignado correctamente'); // ← era mostrarAlerta
            form.reset();
        } catch (err) {
            mostrarError(err.message || 'Error asignando merito'); // ← era mostrarAlerta
        }
    });
}
// ================================
// DESASIGNAR MERITO DE PERSONA
// ================================
function bindDesasignarMerito() {
    const form = document.getElementById('formDesasignarMerito');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = new FormData(form);

        const data = {
            id_bombero: f.get('n_funcionario'),
            id_merito: f.get('merito'),
        };

        if (!data.id_bombero || !data.id_merito) {
            mostrarError('Seleccione persona y mérito');
            return;
        }

        try {
            await MeritosApi.unassignFromPerson(data);
            mostrarExito('Mérito desasignado correctamente');
            form.reset();
        } catch (err) {
            mostrarError(err.message || 'Error desasignando mérito');
        }
    });
}
// ================================
// CREAR MÉRITO
// ================================
function bindCrearMerito() {
    const form = document.getElementById('formMerito');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre      = document.getElementById('nombreMerito').value.trim();
        const descripcion = document.getElementById('descripcionMerito').value.trim();

        // Validaciones básicas
        if (!nombre) {
            mostrarError('El nombre es obligatorio');
            return;
        }
        if (!descripcion) {
            mostrarError('La descripción es obligatoria');
            return;
        }

        try {
            await MeritoApi.create({
                nombre,
                descripcion
            });

            await cargarMeritos();
            form.reset();
            mostrarExito('Mérito creado correctamente', 'success');

        } catch (err) {
            if (err.errors) {
                const msgs = Object.values(err.errors).flat().join(', ');
                mostrarError(msgs, 'danger');
            } else {
                mostrarError(err.message || 'Error creando mérito', 'danger');
            }
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
        const merito = meritos.find(m => String(m.id_merito) === String(id));
        if (!merito) return;

        // Detalle del mérito
        const detalles = document.getElementById('detallesMerito');
        detalles.innerHTML = '';
        [
            { label: 'ID',          valor: merito.id_merito },
            { label: 'Nombre',      valor: merito.nombre },
            { label: 'Descripción', valor: merito.descripcion ?? '—' },
        ].forEach(({ label, valor }) => {
            const p = document.createElement('p');
            p.innerHTML = `<strong>${label}:</strong> ${valor}`;
            detalles.appendChild(p);
        });

        // Cargar personas
        const tbody = document.querySelector('#tablaPersonasMerito tbody');
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Cargando...</td></tr>';

        try {
            const res = await MeritosApi.getPersonsByMerito(id);
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
                                data-id-merito="${id}">
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

    // Desasignar desde la tabla del modal
    document.addEventListener('click', async function (e) {
        const btn = e.target.closest('.btn-desasignar-persona');
        if (!btn) return;

        const data = {
            id_bombero: btn.dataset.idBombero,
            id_merito:  btn.dataset.idMerito,
        };

        try {
            await MeritosApi.unassignFromPerson(data);
            mostrarExito('Mérito desasignado correctamente');
            btn.closest('tr').remove();
        } catch (err) {
            mostrarError(err.message || 'Error desasignando mérito');
        }
    });
}
// ================================
// MODAL ELIMINAR MÉRITO
// ================================
document.addEventListener('click', function (e) {

    const btn = e.target.closest('.btn-eliminar');
    if (!btn) return;

    const id = btn.dataset.id;
    if (!id) return;

    const btnConfirm = document.getElementById('btnConfirmarEliminar');
    btnConfirm.dataset.id = id;
});


document.getElementById('btnConfirmarEliminar')
    .addEventListener('click', async function () {

        const id = this.dataset.id;
        if (!id) return;

        try {
            await MeritoApi.remove(id);
            await cargarMeritos();

            const modal = bootstrap.Modal.getInstance(
                document.getElementById('modalEliminar')
            );
            modal.hide();

            mostrarExito('Mérito eliminado correctamente');

        } catch (error) {

            if (error.status === 409) {
                mostrarError(
                    'No se puede eliminar: el mérito está asignado a usuarios',
                    'warning'
                );
            } else {
                mostrarError(
                    error.message || 'Error al eliminar el mérito'
                );
            }
        }
});