import EmergenciaApi from '../api_f/EmergenciaApi.js';

document.addEventListener('DOMContentLoaded', () => {
  cargarEmergencias();
  setupFormularioInsertar();
});

// ================================
// CARGAR EMERGENCIAS
// ================================
async function cargarEmergencias() {
  try {
    const emergencias = await EmergenciaApi.getAll();
    renderTablaEmergencias(emergencias);
  } catch (e) {
    mostrarError(e.message || 'Error cargando emergencias');
  }
}

// ================================
// RENDER TABLA
// ================================
function renderTablaEmergencias(emergencias) {
  const tbody = document.querySelector('#tablaEmergencias tbody');
  tbody.innerHTML = '';

  emergencias.forEach(e => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${e.id_emergencia || ''}</td>
      <td>${formatearFecha(e.fecha) || ''}</td>
      <td class="d-none d-md-table-cell">${e.descripcion || ''}</td>
      <td>${e.estado || ''}</td>
      <td class="d-none d-md-table-cell">${e.direccion || ''}</td>
      <td>${e.tipo || ''}</td>
      <td class="d-flex justify-content-around">
        <button type="button" class="btn p-0 d-md-none btn-ver" 
                data-id="${e.id_emergencia}" 
                data-bs-toggle="modal" 
                data-bs-target="#modalVer">
          <i class="bi bi-eye"></i>
        </button>
        <button type="button" class="btn p-0 btn-editar" 
                data-id="${e.id_emergencia}"
                data-bs-toggle="modal" 
                data-bs-target="#modalEditar">
          <i class="bi bi-pencil"></i>
        </button>
        <button type="button" class="btn p-0 btn-eliminar" 
                data-id="${e.id_emergencia}"
                data-bs-toggle="modal" 
                data-bs-target="#modalEliminar">
          <i class="bi bi-trash3"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Agregar event listeners
  document.querySelectorAll('.btn-ver').forEach(btn => {
    btn.addEventListener('click', () => verEmergencia(btn.dataset.id));
  });

  document.querySelectorAll('.btn-editar').forEach(btn => {
    btn.addEventListener('click', () => editarEmergencia(btn.dataset.id));
  });

  document.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', () => prepararEliminar(btn.dataset.id));
  });
}

// ================================
// VER DETALLE
// ================================
async function verEmergencia(idEmergencia) {
  try {
    const emergencia = await EmergenciaApi.getById(idEmergencia);
    const modalBody = document.getElementById('modalVerBody');
    
    modalBody.innerHTML = `
      <div class="mb-2"><strong>Código:</strong> ${emergencia.id_emergencia || ''}</div>
      <div class="mb-2"><strong>Fecha:</strong> ${formatearFecha(emergencia.fecha) || ''}</div>
      <div class="mb-2"><strong>Estado:</strong> ${emergencia.estado || ''}</div>
      <div class="mb-2"><strong>Tipo:</strong> ${emergencia.tipo || ''}</div>
      <div class="mb-2"><strong>Dirección:</strong> ${emergencia.direccion || ''}</div>
      <div class="mb-2"><strong>Descripción:</strong> ${emergencia.descripcion || ''}</div>
      <div class="mb-2"><strong>Operador:</strong> ${emergencia.nom_operador || ''}</div>
      <div class="mb-2"><strong>Solicitante:</strong> ${emergencia.nom_solicitante || ''}</div>
      <div class="mb-2"><strong>Teléfono:</strong> ${emergencia.tlfn_solicitante || ''}</div>
    `;
  } catch (e) {
    mostrarError(e.message || 'Error al cargar el detalle');
  }
}

