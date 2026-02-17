import MaterialApi from '../api_f/MaterialApi.js';
import VehiculoApi from '../api_f/VehiculoApi.js';
import PersonaApi from '../api_f/PersonaApi.js';
import AlmacenApi from '../api_f/AlmacenApi.js';
import InstalacionApi from '../api_f/InstalacionApi.js';
import CategoriaApi from '../api_f/CategoriaApi.js';

let materiales = [];
let vehiculos = [];
let personas = [];
let almacenes = [];
let instalaciones = [];
let categorias = [];

document.addEventListener('DOMContentLoaded', () => {
  cargarDatosIniciales();
  bindCrearMaterial();
  bindAsignarVehiculo();
  bindAsignarFuncionario();
  bindAsignarAlmacen();
  bindFiltros();
});

// ================================
// CARGAR DATOS INICIALES
// ================================
async function cargarDatosIniciales() {
  try {
    await Promise.all([
      cargarMateriales(),
      cargarVehiculos(),
      cargarPersonas(),
      cargarAlmacenes(),
      cargarInstalaciones(),
      cargarCategorias()
    ]);
    
    // Poblar todos los selects
    poblarSelectCategorias();
    poblarSelectMateriales();
    poblarSelectVehiculos();
    poblarSelectPersonas();
    poblarSelectAlmacenes();
    poblarSelectInstalaciones();
    
  } catch (e) {
    mostrarError('Error cargando datos: ' + e.message);
  }
}

// ================================
// CARGAR MATERIALES
// ================================
async function cargarMateriales() {
  try {
    const response = await MaterialApi.getAll();
    materiales = response.data;
    await enrichMateriales();
    renderTablaMateriales(materiales);
  } catch (e) {
    mostrarError('Error cargando materiales: ' + e.message);
  }
}

// ================================
// CARGAR VEHÍCULOS
// ================================
async function cargarVehiculos() {
  try {
    const response = await VehiculoApi.getAll();
    vehiculos = response.data;
  } catch (e) {
    console.error('Error cargando vehículos:', e);
  }
}

// ================================
// CARGAR PERSONAS
// ================================
async function cargarPersonas() {
  try {
    const response = await PersonaApi.getAll();
    personas = response.data;
  } catch (e) {
    console.error('Error cargando personas:', e);
  }
}

// ================================
// CARGAR ALMACENES
// ================================
async function cargarAlmacenes() {
  try {
    const response = await AlmacenApi.getAll();
    almacenes = response.data;
  } catch (e) {
    console.error('Error cargando almacenes:', e);
  }
}

// ================================
// CARGAR INSTALACIONES
// ================================
async function cargarInstalaciones() {
  try {
    const response = await InstalacionApi.getAll();
    instalaciones = response.data;
  } catch (e) {
    console.error('Error cargando instalaciones:', e);
  }
}

// ================================
// CARGAR CATEGORÍAS
// ================================
async function cargarCategorias() {
  try {
    const response = await CategoriaApi.getAll();
    categorias = response.data;
  } catch (e) {
    console.error('Error cargando categorías:', e);
  }
}

// ================================
// POBLAR SELECT DE CATEGORÍAS
// ================================
function poblarSelectCategorias() {
  const select = document.getElementById('insertCategoria');
  if (select) {
    select.innerHTML = '<option value="">Seleccione una categoría...</option>';
    categorias.forEach(c => {
      const option = document.createElement('option');
      option.value = c.id_categoria;
      option.textContent = c.nombre;
      select.appendChild(option);
    });
  }
}

// ================================
// POBLAR SELECT DE MATERIALES
// ================================
function poblarSelectMateriales() {
  const selects = [
    'selectMaterialVehiculo',
    'selectMaterialFuncionario',
    'selectMaterialAlmacen'
  ];
  
  selects.forEach(id => {
    const select = document.getElementById(id);
    if (select) {
      select.innerHTML = '<option value="">Seleccione un material...</option>';
      materiales.forEach(m => {
        const option = document.createElement('option');
        option.value = m.id_material;
        option.textContent = `${m.nombre} (ID: ${m.id_material})`;
        select.appendChild(option);
      });
    }
  });
}

