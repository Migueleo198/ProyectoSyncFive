import AvisoApi from '../api_f/AvisoApi.js';
import PersonaApi from '../api_f/PersonaApi.js';
import { 
    formatearFecha,
    truncar,
    mostrarExito,
    mostrarError
} from '../helpers/utils.js';


let avisos = [];
let personas = [];

// Usuario actual leído del sessionStorage
const usuarioActual = JSON.parse(sessionStorage.getItem('user') || 'null');

document.addEventListener('DOMContentLoaded', () => {
    cargarPersonas();
    cargarAvisos();
    bindCrearAviso();
    bindModalVer();
    bindModalEliminar();
});


// ================================
// CARGAR PERSONAS (para el select de destinatarios)
// ================================
async function cargarPersonas() {
    try {
        const response = await PersonaApi.getAll();
        personas = response.data;
        poblarSelectDestinatarios(personas);
    } catch (e) {
        console.error('Error cargando personas:', e.message);
    }
}

function poblarSelectDestinatarios(lista) {
    const select = document.getElementById('insertDestinatarios');
    if (!select) return;

    // Limpiar opciones previas excepto la vacía
    select.innerHTML = '';

    lista.forEach(p => {
        // No incluir al usuario actual como destinatario de su propio aviso
        if (usuarioActual && p.id_bombero === usuarioActual.id_bombero) return;

        const option   = document.createElement('option');
        option.value   = p.id_bombero;
        option.textContent = `${p.nombre} ${p.apellidos} (${p.nombre_usuario})`;
        select.appendChild(option);
    });
}

// ================================
// CARGAR AVISOS
// ================================
async function cargarAvisos() {
    try {
        const response = await AvisoApi.getAll();
        const todosLosAvisos = response.data;

        // Filtrar: solo los avisos donde el usuario actual es destinatario
        // Para ello necesitamos consultar los destinatarios de cada aviso,
        // pero como no hay endpoint de "mis avisos", filtramos en cliente
        // usando los destinatarios ya cargados en paralelo
        const misAvisos = await filtrarAvisosDelUsuario(todosLosAvisos);

        avisos = misAvisos;
        renderTablaAvisos(avisos);
    } catch (e) {
        mostrarError(e.message || 'Error cargando avisos');
    }
}

async function filtrarAvisosDelUsuario(lista) {
    if (!usuarioActual) return lista;

    // Consultamos destinatarios de cada aviso en paralelo
    const resultados = await Promise.allSettled(
        lista.map(a => AvisoApi.getDestinatarios(a.id_aviso))
    );

    return lista.filter((aviso, index) => {
        const resultado = resultados[index];
        if (resultado.status !== 'fulfilled') return false;

        const destinatarios = resultado.value.data ?? [];

        // Mostrar si: el usuario es destinatario O es el remitente
        const esDestinatario = destinatarios.some(
            d => String(d.id_bombero) === String(usuarioActual.id_bombero)
        );
        const esRemitente = String(aviso.remitente) === String(usuarioActual.id_bombero);

        return esDestinatario || esRemitente;
    });
}