// ================================
// EDITAR EMERGENCIA
// ================================
async function editarEmergencia(idEmergencia) {
  try {
    const emergencia = await EmergenciaApi.getById(idEmergencia);
    
    // Rellenar el formulario del modal de edición
    document.getElementById('editIdEmergencia').value = emergencia.id_emergencia || '';
    document.getElementById('editFecha').value = emergencia.fecha || '';
    document.getElementById('editEstado').value = emergencia.estado || '';
    document.getElementById('editTipo').value = emergencia.tipo || '';
    document.getElementById('editDireccion').value = emergencia.direccion || '';
    document.getElementById('editDescripcion').value = emergencia.descripcion || '';
    document.getElementById('editOperador').value = emergencia.nom_operador || '';
    document.getElementById('editSolicitante').value = emergencia.nom_solicitante || '';
    document.getElementById('editTelefono').value = emergencia.tlfn_solicitante || '';
    
    // Guardar el ID para usarlo al guardar cambios
    document.getElementById('btnGuardarCambios').dataset.id = idEmergencia;
  } catch (e) {
    mostrarError(e.message || 'Error al cargar datos para editar');
  }
}

// Guardar cambios de edición
document.addEventListener('DOMContentLoaded', () => {
  const btnGuardar = document.getElementById('btnGuardarCambios');
  if (btnGuardar) {
    btnGuardar.addEventListener('click', async () => {
      const idEmergencia = btnGuardar.dataset.id;
      const datos = {
        fecha: document.getElementById('editFecha').value,
        estado: document.getElementById('editEstado').value,
        tipo: document.getElementById('editTipo').value,
        direccion: document.getElementById('editDireccion').value,
        descripcion: document.getElementById('editDescripcion').value,
        nom_operador: document.getElementById('editOperador').value,
        nom_solicitante: document.getElementById('editSolicitante').value,
        tlfn_solicitante: document.getElementById('editTelefono').value
      };
      
      try {
        await EmergenciaApi.update(idEmergencia, datos);
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditar'));
        modal.hide();
        
        // Recargar tabla
        cargarEmergencias();
        
        mostrarExito('Emergencia actualizada correctamente');
      } catch (e) {
        mostrarError(e.message || 'Error al actualizar');
      }
    });
  }
});

// ================================
// ELIMINAR EMERGENCIA
// ================================
let idEmergenciaEliminar = null;

function prepararEliminar(idEmergencia) {
  idEmergenciaEliminar = idEmergencia;
}

document.addEventListener('DOMContentLoaded', () => {
  const btnConfirmar = document.getElementById('btnConfirmarEliminar');
  if (btnConfirmar) {
    btnConfirmar.addEventListener('click', async () => {
      if (!idEmergenciaEliminar) return;
      
      try {
        await EmergenciaApi.delete(`/${idEmergenciaEliminar}`);
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEliminar'));
        modal.hide();
        
        // Recargar tabla
        cargarEmergencias();
        
        mostrarExito('Emergencia eliminada correctamente');
        idEmergenciaEliminar = null;
      } catch (e) {
        mostrarError(e.message || 'Error al eliminar');
      }
    });
  }
});

// ================================
// FORMULARIO INSERTAR
// ================================
function setupFormularioInsertar() {
  const form = document.getElementById('formIncidencia');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const datos = {
        fecha: formData.get('fecha'),
        estado: formData.get('estado'),
        direccion: formData.get('direccion'),
        tipo: formData.get('tipo'),
        nom_operador: formData.get('operador'),
        nom_solicitante: formData.get('solicitante'),
        tlfn_solicitante: formData.get('tlfSolicitante'),
        descripcion: formData.get('descripcion')
      };
      
      try {
        await EmergenciaApi.create(datos);
        form.reset();
        cargarEmergencias();
        mostrarExito('Emergencia creada correctamente');
      } catch (e) {
        mostrarError(e.message || 'Error al crear emergencia');
      }
    });
  }
}

// ================================
// UTILIDADES
// ================================
function formatearFecha(fecha) {
  if (!fecha) return '';
  const date = new Date(fecha);
  return date.toLocaleDateString('es-ES');
}

function mostrarError(msg) {
  alert('Error: ' + msg);
  console.error(msg);
}

function mostrarExito(msg) {
  alert(msg);
}