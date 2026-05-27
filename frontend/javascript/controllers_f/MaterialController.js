import MaterialApi from '../api_f/MaterialApi.js';
import CategoriaApi from '../api_f/CategoriaApi.js';
import AlmacenApi from '../api_f/AlmacenApi.js';
import InstalacionApi from '../api_f/InstalacionApi.js';
import VehiculoApi from '../api_f/VehiculoApi.js';
import PersonaApi from '../api_f/PersonaApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { validarCheck } from '../helpers/validacion.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';

// ================================
// CONSTANTES
// Según DDL Material:
//   nombre      VARCHAR(100) NOT NULL
//   descripcion TEXT         NOT NULL
//   estado      ENUM('ALTA','BAJA') NOT NULL
//   id_categoria FK         NOT NULL
// ================================
const ESTADOS_MATERIAL = ['ALTA', 'BAJA'];

let materiales = [];
let categorias = [];
let instalaciones = [];
let vehiculos = [];
let personas = [];
let currentMaterialId = null;
let sesionActual = null;
const pagination = new PaginationHelper(15);
pagination.setLoadingCallback((isLoading) => {
    if (isLoading) {
        showTableLoading('#tabla tbody', 6);
    }
});

let datosCargados = false;
let asignacionesCache = new Map();
let eliminacionPendiente = null;

function normalizarIdMaterial(idMaterial) {
    return String(idMaterial ?? '');
}

function invalidarAsignacionesMaterial(idMaterial) {
    asignacionesCache.delete(normalizarIdMaterial(idMaterial));
}

document.addEventListener('DOMContentLoaded', async () => {
    sesionActual = await authGuard('materiales');
    if (!sesionActual) return;

    cargarDatosIniciales();
    bindFiltros();
    limpiarBackdropsAlCerrarModal();

    if (sesionActual.puedeEscribir) {
        bindCrearMaterial();
        bindModalesEscritura();
    }

    bindModalVer();

    if (sesionActual.puedeEscribir || sesionActual.puedeEliminar) {
        bindModalEliminarPreparar();
    }
});

// ================================
// LIMPIAR BACKDROPS DE BOOTSTRAP
// ================================
function limpiarBackdropsAlCerrarModal() {
    ['modalVer', 'modalEditar', 'modalEliminar'].forEach(id => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.addEventListener('hidden.bs.modal', function () {
                const hayModalAbierto = document.querySelector('.modal.show');
                if (hayModalAbierto) {
                    document.body.classList.add('modal-open');
                    document.body.style.overflow = 'hidden';
                    return;
                }

                document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            });
        }
    });
}

function configurarModalEliminar({ mensaje, ejecutar, errorMessage }) {
    const btnConfirm = document.getElementById('btnConfirmarEliminar');
    if (btnConfirm) {
        btnConfirm.disabled = false;
        btnConfirm.textContent = 'Eliminar';
    }

    const modalBody = document.querySelector('#modalEliminar .modal-body');
    if (modalBody) modalBody.innerHTML = mensaje;

    eliminacionPendiente = { ejecutar, errorMessage };
}

function abrirModalEliminarAsignacion(config) {
    configurarModalEliminar(config);
    const modalEliminar = document.getElementById('modalEliminar');
    if (modalEliminar) bootstrap.Modal.getOrCreateInstance(modalEliminar).show();
}

function mensajeErrorEliminarMaterial(error) {
    return error.message?.includes('foreign') || error.message?.includes('constraint')
        ? 'No se puede eliminar: el material tiene asignaciones'
        : error.message || 'Error al eliminar';
}

function mensajeErrorEliminarAsignacion(error) {
    return 'Error al eliminar: ' + (error.message || '');
}

function obtenerAsignacionUnidadesOSerie(unidadesValue, serieValue) {
    const unidadesTexto = String(unidadesValue ?? '').trim();
    const serieTexto = String(serieValue ?? '').trim();
    const tieneUnidades = unidadesTexto !== '';
    const tieneSerie = serieTexto !== '';

    if (!tieneUnidades && !tieneSerie) {
        mostrarError('Debe indicar unidades o número de serie.');
        return null;
    }

    if (tieneUnidades && tieneSerie) {
        mostrarError('Debe indicar unidades o número de serie, no ambos.');
        return null;
    }

    if (tieneSerie) {
        return { tipo: 'serie', serie: serieTexto };
    }

    if (!/^\d+$/.test(unidadesTexto)) {
        mostrarError('Las unidades deben ser un número entero mayor o igual que 1.');
        return null;
    }

    const unidades = Number(unidadesTexto);
    if (!Number.isInteger(unidades) || unidades < 1) {
        mostrarError('Las unidades deben ser un número entero mayor o igual que 1.');
        return null;
    }

    return { tipo: 'unidades', unidades };
}

