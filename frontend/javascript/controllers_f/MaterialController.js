// ================================
// MATERIAL CONTROLLER - VERSIÓN FINAL CON MODAL EDITABLE COMPLETO
// ================================

let materiales = [];
let categorias = [];
let vehiculos = [];
let personas = [];
let instalaciones = [];
let currentMaterialId = null;
let asignacionesActuales = {
    vehiculos: [],
    personas: [],
    almacenes: []
};
let pendingDeleteEndpoint = null;

// ================================
// INICIALIZACIÓN
// ================================
document.addEventListener('DOMContentLoaded', () => {
    cargarDatosIniciales();
    bindCrearMaterial();
    bindFiltros();
    bindModales();
    bindAsignaciones();
});

// ================================
// CARGAR DATOS INICIALES
// ================================
async function cargarDatosIniciales() {
    try {
        await Promise.all([
            cargarMateriales(),
            cargarCategorias(),
            cargarVehiculos(),
            cargarPersonas(),
            cargarInstalaciones()
        ]);

        poblarSelectCategorias();
        poblarSelectoresComunes();
        poblarSelectCategoriasCompleto();

    } catch (e) {
        console.error('Error cargando datos:', e);
        mostrarError('Error cargando datos: ' + e.message);
    }
}

// ================================
// API CALLS - MATERIALES
// ================================
async function cargarMateriales() {
    try {
        const response = await fetch('/api/materiales');
        const data = await response.json();
        materiales = Array.isArray(data) ? data : (data.data || []);
        renderTablaMateriales(materiales);
    } catch (e) {
        console.error('Error cargando materiales:', e);
        materiales = [];
        renderTablaMateriales(materiales);
    }
}

async function cargarMaterial(id) {
    try {
        const response = await fetch(`/api/materiales/${id}`);
        if (!response.ok) throw new Error('Error al cargar el material');
        const material = await response.json();
        
        const index = materiales.findIndex(m => m.id_material == id);
        if (index >= 0) {
            materiales[index] = material;
        } else {
            materiales.push(material);
        }
        
        return material;
    } catch (e) {
        console.error('Error:', e);
        mostrarError('No se pudo cargar la información del material');
        return null;
    }
}

// ================================
// API CALLS - CATEGORÍAS
// ================================
async function cargarCategorias() {
    try {
        const response = await fetch('/api/categorias');
        const data = await response.json();
        categorias = Array.isArray(data) ? data : (data.data || []);
    } catch (e) {
        console.error('Error cargando categorías:', e);
        categorias = [];
    }
}

async function cargarVehiculos() {
    try {
        const response = await fetch('/api/vehiculos');
        const data = await response.json();
        vehiculos = Array.isArray(data) ? data : (data.data || []);
    } catch (e) {
        console.error('Error cargando vehículos:', e);
        vehiculos = [];
    }
}

async function cargarPersonas() {
    try {
        const response = await fetch('/api/personas');
        const data = await response.json();
        personas = Array.isArray(data) ? data : (data.data || []);
    } catch (e) {
        console.error('Error cargando personas:', e);
        personas = [];
    }
}

async function cargarInstalaciones() {
    try {
        const response = await fetch('/api/instalaciones');
        const data = await response.json();
        instalaciones = Array.isArray(data) ? data : (data.data || []);
    } catch (e) {
        console.error('Error cargando instalaciones:', e);
        instalaciones = [];
    }
}

async function cargarAlmacenesPorInstalacion(id_instalacion) {
    try {
        const response = await fetch(`/api/instalaciones/${id_instalacion}/almacenes`);
        const data = await response.json();
        return Array.isArray(data) ? data : (data.data || []);
    } catch (e) {
        console.error('Error cargando almacenes:', e);
        return [];
    }
}

// ================================
// FUNCIONES PARA OBTENER ASIGNACIONES
// ================================
async function obtenerAsignacionesMaterial(idMaterial) {
    try {
        const response = await fetch('/api/materiales/completo');
        const data = await response.json();
        
        let todosLosMateriales = [];
        if (Array.isArray(data)) {
            todosLosMateriales = data;
        } else if (data && Array.isArray(data.data)) {
            todosLosMateriales = data.data;
        } else {
            todosLosMateriales = [];
        }
        
        const asignacionesMaterial = todosLosMateriales.filter(m => m.id_material == idMaterial);
        
        const vehiculos = asignacionesMaterial.filter(a => a.tipo === 'Vehículo');
        const personas = asignacionesMaterial.filter(a => a.tipo === 'Persona');
        const almacenes = asignacionesMaterial.filter(a => a.tipo === 'Almacén');
        
        return { vehiculos, personas, almacenes };
        
    } catch (e) {
        console.error('Error obteniendo asignaciones:', e);
        return { vehiculos: [], personas: [], almacenes: [] };
    }
}

