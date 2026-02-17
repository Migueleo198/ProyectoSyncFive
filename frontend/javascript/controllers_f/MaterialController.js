import MaterialApi from '../api_f/MaterialApi.js';

let materiales = []; // variable global para almacenar materiales

document.addEventListener('DOMContentLoaded', () => {
  cargarMateriales();
  bindCrearMaterial();
  bindFiltros();
});

// ================================
// CARGAR MATERIALES
// ================================
async function cargarMateriales() {
  try {
    const response = await MaterialApi.getAll();
    materiales = response.data; // guardamos globalmente
    renderTablaMateriales(materiales);
  } catch (e) {
    mostrarError(e.message || 'Error cargando materiales');
  }
}

// ================================
// RENDER TABLA
// ================================
function renderTablaMateriales(materiales) {
  const tbody = document.querySelector('#tabla tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';

  materiales.forEach(e => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${e.id_material}</td>
      <td>${e.nombre ?? ''}</td>
      <td>${e.descripcion ?? ''}</td>
      <td>${e.estado ?? ''}</td>
      <td class="d-flex justify-content-around">                     
        <button type="button" class="btn p-0 btn-ver" 
                data-bs-toggle="modal" 
                data-bs-target="#modalVer"
                data-id="${e.id_material}">
            <i class="bi bi-eye"></i>
        </button>

        <button type="button" class="btn p-0 btn-editar" 
                data-bs-toggle="modal" 
                data-bs-target="#modalEditar" 
                data-id="${e.id_material}">
            <i class="bi bi-pencil"></i>
        </button>
        
        <button type="button" class="btn p-0 btn-eliminar" 
                data-bs-toggle="modal"                                         
                data-bs-target="#modalEliminar" 
                data-id="${e.id_material}">          
            <i class="bi bi-trash3"></i>
        </button>
        
        <button type="button" class="btn p-0 btn-asignar" 
                data-bs-toggle="modal"                                         
                data-bs-target="#modalAsignar" 
                data-id="${e.id_material}">          
            <i class="bi bi-person-plus"></i>
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
  const filtroEstado = document.getElementById('filtroEstado');
  const filtroNombre = document.getElementById('filtroNombre');
  
  if (filtroEstado) {
    filtroEstado.addEventListener('change', aplicarFiltros);
  }
  
  if (filtroNombre) {
    filtroNombre.addEventListener('input', aplicarFiltros);
  }
}

function aplicarFiltros() {
  const filtroEstado = document.getElementById('filtroEstado')?.value;
  const filtroNombre = document.getElementById('filtroNombre')?.value?.toLowerCase();
  
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
// CREAR / INSERTAR MATERIAL
// ================================
function bindCrearMaterial() {
  const form = document.getElementById('formInsertar');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);

    const data = {
      nombre: f.get('nombre'),
      descripcion: f.get('descripcion'),
      estado: f.get('estado'),
    };

    try {
      await MaterialApi.create(data);
      await cargarMateriales();
      form.reset();
      
      const modal = bootstrap.Modal.getInstance(
        document.getElementById('modalInsertar')
      );
      modal.hide();
      
      mostrarExito('Material creado correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error creando material');
    }
  });
}

// ================================
// CAMPOS DE LA TABLA
// ================================
const nombresCampos = [
  'Nombre',
  'Descripción',
  'Estado'
];

const camposBd = [
  'nombre',
  'descripcion',
  'estado'
];

// ================================
// MODAL VER
// ================================
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-ver');
  if (!btn) return;

  const id = btn.dataset.id;

  // Buscar el material correspondiente
  const material = materiales.find(em => em.id_material == id);
  if (!material) return;

  const modalBody = document.getElementById('modalVerBody');
  if (!modalBody) return;

  // Limpiar contenido previo
  modalBody.innerHTML = '';

  nombresCampos.forEach((nombre, index) => {
    const p = document.createElement('p');

    const strong = document.createElement('strong');
    strong.textContent = nombre + ': ';

    const value = document.createTextNode(
      material[camposBd[index]] ?? ''
    );

    p.appendChild(strong);
    p.appendChild(value);
    modalBody.appendChild(p);
  });
});

