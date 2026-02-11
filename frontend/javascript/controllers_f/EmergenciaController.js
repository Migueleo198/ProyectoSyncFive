import EmergenciaApi from '../api_f/EmergenciaApi.js';
import TipoEmergenciaApi from '../api_f/TipoEmergenciaApi.js';

let emergencias = []; // variable global para almacenar emergencias

document.addEventListener('DOMContentLoaded', () => {
  cargarEmergencias();
  cargarTiposEmergenciaFiltro();
  cargarSelectVehiculos();
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
// CARGAR TIPOS DE EMERGENCIA (AÑADIR SI SE REQUIERE)
// ================================
async function cargarTiposEmergencia(tipoSeleccionado) {
  const select = document.getElementById('selectTipoEmergencia');
  if (!select) return;

  try {
    const response = await TipoEmergenciaApi.getAll();
    const tipos = response.data;

    select.innerHTML = '<option value="">Seleccione...</option>';

    tipos.forEach(tipo => {
      const option = document.createElement('option');

      option.value = tipo.codigo_tipo;   // ID numérico
      option.textContent = tipo.nombre; // Nombre descriptivo

      // comparación correcta (número vs número)
      if (Number(tipo.codigo_tipo) === Number(tipoSeleccionado)) {
        option.selected = true;
      }

      select.appendChild(option);
    });

  } catch (e) {
    mostrarError(e.message || 'Error cargando tipos de emergencia');
  }
}

// ================================
// CARGAR TIPOS DE EMERGENCIA AL FILTRO
// ================================
async function cargarTiposEmergenciaFiltro() {
  const select = document.getElementById('filtroTipoEmergencia');
  if (!select) return;

  try {
    const response = await TipoEmergenciaApi.getAll();
    const tipos = response.data;

    // Limpiar select y dejar opción por defecto
    select.innerHTML = '<option value="">Seleccione...</option>';

    // Llenar select con los tipos
    tipos.forEach(tipo => {
      const option = document.createElement('option');
      option.value = tipo.codigo_tipo;   // ID numérico
      option.textContent = tipo.nombre;  // Nombre descriptivo
      select.appendChild(option);
    });

  } catch (e) {
    mostrarError(e.message || 'Error cargando tipos de emergencia');
  }
}

// ================================
// CARGAR VEHÍCULOS (AÑADIR SI SE REQUIERE)
// ================================
async function cargarSelectVehiculos() {
        const select = document.getElementById("selectVehiculo");
        const vehiculos = await EmergenciaApi.getVehiculos();

        // Limpiar opciones existentes, excepto la primera
        select.innerHTML = '<option value="">Seleccione vehículo...</option>';

        // Agregar opciones dinámicamente
        vehiculos.forEach(vehiculo => {
            const option = document.createElement("option");
            option.value = vehiculo.id;
            option.textContent = vehiculo.nombre;
            select.appendChild(option);
        });
    }

// ================================
// RENDER TABLA
// ================================
function renderTablaEmergencias(emergencias) {
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
        <button type="button" class="btn p-0 btn-ver" 
                data-bs-toggle="modal" 
                data-bs-target="#modalVer"
                data-id="${e.id_emergencia}">
            <i class="bi bi-eye"></i>
        </button>

        <button type="button" class="btn p-0 btn-editar" 
                data-bs-toggle="modal" 
                data-bs-target="#modalEditar" 
                data-id="${e.id_emergencia}">
            <i class="bi bi-pencil"></i>
        </button>
        
        
      </td>  
    `;
        // <button type="button" class="btn p-0 btn-eliminar" 
        //         data-bs-toggle="modal"                                              BOTON ELIMINAR (AÑADIR SI SE REQUIERE)
        //         data-bs-target="#modalEliminar" 
        //         data-id="${e.id_emergencia}">
        //     <i class="bi bi-trash3"></i>
        // </button>

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
document.addEventListener('click', async function (e) {
  const btn = e.target.closest('.btn-editar');
  if (!btn) return;

  const id = btn.dataset.id;

  try {
    // Obtener datos de la emergencia
    const response = await EmergenciaApi.getById(id);
    const emergencia = response.data;
    if (!emergencia) return;

    const form = document.getElementById('formEditar');
    form.innerHTML = ''; // Limpiar contenido previo

    // Insertar formulario
    form.innerHTML = `
      <div class="row mb-3">
        <div class="col-lg-4">
          <label class="form-label">Fecha</label>
          <input 
            type="text" 
            class="form-control" 
            value="${emergencia.fecha || ''}" 
            disabled
          >
        </div>

        <div class="col-lg-4">
          <label class="form-label">Estado</label>
          <select class="form-select" name="estado">
            <option value="${emergencia.estado || ''}">${emergencia.estado || 'Seleccionar estado'}</option>
            <option value="ACTIVA">ACTIVA</option>
            <option value="CERRADA">CERRADA</option>
          </select>
        </div>

        <div class="col-lg-4">
          <label class="form-label">Dirección</label>
          <input type="text" class="form-control" name="direccion" value="${emergencia.direccion || ''}">
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-lg-4">
          <label class="form-label">Tipo</label>
          <select class="form-select" name="codigo_tipo" id="selectTipoEmergencia">
            <option value="">Seleccione...</option>
          </select>
        </div>

        <div class="col-lg-4">
          <label class="form-label">ID Bombero</label>
          <input type="text" class="form-control" name="id_bombero" value="${emergencia.id_bombero || ''}">
        </div>

        <div class="col-lg-4">
          <label class="form-label">Nombre Solicitante</label>
          <input type="text" class="form-control" name="solicitante" value="${emergencia.solicitante || ''}">
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-lg-4">
          <label class="form-label">Teléfono Solicitante</label>
          <input type="tel" class="form-control" name="tlfSolicitante" value="${emergencia.tlfSolicitante || ''}">
        </div>

        <div class="col-lg-8">
          <label class="form-label">Equipos</label>
          <select class="form-select" name="equipos">
            <option value="">Seleccione...</option>
            <option value="equipo1" ${emergencia.equipos === 'equipo1' ? 'selected' : ''}>Equipo 1</option>
            <option value="equipo2" ${emergencia.equipos === 'equipo2' ? 'selected' : ''}>Equipo 2</option>
            <option value="equipo3" ${emergencia.equipos === 'equipo3' ? 'selected' : ''}>Equipo 3</option>
          </select>
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label">Descripción</label>
        <textarea class="form-control" name="descripcion" rows="4">${emergencia.descripcion || ''}</textarea>
      </div>

      <div class="text-center">
        <button type="button" id="btnGuardarCambios" class="btn btn-primary">
          Guardar cambios
        </button>
      </div>
    `;
    await cargarTiposEmergencia(emergencia.codigo_tipo); // Cargar tipos y marcar el seleccionado

    // Guardar cambios
    document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
      const data = {};

      camposBd.forEach(campo => {
        const input = form.querySelector(`[name="${campo}"]`);
        if (input) data[campo] = input.value;
      });

      await EmergenciaApi.update(id, data);
      await cargarEmergencias();

      const modal = bootstrap.Modal.getInstance(
        document.getElementById('modalEditar')
      );
      modal.hide();
    });

  } catch (error) {
    console.error('Error al editar emergencia:', error);
  }
});

    


// ================================
// MODAL VER
// ================================
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-ver');
  if (!btn) return;

  const id = btn.dataset.id;

  // Buscar la emergencia correspondiente
  const emergencia = emergencias.find(em => em.id_emergencia == id);
  if (!emergencia) return;

  const modalBody = document.getElementById('modalVerBody');

  // Limpiar contenido previo
  while (modalBody.firstChild) {
    modalBody.removeChild(modalBody.firstChild);
  }

  nombresCampos.forEach((nombre, index) => {
    const p = document.createElement('p');

    const strong = document.createElement('strong');
    strong.textContent = nombre + ': ';

    const value = document.createTextNode(
      emergencia[camposBd[index]] ?? ''
    );

    p.appendChild(strong);
    p.appendChild(value);
    modalBody.appendChild(p);
  });
});

// ================================
// MODAL ELIMINAR (AÑADIR SI SE REQUIERE)   
// ================================
// document.addEventListener('click', function (e) {
//   const btn = e.target.closest('.btn-eliminar');
//   if (!btn) return;

//   const id = btn.dataset.id;

//   const btnConfirm = document.getElementById('btnConfirmarEliminar');
//   btnConfirm.dataset.id = id;
// });

// document.getElementById('btnConfirmarEliminar')
//   .addEventListener('click', async function () {

//     const id = this.dataset.id;
//     if (!id) return;

//     try {
//       await EmergenciaApi.delete(id);
//       await cargarEmergencias();

//       // Cerrar modal
//       const modal = bootstrap.Modal.getInstance(
//         document.getElementById('modalEliminar')
//       );
//       modal.hide();

//     } catch (error) {
//       console.error('Error al eliminar emergencia:', error);
//     }
// });


// ================================
// ERRORES
// ================================
function mostrarError(msg) {
  alert(msg);
}
