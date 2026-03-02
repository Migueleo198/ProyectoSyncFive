import MaterialApi from '../api_f/MaterialApi.js';
import CategoriaApi from '../api_f/CategoriaApi.js';
import InstalacionApi from '../api_f/InstalacionApi.js';
import VehiculoApi from '../api_f/VehiculoApi.js';
import PersonaApi from '../api_f/PersonaApi.js';

let materiales = [];
let categorias = [];
let instalaciones = [];
let vehiculos = [];
let personas = [];
let currentMaterialId = null;

// Cache para evitar peticiones duplicadas
let datosCargados = false;
let asignacionesCache = new Map();

document.addEventListener('DOMContentLoaded', () => {
    cargarDatosIniciales();
    bindCrearMaterial();
    bindFiltros();
    bindModales();
    limpiarBackdropsAlCerrarModal();
});


// LIMPIAR BACKDROPS DE BOOTSTRAP

function limpiarBackdropsAlCerrarModal() {
    const modales = ['modalVer', 'modalEditar', 'modalEliminar'];
    modales.forEach(id => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.addEventListener('hidden.bs.modal', function() {
                document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            });
        }
    });
}


// CARGAR DATOS INICIALES

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

async function cargarMateriales() {
    try {
        const response = await MaterialApi.getAll();
        materiales = Array.isArray(response) ? response : (response.data || []);

        materiales.forEach(m => {
            const cat = categorias.find(c => c.id_categoria == m.id_categoria);
            m.categoria_nombre = cat ? cat.nombre : 'Sin categoría';
        });

        renderTablaMateriales(materiales);
    } catch (e) {
        console.error('Error cargando materiales:', e);
        materiales = [];
        renderTablaMateriales([]);
    }
}


// POBLAR SELECT DE CATEGORÍAS

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


// RENDER TABLA PRINCIPAL