// ================================
// POBLAR SELECT DE VEHÍCULOS
// ================================
function poblarSelectVehiculos() {
  const select = document.getElementById('selectVehiculo');
  if (select) {
    select.innerHTML = '<option value="">Seleccione un vehículo...</option>';
    vehiculos.forEach(v => {
      const option = document.createElement('option');
      option.value = v.matricula;
      option.textContent = `${v.nombre} - ${v.matricula} (${v.marca} ${v.modelo})`;
      select.appendChild(option);
    });
  }
}

// ================================
// POBLAR SELECT DE PERSONAS
// ================================
function poblarSelectPersonas() {
  const select = document.getElementById('selectFuncionario');
  if (select) {
    select.innerHTML = '<option value="">Seleccione un funcionario...</option>';
    personas.forEach(p => {
      const option = document.createElement('option');
      option.value = p.id_bombero;
      option.textContent = `${p.nombre} ${p.apellidos} (${p.id_bombero})`;
      select.appendChild(option);
    });
  }
}

// ================================
// POBLAR SELECT DE ALMACENES
// ================================
function poblarSelectAlmacenes() {
  const select = document.getElementById('selectAlmacen');
  if (select) {
    select.innerHTML = '<option value="">Seleccione un almacén...</option>';
    almacenes.forEach(a => {
      const option = document.createElement('option');
      option.value = a.id_almacen;
      option.textContent = `${a.nombre} - Planta ${a.planta} (ID: ${a.id_almacen})`;
      select.appendChild(option);
    });
  }
}

// ================================
// POBLAR SELECT DE INSTALACIONES
// ================================
function poblarSelectInstalaciones() {
  const select = document.getElementById('selectInstalacion');
  if (select) {
    select.innerHTML = '<option value="">Seleccione una instalación...</option>';
    instalaciones.forEach(i => {
      const option = document.createElement('option');
      option.value = i.id_instalacion;
      option.textContent = `${i.nombre} - ${i.localidad} (ID: ${i.id_instalacion})`;
      select.appendChild(option);
    });
  }
}

// ================================
// ENRIQUECER MATERIALES CON ASIGNACIONES REALES
// ================================
async function enrichMateriales() {
  try {
    // Para cada material, buscar sus asignaciones
    for (const material of materiales) {
      material.asignado_a = 'No asignado';
      
      // 1. Buscar si está asignado a algún vehículo
      try {
        // Asumiendo que tienes un endpoint para obtener asignaciones por material
        const respVehiculo = await fetch(`/api/vehiculos?material=${material.id_material}`);
        const dataVehiculo = await respVehiculo.json();
        if (dataVehiculo.data && dataVehiculo.data.length > 0) {
          const v = dataVehiculo.data[0];
          material.asignado_a = `Vehículo: ${v.nombre} (${v.matricula})`;
          continue; // Si ya encontramos asignación, pasamos al siguiente material
        }
      } catch (e) {
        console.log('No hay asignación a vehículo');
      }
      
      // 2. Buscar si está asignado a alguna persona
      try {
        const respPersona = await fetch(`/api/personas?material=${material.id_material}`);
        const dataPersona = await respPersona.json();
        if (dataPersona.data && dataPersona.data.length > 0) {
          const p = dataPersona.data[0];
          material.asignado_a = `Persona: ${p.nombre} ${p.apellidos} (${p.id_bombero})`;
          continue;
        }
      } catch (e) {
        console.log('No hay asignación a persona');
      }
      
      // 3. Buscar si está asignado a algún almacén
      try {
        const respAlmacen = await fetch(`/api/almacenes?material=${material.id_material}`);
        const dataAlmacen = await respAlmacen.json();
        if (dataAlmacen.data && dataAlmacen.data.length > 0) {
          const a = dataAlmacen.data[0];
          material.asignado_a = `Almacén: ${a.nombre}`;
          continue;
        }
      } catch (e) {
        console.log('No hay asignación a almacén');
      }
    }
  } catch (e) {
    console.error('Error en enrichMateriales:', e);
  }
}

