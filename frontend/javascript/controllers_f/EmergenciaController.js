import EmergenciaApi from '../api_f/EmergenciaApi.js';

let emergencias = []; // GLOBAL para acceder desde los listeners

document.addEventListener('DOMContentLoaded', () => {
  cargarEmergencias();
});

// ================================
// CARGAR EMERGENCIAS
// ================================
async function cargarEmergencias() {
  try {
    const response = await EmergenciaApi.getAll();
    emergencias = response.data; // guardamos globalmente
    renderTablaEmergencias(emergencias);
  } catch (e) {
    mostrarError(e.message || 'Error cargando emergencias');
  }
}


// ================================
// RENDER TABLA
// ================================
function renderTablaEmergencias(emergencias,nombresColumnas) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';

  emergencias.forEach(e => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${e.id_emergencia}</td>
      <td>${e.fecha}</td>
      <td class="d-none d-md-table-cell">${e.descripcion ?? ''}</td>
      <td>${e.estado}</td>
      <td class="d-none d-md-table-cell">${e.direccion ?? ''}</td>
      <td>${e.nombre_tipo ?? ''}</td>
      <td class="d-flex justify-content-around">                     
        <button type="button" class="btn p-0 d-md-none btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer">
            <i class="bi bi-eye"></i>
        </button>

        <button type="button" class="btn p-0 btn-editar" 
                data-bs-toggle="modal" 
                data-bs-target="#modalEditar" 
                data-id="${e.id_emergencia}">
            <i class="bi bi-pencil"></i>
        </button>
        
        <button type="button" class="btn p-0 btn-eliminar" 
                data-bs-toggle="modal" 
                data-bs-target="#modalEliminar" 
                data-id="${e.id_emergencia}">
            <i class="bi bi-trash3"></i>
        </button>
      </td>  
    `;

    tbody.appendChild(tr);
  });
}

// ================================
// CAMPOS DE LA TABLA
// ================================
  const nombresCampos = [
    'Fecha',
    'Estado',
    'Dirección',
    'Tipo Emergencia',
    'ID Bombero',
    'Nombre Solicitante',
    'Teléfono Solicitante',
    'Descripción'
  ];
  const camposBd = [
    'fecha',
    'estado',
    'direccion',
    'codigo_tipo',
    'id_bombero',
    'nombre_solicitante',
    'tlfn_solicitante',
    'descripcion'
  ];

// ================================
// MODAL EDITAR
// ================================
document.addEventListener('click', async function(e) {
  if (e.target.closest('.btn-editar')) {
    const btn = e.target.closest('.btn-editar');
    const id = btn.dataset.id;


    // Buscar la emergencia correspondiente
    const response = await EmergenciaApi.getById(id);
    const emergencia = response.data;
    if (!emergencia) return;
    const form = document.getElementById('formEditar');
    // Rellenar el modal
    nombresCampos.forEach((nombre, index) => {
      
      // contenedor
      const div = document.createElement('div');
      div.className = 'mb-3';

      // label
      const label = document.createElement('label');
      label.className = 'form-label';
      label.textContent = nombre;
      
      // input
      const input = document.createElement('input');
      input.className = 'form-control';
      input.name = camposBd[index];
      input.value = emergencia[camposBd[index]] ?? '';
      
      // Añadir al formulario
      div.append(label, input);
      form.innerHTML = ''; // Limpiar contenido previo
      form.appendChild(div);
    });
    // Guardar id en el botón de guardar cambios
    const btnGuardarCambios = document.createElement('button');
    btnGuardarCambios.id = 'btnGuardarCambios';
    btnGuardarCambios.dataset.id = id;
    btnGuardarCambios.textContent = 'Guardar Cambios';
    btnGuardarCambios.className = 'btn btn-primary';
    btnGuardarCambios.type = 'button'; // para evitar submit del form
    btnGuardarCambios.addEventListener('click', async () => {
      const data = {};
      camposBd.forEach(campo => {
        data[campo] = form.querySelector(`[name="${campo}"]`).value;
      });

      try {
        await EmergenciaApi.update(id, data);
        await cargarEmergencias();

        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditar'));
        modal.hide();
      } catch (error) {
        console.error('Error al actualizar emergencia:', error);
      }
    
    });
    form.appendChild(btnGuardarCambios);
  }
});

// Guardar cambios
// document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
//   const id = document.getElementById('btnGuardarCambios').dataset.id;
//   const data = {
//     nombre_tipo: document.getElementById('editNombre').value,
//     grupo: document.getElementById('editGrupo').value
//   };

//   try {
//     await EmergenciaApi.update(id, data);
//     // Actualizar tabla después de modificar
//     await cargarEmergencias();

//     // Cerrar modal
//     const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditar'));
//     modal.hide();
//   } catch (error) {
//     console.error('Error al actualizar emergencia:', error);
//   }
// });

// ================================
// MODAL ELIMINAR
// ================================
document.addEventListener('click', function(e) {
  if (e.target.closest('.btn-eliminar')) {
    const btn = e.target.closest('.btn-eliminar');
    const id = btn.dataset.id;

    // Guardar el ID en el botón de confirmar
    const btnConfirm = document.getElementById('btnConfirmarEliminar');
    btnConfirm.dataset.id = id;
  }
});

// Confirmar eliminación
document.getElementById('btnConfirmarEliminar').addEventListener('click', async function() {
  const id = this.dataset.id;
  try {
    await EmergenciaApi.delete(id); // eliminamos la emergencia
    await cargarEmergencias();

    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalEliminar'));
    modal.hide();
  } catch (error) {
    console.error('Error al eliminar emergencia:', error);
  }
});

// ================================
// ERRORES
// ================================
function mostrarError(msg) {
  alert(msg);
}
