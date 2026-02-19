import MeritoApi from '../api_f/MeritoApi.js';

let meritos = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarMeritos();
    bindCrearMerito();
    bindModalVer();
});

// ================================
// CARGAR MÉRITOS
// ================================
async function cargarMeritos() {
    try {
        const response = await MeritoApi.getAll();
        meritos = response.data;
        renderTablaMeritos(meritos);
    } catch (e) {
        mostrarAlerta(e.message || 'Error cargando méritos', 'danger');
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
                        data-id="${m.id_merito}"
                        title="Eliminar">
                    <i class="bi bi-trash3 text-danger"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Bind eliminar después de renderizar
    bindEliminarMerito();
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

        try {
            await MeritoApi.create({
                nombre,
                descripcion
            });

            await cargarMeritos();
            form.reset();
            mostrarAlerta('Mérito creado correctamente', 'success');

        } catch (err) {
            if (err.errors) {
                const msgs = Object.values(err.errors).flat().join(', ');
                mostrarAlerta(msgs, 'danger');
            } else {
                mostrarAlerta(err.message || 'Error creando mérito', 'danger');
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

        const id     = btn.dataset.id;
        const merito = meritos.find(m => String(m.id_merito) === String(id));
        if (!merito) return;

        const modalBody = document.getElementById('modalVerBody');
        modalBody.innerHTML = '';

        const campos = [
            { label: 'ID',          valor: merito.id_merito },
            { label: 'Nombre',      valor: merito.nombre },
            { label: 'Descripción', valor: merito.descripcion ?? '—' },
        ];

        campos.forEach(({ label, valor }) => {
            const p = document.createElement('p');
            p.innerHTML = `<strong>${label}:</strong> ${valor}`;
            modalBody.appendChild(p);
        });
    });
}

// ================================
// ELIMINAR MÉRITO
// ================================
function bindEliminarMerito() {
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', async function () {
            const id = this.dataset.id;
            if (!id) return;

            const confirmar = confirm('¿Estás seguro de eliminar este mérito? Esta acción no se puede deshacer.');
            if (!confirmar) return;

            try {
                await MeritoApi.remove(id);
                await cargarMeritos();
                mostrarAlerta('Mérito eliminado correctamente', 'success');

            } catch (error) {
                // Error 409 = registro en uso
                if (error.status === 409) {
                    mostrarAlerta(
                        'No se puede eliminar: el mérito está asignado a usuarios',
                        'warning'
                    );
                } else {
                    mostrarAlerta(error.message || 'Error al eliminar el mérito', 'danger');
                }
            }
        });
    });
}

// ================================
// UTILIDADES
// ================================
function truncar(texto, max) {
    if (!texto) return '—';
    return texto.length > max ? texto.substring(0, max) + '…' : texto;
}

function mostrarAlerta(msg, tipo = 'info') {
    const container = document.getElementById('alert-container');
    if (!container) { alert(msg); return; }

    const id  = `alert-${Date.now()}`;
    const div = document.createElement('div');
    div.id        = id;
    div.className = `alert alert-${tipo} alert-dismissible fade show shadow-sm`;
    div.role      = 'alert';
    div.innerHTML = `
        ${msg}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    container.appendChild(div);

    setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.remove();
    }, 4000);
}