// ================================
// RENDERIZADO - TABLA PRINCIPAL
// ================================
function renderTablaMateriales(materiales) {
    const tbody = document.querySelector('#tabla tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!Array.isArray(materiales) || materiales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay materiales para mostrar</td></tr>';
        return;
    }

    materiales.forEach(m => {
        const tr = document.createElement('tr');
        tr.dataset.id = m.id_material;

        tr.innerHTML = `
            <td class="d-none d-md-table-cell">${m.id_material || ''}</td>
            <td>${m.nombre || ''}</td>
            <td class="d-none d-md-table-cell">${m.descripcion || ''}</td>
            <td>
                <span class="badge ${m.estado === 'ALTA' ? 'bg-success' : 'bg-danger'}">
                    ${m.estado || ''}
                </span>
            </td>
            <td class="d-none d-md-table-cell">${m.categoria_nombre || m.id_categoria || ''}</td>
            <td class="d-flex justify-content-around">
                <button type="button" class="btn p-0 btn-ver" 
                        data-bs-toggle="modal" 
                        data-bs-target="#modalVerCompleto"
                        data-id="${m.id_material}">
                    <i class="bi bi-eye"></i>
                </button>
                <button type="button" class="btn p-0 btn-editar-completo" 
                        data-bs-toggle="modal" 
                        data-bs-target="#modalEditarCompleto"
                        data-id="${m.id_material}">
                    <i class="bi bi-pencil-square"></i>
                </button>
                <button type="button" class="btn p-0 btn-eliminar" 
                        data-bs-toggle="modal"                                         
                        data-bs-target="#modalEliminarMaterial" 
                        data-id="${m.id_material}"
                        data-nombre="${m.nombre}">
                    <i class="bi bi-trash3"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function poblarSelectCategorias() {
    const selectInsert = document.getElementById('insertCategoria');
    if (selectInsert) {
        selectInsert.innerHTML = '<option value="">Seleccione una categoría...</option>';
        categorias.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id_categoria;
            option.textContent = c.nombre;
            selectInsert.appendChild(option);
        });
    }
}

function poblarSelectCategoriasCompleto() {
    const selectCategoria = document.getElementById('editCompletoCategoria');
    if (selectCategoria) {
        selectCategoria.innerHTML = '<option value="">Seleccione una categoría...</option>';
        categorias.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id_categoria;
            option.textContent = c.nombre;
            selectCategoria.appendChild(option);
        });
    }
}

function poblarSelectoresComunes() {
    const selectVehiculo = document.getElementById('selectVehiculo');
    if (selectVehiculo) {
        selectVehiculo.innerHTML = '<option value="">Seleccione un vehículo...</option>';
        vehiculos.forEach(v => {
            const option = document.createElement('option');
            option.value = v.matricula;
            option.textContent = `${v.nombre} - ${v.matricula}`;
            selectVehiculo.appendChild(option);
        });
    }

    const selectPersona = document.getElementById('selectPersona');
    if (selectPersona) {
        selectPersona.innerHTML = '<option value="">Seleccione una persona...</option>';
        personas.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id_bombero;
            option.textContent = `${p.nombre} ${p.apellidos || ''} (${p.id_bombero})`;
            selectPersona.appendChild(option);
        });
    }

    const selectInstalacion = document.getElementById('selectInstalacion');
    if (selectInstalacion) {
        selectInstalacion.innerHTML = '<option value="">Seleccione una instalación...</option>';
        instalaciones.forEach(i => {
            const option = document.createElement('option');
            option.value = i.id_instalacion;
            option.textContent = i.nombre;
            selectInstalacion.appendChild(option);
        });

        selectInstalacion.addEventListener('change', async function() {
            const id_instalacion = this.value;
            const selectAlmacen = document.getElementById('selectAlmacen');
            
            if (!id_instalacion) {
                selectAlmacen.innerHTML = '<option value="">Primero seleccione instalación</option>';
                selectAlmacen.disabled = true;
                return;
            }

            selectAlmacen.innerHTML = '<option value="">Cargando almacenes...</option>';
            selectAlmacen.disabled = true;

            const almacenesInst = await cargarAlmacenesPorInstalacion(id_instalacion);
            
            if (almacenesInst.length > 0) {
                selectAlmacen.innerHTML = '<option value="">Seleccione un almacén...</option>';
                almacenesInst.forEach(a => {
                    const option = document.createElement('option');
                    option.value = a.id_almacen;
                    option.textContent = `${a.nombre} - Planta ${a.planta || ''}`;
                    selectAlmacen.appendChild(option);
                });
                selectAlmacen.disabled = false;
            } else {
                selectAlmacen.innerHTML = '<option value="">No hay almacenes en esta instalación</option>';
                selectAlmacen.disabled = true;
            }
        });
    }

    const selectAlmacen = document.getElementById('selectAlmacen');
    if (selectAlmacen) {
        selectAlmacen.innerHTML = '<option value="">Primero seleccione instalación</option>';
        selectAlmacen.disabled = true;
    }
}

// ================================
// FILTROS
// ================================
function bindFiltros() {
    const filtroEstado = document.getElementById('estado');
    const filtroNombre = document.getElementById('nombre');
    
    if (filtroEstado) filtroEstado.addEventListener('change', aplicarFiltros);
    if (filtroNombre) filtroNombre.addEventListener('input', aplicarFiltros);
}

function aplicarFiltros() {
    const filtroEstado = document.getElementById('estado')?.value;
    const filtroNombre = document.getElementById('nombre')?.value?.toLowerCase();

    const filtrados = materiales.filter(m => {
        let cumple = true;
        if (filtroEstado && filtroEstado !== '') {
            cumple = cumple && m.estado === filtroEstado;
        }
        if (filtroNombre && filtroNombre !== '') {
            cumple = cumple && (m.nombre?.toLowerCase().includes(filtroNombre) ||
                m.descripcion?.toLowerCase().includes(filtroNombre));
        }
        return cumple;
    });

    renderTablaMateriales(filtrados);
}

// ================================
// CRUD MATERIALES
// ================================
function bindCrearMaterial() {
    const form = document.getElementById('formInsertar');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            id_categoria: document.getElementById('insertCategoria').value,
            nombre: document.getElementById('insertNombre').value,
            descripcion: document.getElementById('insertDescripcion').value,
            estado: document.getElementById('insertEstado').value
        };

        if (!data.id_categoria) {
            mostrarError('Debe seleccionar una categoría');
            return;
        }

        if (!data.nombre || data.nombre.trim() === '') {
            mostrarError('El nombre es obligatorio');
            return;
        }

        if (!data.descripcion || data.descripcion.trim() === '') {
            mostrarError('La descripción es obligatoria');
            return;
        }

        if (!data.estado) {
            mostrarError('Debe seleccionar un estado');
            return;
        }

        try {
            const response = await fetch('/api/materiales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                if (result.errors) {
                    const errores = Object.values(result.errors).flat().join(', ');
                    throw new Error(errores);
                }
                throw new Error(result.message || 'Error al crear');
            }

            await cargarMateriales();
            form.reset();
            mostrarExito('Material creado correctamente');
        } catch (err) {
            mostrarError(err.message || 'Error creando material');
        }
    });
}

async function actualizarMaterial(id, data) {
    try {
        const response = await fetch(`/api/materiales/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            if (result.errors) {
                const errores = Object.values(result.errors).flat().join(', ');
                throw new Error(errores);
            }
            throw new Error(result.message || 'Error al actualizar');
        }

        await cargarMateriales();
        return true;
    } catch (error) {
        throw error;
    }
}