function mensajeConfirmacionAsignacion(tipo, destino) {
    return `¿Eliminar la asignación de este material ${tipo} <strong>"${destino}"</strong>?<br><small class="text-muted">Esta acción no se puede deshacer.</small>`;
}

function vincularCamposUnidadesSerie(unidadesInput, serieInput) {
    if (!unidadesInput || !serieInput) return;

    unidadesInput.value = '';
    serieInput.value = '';

    unidadesInput.addEventListener('input', () => {
        if (unidadesInput.value.trim() !== '' && serieInput.value.trim() !== '') {
            serieInput.value = '';
        }
    });

    serieInput.addEventListener('input', () => {
        if (serieInput.value.trim() !== '' && unidadesInput.value.trim() !== '') {
            unidadesInput.value = '';
        }
    });
}

function resetModalEliminar() {
    const btnConfirm = document.getElementById('btnConfirmarEliminar');
    if (btnConfirm) {
        btnConfirm.disabled = false;
        btnConfirm.textContent = 'Eliminar';
        delete btnConfirm.dataset.id;
    }

    eliminacionPendiente = null;
}

function bindModalEliminarPreparar() {
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.btn-eliminar');
        if (!btn) return;
        e.preventDefault();

        configurarModalEliminar({
            mensaje: `¿Eliminar el material <strong>"${btn.dataset.nombre}"</strong>?<br><small class="text-muted">Esta acción no se puede deshacer.</small>`,
            ejecutar: async () => {
                await MaterialApi.delete(btn.dataset.id);
                invalidarAsignacionesMaterial(btn.dataset.id);
                await cargarMateriales();
                mostrarExito('Material eliminado');
            },
            errorMessage: mensajeErrorEliminarMaterial
        });

        const modalEliminar = document.getElementById('modalEliminar');
        if (modalEliminar) bootstrap.Modal.getOrCreateInstance(modalEliminar).show();
    });

    const modalEliminar = document.getElementById('modalEliminar');
    modalEliminar?.addEventListener('hidden.bs.modal', resetModalEliminar);

    const btnConfirmar = document.getElementById('btnConfirmarEliminar');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', async function (e) {
            e.preventDefault();
            if (!eliminacionPendiente) return;

            const eliminacionActual = eliminacionPendiente;
            this.disabled = true;
            this.textContent = 'Eliminando...';

            try {
                await eliminacionActual.ejecutar();
                bootstrap.Modal.getInstance(document.getElementById('modalEliminar'))?.hide();
            } catch (error) {
                const mensaje = typeof eliminacionActual.errorMessage === 'function'
                    ? eliminacionActual.errorMessage(error)
                    : error.message || 'Error al eliminar';
                mostrarError(mensaje);
                this.disabled = false;
                this.textContent = 'Eliminar';
            }
        });
    }
}

// ================================
// CARGAR DATOS INICIALES
// ================================
async function cargarDatosIniciales() {
    if (datosCargados) return;
    try {
        const [catRes, instRes, vehRes, perRes] = await Promise.allSettled([
            CategoriaApi.getAll().catch(e => []),
            InstalacionApi.getAll().catch(e => []),
            VehiculoApi.getAll().catch(e => []),
            PersonaApi.getAll().catch(e => [])
        ]);
        categorias    = catRes.status  === 'fulfilled' ? (Array.isArray(catRes.value)  ? catRes.value  : (catRes.value?.data  || [])) : [];
        instalaciones = instRes.status === 'fulfilled' ? (Array.isArray(instRes.value) ? instRes.value : (instRes.value?.data || [])) : [];
        vehiculos     = vehRes.status  === 'fulfilled' ? (Array.isArray(vehRes.value)  ? vehRes.value  : (vehRes.value?.data  || [])) : [];
        personas      = perRes.status  === 'fulfilled' ? (Array.isArray(perRes.value)  ? perRes.value  : (perRes.value?.data  || [])) : [];

        poblarSelectCategorias();
        await cargarMateriales();
        datosCargados = true;
    } catch (e) {
        console.error('Error cargando datos:', e);
    }
}

// ================================
// CARGAR MATERIALES
// ================================
async function cargarMateriales() {
    try {
        showTableLoading('#tabla tbody', 6);
        const response = await MaterialApi.getAll();
        materiales = Array.isArray(response) ? response : (response.data || []);
        materiales.forEach(m => {
            const cat = categorias.find(c => c.id_categoria == m.id_categoria);
            m.categoria_nombre = cat ? cat.nombre : 'Sin categoría';
        });
        pagination.setData(materiales, () => {
      renderTablaMateriales(materiales);
    });
        pagination.render('pagination-material');
        renderTablaMateriales(materiales);
    } catch (e) {
        materiales = [];
        pagination.setData([], () => {
      renderTablaMateriales([]);
    });
        pagination.render('pagination-material');
        renderTablaMateriales([]);
    }
}