// ================================
// RENDER TABLA
// ================================
function renderTablaMateriales(materiales) {
  const tbody = document.querySelector('#tabla tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';

  materiales.forEach(m => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${m.id_material}</td>
      <td>${m.nombre ?? ''}</td>
      <td class="d-none d-md-table-cell">${m.descripcion ?? ''}</td>
      <td>${m.estado ?? ''}</td>
      <td class="d-none d-md-table-cell">${m.categoria_nombre ?? m.id_categoria ?? ''}</td>
      <td class="d-none d-md-table-cell">${m.asignado_a}</td>
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
                data-id="${m.id_material}">          
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
  const filtroEstado = document.getElementById('estado');
  const filtroNombre = document.getElementById('nombre');
  
  if (filtroEstado) {
    filtroEstado.addEventListener('change', aplicarFiltros);
  }
  
  if (filtroNombre) {
    filtroNombre.addEventListener('input', aplicarFiltros);
  }
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
// CREAR MATERIAL
// ================================
function bindCrearMaterial() {
  const form = document.getElementById('formInsertar');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);

    const data = {
      id_categoria: f.get('id_categoria'),
      nombre: f.get('nombre'),
      descripcion: f.get('descripcion'),
      estado: f.get('estado')
    };

    try {
      await MaterialApi.create(data);
      await cargarDatosIniciales();
      form.reset();
      mostrarExito('Material creado correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error creando material');
    }
  });
}

// ================================
// ASIGNAR A VEHÍCULO
// ================================
function bindAsignarVehiculo() {
  const form = document.getElementById('formAsignarVehiculo');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);
    const id_material = f.get('id_material');
    const matricula = f.get('matricula');
    
    const data = {
      nserie: f.get('nserie') || `VEH-${Date.now()}`,
      unidades: parseInt(f.get('unidades')) || 1
    };

    try {
      await MaterialApi.assignToVehiculo(matricula, id_material, data);
      await cargarDatosIniciales();
      form.reset();
      mostrarExito('Material asignado a vehículo correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error asignando material a vehículo');
    }
  });
}

// ================================
// ASIGNAR A FUNCIONARIO
// ================================
function bindAsignarFuncionario() {
  const form = document.getElementById('formAsignarFuncionario');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);
    const id_bombero = f.get('id_bombero');
    const id_material = f.get('id_material');
    const nserie = f.get('nserie');

    if (!nserie) {
      mostrarError('El número de serie es obligatorio');
      return;
    }

    try {
      await MaterialApi.assignToPersona(id_bombero, id_material, nserie);
      await cargarDatosIniciales();
      form.reset();
      mostrarExito('Material asignado a funcionario correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error asignando material a funcionario');
    }
  });
}

// ================================
// ASIGNAR A ALMACÉN
// ================================
function bindAsignarAlmacen() {
  const form = document.getElementById('formAsignarAlmacen');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);
    const id_almacen = f.get('id_almacen');
    
    const data = {
      id_material: f.get('id_material'),
      id_instalacion: f.get('id_instalacion'),
      n_serie: f.get('n_serie') || `ALM-${Date.now()}`,
      unidades: parseInt(f.get('unidades')) || 1
    };

    try {
      await MaterialApi.assignToAlmacen(id_almacen, data);
      await cargarDatosIniciales();
      form.reset();
      mostrarExito('Material asignado a almacén correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error asignando material a almacén');
    }
  });
}

// ================================
// MODAL VER
// ================================
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-ver');
  if (!btn) return;

  const id = btn.dataset.id;
  const material = materiales.find(m => m.id_material == id);
  if (!material) return;

  const modalBody = document.getElementById('modalVerBody');
  if (!modalBody) return;

  modalBody.innerHTML = `
    <p><strong>ID:</strong> ${material.id_material}</p>
    <p><strong>Nombre:</strong> ${material.nombre}</p>
    <p><strong>Descripción:</strong> ${material.descripcion || 'Sin descripción'}</p>
    <p><strong>Estado:</strong> ${material.estado}</p>
    <p><strong>Categoría:</strong> ${material.categoria_nombre || material.id_categoria}</p>
    <p><strong>Asignado a:</strong> ${material.asignado_a}</p>
  `;
});