async function eliminarMaterial(id) {
    try {
        const response = await fetch(`/api/materiales/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || 'No se puede eliminar porque tiene asignaciones');
        }

        await cargarMateriales();
        return true;
    } catch (error) {
        throw error;
    }
}

// ================================
// ASIGNACIONES
// ================================
async function asignarAVehiculo(formData) {
    const matricula = formData.get('matricula');
    const unidades = parseInt(formData.get('unidades'));
    const nserie = formData.get('nserie') || null;

    if (!matricula) {
        mostrarError('Seleccione un vehículo');
        return false;
    }

    if (isNaN(unidades) || unidades <= 0) {
        mostrarError('Las unidades deben ser un número positivo');
        return false;
    }

    const data = { nserie, unidades };

    try {
        const response = await fetch(`/api/vehiculos/${matricula}/materiales/${currentMaterialId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || 'Error al asignar');
        }

        const asignaciones = await obtenerAsignacionesMaterial(currentMaterialId);
        asignacionesActuales = asignaciones;
        
        renderModalTablaVehiculos(asignaciones.vehiculos);
        renderModalTablaPersonas(asignaciones.personas);
        renderModalTablaAlmacenes(asignaciones.almacenes);
        
        return true;
    } catch (e) {
        throw e;
    }
}