function renderTablaMateriales(lista) {
    const tbody = document.querySelector('#tabla tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!lista || lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay materiales para mostrar</td></tr>';
        return;
    }

    lista.forEach(m => {
        const tr = document.createElement('tr');
        tr.dataset.id = m.id_material;

        tr.innerHTML = `
            <td class="d-none d-md-table-cell">${m.id_material ?? ''}</td>
            <td>${m.nombre ?? ''}</td>
            <td class="d-none d-md-table-cell">${m.descripcion ?? ''}</td>
            <td>${m.estado ?? ''}</td>
            <td class="d-none d-md-table-cell">${m.categoria_nombre ?? ''}</td>
            <td class="d-flex justify-content-around">
                <button type="button" class="btn p-0 btn-ver"
                        data-bs-toggle="modal"
                        data-bs-target="#modalVer"
                        data-id="${m.id_material}">
                    <i class="bi bi-eye"></i>
                </button>
                <button type="button" class="btn p-0 btn-editar"
                        data-bs-toggle="modal"
                        data-bs-target="#modalEditar"
                        data-id="${m.id_material}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button type="button" class="btn p-0 btn-eliminar"
                        data-bs-toggle="modal"
                        data-bs-target="#modalEliminar"
                        data-id="${m.id_material}"
                        data-nombre="${m.nombre}">
                    <i class="bi bi-trash3"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}


// FILTROS

function bindFiltros() {
    document.getElementById('estado')?.addEventListener('change', aplicarFiltros);
    document.getElementById('nombre')?.addEventListener('input', aplicarFiltros);
}

function aplicarFiltros() {
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

    renderTablaMateriales(filtrados);
}


// CREAR MATERIAL

function bindCrearMaterial() {
    const form = document.getElementById('formInsertar');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            id_categoria: parseInt(document.getElementById('insertCategoria').value),
            nombre:       document.getElementById('insertNombre').value.trim(),
            descripcion:  document.getElementById('insertDescripcion').value.trim(),
            estado:       document.getElementById('insertEstado').value
        };

        if (!data.id_categoria) { mostrarError('Debe seleccionar una categoría'); return; }
        if (!data.nombre)       { mostrarError('El nombre es obligatorio'); return; }
        if (!data.descripcion)  { mostrarError('La descripción es obligatoria'); return; }
        if (!data.estado)       { mostrarError('Debe seleccionar un estado'); return; }

        try {
            await MaterialApi.create(data);
            await cargarMateriales();
            form.reset();
            mostrarExito('Material creado correctamente');
        } catch (err) {
            mostrarError(err.message || 'Error creando material');
        }
    });
}


// OBTENER ASIGNACIONES CON CACHE

async function obtenerAsignacionesMaterial(idMaterial) {
    if (asignacionesCache.has(idMaterial)) {
        return asignacionesCache.get(idMaterial);
    }

    try {
        const response = await MaterialApi.getCompleto();
        const todos = Array.isArray(response) ? response : (response.data || []);
        const filtrados = todos.filter(m => m.id_material == idMaterial);

        const resultado = {
            vehiculos: filtrados.filter(a => a.tipo === 'Vehículo'),
            personas:  filtrados.filter(a => a.tipo === 'Persona'),
            almacenes: filtrados.filter(a => a.tipo === 'Almacén')
        };

        asignacionesCache.set(idMaterial, resultado);
        return resultado;
    } catch (e) {
        console.error('Error obteniendo asignaciones:', e);
        return { vehiculos: [], personas: [], almacenes: [] };
    }
}


// EXTRAER NOMBRE DE INSTALACIÓN DESDE EL CAMPO 'elemento'

function extraerNombreInstalacion(elemento) {
    if (!elemento) return null;
    const match = elemento.match(/\(([^)]+)\)\s*$/);
    return match ? match[1].trim() : null;
}

function extraerNombreAlmacen(elemento) {
    if (!elemento) return elemento;
    return elemento.replace(/\s*\([^)]+\)\s*$/, '').trim();
}


// CAMPOS PARA MODAL VER

const nombresCampos = ['ID', 'Nombre', 'Descripción', 'Estado', 'Categoría'];
const camposBd      = ['id_material', 'nombre', 'descripcion', 'estado', 'id_categoria'];


// FUNCIONES PARA RENDERIZAR TABLAS EN MODAL VER

function crearTablaVehiculosVer(asignaciones) {
    let html = '<div class="mt-4"><h6 class="fw-bold">Asignaciones a vehículos</h6>';
    html += '<table class="table table-bordered table-striped table-sm">';
    html += '<thead class="table-dark"><tr><th>Matrícula</th><th>Vehículo</th><th>Unidades</th><th>Nº Serie</th></tr></thead>';
    html += '<tbody>';
    if (asignaciones.length === 0) {
        html += '<tr><td colspan="4" class="text-center text-muted">Sin asignaciones</td></tr>';
    } else {
        asignaciones.forEach(a => {
            html += `<tr>
                <td>${a.identificador || a.matricula || '-'}</td>
                <td>${a.elemento || a.matricula || '-'}</td>
                <td>${a.unidades || '-'}</td>
                <td>${a.numero_serie || a.nserie || '-'}</td>
            </tr>`;
        });
    }
    html += '</tbody></table></div>';
    return html;
}

function crearTablaPersonasVer(asignaciones) {
    let html = '<div class="mt-4"><h6 class="fw-bold">Asignaciones a personas</h6>';
    html += '<table class="table table-bordered table-striped table-sm">';
    html += '<thead class="table-dark"><tr><th>ID</th><th>Nombre</th><th>Nº Funcionario</th><th>Nº Serie</th></tr></thead>';
    html += '<tbody>';
    if (asignaciones.length === 0) {
        html += '<tr><td colspan="4" class="text-center text-muted">Sin asignaciones</td></tr>';
    } else {
        asignaciones.forEach(a => {
            html += `<tr>
                <td>${a.identificador || a.id_bombero || '-'}</td>
                <td>${a.elemento || a.nombre || '-'}</td>
                <td>${a.n_funcionario || '-'}</td>
                <td>${a.numero_serie || a.nserie || '-'}</td>
            </tr>`;
        });
    }
    html += '</tbody></table></div>';
    return html;
}

function crearTablaAlmacenesVer(asignaciones) {
    let html = '<div class="mt-4"><h6 class="fw-bold">Asignaciones a almacenes</h6>';
    html += '<table class="table table-bordered table-striped table-sm">';
    html += '<thead class="table-dark"><tr><th>Instalación</th><th>Almacén</th><th>Planta</th><th>Unidades</th><th>Nº Serie</th></tr></thead>';
    html += '<tbody>';
    if (asignaciones.length === 0) {
        html += '<tr><td colspan="5" class="text-center text-muted">Sin asignaciones</td></tr>';
    } else {
        asignaciones.forEach(a => {
            const nombreInstalacion = a.nombre_instalacion || extraerNombreInstalacion(a.elemento) || '-';
            const nombreAlmacen     = a.nombre_almacen     || extraerNombreAlmacen(a.elemento)     || '-';
            html += `<tr>
                <td>${nombreInstalacion}</td>
                <td>${nombreAlmacen}</td>
                <td>${a.planta || '-'}</td>
                <td>${a.unidades || '-'}</td>
                <td>${a.numero_serie || a.n_serie || '-'}</td>
            </tr>`;
        });
    }
    html += '</tbody></table></div>';
    return html;
}


// BIND MODALES

function bindModales() {

    // ---- MODAL VER ----
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
            const strong = document.createElement('strong');
            strong.textContent = nombre + ': ';
            p.appendChild(strong);
            p.appendChild(document.createTextNode(valor));
            modalBody.appendChild(p);
        });

        try {
            const asignaciones = await obtenerAsignacionesMaterial(material.id_material);
            const htmlVehiculos = crearTablaVehiculosVer(asignaciones.vehiculos);
            const htmlPersonas  = crearTablaPersonasVer(asignaciones.personas);
            const htmlAlmacenes = crearTablaAlmacenesVer(asignaciones.almacenes);

            modalBody.insertAdjacentHTML('beforeend', htmlVehiculos + htmlPersonas + htmlAlmacenes);
        } catch (error) {
            console.error('Error cargando asignaciones:', error);
        }
    });


    // ---- MODAL EDITAR ----
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
                const sel = c.id_categoria == material.id_categoria ? 'selected' : '';
                catOptions += `<option value="${c.id_categoria}" ${sel}>${c.nombre}</option>`;
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
                        <input type="text" class="form-control" name="nombre" value="${material.nombre ?? ''}" required>
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
                        <select class="form-select" name="id_categoria" required>
                            ${catOptions}
                        </select>
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
                    <button type="button" class="btn btn-primary btn-guardar-material">
                        Guardar cambios
                    </button>
                </div>

                <hr>

                <!-- ASIGNACIONES EN PESTAÑAS -->
                <ul class="nav nav-tabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button type="button" class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-vehiculos" role="tab">
                            <i class="bi bi-truck"></i> Vehículos
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button type="button" class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-personas" role="tab">
                            <i class="bi bi-person"></i> Personas
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button type="button" class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-almacenes" role="tab">
                            <i class="bi bi-building"></i> Almacenes
                        </button>
                    </li>
                </ul>

                <div class="tab-content mt-3">

                    <!-- VEHÍCULOS -->
                    <div class="tab-pane fade show active" id="tab-vehiculos" role="tabpanel">
                        <div class="card card-body bg-light mb-3">
                            <div class="row g-2 align-items-end">
                                <div class="col-md-4">
                                    <label class="form-label form-label-sm">Vehículo</label>
                                    <select class="form-select form-select-sm" id="asigVehiculoSelect">
                                        <option value="">Seleccione...</option>
                                        ${vehiculos.map(v => `<option value="${v.matricula}">${v.nombre} (${v.matricula})</option>`).join('')}
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label form-label-sm">Asignar por</label>
                                    <select class="form-select form-select-sm" id="modoAsigVehiculo">
                                        <option value="unidades">Unidades</option>
                                        <option value="nserie">Nº Serie</option>
                                    </select>
                                </div>
                                <div class="col-md-3" id="wrapVehiculoUnidades">
                                    <label class="form-label form-label-sm">Unidades</label>
                                    <input type="number" class="form-control form-control-sm" id="asigVehiculoUnidades" min="1" value="1">
                                </div>
                                <div class="col-md-3 d-none" id="wrapVehiculoNserie">
                                    <label class="form-label form-label-sm">Nº Serie</label>
                                    <input type="text" class="form-control form-control-sm" id="asigVehiculoNserie" placeholder="ej: NS-1234">
                                </div>
                                <div class="col-md-2">
                                    <button type="button" class="btn btn-success btn-sm w-100" id="btnAsignarVehiculo">Asignar</button>
                                </div>
                            </div>
                        </div>
                        <table class="table table-bordered table-sm">
                            <thead class="table-dark"><tr><th>Matrícula</th><th>Vehículo</th><th>Unidades</th><th>Nº Serie</th><th>Acción</th></tr></thead>
                            <tbody id="tbodyVehiculos"><tr><td colspan="5" class="text-center">Cargando...</td></tr></tbody>
                        </table>
                    </div>

                    <!-- PERSONAS -->
                    <div class="tab-pane fade" id="tab-personas" role="tabpanel">
                        <div class="card card-body bg-light mb-3">
                            <div class="row g-2 align-items-end">
                                <div class="col-md-5">
                                    <label class="form-label form-label-sm">Persona</label>
                                    <select class="form-select form-select-sm" id="asigPersonaSelect">
                                        <option value="">Seleccione...</option>
                                        ${personas.map(p => `<option value="${p.id_bombero}">${p.nombre} ${p.apellidos || ''} (${p.n_funcionario || p.id_bombero})</option>`).join('')}
                                    </select>
                                </div>
                                <div class="col-md-5">
                                    <label class="form-label form-label-sm">Nº Serie <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control form-control-sm" id="asigPersonaNserie" placeholder="ej: SN001">
                                </div>
                                <div class="col-md-2">
                                    <button type="button" class="btn btn-success btn-sm w-100" id="btnAsignarPersona">Asignar</button>
                                </div>
                            </div>
                        </div>
                        <table class="table table-bordered table-sm">
                            <thead class="table-dark"><tr><th>ID</th><th>Nombre</th><th>Nº Funcionario</th><th>Nº Serie</th><th>Acción</th></tr></thead>
                            <tbody id="tbodyPersonas"><tr><td colspan="5" class="text-center">Cargando...</td></tr></tbody>
                        </table>
                    </div>

                    <!-- ALMACENES -->
                    <div class="tab-pane fade" id="tab-almacenes" role="tabpanel">
                        <div class="card card-body bg-light mb-3">
                            <div class="row g-2 align-items-end">
                                <div class="col-md-3">
                                    <label class="form-label form-label-sm">Instalación</label>
                                    <select class="form-select form-select-sm" id="asigInstalacionSelect">
                                        <option value="">Seleccione...</option>
                                        ${instalaciones.map(i => `<option value="${i.id_instalacion}">${i.nombre}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label form-label-sm">Almacén</label>
                                    <select class="form-select form-select-sm" id="asigAlmacenSelect" disabled>
                                        <option value="">Primero seleccione instalación</option>
                                    </select>
                                </div>
                                <div class="col-md-2">
                                    <label class="form-label form-label-sm">Asignar por</label>
                                    <select class="form-select form-select-sm" id="modoAsigAlmacen">
                                        <option value="unidades">Unidades</option>
                                        <option value="nserie">Nº Serie</option>
                                    </select>
                                </div>
                                <div class="col-md-2" id="wrapAlmacenUnidades">
                                    <label class="form-label form-label-sm">Unidades</label>
                                    <input type="number" class="form-control form-control-sm" id="asigAlmacenUnidades" min="1" value="1">
                                </div>
                                <div class="col-md-2 d-none" id="wrapAlmacenNserie">
                                    <label class="form-label form-label-sm">Nº Serie</label>
                                    <input type="text" class="form-control form-control-sm" id="asigAlmacenNserie" placeholder="ej: 12345">
                                </div>
                                <div class="col-md-2">
                                    <button type="button" class="btn btn-success btn-sm w-100" id="btnAsignarAlmacen">Asignar</button>
                                </div>
                            </div>
                        </div>
                        <table class="table table-bordered table-sm">
                            <thead class="table-dark"><tr><th>Instalación</th><th>Almacén</th><th>Planta</th><th>Unidades</th><th>Nº Serie</th><th>Acción</th></tr></thead>
                            <tbody id="tbodyAlmacenes"><tr><td colspan="6" class="text-center">Cargando...</td></tr></tbody>
                        </table>
                    </div>

                </div>
            `;

            // Cargar asignaciones
            const asignaciones = await obtenerAsignacionesMaterial(currentMaterialId);
            renderTablaVehiculos(asignaciones.vehiculos);
            renderTablaPersonas(asignaciones.personas);
            renderTablaAlmacenes(asignaciones.almacenes);

            bindEventosModalEditar(form);

        } catch (error) {
            console.error('Error:', error);
            mostrarError('Error al cargar datos');
        }
    });


    // ---- MODAL ELIMINAR - Preparar ----
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.btn-eliminar');
        if (!btn) return;

        e.preventDefault();

        const id = btn.dataset.id;
        const nombre = btn.dataset.nombre;

        const btnConfirm = document.getElementById('btnConfirmarEliminar');
        if (btnConfirm) {
            btnConfirm.dataset.id = id;
            btnConfirm.disabled = false;
            btnConfirm.textContent = 'Eliminar';
        }

        const modalBody = document.querySelector('#modalEliminar .modal-body');
        if (modalBody) {
            modalBody.innerHTML = `¿Eliminar el material <strong>"${nombre}"</strong>?<br><small class="text-muted">Esta acción no se puede deshacer.</small>`;
        }
    });

    // ---- MODAL ELIMINAR - Confirmar ----
    const btnConfirmar = document.getElementById('btnConfirmarEliminar');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', async function (e) {
            e.preventDefault();

            const id = this.dataset.id;
            if (!id) return;

            this.disabled = true;
            this.textContent = 'Eliminando...';

            try {
                await MaterialApi.delete(id);
                asignacionesCache.delete(id);
                await cargarMateriales();

                const modal = bootstrap.Modal.getInstance(document.getElementById('modalEliminar'));
                if (modal) modal.hide();

                mostrarExito('Material eliminado');
            } catch (error) {
                console.error('Error:', error);
                if (error.message?.includes('foreign') || error.message?.includes('constraint')) {
                    mostrarError('No se puede eliminar: el material tiene asignaciones');
                } else {
                    mostrarError(error.message || 'Error al eliminar');
                }
                this.disabled = false;
                this.textContent = 'Eliminar';
            }
        });
    }
}


// BIND EVENTOS MODAL EDITAR

function bindEventosModalEditar(form) {

    // Guardar cambios del material
    form.querySelector('.btn-guardar-material').addEventListener('click', async function () {
        const data = {
            nombre:       form.querySelector('input[name="nombre"]').value.trim(),
            descripcion:  form.querySelector('textarea[name="descripcion"]').value.trim(),
            id_categoria: parseInt(form.querySelector('select[name="id_categoria"]').value),
            estado:       form.querySelector('select[name="estado"]').value
        };

        if (!data.nombre || !data.descripcion || !data.id_categoria) {
            mostrarError('Complete todos los campos');
            return;
        }

        try {
            await MaterialApi.update(currentMaterialId, data);
            asignacionesCache.delete(currentMaterialId);
            await cargarMateriales();
            bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
            mostrarExito('Material actualizado');
        } catch (error) {
            mostrarError(error.message);
        }
    });

    // Toggle unidades / nserie en VEHÍCULO
    const modoVehiculo = form.querySelector('#modoAsigVehiculo');
    if (modoVehiculo) {
        modoVehiculo.addEventListener('change', function () {
            const esNserie = this.value === 'nserie';
            form.querySelector('#wrapVehiculoUnidades').classList.toggle('d-none', esNserie);
            form.querySelector('#wrapVehiculoNserie').classList.toggle('d-none', !esNserie);
        });
    }

    // Toggle unidades / nserie en ALMACÉN
    const modoAlmacen = form.querySelector('#modoAsigAlmacen');
    if (modoAlmacen) {
        modoAlmacen.addEventListener('change', function () {
            const esNserie = this.value === 'nserie';
            form.querySelector('#wrapAlmacenUnidades').classList.toggle('d-none', esNserie);
            form.querySelector('#wrapAlmacenNserie').classList.toggle('d-none', !esNserie);
        });
    }

    // Asignar vehículo
    const btnAsignarVehiculo = form.querySelector('#btnAsignarVehiculo');
    if (btnAsignarVehiculo) {
        btnAsignarVehiculo.addEventListener('click', async () => {
            const matricula = form.querySelector('#asigVehiculoSelect').value;
            const modo      = form.querySelector('#modoAsigVehiculo').value;

            if (!matricula) return mostrarError('Seleccione un vehículo');

            let payload = {};
            if (modo === 'unidades') {
                const unidades = parseInt(form.querySelector('#asigVehiculoUnidades').value);
                if (!unidades || unidades < 1) return mostrarError('Unidades inválidas');
                payload = { unidades };
            } else {
                const nserie = form.querySelector('#asigVehiculoNserie').value.trim();
                if (!nserie) return mostrarError('Introduzca el número de serie');
                payload = { nserie };
            }

            try {
                await MaterialApi.assignToVehiculo(matricula, currentMaterialId, payload);
                mostrarExito('Asignado correctamente');
            } catch (e) {
                console.error('Error asignando vehículo:', e);
                mostrarError(e.message || 'Error al asignar vehículo');
            } finally {
                asignacionesCache.delete(currentMaterialId);
                const nuevas = await obtenerAsignacionesMaterial(currentMaterialId);
                renderTablaVehiculos(nuevas.vehiculos);

                form.querySelector('#asigVehiculoSelect').value = '';
                form.querySelector('#asigVehiculoUnidades').value = '1';
                form.querySelector('#asigVehiculoNserie').value = '';
                form.querySelector('#modoAsigVehiculo').value = 'unidades';
                form.querySelector('#wrapVehiculoUnidades').classList.remove('d-none');
                form.querySelector('#wrapVehiculoNserie').classList.add('d-none');
            }
        });
    }

    // Asignar persona
    const btnAsignarPersona = form.querySelector('#btnAsignarPersona');
    if (btnAsignarPersona) {
        btnAsignarPersona.addEventListener('click', async function () {
            const id_bombero = String(form.querySelector('#asigPersonaSelect').value);
            const nserie     = form.querySelector('#asigPersonaNserie').value.trim();

            if (!id_bombero) return mostrarError('Seleccione una persona');
            if (!nserie)     return mostrarError('El número de serie es obligatorio');

            const nserieEncoded = encodeURIComponent(nserie);

            const btn = this;
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

            try {
                await MaterialApi.assignToPersona(id_bombero, currentMaterialId, nserieEncoded);
                mostrarExito('Asignado correctamente');
            } catch (e) {
                console.error('Error asignando persona:', e);
                mostrarError(e.message || 'Error al asignar persona');
            } finally {
                asignacionesCache.delete(currentMaterialId);
                const nuevas = await obtenerAsignacionesMaterial(currentMaterialId);
                renderTablaPersonas(nuevas.personas);

                form.querySelector('#asigPersonaSelect').value = '';
                form.querySelector('#asigPersonaNserie').value = '';

                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    }

    // Cambio instalación → cargar almacenes
    const instalacionSelect = form.querySelector('#asigInstalacionSelect');
    if (instalacionSelect) {
        instalacionSelect.addEventListener('change', function () {
            cargarAlmacenesEnSelect(this.value);
        });
    }

    // ============================================
    // ASIGNAR ALMACÉN - VERSIÓN FINAL FUNCIONAL
    // ============================================
    const btnAsignarAlmacen = form.querySelector('#btnAsignarAlmacen');
    if (btnAsignarAlmacen) {
        // Eliminar event listeners anteriores
        btnAsignarAlmacen.replaceWith(btnAsignarAlmacen.cloneNode(true));
        const nuevoBtn = form.querySelector('#btnAsignarAlmacen');
        
        nuevoBtn.addEventListener('click', async () => {
            const id_instalacion = parseInt(form.querySelector('#asigInstalacionSelect').value);
            const id_almacen     = parseInt(form.querySelector('#asigAlmacenSelect').value);
            const modo           = form.querySelector('#modoAsigAlmacen').value;

            if (!id_instalacion) return mostrarError('Seleccione instalación');
            if (!id_almacen)     return mostrarError('Seleccione almacén');

            // Verificar si ya existe la asignación
            try {
                const asignacionesActuales = await obtenerAsignacionesMaterial(currentMaterialId);
                const instalacionNombre = instalaciones.find(i => i.id_instalacion == id_instalacion)?.nombre;
                
                const yaExiste = asignacionesActuales.almacenes.some(a => {
                    const idAlmacenCoincide = a.id_almacen == id_almacen;
                    const instalacionCoincide = a.nombre_instalacion === instalacionNombre || 
                                                extraerNombreInstalacion(a.elemento) === instalacionNombre;
                    return idAlmacenCoincide && instalacionCoincide;
                });
                
                if (yaExiste) {
                    return mostrarError('Este material ya está asignado a este almacén en esta instalación');
                }
            } catch (e) {
                console.error('Error verificando asignación existente:', e);
            }

            // Construir payload BASE
            let payload = {
                id_material: parseInt(currentMaterialId),
                id_instalacion: id_instalacion
            };

            // MODO EXCLUYENTE: SOLO UN CAMPO
            if (modo === 'unidades') {
                const unidades = parseInt(form.querySelector('#asigAlmacenUnidades').value);
                if (!unidades || unidades < 1) return mostrarError('Unidades inválidas');
                payload.unidades = unidades;
                
            } else { 
                const n_serie = form.querySelector('#asigAlmacenNserie').value.trim();
                if (!n_serie) return mostrarError('Introduzca el número de serie');
                
                if (!/^\d+$/.test(n_serie)) {
                    return mostrarError('El número de serie del almacén debe ser numérico (solo dígitos)');
                }
                
                payload.n_serie = parseInt(n_serie, 10);
            }

            try {
                await MaterialApi.assignToAlmacen(id_almacen, payload);
                mostrarExito('Asignado correctamente');
                
                // Limpiar formulario
                form.querySelector('#asigInstalacionSelect').value = '';
                form.querySelector('#asigAlmacenSelect').innerHTML = '<option value="">Primero seleccione instalación</option>';
                form.querySelector('#asigAlmacenSelect').disabled = true;
                form.querySelector('#asigAlmacenUnidades').value = '1';
                form.querySelector('#asigAlmacenNserie').value = '';
                form.querySelector('#modoAsigAlmacen').value = 'unidades';
                form.querySelector('#wrapAlmacenUnidades').classList.remove('d-none');
                form.querySelector('#wrapAlmacenNserie').classList.add('d-none');
                
            } catch (e) {
                console.error('Error:', e);
                if (e.response) {
                    if (e.response.status === 409) {
                        if (e.response.data?.message?.includes('número de serie')) {
                            mostrarError('El número de serie ya existe en este almacén');
                        } else {
                            mostrarError('El material ya existe en este almacén');
                        }
                    } else {
                        mostrarError(e.response.data?.message || 'Error al asignar');
                    }
                } else {
                    mostrarError(e.message || 'Error al asignar');
                }
            } finally {
                asignacionesCache.delete(currentMaterialId);
                const nuevas = await obtenerAsignacionesMaterial(currentMaterialId);
                renderTablaAlmacenes(nuevas.almacenes);
            }
        });
    }
}


// FUNCIONES PARA RENDERIZAR TABLAS

function renderTablaVehiculos(asignaciones) {
    const tbody = document.getElementById('tbodyVehiculos');
    if (!tbody) return;

    if (!asignaciones || asignaciones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Sin asignaciones</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    asignaciones.forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${a.identificador || a.matricula || '-'}</td>
            <td>${a.elemento || a.matricula || '-'}</td>
            <td>${a.unidades || '-'}</td>
            <td>${a.numero_serie || a.nserie || '-'}</td>
            <td><button type="button" class="btn btn-sm btn-danger btn-eliminar-vehiculo"
                        data-matricula="${a.identificador || a.matricula}">
                <i class="bi bi-trash"></i>
            </button></td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-eliminar-vehiculo').forEach(btn => {
        btn.addEventListener('click', eliminarAsignacionVehiculo);
    });
}

function renderTablaPersonas(asignaciones) {
    const tbody = document.getElementById('tbodyPersonas');
    if (!tbody) return;

    if (!asignaciones || asignaciones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Sin asignaciones</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    asignaciones.forEach(a => {
        const idOriginal = a.identificador || a.id_bombero || '-';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${idOriginal}</td>
            <td>${a.elemento || a.nombre || '-'}</td>
            <td>${a.n_funcionario || '-'}</td>
            <td>${a.numero_serie || a.nserie || '-'}</td>
            <td><button type="button" class="btn btn-sm btn-danger btn-eliminar-persona"
                        data-id="${idOriginal}">
                <i class="bi bi-trash"></i>
            </button></td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-eliminar-persona').forEach(btn => {
        btn.addEventListener('click', eliminarAsignacionPersona);
    });
}

function renderTablaAlmacenes(asignaciones) {
    const tbody = document.getElementById('tbodyAlmacenes');
    if (!tbody) return;

    if (!asignaciones || asignaciones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Sin asignaciones</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    asignaciones.forEach(a => {
        const idAlmacen = a.identificador || a.id_almacen;
        const nombreInstalacion = a.nombre_instalacion || extraerNombreInstalacion(a.elemento) || '-';
        const nombreAlmacen     = a.nombre_almacen     || extraerNombreAlmacen(a.elemento)     || '-';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${nombreInstalacion}</td>
            <td>${nombreAlmacen}</td>
            <td>${a.planta || '-'}</td>
            <td>${a.unidades || '-'}</td>
            <td>${a.numero_serie || a.n_serie || '-'}</td>
            <td><button type="button" class="btn btn-sm btn-danger btn-eliminar-almacen"
                        data-id="${idAlmacen}">
                <i class="bi bi-trash"></i>
            </button></td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-eliminar-almacen').forEach(btn => {
        btn.addEventListener('click', eliminarAsignacionAlmacen);
    });
}


// ELIMINAR ASIGNACIONES

async function eliminarAsignacionVehiculo(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('¿Eliminar asignación de este vehículo?')) return;

    const btn = e.currentTarget;
    const matricula = btn.dataset.matricula;
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

    try {
        await MaterialApi.removeFromVehiculo(matricula, currentMaterialId);
        mostrarExito('Asignación eliminada');
    } catch (e) {
        console.error('Error eliminando asignación:', e);
        mostrarError('Error en servidor, pero recargando...');
    } finally {
        asignacionesCache.delete(currentMaterialId);
        const nuevas = await obtenerAsignacionesMaterial(currentMaterialId);
        renderTablaVehiculos(nuevas.vehiculos);
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
}

async function eliminarAsignacionPersona(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('¿Eliminar asignación de esta persona?')) return;

    const btn = e.currentTarget;
    const id_persona = btn.dataset.id;
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

    try {
        await MaterialApi.removeFromPersona(id_persona, currentMaterialId);
        mostrarExito('Asignación eliminada');
    } catch (e) {
        console.error('Error eliminando asignación:', e);
        mostrarError('Error en servidor, pero recargando...');
    } finally {
        asignacionesCache.delete(currentMaterialId);
        const nuevas = await obtenerAsignacionesMaterial(currentMaterialId);
        renderTablaPersonas(nuevas.personas);
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
}

async function eliminarAsignacionAlmacen(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('¿Eliminar asignación de este almacén?')) return;

    const btn = e.currentTarget;
    const id_almacen = btn.dataset.id;
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

    try {
        await MaterialApi.removeFromAlmacen(id_almacen, currentMaterialId);
        mostrarExito('Asignación eliminada correctamente');
    } catch (e) {
        console.error('Error eliminando asignación:', e);
        mostrarError('Error al eliminar asignación');
    } finally {
        asignacionesCache.delete(currentMaterialId);
        const nuevas = await obtenerAsignacionesMaterial(currentMaterialId);
        renderTablaAlmacenes(nuevas.almacenes);
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
}


// CARGAR ALMACENES EN SELECT

async function cargarAlmacenesEnSelect(id_instalacion) {
    const sel = document.getElementById('asigAlmacenSelect');
    if (!sel) return;

    if (!id_instalacion) {
        sel.innerHTML = '<option value="">Primero seleccione instalación</option>';
        sel.disabled = true;
        return;
    }

    sel.innerHTML = '<option value="">Cargando...</option>';
    sel.disabled = true;

    try {
        const res  = await fetch(`/api/instalaciones/${id_instalacion}/almacenes`);
        if (!res.ok) throw new Error(`Error ${res.status}`);

        const data     = await res.json();
        const almacenes = Array.isArray(data) ? data : (data.data || []);

        if (almacenes.length === 0) {
            sel.innerHTML = '<option value="">No hay almacenes</option>';
            sel.disabled = true;
            return;
        }

        sel.innerHTML = '<option value="">Seleccione un almacén...</option>';
        almacenes.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.id_almacen;
            opt.textContent = `${a.nombre} - Planta ${a.planta || ''}`;
            sel.appendChild(opt);
        });
        sel.disabled = false;
    } catch (e) {
        console.error('Error cargando almacenes:', e);
        sel.innerHTML = '<option value="">Error cargando almacenes</option>';
        sel.disabled = true;
    }
}


// FUNCIONES AUXILIARES

function mostrarError(msg) {
    const container = document.getElementById('alert-container');
    if (!container) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show shadow" role="alert">
            <strong>Error:</strong> ${msg}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    container.appendChild(wrapper);
    setTimeout(() => wrapper.remove(), 5000);
}

function mostrarExito(msg) {
    const container = document.getElementById('alert-container');
    if (!container) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show shadow" role="alert">
            <strong>Éxito:</strong> ${msg}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    container.appendChild(wrapper);
    setTimeout(() => wrapper.remove(), 3000);
}

window.refrescarMateriales = async function () {
    datosCargados = false;
    asignacionesCache.clear();
    await cargarDatosIniciales();
    mostrarExito('Datos actualizados');
};

window.MaterialController = {
    cargarMateriales,
    aplicarFiltros
};