// ================================
// MODAL EDITAR
// ================================
document.addEventListener('click', async function (e) {
  const btn = e.target.closest('.btn-editar');
  if (!btn) return;

  const id = btn.dataset.id;

  try {
    const response = await MaterialApi.getById(id);
    const material = response.data;
    if (!material) return;

    const form = document.getElementById('formEditar');
    if (!form) return;

    // Crear select de categorías para edición
    let categoriasOptions = '<option value="">Seleccione una categoría...</option>';
    categorias.forEach(c => {
      const selected = c.id_categoria == material.id_categoria ? 'selected' : '';
      categoriasOptions += `<option value="${c.id_categoria}" ${selected}>${c.nombre}</option>`;
    });

    form.innerHTML = `
      <div class="mb-3">
        <label class="form-label">ID Material</label>
        <input type="text" class="form-control" value="${material.id_material || ''}" readonly disabled>
        <input type="hidden" name="id_material" value="${material.id_material || ''}">
      </div>

      <div class="row mb-3">
        <div class="col-lg-6">
          <label class="form-label">Nombre</label>
          <input type="text" class="form-control" name="nombre" value="${material.nombre || ''}" required>
        </div>

        <div class="col-lg-6">
          <label class="form-label">Categoría</label>
          <select class="form-select" name="id_categoria" required>
            ${categoriasOptions}
          </select>
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label">Descripción</label>
        <textarea class="form-control" name="descripcion" rows="3" required>${material.descripcion || ''}</textarea>
      </div>

      <div class="mb-3">
        <label class="form-label">Estado</label>
        <select class="form-select" name="estado" required>
          <option value="ALTA" ${material.estado === 'ALTA' ? 'selected' : ''}>ALTA</option>
          <option value="BAJA" ${material.estado === 'BAJA' ? 'selected' : ''}>BAJA</option>
        </select>
      </div>
    `;

    document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
      const data = {};
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        if (input.name) {
          data[input.name] = input.value;
        }
      });

      try {
        await MaterialApi.update(id, data);
        await cargarDatosIniciales();

        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditar'));
        modal.hide();
        mostrarExito('Material actualizado correctamente');
      } catch (error) {
        mostrarError('Error al actualizar material: ' + error.message);
      }
    });

  } catch (error) {
    console.error('Error al editar material:', error);
    mostrarError('Error al cargar datos del material');
  }
});

// ================================
// MODAL ELIMINAR
// ================================
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-eliminar');
  if (!btn) return;

  const id = btn.dataset.id;
  const material = materiales.find(m => m.id_material == id);
  
  const btnConfirm = document.getElementById('btnConfirmarEliminar');
  if (btnConfirm) {
    btnConfirm.dataset.id = id;
    
    const modalBody = document.querySelector('#modalEliminar .modal-body');
    if (modalBody && material) {
      let mensajeAdicional = '';
      if (material.asignado_a && material.asignado_a !== 'No asignado') {
        mensajeAdicional = `<p class="text-danger mt-2"><strong>Atención:</strong> Este material está asignado a: ${material.asignado_a}. Debes desasignarlo primero.</p>`;
      }
      
      modalBody.innerHTML = `
        ¿Estás seguro de que deseas eliminar el material "${material.nombre}"?
        <p class="text-muted mb-0 mt-2">Esta acción no se puede deshacer.</p>
        ${mensajeAdicional}
      `;
    }
  }
});

document.addEventListener('click', async function (e) {
  if (e.target.id === 'btnConfirmarEliminar') {
    const id = e.target.dataset.id;
    if (!id) return;

    try {
      await MaterialApi.delete(id);
      await cargarDatosIniciales();

      const modal = bootstrap.Modal.getInstance(document.getElementById('modalEliminar'));
      modal.hide();
      mostrarExito('Material eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar material:', error);
      
      if (error.message && error.message.includes('foreign key constraint')) {
        mostrarError('No se puede eliminar el material porque tiene asignaciones. Debes desasignarlo primero.');
      } else {
        mostrarError('Error al eliminar material: ' + error.message);
      }
    }
  }
});

// ================================
// FUNCIONES AUXILIARES
// ================================
function mostrarError(msg) {
  console.error(msg);
  
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3';
  alertDiv.style.zIndex = '9999';
  alertDiv.innerHTML = `
    <strong>Error:</strong> ${msg}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

function mostrarExito(msg) {
  console.log(msg);
  
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3';
  alertDiv.style.zIndex = '9999';
  alertDiv.innerHTML = `
    <strong>Éxito:</strong> ${msg}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.remove();
  }, 3000);
}

window.refrescarMateriales = async function() {
  await cargarDatosIniciales();
  mostrarExito('Datos actualizados');
};

window.MaterialController = {
  cargarMateriales,
  refrescarMateriales,
  aplicarFiltros
};