import CarnetApiApi from '../api_f/CarnetApi.js';
import PersonaApiApi from '../api_f/PersonaApi.js';

let carnets = []; // variable global para almacenar carnets

document.addEventListener('DOMContentLoaded', () => {
  cargarCarnets();
  cargarTiposCarnet(0,'filtroTipoCarnet');
  cargarTiposCarnet(0,'tipoCarnetInsert');
  cargarCarnetsDisponibles(null, 'seleccionarCarnet');
  cargarBomberosDisponibles(null, 'id_bombero');
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
    const response = await CarnetApiApi.getAll();
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
    mostrarError(e.message || 'Error cargando tipos de carnet');
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
      <td>${c.duracion_meses}</td>
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
                data-bs-toggle="modal"                                           
                data-bs-target="#modalEliminar" 
                data-id="${c.id_carnet}">         
            <i class="bi bi-trash3"></i>
        </button>
        
      </td>  
    `;
        

    tbody.appendChild(tr);
  });
}

// ================================
// CREAR / INSERTAR CARNET
// ================================
function bindCrearCarnet() {
  const form = document.getElementById('formInsertarCarnet');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);

    const data = {
      nombre:         f.get('nombre'),
      categoria:      f.get('categoria'),
      duracion_meses: f.get('duracion_meses')
    };

    try {
      await CarnetApiApi.create(data); // ← corregido
      await cargarCarnets();
      form.reset();
      mostrarExito('Carnet creado correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error creando carnet');
    }
  });
}

// ================================
// ERRORES / ÉXITO
// ================================
function mostrarError(msg) {
  const container = document.getElementById('alert-container');
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div class="alert alert-danger alert-dismissible fade show shadow" role="alert">
      <strong>Error:</strong> ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
  container.append(wrapper);
}

function mostrarExito(msg) {
  const container = document.getElementById('alert-container');
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div class="alert alert-success alert-dismissible fade show shadow" role="alert">
      <strong>OK:</strong> ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
  container.append(wrapper);
}


// ================================
// MODAL ELIMINAR (AÑADIR SI SE REQUIERE)   
// ================================
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-eliminar');
  if (!btn) return;

  const id = btn.dataset.id;

  const btnConfirm = document.getElementById('btnConfirmarEliminar');
  btnConfirm.dataset.id = id;
});

document.getElementById('btnConfirmarEliminar')
  .addEventListener('click', async function () {

    const id = this.dataset.id;
    if (!id) return;

      try {
        await CarnetApiApi.remove(id);
        await cargarCarnets();

      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById('modalEliminar')
      );
      modal.hide();

    } catch (error) {
      mostrarError('Error al eliminar carnet: ' + error.message);
    }
});

// ================================
// CAMPOS DE LA TABLA      estos arrays se usan para mostrar los campos en el modal ver (arriba como lo quieres ver, abajo como están en la base de datos, el orden debe coincidir)  
// ================================
  const nombresCampos = [
    'nombre',
    'categoria',
    'duracion_meses'
  ];
  const camposBd = [      //tambien se usan para el modal editar, para recoger los datos de los inputs y enviarlos al backend, por eso deben coincidir con los name de los inputs del formulario editar
    'nombre',
    'categoria',
    'duracion_meses'
  ];

// ================================
// MODAL EDITAR
// ================================
document.addEventListener('click', async function (e) {
  const btn = e.target.closest('.btn-editar');
  if (!btn) return;

  const id = btn.dataset.id;

  try {
    // Obtener datos de la carnet para rellenar el formulario de edición
    const response = await CarnetApiApi.getById(id);
    const carnet = response.data;
    if (!carnet) return;

    const form = document.getElementById('formEditar');
    form.innerHTML = ''; // Limpiar contenido previo

    // Insertar formulario                                             TENER EN CUENTA EL FORMATO DE LA FECHA
    form.innerHTML = `
      <div class="row mb-3">
        <div class="col-lg-4">
          <label class="form-label">Nombre</label>
          <input type="text" class="form-control" name="nombre" value="${carnet.nombre || ''}">
        </div>

        <div class="col-lg-4">
          <label class="form-label">Categoría</label>
          <input type="text" class="form-control" name="categoria" value="${carnet.categoria || ''}">
        </div>

        <div class="col-lg-4">
          <label class="form-label">Duracion (meses)</label>
          <input type="text" class="form-control" name="duracion_meses" value="${carnet.duracion_meses || ''}">        </div>
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

      camposBd.forEach(campo => {
        const input = form.querySelector(`[name="${campo}"]`);
        if (input) data[campo] = input.value;
      });

      await CarnetApiApi.update(id, data);             // Enviar datos al backend para actualizar la carnet
      await cargarCarnets();                        // Recargar tabla para mostrar cambios

      const modal = bootstrap.Modal.getInstance(        // Cerrar modal
        document.getElementById('modalEditar')
      );
      modal.hide();
    });

  } catch (error) {
    console.error('Error al editar carnet:', error);
  }
});

// ================================
// MODAL VER
// ================================
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-ver');
  if (!btn) return;

  const id = btn.dataset.id;

  // Buscar la carnet correspondiente (usar carnets plural, y id_carnet)
  const carnet = carnets.find(p => p.id_carnet == id);
  if (!carnet) return;

  const modalBody = document.getElementById('modalVerBody');

  // Limpiar contenido previo
  modalBody.innerHTML = '';

  nombresCampos.forEach((nombre, index) => {
    const campo = camposBd[index];
    let valor = carnet[campo] ?? '';

    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = nombre + ': ';

    p.appendChild(strong);
    p.appendChild(document.createTextNode(valor));

    modalBody.appendChild(p);
  });
});

// ================================
// CARGAR CARNETS DISPONIBLES
// ================================
async function cargarCarnetsDisponibles(carnetSeleccionado, id_select) {
  const select = document.getElementById(id_select);
  if (!select) return;

  try {
    const response = await CarnetApiApi.getAll();
    const carnets = response.data;

    select.innerHTML = '<option value="">Seleccione carnet...</option>';

    carnets.forEach(carnet => {
      const option = document.createElement('option');
      
      option.value = carnet.id_carnet;  // ID del carnet
      option.textContent = `${carnet.nombre} - ${carnet.categoria} (${carnet.duracion_meses} meses)`; // Nombre descriptivo
      
      // Marcar como seleccionado si coincide
      if (carnetSeleccionado && carnet.id_carnet === carnetSeleccionado) {
        option.selected = true;
      }

      select.appendChild(option);
    });

  } catch (e) {
    mostrarError(e.message || 'Error cargando carnets');
  }
}
// ================================
// CARGAR BOMBEROS DISPONIBLES
// ================================
async function cargarBomberosDisponibles(bomberoSeleccionado, id_select) {
  const select = document.getElementById(id_select);
  if (!select) return;

  try {
    const response = await PersonaApiApi.getAll();
    const bomberos = response.data;

    select.innerHTML = '<option value="">Seleccione bombero...</option>';

    bomberos.forEach(bombero => {
      const option = document.createElement('option');
      
      option.value = bombero.id_bombero;  // ID del bombero
      option.textContent = `${bombero.id_bombero} - ${bombero.nombre} ${bombero.apellidos}`; // Nombre descriptivo
      
      // Marcar como seleccionado si coincide
      if (bomberoSeleccionado && bombero.id_bombero === bomberoSeleccionado) {
        option.selected = true;
      }

      select.appendChild(option);
    });

  } catch (e) {
    mostrarError(e.message || 'Error cargando bomberos');
  }
}