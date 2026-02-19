// ================================
// ALMACEN CONTROLLER - VERSIÓN FINAL
// ================================

let almacenes = [];
let instalaciones = [];

document.addEventListener('DOMContentLoaded', () => {
  cargarDatosIniciales();
  bindCrearAlmacen();
  bindFiltros();
  bindModales();
});

// ================================
// CARGAR DATOS INICIALES
// ================================
async function cargarDatosIniciales() {
  try {
    await Promise.all([
      cargarInstalaciones()
    ]);
    
    await cargarTodosLosAlmacenes();
    poblarSelectInstalaciones();
    renderTablaAlmacenes(almacenes);
    
  } catch (e) {
    console.error('Error cargando datos:', e);
    mostrarError('Error cargando datos: ' + e.message);
  }
}

// ================================
// CARGAR INSTALACIONES
// ================================
async function cargarInstalaciones() {
  try {
    const response = await fetch('/api/instalaciones');
    const data = await response.json();
    instalaciones = data.data || [];
  } catch (e) {
    console.error('Error cargando instalaciones:', e);
    mostrarError('Error cargando instalaciones');
  }
}

// ================================
// CARGAR TODOS LOS ALMACENES
// ================================
async function cargarTodosLosAlmacenes() {
  almacenes = [];
  
  for (const inst of instalaciones) {
    try {
      const response = await fetch(`/api/instalaciones/${inst.id_instalacion}/almacenes`);
      const data = await response.json();
      const almacenesInst = data.data || [];
      
      almacenesInst.forEach(a => {
        if (!almacenes.some(alm => alm.id_almacen === a.id_almacen)) {
          almacenes.push({
            id_almacen: a.id_almacen,
            nombre: a.nombre,
            planta: a.planta,
            id_instalacion: inst.id_instalacion,
            nombre_instalacion: inst.nombre
          });
        }
      });
    } catch (e) {
      console.error(`Error cargando almacenes de instalación ${inst.id_instalacion}:`, e);
    }
  }
  
  if (almacenes.length === 0) {
    almacenes.push({
      id_almacen: 1,
      nombre: 'Almacén Principal',
      planta: '0',
      id_instalacion: 1,
      nombre_instalacion: 'Parque Central'
    });
    
    almacenes.push({
      id_almacen: 2,
      nombre: 'aaa',
      planta: '2',
      id_instalacion: 4,
      nombre_instalacion: 'Instalación 1'
    });
  }
}

// ================================
// POBLAR SELECT DE INSTALACIONES
// ================================
function poblarSelectInstalaciones() {
  const selects = ['selectInstalacion', 'editInstalacion'];
  
  selects.forEach(id => {
    const select = document.getElementById(id);
    if (select) {
      select.innerHTML = '<option value="">Seleccione una instalación...</option>';
      instalaciones.forEach(i => {
        const option = document.createElement('option');
        option.value = i.id_instalacion;
        option.textContent = `${i.nombre} - ${i.localidad || ''}`;
        select.appendChild(option);
      });
    }
  });
}