// ================================
// MODAL EDITAR
// ================================
document.addEventListener('click', async function (e) {
  const btn = e.target.closest('.btn-editar');
  if (!btn) return;

  const id = btn.dataset.id;

  try {
    // Obtener datos del material
    const response = await MaterialApi.getById(id);
    const material = response.data;
    if (!material) return;

    const form = document.getElementById('formEditar');
    if (!form) return;

    // Insertar formulario
    form.innerHTML = `
      <div class="row mb-3">
        <div class="col-lg-6">
          <label class="form-label">Nombre</label>
          <input type="text" class="form-control" name="nombre" value="${material.nombre || ''}" required>
        </div>

        <div class="col-lg-6">
          <label class="form-label">Estado</label>
          <select class="form-select" name="estado" required>
            <option value="Disponible" ${material.estado === 'Disponible' ? 'selected' : ''}>Disponible</option>
            <option value="Asignado" ${material.estado === 'Asignado' ? 'selected' : ''}>Asignado</option>
            <option value="En reparación" ${material.estado === 'En reparación' ? 'selected' : ''}>En reparación</option>
            <option value="Baja" ${material.estado === 'Baja' ? 'selected' : ''}>Baja</option>
          </select>
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label">Descripción</label>
        <textarea class="form-control" name="descripcion" rows="3">${material.descripcion || ''}</textarea>
      </div>

      <div class="text-center">
        <button type="button" id="btnGuardarCambios" class="btn btn-primary">
          Guardar cambios
        </button>
      </div>
    `;

    // Guardar cambios
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
        await cargarMateriales();

        const modal = bootstrap.Modal.getInstance(
          document.getElementById('modalEditar')
        );
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
  
  if (material) {
    const nombreMaterial = document.getElementById('nombreMaterialEliminar');
    if (nombreMaterial) {
      nombreMaterial.textContent = material.nombre;
    }
  }

  const btnConfirm = document.getElementById('btnConfirmarEliminar');
  if (btnConfirm) {
    btnConfirm.dataset.id = id;
  }
});

document.addEventListener('click', async function (e) {
  if (e.target.id === 'btnConfirmarEliminar') {
    const id = e.target.dataset.id;
    if (!id) return;

    try {
      await MaterialApi.delete(id);
      await cargarMateriales();

      const modal = bootstrap.Modal.getInstance(
        document.getElementById('modalEliminar')
      );
      modal.hide();
      
      mostrarExito('Material eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar material:', error);
      mostrarError('Error al eliminar material: ' + error.message);
    }
  }
});

// ================================
// MODAL ASIGNAR (ejemplo de asignación a persona)
// ================================
document.addEventListener('click', async function (e) {
  const btn = e.target.closest('.btn-asignar');
  if (!btn) return;

  const id_material = btn.dataset.id;
  const material = materiales.find(m => m.id_material == id_material);
  
  if (material) {
    const form = document.getElementById('formAsignar');
    if (form) {
      // Aquí puedes implementar la lógica para asignar material
      // a personas, vehículos o almacenes
      console.log('Asignar material:', material);
    }
  }
});

// ================================
// FUNCIONES AUXILIARES
// ================================
function mostrarError(msg) {
  // Puedes implementar un toast o alert personalizado
  alert('Error: ' + msg);
}

function mostrarExito(msg) {
  // Puedes implementar un toast o alert personalizado
  alert('Éxito: ' + msg);
}

// ================================
// REFRESCAR DATOS
// ================================
window.refrescarMateriales = async function() {
  await cargarMateriales();
  mostrarExito('Datos actualizados');
};

// ================================
// EXPORTAR FUNCIONES PARA USO GLOBAL (opcional)
// ================================
window.MaterialController = {
  cargarMateriales,
  refrescarMateriales,
  aplicarFiltros
};