import MaterialApi from '../api_f/MaterialApi.js';
import CategoriaApi from '../api_f/CategoriaApi.js';
import InstalacionApi from '../api_f/InstalacionApi.js';
import VehiculoApi from '../api_f/VehiculoApi.js';
import PersonaApi from '../api_f/PersonaApi.js';
import { authGuard } from '../helpers/authGuard.js';

let materiales = [];
let categorias = [];
let instalaciones = [];
let vehiculos = [];
let personas = [];
let currentMaterialId = null;
let sesionActual = null;

let datosCargados = false;
let asignacionesCache = new Map();

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
    bindModalEliminarPreparar();
});

// ================================
// LIMPIAR BACKDROPS DE BOOTSTRAP
// ================================
// ================================
// LIMPIAR BACKDROPS DE BOOTSTRAP
// ================================
function limpiarBackdropsAlCerrarModal() {
    ['modalVer', 'modalEditar', 'modalEliminar'].forEach(id => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.addEventListener('hidden.bs.modal', function () {
                document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            });
        }
    });
}

// ================================
// FUNCIÓN AUXILIAR PARA EXTRAER NÚMERO DE ID
// ================================
// ================================
// FUNCIÓN AUXILIAR PARA EXTRAER NÚMERO DE ID
// ================================
function extraerNumeroId(id) {
    if (!id && id !== 0) return null;
    if (typeof id === 'number') return id;
    const match = String(id).match(/\d+/);
    return match ? parseInt(match[0]) : null;
}

// ================================
// CARGAR DATOS INICIALES
// ================================
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
        const response = await MaterialApi.getAll();
        materiales = Array.isArray(response) ? response : (response.data || []);
        materiales.forEach(m => {
            const cat = categorias.find(c => c.id_categoria == m.id_categoria);
            m.categoria_nombre = cat ? cat.nombre : 'Sin categoría';
        });
        renderTablaMateriales(materiales);
    } catch (e) {
        materiales = [];
        renderTablaMateriales([]);
    }
}