// ================================
// POBLAR SELECT DE CATEGORÍAS
// ================================
function poblarSelectCategorias() {
    const sel = document.getElementById('insertCategoria');
    if (!sel) return;
    sel.innerHTML = '<option value="">Seleccione una categoría...</option>';
    categorias.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id_categoria;
        opt.textContent = c.nombre;
        sel.appendChild(opt);
    });
}

// ================================
// RENDER TABLA PRINCIPAL
// ================================
function renderTablaMateriales(lista) {
    const tbody = document.querySelector('#tabla tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!lista || lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay materiales para mostrar</td></tr>';
        return;
    }

    const puedeEscribir = sesionActual?.puedeEscribir ?? false;
    const puedeEliminar = sesionActual?.puedeEliminar ?? false;
    const itemsPagina = pagination.getPageItems(lista);

    itemsPagina.forEach(m => {
        const tr = document.createElement('tr');
        tr.dataset.id = m.id_material;

        const botonVer = `<button type="button" class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${m.id_material}"><i class="bi bi-eye"></i></button>`;
        const botonEditar = puedeEscribir
            ? `<button type="button" class="btn p-0 btn-editar" data-bs-toggle="modal" data-bs-target="#modalEditar" data-id="${m.id_material}"><i class="bi bi-pencil"></i></button>`
            : '';
        const botonEliminar = puedeEliminar
            ? `<button type="button" class="btn p-0 btn-eliminar" data-bs-toggle="modal" data-bs-target="#modalEliminar" data-id="${m.id_material}" data-nombre="${m.nombre}"><i class="bi bi-trash3"></i></button>`
            : '';
        const botonesAccion = `${botonVer}${botonEditar}${botonEliminar}`;

        tr.innerHTML = `
            <td class="d-none d-md-table-cell">${m.id_material ?? ''}</td>
            <td>${m.nombre ?? ''}</td>
            <td class="d-none d-md-table-cell">${m.descripcion ?? ''}</td>
            <td><span class="badge ${m.estado === 'ALTA' ? 'bg-success' : 'bg-danger'}">${m.estado ?? ''}</span></td>
            <td class="d-none d-md-table-cell">${m.categoria_nombre ?? ''}</td>
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
// FILTROS
// ================================
function bindFiltros() {
    document.getElementById('estado')?.addEventListener('change', aplicarFiltros);
    document.getElementById('nombre')?.addEventListener('input', aplicarFiltros);
}

function aplicarFiltros() {
    pagination.goToPage(0);
    const filtroEstado = document.getElementById('estado')?.value;
    const filtroNombre = document.getElementById('nombre')?.value?.toLowerCase();
    const filtrados = materiales.filter(m => {
        let cumple = true;
        if (filtroEstado) cumple = cumple && m.estado === filtroEstado;
        if (filtroNombre) cumple = cumple && (
            m.nombre?.toLowerCase().includes(filtroNombre) ||
            m.descripcion?.toLowerCase().includes(filtroNombre)
        );
        return cumple;
    });
    pagination.setData(filtrados, () => {
      renderTablaMateriales(filtrados);
    });
    pagination.render('pagination-material');
    renderTablaMateriales(filtrados);
}

// ================================
// VALIDAR MATERIAL
// Según DDL Material:
//   nombre      VARCHAR(100) NOT NULL
//   descripcion TEXT         NOT NULL
//   estado      ENUM('ALTA','BAJA') NOT NULL
//   id_categoria FK          NOT NULL
// ================================
function validarMaterial(nombre, descripcion, estado, id_categoria) {
    if (!id_categoria) {
        mostrarError('Debe seleccionar una categoría.');
        return false;
    }
    if (!nombre || !nombre.trim()) {
        mostrarError('El nombre es obligatorio.');
        return false;
    }
    if (nombre.trim().length > 100) {
        mostrarError('El nombre no puede superar los 100 caracteres.');
        return false;
    }
    if (!descripcion || !descripcion.trim()) {
        mostrarError('La descripción es obligatoria.');
        return false;
    }
    if (!validarCheck(estado, ESTADOS_MATERIAL)) {
        mostrarError('El estado no es válido. Debe ser ALTA o BAJA.');
        return false;
    }
    return true;
}

// ================================
// CREAR MATERIAL
// ================================
function bindCrearMaterial() {
    const form = document.getElementById('formInsertar');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id_categoria = parseInt(document.getElementById('insertCategoria').value);
        const nombre       = document.getElementById('insertNombre').value.trim();
        const descripcion  = document.getElementById('insertDescripcion').value.trim();
        const estado       = 'ALTA';

        // ── Validación ──
        if (!validarMaterial(nombre, descripcion, estado, id_categoria)) return;

        try {
            await MaterialApi.create({ id_categoria, nombre, descripcion, estado });
            await cargarMateriales();
            form.reset();
            mostrarExito('Material creado correctamente');
        } catch (err) {
            mostrarError(err.message || 'Error creando material');
        }
    });
}

// ================================
// OBTENER ASIGNACIONES CON CACHÉ
// ================================
async function obtenerAsignacionesMaterial(idMaterial) {
    const cacheKey = normalizarIdMaterial(idMaterial);
    if (asignacionesCache.has(cacheKey)) return asignacionesCache.get(cacheKey);
    try {
        const response = await MaterialApi.getCompleto();
        const todos = Array.isArray(response) ? response : (response.data || []);
        const filtrados = todos.filter(m => normalizarIdMaterial(m.id_material) === cacheKey);
        const resultado = {
            vehiculos: filtrados.filter(a => a.tipo === 'Vehículo'),
            personas:  filtrados.filter(a => a.tipo === 'Persona'),
            almacenes: filtrados.filter(a => a.tipo === 'Almacén')
        };
        asignacionesCache.set(cacheKey, resultado);
        return resultado;
    } catch (e) {
        return { vehiculos: [], personas: [], almacenes: [] };
    }
}

// ================================
// CAMPOS PARA MODAL VER
// ================================
const nombresCampos = ['ID', 'Nombre', 'Descripción', 'Estado', 'Categoría'];
const camposBd      = ['id_material', 'nombre', 'descripcion', 'estado', 'id_categoria'];

// ================================
// MODAL VER
// ================================
function bindModalVer() {
    document.addEventListener('click', async function (e) {
        const btn = e.target.closest('.btn-ver');
        if (!btn) return;

        const material = materiales.find(m => m.id_material == btn.dataset.id);
        if (!material) return;

        const modalBody = document.getElementById('modalVerBody');
        if (!modalBody) return;
        modalBody.innerHTML = '';

        nombresCampos.forEach((nombre, index) => {
            const campo = camposBd[index];
            let valor = material[campo] ?? '';
            if (campo === 'id_categoria') valor = material.categoria_nombre ?? 'Sin categoría';
            const p = document.createElement('p');
            p.innerHTML = `<strong>${nombre}:</strong> ${valor || '—'}`;
            modalBody.appendChild(p);
        });

        try {
            const asignaciones = await obtenerAsignacionesMaterial(material.id_material);
            modalBody.insertAdjacentHTML('beforeend',
                crearTablaVehiculosVer(asignaciones.vehiculos) +
                crearTablaPersonasVer(asignaciones.personas) +
                crearTablaAlmacenesVer(asignaciones.almacenes)
            );
        } catch (error) {
            console.error('Error cargando asignaciones:', error);
        }
    });
}

function crearTablaVehiculosVer(asignaciones) {
    let html = '<div class="mt-4"><h6 class="fw-bold">Asignaciones a vehículos</h6><table class="table table-bordered table-striped table-sm"><thead class="table-dark"><tr><th>Matrícula</th><th>Vehículo</th><th>Unidades</th><th>Nº Serie</th></tr></thead><tbody>';
    if (!asignaciones.length) html += '<tr><td colspan="4" class="text-center text-muted">Sin asignaciones</td></tr>';
    else asignaciones.forEach(a => { html += `<tr><td>${a.identificador||a.matricula||'-'}</td><td>${a.elemento||a.matricula||'-'}</td><td>${a.unidades||'-'}</td><td>${a.numero_serie||a.nserie||'-'}</td></tr>`; });
    return html + '</tbody></table></div>';
}

function crearTablaPersonasVer(asignaciones) {
    let html = '<div class="mt-4"><h6 class="fw-bold">Asignaciones a personas</h6><table class="table table-bordered table-striped table-sm"><thead class="table-dark"><tr><th>ID</th><th>Nombre</th><th>Nº Funcionario</th><th>Nº Serie</th></tr></thead><tbody>';
    if (!asignaciones.length) html += '<tr><td colspan="4" class="text-center text-muted">Sin asignaciones</td></tr>';
    else asignaciones.forEach(a => { html += `<tr><td>${a.identificador||a.id_bombero||'-'}</td><td>${a.elemento||a.nombre||'-'}</td><td>${a.n_funcionario||'-'}</td><td>${a.numero_serie||a.nserie||'-'}</td></tr>`; });
    return html + '</tbody></table></div>';
}

function crearTablaAlmacenesVer(asignaciones) {
    let html = '<div class="mt-4"><h6 class="fw-bold">Asignaciones a almacenes</h6><table class="table table-bordered table-striped table-sm"><thead class="table-dark"><tr><th>Instalación</th><th>Almacén</th><th>Planta</th><th>Unidades</th><th>Nº Serie</th></tr></thead><tbody>';
    if (!asignaciones.length) html += '<tr><td colspan="5" class="text-center text-muted">Sin asignaciones</td></tr>';
    else asignaciones.forEach(a => { html += `<tr><td>${a.nombre_instalacion||a.instalacion||a.id_instalacion||'-'}</td><td>${a.elemento||a.nombre_almacen||a.id_almacen||'-'}</td><td>${a.planta||'-'}</td><td>${a.unidades||'-'}</td><td>${a.numero_serie||a.n_serie||'-'}</td></tr>`; });
    return html + '</tbody></table></div>';
}

// ================================
// MODALES DE ESCRITURA
// ================================
function bindModalesEscritura() {
    document.addEventListener('click', async function (e) {
        const btn = e.target.closest('.btn-editar');
        if (!btn) return;

        currentMaterialId = btn.dataset.id;

        try {
            const response = await MaterialApi.getById(currentMaterialId);
            const material = Array.isArray(response) ? response[0] : (response.data ?? response);
            if (!material) return;

            const form = document.getElementById('formEditar');
            if (!form) return;

            let catOptions = '<option value="">Seleccione una categoría...</option>';
            categorias.forEach(c => {
                catOptions += `<option value="${c.id_categoria}" ${c.id_categoria == material.id_categoria ? 'selected' : ''}>${c.nombre}</option>`;
            });

            form.innerHTML = `
                <div class="row mb-3">
                    <div class="col-lg-4">
                        <label class="form-label">ID</label>
                        <input type="text" class="form-control" value="${material.id_material ?? ''}" disabled>
                        <input type="hidden" name="id_material" value="${material.id_material ?? ''}">
                    </div>
                    <div class="col-lg-8">
                        <label class="form-label">Nombre</label>
                        <input type="text" class="form-control" name="nombre" maxlength="100" value="${material.nombre ?? ''}" required>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-12">
                        <label class="form-label">Descripción</label>
                        <textarea class="form-control" name="descripcion" rows="3" required>${material.descripcion ?? ''}</textarea>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-lg-6">
                        <label class="form-label">Categoría</label>
                        <select class="form-select" name="id_categoria" required>${catOptions}</select>
                    </div>
                    <div class="col-lg-6">
                        <label class="form-label">Estado</label>
                        <select class="form-select" name="estado" required>
                            <option value="ALTA" ${material.estado === 'ALTA' ? 'selected' : ''}>ALTA</option>
                            <option value="BAJA" ${material.estado === 'BAJA' ? 'selected' : ''}>BAJA</option>
                        </select>
                    </div>
                </div>
                <div class="text-center mb-4">
                    <button type="button" class="btn btn-primary btn-guardar-material">Guardar cambios</button>
                </div>
                <hr>
                <ul class="nav nav-tabs" role="tablist">
                    <li class="nav-item"><button type="button" class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-vehiculos"><i class="bi bi-truck"></i> Vehículos</button></li>
                    <li class="nav-item"><button type="button" class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-personas"><i class="bi bi-person"></i> Personas</button></li>
                    <li class="nav-item"><button type="button" class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-almacenes"><i class="bi bi-building"></i> Almacenes</button></li>
                </ul>
                <div class="tab-content mt-3">
                    <div class="tab-pane fade show active" id="tab-vehiculos">
                        <div class="card card-body bg-light mb-3"><div class="row">
                            <div class="col-md-5"><select class="form-select" id="asigVehiculoSelect"><option value="">Vehículo...</option>${vehiculos.map(v => `<option value="${v.matricula}">${v.nombre} (${v.matricula})</option>`).join('')}</select></div>
                            <div class="col-md-2"><input type="number" class="form-control" id="asigVehiculoUnidades" min="1" step="1" inputmode="numeric" value="" placeholder="Unidades"></div>
                            <div class="col-md-3"><input type="text" class="form-control" id="asigVehiculoNserie" placeholder="Nº Serie"></div>
                            <div class="col-md-2"><button type="button" class="btn btn-success w-100" id="btnAsignarVehiculo">Asignar</button></div>
                        </div></div>
                        <table class="table table-bordered table-sm"><thead class="table-dark"><tr><th>Matrícula</th><th>Vehículo</th><th>Unidades</th><th>Nº Serie</th><th class="text-center">Acción</th></tr></thead><tbody id="tbodyVehiculos"><tr><td colspan="5" class="text-center">Cargando...</td></tr></tbody></table>
                    </div>
                    <div class="tab-pane fade" id="tab-personas">
                        <div class="card card-body bg-light mb-3"><div class="row">
                            <div class="col-md-6"><select class="form-select" id="asigPersonaSelect"><option value="">Persona...</option>${personas.map(p => `<option value="${p.id_bombero}">${p.nombre} ${p.apellidos || ''} (${p.n_funcionario || p.id_bombero})</option>`).join('')}</select></div>
                            <div class="col-md-4"><input type="text" class="form-control" id="asigPersonaNserie" placeholder="Nº Serie *"></div>
                            <div class="col-md-2"><button type="button" class="btn btn-success w-100" id="btnAsignarPersona">Asignar</button></div>
                        </div></div>
                        <table class="table table-bordered table-sm"><thead class="table-dark"><tr><th>ID</th><th>Nombre</th><th>Nº Funcionario</th><th>Nº Serie</th><th class="text-center">Acción</th></tr></thead><tbody id="tbodyPersonas"><tr><td colspan="5" class="text-center">Cargando...</td></tr></tbody></table>
                    </div>
                    <div class="tab-pane fade" id="tab-almacenes">
                        <div class="card card-body bg-light mb-3"><div class="row">
                            <div class="col-md-3"><select class="form-select" id="asigInstalacionSelect"><option value="">Instalación...</option>${instalaciones.map(i => `<option value="${i.id_instalacion}">${i.nombre}</option>`).join('')}</select></div>
                            <div class="col-md-3"><select class="form-select" id="asigAlmacenSelect" disabled><option value="">Primero seleccione instalación</option></select></div>
                            <div class="col-md-2"><input type="number" class="form-control" id="asigAlmacenUnidades" min="1" step="1" inputmode="numeric" value="" placeholder="Unidades"></div>
                            <div class="col-md-2"><input type="text" class="form-control" id="asigAlmacenNserie" placeholder="Nº Serie"></div>
                            <div class="col-md-2"><button type="button" class="btn btn-success w-100" id="btnAsignarAlmacen">Asignar</button></div>
                        </div></div>
                        <table class="table table-bordered table-sm"><thead class="table-dark"><tr><th>Instalación</th><th>Almacén</th><th>Planta</th><th>Unidades</th><th>Nº Serie</th><th class="text-center">Acción</th></tr></thead><tbody id="tbodyAlmacenes"><tr><td colspan="6" class="text-center">Cargando...</td></tr></tbody></table>
                    </div>
                </div>`;

            const asignaciones = await obtenerAsignacionesMaterial(currentMaterialId);
            renderTablaVehiculos(asignaciones.vehiculos);
            renderTablaPersonas(asignaciones.personas);
            renderTablaAlmacenes(asignaciones.almacenes);

            vincularCamposUnidadesSerie(
                form.querySelector('#asigVehiculoUnidades'),
                form.querySelector('#asigVehiculoNserie')
            );
            vincularCamposUnidadesSerie(
                form.querySelector('#asigAlmacenUnidades'),
                form.querySelector('#asigAlmacenNserie')
            );

            form.querySelector('.btn-guardar-material').addEventListener('click', async function () {
                const nombre       = form.querySelector('[name="nombre"]').value.trim();
                const descripcion  = form.querySelector('[name="descripcion"]').value.trim();
                const id_categoria = parseInt(form.querySelector('[name="id_categoria"]').value);
                const estado       = form.querySelector('[name="estado"]').value;

                // ── Validación ──
                if (!validarMaterial(nombre, descripcion, estado, id_categoria)) return;

                try {
                    await MaterialApi.update(currentMaterialId, { nombre, descripcion, id_categoria, estado });
                    invalidarAsignacionesMaterial(currentMaterialId);
                    await cargarMateriales();
                    bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
                    mostrarExito('Material actualizado');
                } catch (error) { mostrarError(error.message); }
            });

            form.querySelector('#btnAsignarVehiculo').addEventListener('click', async () => {
                const matricula = form.querySelector('#asigVehiculoSelect').value;
                const unidadesValue = form.querySelector('#asigVehiculoUnidades').value;
                const nserieValue = form.querySelector('#asigVehiculoNserie').value.trim();
                if (!matricula) return mostrarError('Seleccione un vehículo.');

                const asignacion = obtenerAsignacionUnidadesOSerie(unidadesValue, nserieValue);
                if (!asignacion) return;

                const data = asignacion.tipo === 'serie'
                    ? { nserie: asignacion.serie }
                    : { unidades: asignacion.unidades };

                try {
                    await MaterialApi.assignToVehiculo(matricula, currentMaterialId, data);
                    invalidarAsignacionesMaterial(currentMaterialId);
                    renderTablaVehiculos((await obtenerAsignacionesMaterial(currentMaterialId)).vehiculos);
                    form.querySelector('#asigVehiculoSelect').value = '';
                    form.querySelector('#asigVehiculoUnidades').value = '';
                    form.querySelector('#asigVehiculoNserie').value = '';
                    mostrarExito('Asignado correctamente');
                } catch (e) { mostrarError('Error al asignar: ' + (e.message || '')); }
            });

            form.querySelector('#btnAsignarPersona').addEventListener('click', async () => {
                const id_bombero = form.querySelector('#asigPersonaSelect').value;
                const nserie = form.querySelector('#asigPersonaNserie').value.trim();
                if (!id_bombero) return mostrarError('Seleccione una persona.');
                if (!nserie) return mostrarError('El número de serie es obligatorio.');
                try {
                    await MaterialApi.assignToPersona(id_bombero, currentMaterialId, nserie);
                    invalidarAsignacionesMaterial(currentMaterialId);
                    renderTablaPersonas((await obtenerAsignacionesMaterial(currentMaterialId)).personas);
                    form.querySelector('#asigPersonaSelect').value = '';
                    form.querySelector('#asigPersonaNserie').value = '';
                    mostrarExito('Asignado correctamente');
                } catch (e) { mostrarError('Error al asignar: ' + (e.message || '')); }
            });

            form.querySelector('#asigInstalacionSelect').addEventListener('change', async function () {
                await cargarAlmacenesEnSelect(this.value);
            });

            form.querySelector('#btnAsignarAlmacen').addEventListener('click', async () => {
                const id_instalacion = parseInt(form.querySelector('#asigInstalacionSelect').value);
                const id_almacen = parseInt(form.querySelector('#asigAlmacenSelect').value);
                const unidadesValue = form.querySelector('#asigAlmacenUnidades').value;
                const nSerieValue = form.querySelector('#asigAlmacenNserie').value.trim();
                if (!id_instalacion) return mostrarError('Seleccione una instalación.');
                if (!id_almacen)     return mostrarError('Seleccione un almacén.');

                const asignacion = obtenerAsignacionUnidadesOSerie(unidadesValue, nSerieValue);
                if (!asignacion) return;

                const data = { id_material: parseInt(currentMaterialId) };
                if (asignacion.tipo === 'serie') {
                    data.n_serie = asignacion.serie;
                } else {
                    data.unidades = asignacion.unidades;
                }

                try {
                    await MaterialApi.assignToAlmacen(id_instalacion, id_almacen, data);
                    invalidarAsignacionesMaterial(currentMaterialId);
                    renderTablaAlmacenes((await obtenerAsignacionesMaterial(currentMaterialId)).almacenes);
                    form.querySelector('#asigInstalacionSelect').value = '';
                    form.querySelector('#asigAlmacenSelect').innerHTML = '<option value="">Primero seleccione instalación</option>';
                    form.querySelector('#asigAlmacenSelect').disabled = true;
                    form.querySelector('#asigAlmacenUnidades').value = '';
                    form.querySelector('#asigAlmacenNserie').value = '';
                    mostrarExito('Asignado correctamente');
                } catch (e) { mostrarError('Error al asignar: ' + (e.message || '')); }
            });

        } catch (error) {
            mostrarError('Error al cargar datos');
        }
    });
}

// ================================
// RENDER TABLAS DE ASIGNACIONES
// ================================
function renderTablaVehiculos(asignaciones) {
    const tbody = document.getElementById('tbodyVehiculos');
    if (!tbody) return;
    if (!asignaciones?.length) { tbody.innerHTML = '<tr><td colspan="5" class="text-center">Sin asignaciones</td></tr>'; return; }
    tbody.innerHTML = '';
    asignaciones.forEach(a => {
        const matricula = a.identificador || a.matricula || '';
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${a.identificador||a.matricula||'-'}</td><td>${a.elemento||a.matricula||'-'}</td><td>${a.unidades||'-'}</td><td>${a.numero_serie||a.nserie||'-'}</td><td class="text-center align-middle"><button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-compacto" data-matricula="${matricula}" title="Eliminar asignación"><i class="bi bi-trash"></i></button></td>`;
        tr.querySelector('button').addEventListener('click', function (e) {
            e.preventDefault(); e.stopPropagation();
            abrirModalEliminarAsignacion({
                mensaje: mensajeConfirmacionAsignacion('del vehículo', this.dataset.matricula || '-'),
                ejecutar: async () => {
                    await MaterialApi.removeFromVehiculo(this.dataset.matricula, currentMaterialId);
                    invalidarAsignacionesMaterial(currentMaterialId);
                    renderTablaVehiculos((await obtenerAsignacionesMaterial(currentMaterialId)).vehiculos);
                    mostrarExito('Asignación eliminada');
                },
                errorMessage: mensajeErrorEliminarAsignacion
            });
        });
        tbody.appendChild(tr);
    });
}