async function asignarAAlmacen(formData) {
    const id_almacen = parseInt(formData.get('id_almacen'));
    const id_instalacion = parseInt(formData.get('id_instalacion'));
    const unidades = parseInt(formData.get('unidades'));
    const n_serie = formData.get('n_serie') || null;

    if (isNaN(id_almacen) || id_almacen <= 0) {
        mostrarError('Seleccione un almacén');
        return false;
    }

    if (isNaN(id_instalacion) || id_instalacion <= 0) {
        mostrarError('Seleccione una instalación');
        return false;
    }

    if (isNaN(unidades) || unidades <= 0) {
        mostrarError('Las unidades deben ser un número positivo');
        return false;
    }

    const data = {
        id_material: parseInt(currentMaterialId),
        id_instalacion,
        n_serie,
        unidades
    };

    try {
        const response = await fetch(`/api/almacenes/${id_almacen}/material`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || 'Error al asignar');
        }

        const asignaciones = await obtenerAsignacionesMaterial(currentMaterialId);
        asignacionesActuales = asignaciones;
        
        renderModalTablaVehiculos(asignaciones.vehiculos);
        renderModalTablaPersonas(asignaciones.personas);
        renderModalTablaAlmacenes(asignaciones.almacenes);
        
        return true;
    } catch (e) {
        throw e;
    }
}