// ================================
// POBLAR SELECT DE CATEGORÍAS
// ================================
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

    lista.forEach(m => {
        const tr = document.createElement('tr');
        tr.dataset.id = m.id_material;

        const botonesAccion = puedeEscribir
            ? `<button type="button" class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${m.id_material}"><i class="bi bi-eye"></i></button>
               <button type="button" class="btn p-0 btn-editar" data-bs-toggle="modal" data-bs-target="#modalEditar" data-id="${m.id_material}"><i class="bi bi-pencil"></i></button>
               <button type="button" class="btn p-0 btn-eliminar" data-bs-toggle="modal" data-bs-target="#modalEliminar" data-id="${m.id_material}" data-nombre="${m.nombre}"><i class="bi bi-trash3"></i></button>`
            : `<button type="button" class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${m.id_material}"><i class="bi bi-eye"></i></button>`;

        tr.innerHTML = `
            <td class="d-none d-md-table-cell">${m.id_material ?? ''}</td>
            <td>${m.nombre ?? ''}</td>
            <td class="d-none d-md-table-cell">${m.descripcion ?? ''}</td>
            <td><span class="badge ${m.estado === 'ALTA' ? 'bg-success' : 'bg-danger'}">${m.estado ?? ''}</span></td>
            <td class="d-none d-md-table-cell">${m.categoria_nombre ?? ''}</td>
            <td>
                <div  class="d-flex justify-content-around">
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
// ================================
// FILTROS
// ================================
function bindFiltros() {
    document.getElementById('estado')?.addEventListener('change', aplicarFiltros);
    document.getElementById('nombre')?.addEventListener('input', aplicarFiltros);
}

// ================================
// APLICAR FILTROS
// ================================
function aplicarFiltros() {
    const filtroEstado = document.getElementById('estado')?.value;
    const filtroNombre = document.getElementById('nombre')?.value?.toLowerCase();
    renderTablaMateriales(materiales.filter(m => {
        let cumple = true;
        if (filtroEstado) cumple = cumple && m.estado === filtroEstado;
        if (filtroNombre) cumple = cumple && (
            m.nombre?.toLowerCase().includes(filtroNombre) ||
            m.descripcion?.toLowerCase().includes(filtroNombre)
        );
        return cumple;
    }));
}

// ================================
// CREAR MATERIAL
// ================================
// ================================
// CREAR MATERIAL
// ================================
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

// ================================
// OBTENER ASIGNACIONES CON CACHE
// ================================
// ================================
// OBTENER ASIGNACIONES CON CACHÉ
// ================================
async function obtenerAsignacionesMaterial(idMaterial) {
    if (asignacionesCache.has(idMaterial)) return asignacionesCache.get(idMaterial);
    try {
        const response = await fetch('/api/materiales/completo');
        const data = await response.json();
        const todos = Array.isArray(data) ? data : (data.data || []);
        const filtrados = todos.filter(m => m.id_material == idMaterial);
        const resultado = {
            vehiculos: filtrados.filter(a => a.tipo === 'Vehículo'),
            personas:  filtrados.filter(a => a.tipo === 'Persona'),
            almacenes: filtrados.filter(a => a.tipo === 'Almacén')
        };
        asignacionesCache.set(idMaterial, resultado);
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

// ================================
// TABLA VEHÍCULOS - MODAL VER
// ================================
function crearTablaVehiculosVer(asignaciones) {
    let html = '<div class="mt-4"><h6 class="fw-bold">Asignaciones a vehículos</h6><table class="table table-bordered table-striped table-sm"><thead class="table-dark"><tr><th>Matrícula</th><th>Vehículo</th><th>Unidades</th><th>Nº Serie</th></tr></thead><tbody>';
    if (!asignaciones.length) html += '<tr><td colspan="4" class="text-center text-muted">Sin asignaciones</td></tr>';
    else asignaciones.forEach(a => { html += `<tr><td>${a.identificador||a.matricula||'-'}</td><td>${a.elemento||a.matricula||'-'}</td><td>${a.unidades||'-'}</td><td>${a.numero_serie||a.nserie||'-'}</td></tr>`; });
    return html + '</tbody></table></div>';
}

// ================================
// TABLA PERSONAS - MODAL VER
// ================================
function crearTablaPersonasVer(asignaciones) {
    let html = '<div class="mt-4"><h6 class="fw-bold">Asignaciones a personas</h6><table class="table table-bordered table-striped table-sm"><thead class="table-dark"><tr><th>ID</th><th>Nombre</th><th>Nº Funcionario</th><th>Nº Serie</th></tr></thead><tbody>';
    if (!asignaciones.length) html += '<tr><td colspan="4" class="text-center text-muted">Sin asignaciones</td></tr>';
    else asignaciones.forEach(a => { html += `<tr><td>${a.identificador||a.id_bombero||'-'}</td><td>${a.elemento||a.nombre||'-'}</td><td>${a.n_funcionario||'-'}</td><td>${a.numero_serie||a.nserie||'-'}</td></tr>`; });
    return html + '</tbody></table></div>';
}

// ================================
// TABLA ALMACENES - MODAL VER
// ================================
function crearTablaAlmacenesVer(asignaciones) {
    let html = '<div class="mt-4"><h6 class="fw-bold">Asignaciones a almacenes</h6><table class="table table-bordered table-striped table-sm"><thead class="table-dark"><tr><th>Instalación</th><th>Almacén</th><th>Planta</th><th>Unidades</th><th>Nº Serie</th></tr></thead><tbody>';
    if (!asignaciones.length) html += '<tr><td colspan="5" class="text-center text-muted">Sin asignaciones</td></tr>';
    else asignaciones.forEach(a => { html += `<tr><td>${a.nombre_instalacion||a.instalacion||a.id_instalacion||'-'}</td><td>${a.elemento||a.nombre_almacen||a.id_almacen||'-'}</td><td>${a.planta||'-'}</td><td>${a.unidades||'-'}</td><td>${a.numero_serie||a.n_serie||'-'}</td></tr>`; });
    return html + '</tbody></table></div>';
}

// ================================
// MODAL ELIMINAR
// ================================
// ================================
// MODAL ELIMINAR
// ================================
function bindModalEliminarPreparar() {
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.btn-eliminar');
        if (!btn) return;
        e.preventDefault();
        const btnConfirm = document.getElementById('btnConfirmarEliminar');
        if (btnConfirm) { btnConfirm.dataset.id = btn.dataset.id; btnConfirm.disabled = false; btnConfirm.textContent = 'Eliminar'; }
        const modalBody = document.querySelector('#modalEliminar .modal-body');
        if (modalBody) modalBody.innerHTML = `¿Eliminar el material <strong>"${btn.dataset.nombre}"</strong>?<br><small class="text-muted">Esta acción no se puede deshacer.</small>`;
    });

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
                bootstrap.Modal.getInstance(document.getElementById('modalEliminar'))?.hide();
                mostrarExito('Material eliminado');
            } catch (error) {
                mostrarError(error.message?.includes('foreign') || error.message?.includes('constraint')
                    ? 'No se puede eliminar: el material tiene asignaciones'
                    : error.message || 'Error al eliminar');
                this.disabled = false;
                this.textContent = 'Eliminar';
            }
        });
    }
}

// ================================
// MODALES DE ESCRITURA (solo si puedeEscribir)
// ================================
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
                    <div class="col-lg-4">
                        <label class="form-label">Categoría</label>
                        <select class="form-select" name="id_categoria" required>${catOptions}</select>
                    </div>
                    <div class="col-lg-4">
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
                            <div class="col-md-2"><input type="number" class="form-control" id="asigVehiculoUnidades" min="1" value="1"></div>
                            <div class="col-md-3"><input type="text" class="form-control" id="asigVehiculoNserie" placeholder="Nº Serie"></div>
                            <div class="col-md-2"><button type="button" class="btn btn-success w-100" id="btnAsignarVehiculo">Asignar</button></div>
                        </div></div>
                        <table class="table table-bordered table-sm"><thead class="table-dark"><tr><th>Matrícula</th><th>Vehículo</th><th>Unidades</th><th>Nº Serie</th><th>Acción</th></tr></thead><tbody id="tbodyVehiculos"><tr><td colspan="5" class="text-center">Cargando...</td></tr></tbody></table>
                    </div>
                    <div class="tab-pane fade" id="tab-personas">
                        <div class="card card-body bg-light mb-3"><div class="row">
                            <div class="col-md-6"><select class="form-select" id="asigPersonaSelect"><option value="">Persona...</option>${personas.map(p => `<option value="${p.id_bombero}">${p.nombre} ${p.apellidos || ''} (${p.n_funcionario || p.id_bombero})</option>`).join('')}</select></div>
                            <div class="col-md-4"><input type="text" class="form-control" id="asigPersonaNserie" placeholder="Nº Serie *"></div>
                            <div class="col-md-2"><button type="button" class="btn btn-success w-100" id="btnAsignarPersona">Asignar</button></div>
                        </div></div>
                        <table class="table table-bordered table-sm"><thead class="table-dark"><tr><th>ID</th><th>Nombre</th><th>Nº Funcionario</th><th>Nº Serie</th><th>Acción</th></tr></thead><tbody id="tbodyPersonas"><tr><td colspan="5" class="text-center">Cargando...</td></tr></tbody></table>
                    </div>
                    <div class="tab-pane fade" id="tab-almacenes">
                        <div class="card card-body bg-light mb-3"><div class="row">
                            <div class="col-md-3"><select class="form-select" id="asigInstalacionSelect"><option value="">Instalación...</option>${instalaciones.map(i => `<option value="${i.id_instalacion}">${i.nombre}</option>`).join('')}</select></div>
                            <div class="col-md-3"><select class="form-select" id="asigAlmacenSelect" disabled><option value="">Primero seleccione instalación</option></select></div>
                            <div class="col-md-2"><input type="number" class="form-control" id="asigAlmacenUnidades" min="1" value="1"></div>
                            <div class="col-md-2"><input type="text" class="form-control" id="asigAlmacenNserie" placeholder="Nº Serie"></div>
                            <div class="col-md-2"><button type="button" class="btn btn-success w-100" id="btnAsignarAlmacen">Asignar</button></div>
                        </div></div>
                        <table class="table table-bordered table-sm"><thead class="table-dark"><tr><th>Instalación</th><th>Almacén</th><th>Planta</th><th>Unidades</th><th>Nº Serie</th><th>Acción</th></tr></thead><tbody id="tbodyAlmacenes"><tr><td colspan="6" class="text-center">Cargando...</td></tr></tbody></table>
                    </div>
                </div>`;

            const asignaciones = await obtenerAsignacionesMaterial(currentMaterialId);
            renderTablaVehiculos(asignaciones.vehiculos);
            renderTablaPersonas(asignaciones.personas);
            renderTablaAlmacenes(asignaciones.almacenes);

            form.querySelector('.btn-guardar-material').addEventListener('click', async function () {
                const data = {
                    nombre:       form.querySelector('[name="nombre"]').value.trim(),
                    descripcion:  form.querySelector('[name="descripcion"]').value.trim(),
                    id_categoria: parseInt(form.querySelector('[name="id_categoria"]').value),
                    estado:       form.querySelector('[name="estado"]').value,
                };
                if (!data.nombre || !data.descripcion || !data.id_categoria) { mostrarError('Complete todos los campos'); return; }
                try {
                    await MaterialApi.update(currentMaterialId, data);
                    asignacionesCache.delete(currentMaterialId);
                    await cargarMateriales();
                    bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
                    mostrarExito('Material actualizado');
                } catch (error) { mostrarError(error.message); }
            });

            form.querySelector('#btnAsignarVehiculo').addEventListener('click', async () => {
                const matricula = form.querySelector('#asigVehiculoSelect').value;
                const unidades = parseInt(form.querySelector('#asigVehiculoUnidades').value);
                const nserie = form.querySelector('#asigVehiculoNserie').value.trim() || null;
                if (!matricula) return mostrarError('Seleccione un vehículo');
                if (unidades < 1) return mostrarError('Unidades inválidas');
                try {
                    await MaterialApi.assignToVehiculo(matricula, currentMaterialId, { nserie, unidades });
                    asignacionesCache.delete(currentMaterialId);
                    renderTablaVehiculos((await obtenerAsignacionesMaterial(currentMaterialId)).vehiculos);
                    form.querySelector('#asigVehiculoSelect').value = '';
                    form.querySelector('#asigVehiculoUnidades').value = '1';
                    form.querySelector('#asigVehiculoNserie').value = '';
                    mostrarExito('Asignado correctamente');
                } catch (e) { mostrarError('Error al asignar: ' + (e.message || '')); }
            });

            form.querySelector('#btnAsignarPersona').addEventListener('click', async () => {
                const id_bombero_num = extraerNumeroId(form.querySelector('#asigPersonaSelect').value);
                const nserie = form.querySelector('#asigPersonaNserie').value.trim();
                if (!id_bombero_num) return mostrarError('Seleccione una persona');
                if (!nserie) return mostrarError('El número de serie es obligatorio');
                try {
                    await MaterialApi.assignToPersona(id_bombero_num, currentMaterialId, nserie);
                    asignacionesCache.delete(currentMaterialId);
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
                const unidades = parseInt(form.querySelector('#asigAlmacenUnidades').value);
                const n_serie = form.querySelector('#asigAlmacenNserie').value.trim() || null;
                if (!id_instalacion) return mostrarError('Seleccione instalación');
                if (!id_almacen) return mostrarError('Seleccione almacén');
                if (unidades < 1) return mostrarError('Unidades inválidas');
                try {
                    await MaterialApi.assignToAlmacen(id_almacen, { id_material: parseInt(currentMaterialId), id_instalacion, n_serie, unidades });
                    asignacionesCache.delete(currentMaterialId);
                    renderTablaAlmacenes((await obtenerAsignacionesMaterial(currentMaterialId)).almacenes);
                    form.querySelector('#asigInstalacionSelect').value = '';
                    form.querySelector('#asigAlmacenSelect').innerHTML = '<option value="">Primero seleccione instalación</option>';
                    form.querySelector('#asigAlmacenSelect').disabled = true;
                    form.querySelector('#asigAlmacenUnidades').value = '1';
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
// ================================
// RENDER TABLA VEHÍCULOS ASIGNADOS
// ================================
function renderTablaVehiculos(asignaciones) {
    const tbody = document.getElementById('tbodyVehiculos');
    if (!tbody) return;
    if (!asignaciones?.length) { tbody.innerHTML = '<tr><td colspan="5" class="text-center">Sin asignaciones</td></tr>'; return; }
    tbody.innerHTML = '';
    asignaciones.forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${a.identificador||a.matricula||'-'}</td><td>${a.elemento||a.matricula||'-'}</td><td>${a.unidades||'-'}</td><td>${a.numero_serie||a.nserie||'-'}</td><td><button type="button" class="btn btn-sm btn-danger" data-matricula="${a.identificador||a.matricula}"><i class="bi bi-trash"></i></button></td>`;
        tr.querySelector('button').addEventListener('click', async function (e) {
            e.preventDefault(); e.stopPropagation();
            if (!confirm('¿Eliminar asignación de este vehículo?')) return;
            const btn = this; btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
            try {
                await MaterialApi.removeFromVehiculo(this.dataset.matricula, currentMaterialId);
                asignacionesCache.delete(currentMaterialId);
                renderTablaVehiculos((await obtenerAsignacionesMaterial(currentMaterialId)).vehiculos);
                mostrarExito('Asignación eliminada');
            } catch (e) { mostrarError('Error al eliminar: ' + (e.message || '')); btn.disabled = false; btn.innerHTML = '<i class="bi bi-trash"></i>'; }
        });
        tbody.appendChild(tr);
    });
}

// ================================
// RENDER TABLA PERSONAS ASIGNADAS
// ================================
function renderTablaPersonas(asignaciones) {
    const tbody = document.getElementById('tbodyPersonas');
    if (!tbody) return;
    if (!asignaciones?.length) { tbody.innerHTML = '<tr><td colspan="5" class="text-center">Sin asignaciones</td></tr>'; return; }
    tbody.innerHTML = '';
    asignaciones.forEach(a => {
        const idNum = extraerNumeroId(a.identificador || a.id_bombero);
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${a.identificador||a.id_bombero||'-'}</td><td>${a.elemento||a.nombre||'-'}</td><td>${a.n_funcionario||'-'}</td><td>${a.numero_serie||a.nserie||'-'}</td><td><button type="button" class="btn btn-sm btn-danger" data-id="${idNum}"><i class="bi bi-trash"></i></button></td>`;
        tr.querySelector('button').addEventListener('click', async function (e) {
            e.preventDefault(); e.stopPropagation();
            if (!confirm('¿Eliminar asignación de esta persona?')) return;
            const btn = this; btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
            try {
                await MaterialApi.removeFromPersona(this.dataset.id, currentMaterialId);
                asignacionesCache.delete(currentMaterialId);
                renderTablaPersonas((await obtenerAsignacionesMaterial(currentMaterialId)).personas);
                mostrarExito('Asignación eliminada');
            } catch (e) { mostrarError('Error al eliminar: ' + (e.message || '')); btn.disabled = false; btn.innerHTML = '<i class="bi bi-trash"></i>'; }
        });
        tbody.appendChild(tr);
    });
}

// ================================
// RENDER TABLA ALMACENES ASIGNADOS
// ================================
function renderTablaAlmacenes(asignaciones) {
    const tbody = document.getElementById('tbodyAlmacenes');
    if (!tbody) return;
    if (!asignaciones?.length) { tbody.innerHTML = '<tr><td colspan="6" class="text-center">Sin asignaciones</td></tr>'; return; }
    tbody.innerHTML = '';
    asignaciones.forEach(a => {
        const idAlmacen = a.identificador || a.id_almacen;
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${a.nombre_instalacion||a.instalacion||a.id_instalacion||'-'}</td><td>${a.elemento||a.nombre_almacen||a.id_almacen||'-'}</td><td>${a.planta||'-'}</td><td>${a.unidades||'-'}</td><td>${a.numero_serie||a.n_serie||'-'}</td><td><button type="button" class="btn btn-sm btn-danger" data-id="${idAlmacen}"><i class="bi bi-trash"></i></button></td>`;
        tr.querySelector('button').addEventListener('click', async function (e) {
            e.preventDefault(); e.stopPropagation();
            if (!confirm('¿Eliminar asignación de este almacén?')) return;
            const btn = this; btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
            try {
                const r = await fetch(`/api/almacenes/${this.dataset.id}/material/${currentMaterialId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
                const text = await r.text();
                if (!r.ok) { try { throw new Error(JSON.parse(text).message); } catch { throw new Error(text.substring(0, 100)); } }
                asignacionesCache.delete(currentMaterialId);
                renderTablaAlmacenes((await obtenerAsignacionesMaterial(currentMaterialId)).almacenes);
                mostrarExito('Asignación eliminada');
            } catch (e) { mostrarError('Error al eliminar: ' + (e.message || '')); btn.disabled = false; btn.innerHTML = '<i class="bi bi-trash"></i>'; }
        });
        tbody.appendChild(tr);
    });
}

// ================================
// CARGAR ALMACENES EN SELECT
// ================================
// ================================
// CARGAR ALMACENES EN SELECT
// ================================
async function cargarAlmacenesEnSelect(id_instalacion) {
    const sel = document.getElementById('asigAlmacenSelect');
    if (!sel) return;
    if (!id_instalacion) { sel.innerHTML = '<option value="">Primero seleccione instalación</option>'; sel.disabled = true; return; }
    sel.innerHTML = '<option value="">Cargando...</option>'; sel.disabled = true;
    try {
        const res = await fetch(`/api/instalaciones/${id_instalacion}/almacenes`);
        const data = await res.json();
        const almacenes = Array.isArray(data) ? data : (data.data || []);
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