function renderTablaPersonas(asignaciones) {
    const tbody = document.getElementById('tbodyPersonas');
    if (!tbody) return;
    if (!asignaciones?.length) { tbody.innerHTML = '<tr><td colspan="5" class="text-center">Sin asignaciones</td></tr>'; return; }
    tbody.innerHTML = '';
    asignaciones.forEach(a => {
        const idBombero = a.identificador || a.id_bombero || '';
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${a.identificador||a.id_bombero||'-'}</td><td>${a.elemento||a.nombre||'-'}</td><td>${a.n_funcionario||'-'}</td><td>${a.numero_serie||a.nserie||'-'}</td><td class="text-center align-middle"><button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-compacto" data-id="${idBombero}" title="Eliminar asignación"><i class="bi bi-trash"></i></button></td>`;
        tr.querySelector('button').addEventListener('click', function (e) {
            e.preventDefault(); e.stopPropagation();
            abrirModalEliminarAsignacion({
                mensaje: mensajeConfirmacionAsignacion('de la persona', this.dataset.id || '-'),
                ejecutar: async () => {
                    await MaterialApi.removeFromPersona(this.dataset.id, currentMaterialId);
                    invalidarAsignacionesMaterial(currentMaterialId);
                    renderTablaPersonas((await obtenerAsignacionesMaterial(currentMaterialId)).personas);
                    mostrarExito('Asignación eliminada');
                },
                errorMessage: mensajeErrorEliminarAsignacion
            });
        });
        tbody.appendChild(tr);
    });
}