async function asignarAPersona(formData) {
    const id_bombero = formData.get('id_bombero');
    const nserie = formData.get('nserie');

    if (!id_bombero) {
        mostrarError('Seleccione una persona');
        return false;
    }

    if (!nserie) {
        mostrarError('El número de serie es obligatorio');
        return false;
    }

    try {
        let idBomberoNum = id_bombero;
        
        if (typeof id_bombero === 'string' && id_bombero.match(/^[A-Za-z]+\d+$/)) {
            idBomberoNum = parseInt(id_bombero.replace(/[^0-9]/g, ''));
        } else {
            idBomberoNum = parseInt(id_bombero);
        }
        
        const materialId = parseInt(currentMaterialId);
        
        if (isNaN(idBomberoNum)) {
            mostrarError('ID de bombero inválido');
            return false;
        }
        
        const response = await fetch(`/api/personas/${idBomberoNum}/material/${materialId}/${nserie}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || 'Error al asignar');
        }

        const asignaciones = await obtenerAsignacionesMaterial(currentMaterialId);
        asignacionesActuales = asignaciones;
        
        renderModalTablaVehiculos(asignaciones.vehiculos);
        renderModalTablaPersonas(asignaciones.personas);
        renderModalTablaAlmacenes(asignaciones.almacenes);
        
        return true;
    } catch (e) {
        console.error('Error en asignarAPersona:', e);
        throw e;
    }
}

async function eliminarAsignacion(endpoint) {
    try {
        let url = endpoint;
        
        if (endpoint.includes('/api/personas/')) {
            const matches = endpoint.match(/\/api\/personas\/([^\/]+)/);
            if (matches && matches[1]) {
                let idBombero = matches[1];
                const idBomberoNum = parseInt(idBombero.replace(/[^0-9]/g, ''));
                const materialId = parseInt(currentMaterialId);
                
                if (!isNaN(idBomberoNum)) {
                    url = `/api/personas/${idBomberoNum}/material/${materialId}`;
                }
            }
        }
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (response.status === 204 || response.status === 200) {
            const asignaciones = await obtenerAsignacionesMaterial(currentMaterialId);
            asignacionesActuales = asignaciones;
            
            renderModalTablaVehiculos(asignaciones.vehiculos);
            renderModalTablaPersonas(asignaciones.personas);
            renderModalTablaAlmacenes(asignaciones.almacenes);

            mostrarExito('Asignación eliminada correctamente');
            return true;
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Error al eliminar');
            }
            
            const asignaciones = await obtenerAsignacionesMaterial(currentMaterialId);
            asignacionesActuales = asignaciones;
            
            renderModalTablaVehiculos(asignaciones.vehiculos);
            renderModalTablaPersonas(asignaciones.personas);
            renderModalTablaAlmacenes(asignaciones.almacenes);

            mostrarExito('Asignación eliminada correctamente');
            return true;
        } else {
            if (!response.ok) {
                const text = await response.text();
                if (text.includes('SQLSTATE')) {
                    throw new Error('Error en la base de datos: No se puede eliminar la asignación');
                } else {
                    throw new Error('Error en el servidor (código ' + response.status + ')');
                }
            }
        }

    } catch (e) {
        if (e.message.includes('foreign key') || e.message.includes('SQLSTATE')) {
            mostrarError('No se puede eliminar porque el material está asignado a otras entidades');
        } else {
            mostrarError(e.message || 'Error al eliminar la asignación');
        }
        throw e;
    }
}

// ================================
// MODALES
// ================================
function bindModales() {
    // MODAL VER COMPLETO
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.btn-ver');
        if (!btn) return;

        const id = btn.dataset.id;
        currentMaterialId = id;
        
        document.getElementById('verMaterialId').textContent = 'Cargando...';
        document.getElementById('verMaterialNombre').textContent = 'Cargando...';
        document.getElementById('verMaterialDescripcion').textContent = 'Cargando...';
        document.getElementById('verMaterialEstado').innerHTML = 'Cargando...';
        document.getElementById('verMaterialCategoria').textContent = 'Cargando...';
        
        document.querySelector('#verTablaVehiculos tbody').innerHTML = '<tr><td colspan="4" class="text-center">Cargando...</td></tr>';
        document.querySelector('#verTablaPersonas tbody').innerHTML = '<tr><td colspan="4" class="text-center">Cargando...</td></tr>';
        document.querySelector('#verTablaAlmacenes tbody').innerHTML = '<tr><td colspan="5" class="text-center">Cargando...</td></tr>';
        
        cargarDatosVerCompleto(id);
    });

    // MODAL EDITAR COMPLETO
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.btn-editar-completo');
        if (!btn) return;

        const id = btn.dataset.id;
        currentMaterialId = id;
        
        document.getElementById('editCompletoId').value = 'Cargando...';
        document.getElementById('editCompletoNombre').value = '';
        document.getElementById('editCompletoDescripcion').value = '';
        document.getElementById('editCompletoEstado').value = '';
        
        poblarSelectCategoriasCompleto();
        
        document.querySelector('#modalTablaVehiculos tbody').innerHTML = '<tr><td colspan="5" class="text-center">Cargando...</td></tr>';
        document.querySelector('#modalTablaPersonas tbody').innerHTML = '<tr><td colspan="5" class="text-center">Cargando...</td></tr>';
        document.querySelector('#modalTablaAlmacenes tbody').innerHTML = '<tr><td colspan="6" class="text-center">Cargando...</td></tr>';
        
        cargarDatosEditarCompleto(id);
    });

    // MODAL ELIMINAR - Preparar
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.btn-eliminar');
        if (!btn) return;

        const id = btn.dataset.id;
        const nombre = btn.dataset.nombre;

        const btnConfirm = document.getElementById('btnConfirmarEliminarMaterial');
        btnConfirm.dataset.id = id;

        const modalBody = document.querySelector('#modalEliminarMaterial .modal-body');
        if (modalBody) {
            modalBody.innerHTML = `
                ¿Estás seguro de que deseas eliminar el material "${nombre}"?
                <p class="text-muted mb-0 mt-2">Esta acción no se puede deshacer.</p>
                <p class="text-warning">Nota: Solo se puede eliminar si no tiene asignaciones.</p>
            `;
        }
    });

    // CONFIRMAR ELIMINAR
    document.getElementById('btnConfirmarEliminarMaterial')?.addEventListener('click', async function() {
        const id = this.dataset.id;
        if (!id) return;

        try {
            await eliminarMaterial(id);
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalEliminarMaterial'));
            modal.hide();
            mostrarExito('Material eliminado correctamente');
        } catch (error) {
            mostrarError(error.message || 'No se puede eliminar el material');
        }
    });

    // MODAL CONFIRMAR ELIMINAR ASIGNACIÓN
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.eliminar-asignacion');
        if (!btn) return;

        pendingDeleteEndpoint = btn.dataset.endpoint;
        const tipo = btn.dataset.tipo;
        const descripcion = btn.dataset.descripcion;

        const modalBody = document.getElementById('modalConfirmarBody');
        modalBody.innerHTML = `¿Eliminar la asignación de este material del ${tipo} "${descripcion}"?`;

        new bootstrap.Modal(document.getElementById('modalConfirmarEliminar')).show();
    });

    document.getElementById('btnConfirmarEliminar')?.addEventListener('click', async () => {
        if (!pendingDeleteEndpoint) return;

        try {
            await eliminarAsignacion(pendingDeleteEndpoint);
            bootstrap.Modal.getInstance(document.getElementById('modalConfirmarEliminar')).hide();
        } catch (e) {
            // Error ya mostrado
        } finally {
            pendingDeleteEndpoint = null;
        }
    });

    // GUARDAR CAMBIOS COMPLETOS
    document.getElementById('btnGuardarCambiosCompletos')?.addEventListener('click', async function() {
        const id = document.getElementById('editCompletoId').value;
        const id_categoria = document.getElementById('editCompletoCategoria').value;
        const nombre = document.getElementById('editCompletoNombre').value;
        const descripcion = document.getElementById('editCompletoDescripcion').value;
        const estado = document.getElementById('editCompletoEstado').value;

        if (!id_categoria) {
            mostrarError('Debe seleccionar una categoría');
            return;
        }

        if (!nombre || nombre.trim() === '') {
            mostrarError('El nombre es obligatorio');
            return;
        }

        if (!descripcion || descripcion.trim() === '') {
            mostrarError('La descripción es obligatoria');
            return;
        }

        const data = {
            id_categoria: parseInt(id_categoria),
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            estado: estado
        };

        try {
            await actualizarMaterial(id, data);
            
            // Recargar las asignaciones para mantenerlas actualizadas
            const asignaciones = await obtenerAsignacionesMaterial(id);
            asignacionesActuales = asignaciones;
            
            renderModalTablaVehiculos(asignaciones.vehiculos);
            renderModalTablaPersonas(asignaciones.personas);
            renderModalTablaAlmacenes(asignaciones.almacenes);
            
            mostrarExito('Material actualizado correctamente');
        } catch (error) {
            mostrarError(error.message);
        }
    });
}

// ================================
// FUNCIONES PARA CARGAR DATOS EN MODALES
// ================================
async function cargarDatosVerCompleto(idMaterial) {
    try {
        const material = await cargarMaterial(idMaterial);
        if (material) {
            const categoriaNombre = categorias.find(c => c.id_categoria == material.id_categoria)?.nombre || material.id_categoria;
            
            document.getElementById('verMaterialId').textContent = material.id_material;
            document.getElementById('verMaterialNombre').textContent = material.nombre;
            document.getElementById('verMaterialDescripcion').textContent = material.descripcion || 'Sin descripción';
            
            const estadoSpan = document.getElementById('verMaterialEstado');
            estadoSpan.innerHTML = `<span class="badge ${material.estado === 'ALTA' ? 'bg-success' : 'bg-danger'}">${material.estado}</span>`;
            
            document.getElementById('verMaterialCategoria').textContent = categoriaNombre;
        }
        
        const asignaciones = await obtenerAsignacionesMaterial(idMaterial);
        
        renderVerTablaVehiculos(asignaciones.vehiculos);
        renderVerTablaPersonas(asignaciones.personas);
        renderVerTablaAlmacenes(asignaciones.almacenes);
        
    } catch (e) {
        console.error('Error cargando datos:', e);
        document.getElementById('verMaterialId').textContent = 'Error';
        document.getElementById('verMaterialNombre').textContent = 'Error';
        document.getElementById('verMaterialDescripcion').textContent = 'Error';
        document.getElementById('verMaterialEstado').innerHTML = '<span class="badge bg-danger">Error</span>';
        document.getElementById('verMaterialCategoria').textContent = 'Error';
    }
}

async function cargarDatosEditarCompleto(idMaterial) {
    try {
        const material = await cargarMaterial(idMaterial);
        if (material) {
            document.getElementById('editCompletoId').value = material.id_material;
            document.getElementById('editCompletoNombre').value = material.nombre || '';
            document.getElementById('editCompletoDescripcion').value = material.descripcion || '';
            document.getElementById('editCompletoEstado').value = material.estado || 'ALTA';
            
            const selectCategoria = document.getElementById('editCompletoCategoria');
            if (selectCategoria) {
                for (let i = 0; i < selectCategoria.options.length; i++) {
                    if (selectCategoria.options[i].value == material.id_categoria) {
                        selectCategoria.selectedIndex = i;
                        break;
                    }
                }
            }
        }
        
        const asignaciones = await obtenerAsignacionesMaterial(idMaterial);
        asignacionesActuales = asignaciones;
        
        renderModalTablaVehiculos(asignaciones.vehiculos);
        renderModalTablaPersonas(asignaciones.personas);
        renderModalTablaAlmacenes(asignaciones.almacenes);
        
    } catch (e) {
        console.error('Error cargando datos:', e);
        mostrarError('Error al cargar los datos');
    }
}

// ================================
// RENDERIZADO DE TABLAS (VER - SIN ACCIONES)
// ================================
function renderVerTablaVehiculos(asignaciones) {
    const tbody = document.querySelector('#verTablaVehiculos tbody');
    if (!tbody) return;

    if (!asignaciones || asignaciones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay asignaciones a vehículos</td></tr>';
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
        `;
        tbody.appendChild(tr);
    });
}