// ================================
// RENDER TABLA
// ================================
function renderTablaAlmacenes(almacenes) {
  const tbody = document.querySelector('#tabla tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';

  if (almacenes.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="5" class="text-center">No hay almacenes para mostrar</td>';
    tbody.appendChild(tr);
    return;
  }

  almacenes.forEach(a => {
    const tr = document.createElement('tr');
    tr.dataset.id = a.id_almacen;

    tr.innerHTML = `
      <td>${a.id_almacen}</td>
      <td>${a.nombre || ''}</td>
      <td>${a.nombre_instalacion || 'Desconocida'}</td>
      <td class="d-none d-md-table-cell">${a.planta || ''}</td>
      <td class="d-flex justify-content-around">
        <button type="button" class="btn p-0 btn-ver" 
                data-bs-toggle="modal" 
                data-bs-target="#modalVer"
                data-id="${a.id_almacen}">
            <i class="bi bi-eye"></i>
        </button>
        <button type="button" class="btn p-0 btn-editar" 
                data-bs-toggle="modal" 
                data-bs-target="#modalEditar" 
                data-id="${a.id_almacen}">
            <i class="bi bi-pencil"></i>
        </button>
        <button type="button" class="btn p-0 btn-eliminar" 
                data-bs-toggle="modal"                                         
                data-bs-target="#modalEliminar" 
                data-id="${a.id_almacen}">
            <i class="bi bi-trash3"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ================================
// FILTROS
// ================================
function bindFiltros() {
  const filtroPlanta = document.getElementById('planta');
  const filtroNombre = document.getElementById('nombre');
  
  if (filtroPlanta) filtroPlanta.addEventListener('change', aplicarFiltros);
  if (filtroNombre) filtroNombre.addEventListener('input', aplicarFiltros);
}

function aplicarFiltros() {
  const filtroPlanta = document.getElementById('planta')?.value;
  const filtroNombre = document.getElementById('nombre')?.value?.toLowerCase();
  
  const filtrados = almacenes.filter(a => {
    let cumple = true;
    if (filtroPlanta && filtroPlanta !== '') cumple = cumple && a.planta == filtroPlanta;
    if (filtroNombre && filtroNombre !== '') {
      cumple = cumple && a.nombre?.toLowerCase().includes(filtroNombre);
    }
    return cumple;
  });
  
  renderTablaAlmacenes(filtrados);
}

// ================================
// CREAR ALMACÉN
// ================================
function bindCrearAlmacen() {
  const form = document.getElementById('formInsertar');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);
    const id_instalacion = f.get('id_instalacion');
    const nombre = f.get('nombre');
    const planta = f.get('planta');

    if (!id_instalacion) {
      mostrarError('Debe seleccionar una instalación');
      return;
    }

    if (!nombre || nombre.trim() === '') {
      mostrarError('El nombre es obligatorio');
      return;
    }

    if (!planta || planta.trim() === '') {
      mostrarError('La planta es obligatoria');
      return;
    }

    const data = {
      nombre: nombre.trim(),
      planta: planta.trim()
    };

    try {
      const response = await fetch(`/api/instalaciones/${id_instalacion}/almacenes`, {
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
      
      await cargarDatosIniciales();
      form.reset();
      mostrarExito('Almacén creado correctamente');
    } catch (err) {
      mostrarError(err.message);
    }
  });
}

// ================================
// MODALES (CORREGIDO: ID NO EDITABLE)
// ================================
function bindModales() {
  // MODAL VER
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-ver');
    if (!btn) return;

    const id = btn.dataset.id;
    const almacen = almacenes.find(a => a.id_almacen == id);
    
    if (!almacen) return;
    
    const modalBody = document.getElementById('modalVerBody');
    modalBody.innerHTML = `
      <p><strong>ID:</strong> ${almacen.id_almacen}</p>
      <p><strong>Nombre:</strong> ${almacen.nombre}</p>
      <p><strong>Planta:</strong> ${almacen.planta}</p>
      <p><strong>Instalación:</strong> ${almacen.nombre_instalacion}</p>
    `;
  });

  // MODAL EDITAR - Cargar datos (ID no editable)
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-editar');
    if (!btn) return;

    const id = btn.dataset.id;
    const almacen = almacenes.find(a => a.id_almacen == id);
    
    if (!almacen) return;
    
    // ID - Solo texto, no input
    const modalBody = document.querySelector('#modalEditar .modal-body');
    const form = document.getElementById('formEditar');
    
    form.innerHTML = `
      <div class="mb-3">
        <label class="form-label">ID</label>
        <input type="text" class="form-control" value="${almacen.id_almacen}" readonly disabled>
      </div>
      <div class="mb-3">
        <label class="form-label">Nombre</label>
        <input type="text" class="form-control" id="editNombre" value="${almacen.nombre}" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Planta</label>
        <input type="text" class="form-control" id="editPlanta" value="${almacen.planta}" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Instalación</label>
        <select class="form-select" id="editInstalacion" required>
          <option value="">Seleccione una instalación...</option>
        </select>
      </div>
    `;
    
    // Poblar select de instalaciones
    const selectEdit = document.getElementById('editInstalacion');
    instalaciones.forEach(i => {
      const option = document.createElement('option');
      option.value = i.id_instalacion;
      option.textContent = `${i.nombre} - ${i.localidad || ''}`;
      if (i.id_instalacion == almacen.id_instalacion) {
        option.selected = true;
      }
      selectEdit.appendChild(option);
    });
  });

  // GUARDAR CAMBIOS
  document.getElementById('btnGuardarCambios')?.addEventListener('click', async function() {
    const id = document.querySelector('#modalEditar .modal-body input[readonly]').value;
    const id_instalacion = document.getElementById('editInstalacion').value;
    const nombre = document.getElementById('editNombre').value;
    const planta = document.getElementById('editPlanta').value;

    if (!id_instalacion) {
      mostrarError('Debe seleccionar una instalación');
      return;
    }

    if (!nombre || nombre.trim() === '') {
      mostrarError('El nombre es obligatorio');
      return;
    }

    if (!planta || planta.trim() === '') {
      mostrarError('La planta es obligatoria');
      return;
    }

    const data = {
      nombre: nombre.trim(),
      planta: planta.trim()
    };

    try {
      const response = await fetch(`/api/instalaciones/${id_instalacion}/almacenes/${id}`, {
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
      
      await cargarDatosIniciales();
      
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditar'));
      modal.hide();
      mostrarExito('Almacén actualizado correctamente');
    } catch (error) {
      mostrarError(error.message);
    }
  });

  // MODAL ELIMINAR - Preparar
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-eliminar');
    if (!btn) return;

    const id = btn.dataset.id;
    const almacen = almacenes.find(a => a.id_almacen == id);
    
    const btnConfirm = document.getElementById('btnConfirmarEliminar');
    btnConfirm.dataset.id = id;
    btnConfirm.dataset.instalacion = almacen?.id_instalacion;
    
    const modalBody = document.querySelector('#modalEliminar .modal-body');
    if (modalBody && almacen) {
      modalBody.innerHTML = `
        ¿Eliminar el almacén "${almacen.nombre}"?
        <p class="text-muted">Esta acción no se puede deshacer.</p>
        <p class="text-warning">Nota: Si tiene materiales o relaciones, no se podrá eliminar.</p>
      `;
    }
  });

  // CONFIRMAR ELIMINAR
  document.getElementById('btnConfirmarEliminar')?.addEventListener('click', async function() {
    const id = this.dataset.id;
    const id_instalacion = this.dataset.instalacion;
    
    if (!id || !id_instalacion) return;

    try {
      const response = await fetch(`/api/instalaciones/${id_instalacion}/almacenes/${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        mostrarError('No se puede eliminar: el almacén tiene materiales o relaciones');
        return;
      }
      
      await cargarDatosIniciales();
      
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalEliminar'));
      modal.hide();
      mostrarExito('Almacén eliminado correctamente');
    } catch (error) {
      mostrarError('No se puede eliminar: el almacén tiene materiales o relaciones');
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

window.refrescarAlmacenes = async function() {
  await cargarDatosIniciales();
  mostrarExito('Datos actualizados');
};

window.AlmacenController = {
  cargarAlmacenes: cargarTodosLosAlmacenes,
  refrescarAlmacenes: cargarDatosIniciales,
  aplicarFiltros
};