import CarnetApi from '../api_f/CarnetApi.js';
import GrupoApi from '../api_f/GrupoApi.js';
import PersonaApi from '../api_f/PersonaApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { mostrarError, mostrarExito } from '../helpers/utils.js';
import { validarNumero, validarRangoFechas } from '../helpers/validacion.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';

let carnets = [];
let grupos = [];
let sesionActual = null;

const pagination = new PaginationHelper(15);
pagination.setLoadingCallback((isLoading) => {
    if (isLoading) {
        showTableLoading('#tabla tbody', 5);
    }
});

const modalVerPagination = new PaginationHelper(5);
modalVerPagination.setLoadingCallback((isLoading) => {
    if (isLoading) {
        showTableLoading('#modalVerPersonasTable tbody', 4);
    }
});

const modalEditarPagination = new PaginationHelper(5);
modalEditarPagination.setLoadingCallback((isLoading) => {
    if (isLoading) {
        showTableLoading('#modalEditarPersonasTable tbody', 5);
    }
});

let personasModalEdicion = [];
let carnetModalEdicionActual = null;

document.addEventListener('DOMContentLoaded', async () => {
    sesionActual = await authGuard('carnets');
    if (!sesionActual) return;

    await cargarDatosIniciales();
    bindFiltros();
    bindModalVer();

    if (sesionActual.puedeEscribir) {
        bindCrearCarnet();
        bindModalEditar();
        bindAsignarCarnet();
        bindEliminarRelacionPersonaCarnet();
    }

    if (sesionActual.puedeEliminar) {
        bindModalEliminar();
    }
});

async function cargarDatosIniciales() {
    const resultados = await Promise.allSettled([
        cargarGrupos(),
        cargarCarnets(),
        cargarBomberosDisponibles(null, 'id_bombero')
    ]);

    resultados.forEach(resultado => {
        if (resultado.status === 'rejected') {
            mostrarError(resultado.reason?.message || 'Error cargando datos de carnets');
        }
    });
}

function obtenerNombreGrupo(carnet) {
    if (carnet?.grupo_nombre) return carnet.grupo_nombre;
    const grupo = grupos.find(g => String(g.id_grupo) === String(carnet?.id_grupo));
    return grupo?.nombre || 'Sin grupo';
}

function renderSinResultados(colspan = 5, mensaje = 'No hay carnets para mostrar') {
    const tbody = document.querySelector('#tabla tbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="${colspan}" class="text-center">${mensaje}</td></tr>`;
}

function formatearFecha(fecha) {
    if (!fecha) return '—';

    const date = new Date(`${fecha}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
        return fecha;
    }

    return date.toLocaleDateString('es-ES');
}

function obtenerNombrePersona(persona) {
    return `${persona.nombre ?? ''} ${persona.apellidos ?? ''}`.trim() || '—';
}

function renderSinResultadosTabla(selector, colspan, mensaje) {
    const tbody = document.querySelector(selector);
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="${colspan}" class="text-center">${mensaje}</td></tr>`;
}

function crearSeccionTablaPersonas({ tableId, paginationId, editable = false }) {
    const columnaAccion = editable ? '<th class="text-center">Accion</th>' : '';
    const avisoEdicion = editable
        ? '<p class="text-muted small mb-2">Las relaciones persona-carnet no se editan: si hay un error, elimine la relacion y vuelva a asignarla.</p>'
        : '';

    return `
        <div class="mt-3">
            <h6 class="mb-2">Personas con este carnet</h6>
            ${avisoEdicion}
            <div class="table-responsive">
                <table class="table table-bordered table-striped mb-0" id="${tableId}">
                    <thead class="table-dark">
                        <tr>
                            <th>ID Bombero</th>
                            <th>Nombre</th>
                            <th>Obtencion</th>
                            <th>Vencimiento</th>
                            ${columnaAccion}
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
            <div id="${paginationId}" class="mt-3"></div>
        </div>
    `;
}

function renderTablaPersonasCarnet(lista, { tableId, paginationId, paginationHelper, editable = false }) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!lista.length) {
        renderSinResultadosTabla(`#${tableId} tbody`, editable ? 5 : 4, 'No hay personas asociadas.');
        const paginationContainer = document.getElementById(paginationId);
        if (paginationContainer) {
            paginationContainer.innerHTML = '';
        }
        return;
    }

    const itemsPagina = paginationHelper.getPageItems(lista);

    itemsPagina.forEach(persona => {
        const tr = document.createElement('tr');
        const botonEliminar = editable
            ? `
                <button
                    type="button"
                    class="btn btn-danger btn-sm btn-eliminar-relacion-carnet"
                    data-bs-toggle="modal"
                    data-bs-target="#modalEliminarRelacionCarnetPersona"
                    data-id-bombero="${persona.id_bombero ?? ''}"
                    data-id-carnet="${carnetModalEdicionActual ?? ''}"
                    data-nombre-persona="${obtenerNombrePersona(persona)}"
                >
                    <i class="bi bi-trash3"></i>
                </button>
            `
            : '';

        tr.innerHTML = `
            <td>${persona.id_bombero ?? '—'}</td>
            <td>${obtenerNombrePersona(persona)}</td>
            <td>${formatearFecha(persona.f_obtencion)}</td>
            <td>${formatearFecha(persona.f_vencimiento)}</td>
            ${editable ? `<td class="text-center">${botonEliminar}</td>` : ''}
        `;

        tbody.appendChild(tr);
    });
}