// ================================
// RENDER TABLA
// ================================
function renderTablaAvisos(lista) {
    const tbody = document.querySelector('#tabla tbody');
    tbody.innerHTML = '';

    if (!lista.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    No hay avisos registrados
                </td>
            </tr>`;
        return;
    }

    lista.forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="d-none d-md-table-cell">${a.id_aviso}</td>
            <td>${a.asunto ?? ''}</td>
            <td>${truncar(a.mensaje, 60)}</td>
            <td class="d-none d-md-table-cell">${formatearFecha(a.fecha)}</td>
            <td class="d-none d-md-table-cell">${a.remitente ?? '—'}</td>
            <td class="d-flex justify-content-around">
                <button type="button" class="btn p-0 btn-ver"
                        data-bs-toggle="modal"
                        data-bs-target="#modalVer"
                        data-id="${a.id_aviso}"
                        title="Ver detalle">
                    <i class="bi bi-eye"></i>
                </button>
                <button type="button" class="btn p-0 btn-eliminar"
                        data-bs-toggle="modal"
                        data-bs-target="#modalEliminar"
                        data-id="${a.id_aviso}"
                        title="Eliminar">
                    <i class="bi bi-trash3 text-danger"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ================================
// CREAR AVISO
// ================================
function bindCrearAviso() {
    const form = document.getElementById('formInsertar');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const asunto  = document.getElementById('insertAsunto').value.trim();
        const mensaje = document.getElementById('insertMensaje').value.trim();

        // ✅ ID corregido — coincide con el HTML
        const selectDest = document.getElementById('insertDestinatarios');
        const destinatarios = selectDest
            ? Array.from(selectDest.selectedOptions)
                   .map(opt => opt.value)
                   .filter(v => v !== '')
            : [];

        try {
            // 1. Crear el aviso
            const response = await AvisoApi.create({
                asunto,
                mensaje,
                fecha: new Date().toISOString().slice(0, 19).replace('T', ' ')
            });

            const idAviso = response.data.id;

            // 2. Asignar remitente automáticamente (usuario actual)
            if (usuarioActual?.id_bombero) {
                await AvisoApi.setRemitente(idAviso, usuarioActual.id_bombero);
            }

            // 3. Asignar destinatarios seleccionados
            for (const idBombero of destinatarios) {
                await AvisoApi.setDestinatario(idAviso, idBombero);
            }

            await cargarAvisos();
            form.reset();
            mostrarExito('Aviso creado correctamente');

        } catch (err) {
            // Mostrar errores de validación si los hay
            if (err.errors) {
                const msgs = Object.values(err.errors).flat().join(', ');
                mostrarError(msgs);
            } else {
                mostrarError(err.message || 'Error creando aviso');
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

        const id    = btn.dataset.id;
        const aviso = avisos.find(a => String(a.id_aviso) === String(id));
        if (!aviso) return;

        const modalBody = document.getElementById('modalVerBody');
        modalBody.innerHTML = '<p class="text-muted text-center">Cargando...</p>';

        // Datos básicos del aviso
        const campos = [
            { label: 'ID',       valor: aviso.id_aviso },
            { label: 'Asunto',   valor: aviso.asunto },
            { label: 'Mensaje',  valor: aviso.mensaje },
            { label: 'Fecha',    valor: formatearFecha(aviso.fecha) },
            { label: 'Remitente',valor: aviso.remitente ?? '—' },
        ];

        modalBody.innerHTML = '';
        campos.forEach(({ label, valor }) => {
            const p = document.createElement('p');
            p.innerHTML = `<strong>${label}:</strong> ${valor ?? ''}`;
            modalBody.appendChild(p);
        });

        // Cargar destinatarios desde la API
        try {
            const res     = await AvisoApi.getDestinatarios(id);
            const destList = res.data ?? [];

            const hr = document.createElement('hr');
            modalBody.appendChild(hr);

            const titulo = document.createElement('p');
            titulo.innerHTML = `<strong>Destinatarios:</strong>`;
            modalBody.appendChild(titulo);

            if (destList.length === 0) {
                const vacio = document.createElement('p');
                vacio.textContent = 'Sin destinatarios asignados';
                vacio.className   = 'text-muted';
                modalBody.appendChild(vacio);
            } else {
                const ul = document.createElement('ul');
                ul.className = 'mb-0';
                destList.forEach(d => {
                    const li      = document.createElement('li');
                    // Mostrar nombre si está en la lista de personas cargadas
                    const persona = personas.find(
                        p => String(p.id_bombero) === String(d.id_bombero)
                    );
                    li.textContent = persona
                        ? `${persona.nombre} ${persona.apellidos}`
                        : d.id_bombero;
                    ul.appendChild(li);
                });
                modalBody.appendChild(ul);
            }
        } catch {
            // Si falla la carga de destinatarios no bloqueamos el modal
        }
    });
}

// ================================
// MODAL ELIMINAR
// ================================
function bindModalEliminar() {
    // Capturar el ID al abrir el modal
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.btn-eliminar');
        if (!btn) return;

        document.getElementById('btnConfirmarEliminar').dataset.id = btn.dataset.id;
    });

    // Confirmar eliminación
    document.getElementById('btnConfirmarEliminar')
        .addEventListener('click', async function () {
            const id = this.dataset.id;
            if (!id) return;

            try {
                // Obtener destinatarios
                const resDest = await AvisoApi.getDestinatarios(id);
                const destinatarios = resDest.data ?? [];

                // Eliminar cada destinatario
                for (const d of destinatarios) {
                    await AvisoApi.deleteDestinatario(id, d.id_bombero);
                }

                // Obtener remitente
                try {
                    const resRem = await AvisoApi.getRemitente(id);
                    const remitente = resRem.data;

                    if (remitente?.id_bombero) {
                        await AvisoApi.deleteRemitente(id, remitente.id_bombero);
                    }

                } catch (e) {
                    // Si no hay remitente no bloqueamos la eliminación
                }

                // Eliminar el aviso
                await AvisoApi.remove(id);

                await cargarAvisos();

                bootstrap.Modal.getInstance(
                    document.getElementById('modalEliminar')
                ).hide();

                mostrarExito('Aviso eliminado correctamente');

            } catch (error) {
                mostrarError(error.message || 'Error al eliminar el aviso');
            }
        });
}