function renderVerTablaPersonas(asignaciones) {
    const tbody = document.querySelector('#verTablaPersonas tbody');
    if (!tbody) return;

    if (!asignaciones || asignaciones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay asignaciones a personas</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    asignaciones.forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${a.identificador || a.id_bombero || '-'}</td>
            <td>${a.elemento || a.nombre || '-'}</td>
            <td>${a.n_funcionario || '-'}</td>
            <td>${a.numero_serie || a.nserie || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderVerTablaAlmacenes(asignaciones) {
    const tbody = document.querySelector('#verTablaAlmacenes tbody');
    if (!tbody) return;

    if (!asignaciones || asignaciones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay asignaciones a almacenes</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    asignaciones.forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${a.nombre_instalacion || a.instalacion || a.id_instalacion || '-'}</td>
            <td>${a.elemento || a.nombre_almacen || a.id_almacen || '-'}</td>
            <td>${a.planta || '-'}</td>
            <td>${a.unidades || '-'}</td>
            <td>${a.numero_serie || a.n_serie || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ================================
// RENDERIZADO DE TABLAS (EDITAR - CON ACCIONES)
// ================================
function renderModalTablaVehiculos(asignaciones) {
    const tbody = document.querySelector('#modalTablaVehiculos tbody');
    if (!tbody) return;

    if (!asignaciones || asignaciones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay asignaciones a vehículos</td></tr>';
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
            <td>
                <button class="btn btn-sm btn-danger eliminar-asignacion" 
                        data-endpoint="/api/vehiculos/${a.identificador}/materiales/${currentMaterialId}"
                        data-tipo="vehículo"
                        data-descripcion="${a.elemento || a.identificador}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderModalTablaPersonas(asignaciones) {
    const tbody = document.querySelector('#modalTablaPersonas tbody');
    if (!tbody) return;

    if (!asignaciones || asignaciones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay asignaciones a personas</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    asignaciones.forEach(a => {
        let idBomberoOriginal = a.identificador || a.id_bombero;
        let idBomberoNum = idBomberoOriginal;
        
        if (typeof idBomberoOriginal === 'string') {
            const match = idBomberoOriginal.match(/\d+/);
            if (match) {
                idBomberoNum = parseInt(match[0]);
            } else {
                idBomberoNum = parseInt(idBomberoOriginal);
            }
        }
        
        const materialId = parseInt(currentMaterialId);
        
        if (isNaN(idBomberoNum)) {
            idBomberoNum = 0;
        }
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${a.identificador || a.id_bombero || '-'}</td>
            <td>${a.elemento || a.nombre || '-'}</td>
            <td>${a.n_funcionario || '-'}</td>
            <td>${a.numero_serie || a.nserie || '-'}</td>
            <td>
                <button class="btn btn-sm btn-danger eliminar-asignacion" 
                        data-endpoint="/api/personas/${idBomberoNum}/material/${materialId}"
                        data-tipo="persona"
                        data-descripcion="${a.elemento || a.identificador}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderModalTablaAlmacenes(asignaciones) {
    const tbody = document.querySelector('#modalTablaAlmacenes tbody');
    if (!tbody) return;

    if (!asignaciones || asignaciones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay asignaciones a almacenes</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    asignaciones.forEach(a => {
        let idAlmacen = a.identificador || a.id_almacen;
        
        if (typeof idAlmacen === 'string') {
            idAlmacen = parseInt(idAlmacen);
        }
        
        const materialId = parseInt(currentMaterialId);
        
        if (isNaN(idAlmacen)) {
            idAlmacen = 0;
        }
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${a.nombre_instalacion || a.instalacion || a.id_instalacion || '-'}</td>
            <td>${a.elemento || a.nombre_almacen || a.id_almacen || '-'}</td>
            <td>${a.planta || '-'}</td>
            <td>${a.unidades || '-'}</td>
            <td>${a.numero_serie || a.n_serie || '-'}</td>
            <td>
                <button class="btn btn-sm btn-danger eliminar-asignacion" 
                        data-endpoint="/api/almacenes/${idAlmacen}/material/${materialId}"
                        data-tipo="almacén"
                        data-descripcion="${a.elemento || a.identificador}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ================================
// ASIGNACIONES BIND
// ================================
function bindAsignaciones() {
    document.getElementById('btnModalAsignarVehiculo')?.addEventListener('click', () => {
        bootstrap.Modal.getInstance(document.getElementById('modalEditarCompleto')).hide();
        const modalVehiculo = new bootstrap.Modal(document.getElementById('modalAsignarVehiculo'));
        modalVehiculo.show();
    });

    document.getElementById('btnModalAsignarPersona')?.addEventListener('click', () => {
        bootstrap.Modal.getInstance(document.getElementById('modalEditarCompleto')).hide();
        const modalPersona = new bootstrap.Modal(document.getElementById('modalAsignarPersona'));
        modalPersona.show();
    });

    document.getElementById('btnModalAsignarAlmacen')?.addEventListener('click', () => {
        bootstrap.Modal.getInstance(document.getElementById('modalEditarCompleto')).hide();
        const modalAlmacen = new bootstrap.Modal(document.getElementById('modalAsignarAlmacen'));
        modalAlmacen.show();
    });

    document.getElementById('btnGuardarAsignacionVehiculo')?.addEventListener('click', async () => {
        const form = document.getElementById('formAsignarVehiculo');
        try {
            await asignarAVehiculo(new FormData(form));
            bootstrap.Modal.getInstance(document.getElementById('modalAsignarVehiculo')).hide();
            form.reset();
            
            const modalEditar = new bootstrap.Modal(document.getElementById('modalEditarCompleto'));
            modalEditar.show();
            
            mostrarExito('Material asignado a vehículo correctamente');
        } catch (e) {
            mostrarError(e.message || 'Error al asignar');
        }
    });

    document.getElementById('btnGuardarAsignacionPersona')?.addEventListener('click', async () => {
        const form = document.getElementById('formAsignarPersona');
        try {
            await asignarAPersona(new FormData(form));
            bootstrap.Modal.getInstance(document.getElementById('modalAsignarPersona')).hide();
            form.reset();
            
            const modalEditar = new bootstrap.Modal(document.getElementById('modalEditarCompleto'));
            modalEditar.show();
            
            mostrarExito('Material asignado a persona correctamente');
        } catch (e) {
            mostrarError(e.message || 'Error al asignar');
        }
    });

    document.getElementById('btnGuardarAsignacionAlmacen')?.addEventListener('click', async () => {
        const form = document.getElementById('formAsignarAlmacen');
        try {
            await asignarAAlmacen(new FormData(form));
            bootstrap.Modal.getInstance(document.getElementById('modalAsignarAlmacen')).hide();
            form.reset();
            
            document.getElementById('selectInstalacion').value = '';
            const selectAlmacen = document.getElementById('selectAlmacen');
            selectAlmacen.innerHTML = '<option value="">Primero seleccione instalación</option>';
            selectAlmacen.disabled = true;
            
            const modalEditar = new bootstrap.Modal(document.getElementById('modalEditarCompleto'));
            modalEditar.show();
            
            mostrarExito('Material asignado a almacén correctamente');
        } catch (e) {
            mostrarError(e.message || 'Error al asignar');
        }
    });

    document.getElementById('modalAsignarVehiculo')?.addEventListener('hidden.bs.modal', () => {
        if (currentMaterialId) {
            const modalEditar = new bootstrap.Modal(document.getElementById('modalEditarCompleto'));
            modalEditar.show();
        }
    });

    document.getElementById('modalAsignarPersona')?.addEventListener('hidden.bs.modal', () => {
        if (currentMaterialId) {
            const modalEditar = new bootstrap.Modal(document.getElementById('modalEditarCompleto'));
            modalEditar.show();
        }
    });

    document.getElementById('modalAsignarAlmacen')?.addEventListener('hidden.bs.modal', () => {
        if (currentMaterialId) {
            const modalEditar = new bootstrap.Modal(document.getElementById('modalEditarCompleto'));
            modalEditar.show();
        }
    });
}

// ================================
// FUNCIONES AUXILIARES
// ================================
function mostrarError(msg) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3';
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        <strong>Error:</strong> ${msg}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
}

function mostrarExito(msg) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3';
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        <strong>Éxito:</strong> ${msg}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
}

window.refrescarMateriales = async function() {
    await cargarMateriales();
    mostrarExito('Datos actualizados');
};

window.MaterialController = {
    refrescarMateriales: cargarMateriales,
    aplicarFiltros
};