function actualizarTablaPersonasModalVer(personas) {
    modalVerPagination.setData(personas, () => {
        renderTablaPersonasCarnet(personas, {
            tableId: 'modalVerPersonasTable',
            paginationId: 'pagination-modal-ver-carnet',
            paginationHelper: modalVerPagination
        });
    });
    modalVerPagination.render('pagination-modal-ver-carnet');
    renderTablaPersonasCarnet(personas, {
        tableId: 'modalVerPersonasTable',
        paginationId: 'pagination-modal-ver-carnet',
        paginationHelper: modalVerPagination
    });
}

function actualizarTablaPersonasModalEditar(personas) {
    modalEditarPagination.setData(personas, () => {
        renderTablaPersonasCarnet(personas, {
            tableId: 'modalEditarPersonasTable',
            paginationId: 'pagination-modal-editar-carnet',
            paginationHelper: modalEditarPagination,
            editable: true
        });
    });
    modalEditarPagination.render('pagination-modal-editar-carnet');
    renderTablaPersonasCarnet(personas, {
        tableId: 'modalEditarPersonasTable',
        paginationId: 'pagination-modal-editar-carnet',
        paginationHelper: modalEditarPagination,
        editable: true
    });
}

function calcularFechaVencimiento(fechaObtencion, duracionMeses) {
    if (!fechaObtencion || !validarNumero(duracionMeses)) {
        return '';
    }

    const date = new Date(`${fechaObtencion}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    date.setMonth(date.getMonth() + Number(duracionMeses));

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function actualizarFechaVencimientoAsignacion() {
    const selectCarnet = document.getElementById('seleccionarCarnet');
    const inputFechaObtencion = document.getElementById('f_obtencion');
    const inputFechaVencimiento = document.getElementById('f_vencimiento');

    if (!selectCarnet || !inputFechaObtencion || !inputFechaVencimiento) return;

    const carnet = carnets.find(item => String(item.id_carnet) === String(selectCarnet.value));
    inputFechaVencimiento.value = calcularFechaVencimiento(
        inputFechaObtencion.value,
        carnet?.duracion_meses
    );
}

async function cargarGrupos() {
    try {
        const response = await GrupoApi.getAll();
        grupos = response?.data || response || [];
        poblarSelectGrupos('filtroGrupo', 'Todos los grupos', '');
        poblarSelectGrupos('insertIdGrupo', 'Seleccione un grupo...', '');
    } catch (error) {
        grupos = [];
        poblarSelectGrupos('filtroGrupo', 'Todos los grupos', '');
        poblarSelectGrupos('insertIdGrupo', 'Seleccione un grupo...', '');
        throw error;
    }
}

function poblarSelectGrupos(idSelect, placeholder, valorSeleccionado = '') {
    const select = document.getElementById(idSelect);
    if (!select) return;

    select.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = placeholder;
    select.appendChild(defaultOption);

    grupos.forEach(grupo => {
        const option = document.createElement('option');
        option.value = grupo.id_grupo;
        option.textContent = grupo.nombre;
        if (String(valorSeleccionado) === String(grupo.id_grupo)) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

async function cargarCarnets() {
    try {
        showTableLoading('#tabla tbody', 5);
        const response = await CarnetApi.getAll();
        carnets = response?.data || response || [];
        pagination.setData(carnets, () => renderTablaCarnets(carnets));
        pagination.render('pagination-carnet');
        renderTablaCarnets(carnets);
        await cargarCarnetsDisponibles(null, 'seleccionarCarnet');
        actualizarFechaVencimientoAsignacion();
    } catch (error) {
        carnets = [];
        pagination.setData([], () => renderTablaCarnets([]));
        pagination.render('pagination-carnet');
        renderTablaCarnets([]);
        mostrarError(error.message || 'Error cargando carnets');
    }
}

function renderTablaCarnets(lista) {
    const tbody = document.querySelector('#tabla tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!lista.length) {
        renderSinResultados();
        return;
    }

    const puedeEscribir = sesionActual?.puedeEscribir ?? false;
    const puedeEliminar = sesionActual?.puedeEliminar ?? false;
    const itemsPagina = pagination.getPageItems(lista);

    itemsPagina.forEach(carnet => {
        const tr = document.createElement('tr');
        const grupoNombre = obtenerNombreGrupo(carnet);

        const botonesAccion = puedeEscribir
            ? `<button type="button" class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${carnet.id_carnet}"><i class="bi bi-eye"></i></button>
               <button type="button" class="btn p-0 btn-editar" data-bs-toggle="modal" data-bs-target="#modalEditar" data-id="${carnet.id_carnet}"><i class="bi bi-pencil"></i></button>
               ${puedeEliminar
                   ? `<button type="button" class="btn p-0 btn-eliminar" data-bs-toggle="modal" data-bs-target="#modalEliminar" data-id="${carnet.id_carnet}" data-nombre="${carnet.nombre ?? ''}"><i class="bi bi-trash3"></i></button>`
                   : ''}`
            : `<button type="button" class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${carnet.id_carnet}"><i class="bi bi-eye"></i></button>`;

        tr.innerHTML = `
            <td class="d-none d-md-table-cell">${carnet.id_carnet ?? ''}</td>
            <td>${carnet.nombre ?? ''}</td>
            <td class="d-none d-md-table-cell">${grupoNombre}</td>
            <td>${carnet.duracion_meses ?? ''}</td>
            <td class="celda-acciones">
                <div class="acciones-tabla">
                    ${botonesAccion}
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function bindFiltros() {
    document.getElementById('filtroNombre')?.addEventListener('input', aplicarFiltros);
    document.getElementById('filtroGrupo')?.addEventListener('change', aplicarFiltros);
}

function aplicarFiltros() {
    pagination.goToPage(0);

    const filtroNombre = document.getElementById('filtroNombre')?.value.toLowerCase().trim() ?? '';
    const filtroGrupo = document.getElementById('filtroGrupo')?.value ?? '';

    const filtrados = carnets.filter(carnet => {
        const cumpleNombre = !filtroNombre || carnet.nombre?.toLowerCase().includes(filtroNombre);
        const cumpleGrupo = !filtroGrupo || String(carnet.id_grupo) === String(filtroGrupo);
        return cumpleNombre && cumpleGrupo;
    });

    pagination.setData(filtrados, () => renderTablaCarnets(filtrados));
    pagination.render('pagination-carnet');
    renderTablaCarnets(filtrados);
}

function validarCarnet(nombre, idGrupo, duracionMeses) {
    if (!idGrupo) {
        mostrarError('Debe seleccionar un grupo.');
        return false;
    }

    if (!nombre || !nombre.trim()) {
        mostrarError('El nombre del carnet es obligatorio.');
        return false;
    }

    if (nombre.trim().length > 50) {
        mostrarError('El nombre del carnet no puede superar los 50 caracteres.');
        return false;
    }

    if (!validarNumero(duracionMeses)) {
        mostrarError('La duración en meses debe ser un número entero positivo.');
        return false;
    }

    return true;
}

function validarAsignacionCarnet(idBombero, idCarnet, fechaObtencion, fechaVencimiento) {
    if (!idBombero) {
        mostrarError('Debe seleccionar un bombero.');
        return false;
    }

    if (!idCarnet) {
        mostrarError('Debe seleccionar un carnet.');
        return false;
    }

    if (!fechaObtencion) {
        mostrarError('La fecha de obtención es obligatoria.');
        return false;
    }

    if (!fechaVencimiento) {
        mostrarError('La fecha de vencimiento es obligatoria.');
        return false;
    }

    if (!validarRangoFechas(fechaObtencion, fechaVencimiento)) {
        mostrarError('La fecha de vencimiento debe ser posterior a la fecha de obtención.');
        return false;
    }

    return true;
}

function bindCrearCarnet() {
    const form = document.getElementById('formInsertarCarnet');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const nombre = formData.get('nombre');
        const idGrupo = formData.get('id_grupo');
        const duracionMeses = formData.get('duracion_meses');

        if (!validarCarnet(nombre, idGrupo, duracionMeses)) return;

        try {
            await CarnetApi.create({
                nombre: nombre.trim(),
                id_grupo: Number(idGrupo),
                duracion_meses: Number(duracionMeses)
            });
            await cargarCarnets();
            form.reset();
            poblarSelectGrupos('insertIdGrupo', 'Seleccione un grupo...', '');
            mostrarExito('Carnet creado correctamente');
        } catch (error) {
            mostrarError(error.message || 'Error creando carnet');
        }
    });
}

function bindModalEliminar() {
    document.addEventListener('click', function (event) {
        const btn = event.target.closest('.btn-eliminar');
        if (!btn) return;

        const btnConfirmar = document.getElementById('btnConfirmarEliminar');
        if (btnConfirmar) {
            btnConfirmar.dataset.id = btn.dataset.id;
        }
    });

    document.getElementById('btnConfirmarEliminar')?.addEventListener('click', async function () {
        const id = this.dataset.id;
        if (!id) return;

        try {
            await CarnetApi.remove(id);
            await cargarCarnets();
            bootstrap.Modal.getInstance(document.getElementById('modalEliminar'))?.hide();
            mostrarExito('Carnet eliminado correctamente');
        } catch (error) {
            mostrarError(error.message || 'Error al eliminar carnet');
        }
    });
}

function bindModalEditar() {
    document.addEventListener('click', async function (event) {
        const btn = event.target.closest('.btn-editar');
        if (!btn) return;

        try {
            const [carnetResponse, personasResponse] = await Promise.all([
                CarnetApi.getById(btn.dataset.id),
                CarnetApi.getPersonsByCarnet(btn.dataset.id)
            ]);

            const carnet = carnetResponse?.data || carnetResponse;
            if (!carnet) return;

            personasModalEdicion = personasResponse?.data || personasResponse || [];
            carnetModalEdicionActual = carnet.id_carnet;

            const form = document.getElementById('formEditar');
            if (!form) return;

            const grupoOptions = [
                '<option value="">Seleccione un grupo...</option>',
                ...grupos.map(grupo => `<option value="${grupo.id_grupo}" ${String(grupo.id_grupo) === String(carnet.id_grupo) ? 'selected' : ''}>${grupo.nombre}</option>`)
            ].join('');

            form.innerHTML = `
                <div class="row mb-3">
                    <div class="col-lg-2">
                        <label class="form-label">ID</label>
                        <input type="text" class="form-control" value="${carnet.id_carnet ?? ''}" disabled>
                    </div>
                    <div class="col-lg-5">
                        <label class="form-label">Nombre</label>
                        <input type="text" class="form-control" name="nombre" maxlength="50" value="${carnet.nombre ?? ''}" required>
                    </div>
                    <div class="col-lg-5">
                        <label class="form-label">Grupo</label>
                        <select class="form-select" name="id_grupo" required>${grupoOptions}</select>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-lg-4">
                        <label class="form-label">Duración (meses)</label>
                        <input type="number" min="1" step="1" class="form-control" name="duracion_meses" value="${carnet.duracion_meses ?? ''}" required>
                    </div>
                </div>
                <div class="text-center mb-4">
                    <button type="button" class="btn btn-primary btn-guardar-carnet">Guardar cambios</button>
                </div>
                ${crearSeccionTablaPersonas({
                    tableId: 'modalEditarPersonasTable',
                    paginationId: 'pagination-modal-editar-carnet',
                    editable: true
                })}
            `;

            actualizarTablaPersonasModalEditar(personasModalEdicion);

            form.querySelector('.btn-guardar-carnet')?.addEventListener('click', async () => {
                const nombre = form.querySelector('[name="nombre"]')?.value ?? '';
                const idGrupo = form.querySelector('[name="id_grupo"]')?.value ?? '';
                const duracionMeses = form.querySelector('[name="duracion_meses"]')?.value ?? '';

                if (!validarCarnet(nombre, idGrupo, duracionMeses)) return;

                try {
                    await CarnetApi.update(carnet.id_carnet, {
                        nombre: nombre.trim(),
                        id_grupo: Number(idGrupo),
                        duracion_meses: Number(duracionMeses)
                    });
                    await cargarCarnets();
                    bootstrap.Modal.getInstance(document.getElementById('modalEditar'))?.hide();
                    mostrarExito('Carnet actualizado correctamente');
                } catch (error) {
                    mostrarError(error.message || 'Error actualizando carnet');
                }
            });
        } catch (error) {
            mostrarError(error.message || 'Error cargando el carnet');
        }
    });
}

const camposVer = [
    { label: 'ID', key: 'id_carnet' },
    { label: 'Nombre', key: 'nombre' },
    { label: 'Grupo', key: 'grupo_nombre' },
    { label: 'Duración (meses)', key: 'duracion_meses' }
];

function bindModalVer() {
    document.addEventListener('click', async function (event) {
        const btn = event.target.closest('.btn-ver');
        if (!btn) return;

        const carnet = carnets.find(item => String(item.id_carnet) === String(btn.dataset.id));
        if (!carnet) return;

        const modalBody = document.getElementById('modalVerBody');
        if (!modalBody) return;

        const detalle = {
            ...carnet,
            grupo_nombre: obtenerNombreGrupo(carnet)
        };

        modalBody.innerHTML = `
            ${camposVer.map(({ label, key }) => `<p><strong>${label}:</strong> ${detalle[key] ?? '—'}</p>`).join('')}
            <hr>
            ${crearSeccionTablaPersonas({
                tableId: 'modalVerPersonasTable',
                paginationId: 'pagination-modal-ver-carnet'
            })}
        `;

        showTableLoading('#modalVerPersonasTable tbody', 4);

        try {
            const response = await CarnetApi.getPersonsByCarnet(carnet.id_carnet);
            const personas = response?.data || response || [];

            actualizarTablaPersonasModalVer(personas);
        } catch (error) {
            renderSinResultadosTabla('#modalVerPersonasTable tbody', 4, error.message || 'Error cargando personas asociadas.');
        }
    });
}

function bindEliminarRelacionPersonaCarnet() {
    document.addEventListener('click', function (event) {
        const btn = event.target.closest('.btn-eliminar-relacion-carnet');
        if (!btn) return;

        const btnConfirmar = document.getElementById('btnConfirmarEliminarRelacionCarnetPersona');
        if (!btnConfirmar) return;

        btnConfirmar.dataset.idCarnet = btn.dataset.idCarnet;
        btnConfirmar.dataset.idBombero = btn.dataset.idBombero;
        btnConfirmar.dataset.nombrePersona = btn.dataset.nombrePersona;

        const textoConfirmacion = document.getElementById('textoEliminarRelacionCarnetPersona');
        if (textoConfirmacion) {
            textoConfirmacion.textContent = `¿Estás seguro de que deseas eliminar la relación de ${btn.dataset.nombrePersona || 'esta persona'} con este carnet?`;
        }
    });

    document.getElementById('btnConfirmarEliminarRelacionCarnetPersona')?.addEventListener('click', async function () {
        const idCarnet = this.dataset.idCarnet;
        const idBombero = this.dataset.idBombero;

        if (!idCarnet || !idBombero) return;

        try {
            await CarnetApi.removePersonFromCarnet(idCarnet, idBombero);
            personasModalEdicion = personasModalEdicion.filter(persona => String(persona.id_bombero) !== String(idBombero));
            actualizarTablaPersonasModalEditar(personasModalEdicion);
            bootstrap.Modal.getInstance(document.getElementById('modalEliminarRelacionCarnetPersona'))?.hide();
            mostrarExito('Relacion persona-carnet eliminada correctamente');
        } catch (error) {
            mostrarError(error.message || 'Error eliminando la relacion persona-carnet');
        }
    });
}

async function cargarCarnetsDisponibles(carnetSeleccionado, idSelect) {
    const select = document.getElementById(idSelect);
    if (!select) return;

    select.innerHTML = '<option value="">Seleccione carnet...</option>';
    carnets.forEach(carnet => {
        const option = document.createElement('option');
        option.value = carnet.id_carnet;
        option.textContent = `${carnet.nombre} - ${obtenerNombreGrupo(carnet)} (${carnet.duracion_meses} meses)`;
        if (String(carnetSeleccionado) === String(carnet.id_carnet)) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

async function cargarBomberosDisponibles(bomberoSeleccionado, idSelect) {
    const select = document.getElementById(idSelect);
    if (!select) return;

    try {
        const response = await PersonaApi.getAll();
        const bomberos = response?.data || response || [];
        select.innerHTML = '<option value="">Seleccione bombero...</option>';

        bomberos.forEach(bombero => {
            const option = document.createElement('option');
            option.value = bombero.id_bombero;
            option.textContent = `${bombero.id_bombero} - ${bombero.nombre} ${bombero.apellidos}`;
            if (String(bomberoSeleccionado) === String(bombero.id_bombero)) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    } catch (error) {
        mostrarError(error.message || 'Error cargando bomberos');
    }
}

function bindAsignarCarnet() {
    const form = document.getElementById('formInsertar');
    if (!form) return;

    document.getElementById('seleccionarCarnet')?.addEventListener('change', actualizarFechaVencimientoAsignacion);
    document.getElementById('f_obtencion')?.addEventListener('change', actualizarFechaVencimientoAsignacion);
    form.addEventListener('reset', () => {
        setTimeout(() => actualizarFechaVencimientoAsignacion(), 0);
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const idBombero = formData.get('id_bombero');
        const idCarnet = formData.get('seleccionarCarnet');
        const fechaObtencion = formData.get('f_obtencion');
        const carnetSeleccionado = carnets.find(carnet => String(carnet.id_carnet) === String(idCarnet));
        const fechaVencimiento = calcularFechaVencimiento(fechaObtencion, carnetSeleccionado?.duracion_meses);

        const inputFechaVencimiento = document.getElementById('f_vencimiento');
        if (inputFechaVencimiento) {
            inputFechaVencimiento.value = fechaVencimiento;
        }

        if (!validarAsignacionCarnet(idBombero, idCarnet, fechaObtencion, fechaVencimiento)) return;

        try {
            await CarnetApi.assignToPerson({
                id_bombero: idBombero,
                ID_Carnet: idCarnet,
                f_obtencion: fechaObtencion,
                f_vencimiento: fechaVencimiento
            });
            form.reset();
            actualizarFechaVencimientoAsignacion();
            mostrarExito('Carnet asignado correctamente');
        } catch (error) {
            mostrarError(error.message || 'Error asignando carnet');
        }
    });
}