function renderTablaAlmacenes(asignaciones) {
    const tbody = document.getElementById('tbodyAlmacenes');
    if (!tbody) return;
    if (!asignaciones?.length) { tbody.innerHTML = '<tr><td colspan="6" class="text-center">Sin asignaciones</td></tr>'; return; }
    tbody.innerHTML = '';
    asignaciones.forEach(a => {
        const idAlmacen = a.identificador || a.id_almacen || '';
        const idInstalacion = a.id_instalacion;
        const tr = document.createElement('tr');
        const numeroSerie = a.numero_serie || a.n_serie || '';
        tr.innerHTML = `<td>${a.nombre_instalacion||a.instalacion||a.id_instalacion||'-'}</td><td>${a.elemento||a.nombre_almacen||a.id_almacen||'-'}</td><td>${a.planta||'-'}</td><td>${a.unidades||'-'}</td><td>${numeroSerie||'-'}</td><td class="text-center align-middle"><button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-compacto" data-id-almacen="${idAlmacen}" data-id-instalacion="${idInstalacion || ''}" data-n-serie="${numeroSerie}" title="Eliminar asignación"><i class="bi bi-trash"></i></button></td>`;
        tr.querySelector('button').addEventListener('click', function (e) {
            e.preventDefault(); e.stopPropagation();
            abrirModalEliminarAsignacion({
                mensaje: mensajeConfirmacionAsignacion('del almacén', this.dataset.idAlmacen || '-'),
                ejecutar: async () => {
                    if (!this.dataset.idInstalacion) throw new Error('No se pudo identificar la instalación del almacén.');
                    await MaterialApi.removeFromAlmacen(this.dataset.idInstalacion, this.dataset.idAlmacen, currentMaterialId, this.dataset.nSerie || null);
                    invalidarAsignacionesMaterial(currentMaterialId);
                    renderTablaAlmacenes((await obtenerAsignacionesMaterial(currentMaterialId)).almacenes);
                    mostrarExito('Asignación eliminada');
                },
                errorMessage: mensajeErrorEliminarAsignacion
            });
        });
        tbody.appendChild(tr);
    });
}

