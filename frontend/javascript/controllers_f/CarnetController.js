import CarnetApiApi from '../api_f/CarnetApiApi.js';

let carnets = []; // variable global para almacenar carnets

document.addEventListener('DOMContentLoaded', () => {
  cargarCarnets();
  cargarTiposCarnet(0,'filtroTipoCarnet');
  cargarTiposCarnet(0,'tipoCarnetInsert');
  bindCrearCarnet();
  // cargarSelectVehiculos();
});

// ================================
// CARGAR CARNETS
// ================================
async function cargarCarnets() {
  try {
    const response = await CarnetApiApi.getAll();
    carnets = response.data; // guardamos globalmente
    renderTablaCarnets(carnets);
  } catch (e) {
    mostrarError(e.message || 'Error cargando carnets');
  }
}

// ================================

// CARGAR TIPOS DE CARNET (AÑADIR SI SE REQUIERE)   Se carga al abrir el modal editar para marcar el tipo seleccionado    

// ================================
async function cargarTiposCarnet(tipoSeleccionado, id_select) {
  const select = document.getElementById(id_select);
  if (!select) return;

  try {
    const response = await TipoCarnetApi.getAll();
    const tipos = response.data;

    select.innerHTML = '<option value="">Seleccione...</option>';

    tipos.forEach(tipo => {
      const option = document.createElement('option');

      option.value = tipo.codigo_tipo;   // ID numérico
      option.textContent = tipo.nombre; // Nombre descriptivo

      // comparación correcta (número vs número)
      if (tipoSeleccionado !== 0 && Number(tipo.codigo_tipo) === Number(tipoSeleccionado)) {
        option.selected = true;
      }

      select.appendChild(option);
    });

  } catch (e) {
    mostrarError(e.message || 'Error cargando tipos de emergencia');
  }
}


// ================================
// RENDER TABLA
// ================================
function renderTablaCarnets(carnets) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';

  carnets.forEach(c => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${c.id_carnet}</td>
      <td>${c.nombre}</td>
      <td>${c.categoria}</td>
      <td>${c.duracion}</td>
      <td class="d-flex justify-content-around">                     
        <button type="button" class="btn p-0 btn-ver" 
                data-bs-toggle="modal" 
                data-bs-target="#modalVer"
                data-id="${c.id_carnet}">
            <i class="bi bi-eye"></i>
        </button>

        <button type="button" class="btn p-0 btn-editar" 
                data-bs-toggle="modal" 
                data-bs-target="#modalEditar" 
                data-id="${c.id_carnet}">
            <i class="bi bi-pencil"></i>
        </button>
        
        <button type="button" class="btn p-0 btn-eliminar" 
                data-bs-toggle="modal"                                             /*  BOTON ELIMINAR (AÑADIR SI SE REQUIERE) meter dentro del td de botones */
                data-bs-target="#modalEliminar" 
                data-id="${c.id_carnet}">          {/* IMPORTANTE: el data-id debe ser el mismo que el del botón editar para identificar la emergencia a eliminar */}
            <i class="bi bi-trash3"></i>
        </button>
        
      </td>  
    `;
        

    tbody.appendChild(tr);
  });
}
// ================================
// CREAR / INSERTAR EMERGENCIA
// ================================
function bindCrearEmergencia() {
  const form = document.getElementById('formIncidencia');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);

    const data = {
      id_carnet: f.get('id_carnet'),
      nombre: f.get('nombre'),
      categoria: f.get('categoria'),
      duracion_meses: Number(f.get('duracion_meses')),
    };

    try {
      await CarnetApi.create(data); // ← INSERT al backend
      await cargarCarnets();        // ← refrescar tabla
      form.reset();
      alert('Carnet creado correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error creando carnet');
    }
  });
}


// ================================
// MODAL EDITAR
// ================================
document.addEventListener('click', async function (e) {
  const btn = e.target.closest('.btn-editar');
  if (!btn) return;

  const id = btn.dataset.id;

  try {
    // Obtener datos de la carnet a editar
    const response = await CarnetApi.getById(id);
    const carnet = response.data;
    if (!carnet) return;

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
            value="${carnet.fecha || ''}" 
            disabled
          >
        </div>

        <div class="col-lg-4">
          <label class="form-label">Estado</label>
          <select class="form-select" name="estado">
            <option value="ACTIVA" ${carnet.estado === 'ACTIVA' ? 'selected' : ''}>ACTIVA</option>
            <option value="CERRADA" ${carnet.estado === 'CERRADA' ? 'selected' : ''}>CERRADA</option>
          </select>
        </div>

        <div class="col-lg-4">
          <label class="form-label">Dirección</label>
          <input type="text" class="form-control" name="direccion" value="${carnet.direccion || ''}">
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-lg-4">
          <label class="form-label">Tipo</label>
          <select class="form-select" name="codigo_tipo" id="selectTipoCarnet">   
            <option value="">Seleccione...</option>
          </select>
        </div>

        <div class="col-lg-4">
          <label class="form-label">ID Bombero</label>
          <input type="text" class="form-control" name="id_bombero" value="${carnet.id_bombero || ''}">
        </div>

        <div class="col-lg-4">
          <label class="form-label">Nombre Solicitante</label>
          <input type="text" class="form-control" name="solicitante" value="${carnet.solicitante || ''}">
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-lg-4">
          <label class="form-label">Teléfono Solicitante</label>
          <input type="tel" class="form-control" name="tlfSolicitante" value="${carnet.tlfSolicitante || ''}">
        </div>

        <div class="col-lg-8">
          <label class="form-label">Equipos</label>
          <select class="form-select" name="equipos">
            <option value="">Seleccione...</option>
            <option value="equipo1" ${carnet.equipos === 'equipo1' ? 'selected' : ''}>Equipo 1</option>
            <option value="equipo2" ${carnet.equipos === 'equipo2' ? 'selected' : ''}>Equipo 2</option>
            <option value="equipo3" ${carnet.equipos === 'equipo3' ? 'selected' : ''}>Equipo 3</option>
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

    await cargarTiposEmergencia(emergencia.codigo_tipo, 'selectTipoEmergencia'); // DENTRO DEL HTML PREVIO hemos creado un select vacío con id= selectTipoEmergencia, donde se cargarán tipos y marcará el seleccionado


    // Guardar cambios
    document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
      const data = {};

      camposBd.forEach(campo => {
        const input = form.querySelector(`[name="${campo}"]`);
        if (input) data[campo] = input.value;
      });

      await EmergenciaApi.update(id, data);             // Enviar datos al backend para actualizar la emergencia
      await cargarEmergencias();                        // Recargar tabla para mostrar cambios

      const modal = bootstrap.Modal.getInstance(        // Cerrar modal
        document.getElementById('modalEditar')
      );
      modal.hide();
    });

  } catch (error) {
    console.error('Error al editar emergencia:', error);
  }
});

    
// ================================
// CAMPOS DE LA TABLA      estos arrays se usan para mostrar los campos en el modal ver (arriba como lo quieres ver, abajo como están en la base de datos, el orden debe coincidir)  
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
  const camposBd = [      //tambien se usan para el modal editar, para recoger los datos de los inputs y enviarlos al backend, por eso deben coincidir con los name de los inputs del formulario editar
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