// ================================
// CARGAR ALMACENES EN SELECT
// ================================
async function cargarAlmacenesEnSelect(id_instalacion) {
    const sel = document.getElementById('asigAlmacenSelect');
    if (!sel) return;
    if (!id_instalacion) { sel.innerHTML = '<option value="">Primero seleccione instalación</option>'; sel.disabled = true; return; }
    sel.innerHTML = '<option value="">Cargando...</option>'; sel.disabled = true;
    try {
        const response = await AlmacenApi.getByInstalacion(id_instalacion);
        const almacenes = Array.isArray(response) ? response : (response.data || []);
        if (!almacenes.length) { sel.innerHTML = '<option value="">No hay almacenes</option>'; return; }
        sel.innerHTML = '<option value="">Seleccione un almacén...</option>';
        almacenes.forEach(a => { const opt = document.createElement('option'); opt.value = a.id_almacen; opt.textContent = `${a.nombre} - Planta ${a.planta || ''}`; sel.appendChild(opt); });
        sel.disabled = false;
    } catch (e) { sel.innerHTML = '<option value="">Error cargando almacenes</option>'; }
}

// ================================
// ALERTAS
// ================================
function mostrarError(msg) {
    const container = document.getElementById('alert-container'); if (!container) return;
    const w = document.createElement('div');
    w.innerHTML = `<div class="alert alert-danger alert-dismissible fade show shadow" role="alert"><strong>Error:</strong> ${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
    container.appendChild(w); setTimeout(() => w.remove(), 5000);
}

function mostrarExito(msg) {
    const container = document.getElementById('alert-container'); if (!container) return;
    const w = document.createElement('div');
    w.innerHTML = `<div class="alert alert-success alert-dismissible fade show shadow" role="alert"><strong>Éxito:</strong> ${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
    container.appendChild(w); setTimeout(() => w.remove(), 3000);
}

window.refrescarMateriales = async function () { datosCargados = false; asignacionesCache.clear(); await cargarDatosIniciales(); mostrarExito('Datos actualizados'); };
window.MaterialController = { cargarMateriales, aplicarFiltros };
