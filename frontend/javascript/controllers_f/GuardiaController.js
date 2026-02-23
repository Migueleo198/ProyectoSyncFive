import GuardiaApi from '../api_f/GuardiaApi.js';
import PersonaApiApi from '../api_f/PersonaApi.js';

let guardias = []; // variable global para almacenar guardias

document.addEventListener('DOMContentLoaded', () => {
  cargarGuardias();
  cargarGuardiasDisponibles(null, 'seleccionarGuardia');
  cargarPersonasDisponibles(null, 'n_funcionario');
  bindCrearGuardia();
  bindAsignarGuardia();
});

// ================================
// CARGAR GUARDIAS
// ================================
async function cargarGuardias() {
  try {
    const response = await GuardiaApi.getAll();
    guardias = response.data;
    renderTablaGuardias(guardias);
  } catch (e) {
    mostrarError(e.message || 'Error cargando guardias');
  }
}

// ================================
// CARGAR GUARDIAS DISPONIBLES (para select)
// ================================
async function cargarGuardiasDisponibles(guardiaSeleccionado, id_select) {
  const select = document.getElementById(id_select);
  if (!select) return;

  try {
    const response = await GuardiaApi.getAll();
    const guardias = response.data;

    select.innerHTML = '<option value="">Seleccione guardia...</option>';

    guardias.forEach(guardia => {
      const option = document.createElement('option');
      
      option.value = guardia.id_guardia;
      option.textContent = `${guardia.id_guardia} - ${guardia.fecha} (${guardia.h_inicio} - ${guardia.h_fin})`;
      
      if (guardiaSeleccionado && guardia.id_guardia === guardiaSeleccionado) {
        option.selected = true;
      }

      select.appendChild(option);
    });

  } catch (e) {
    mostrarError(e.message || 'Error cargando guardias');
  }
}

// ================================
// CARGAR PERSONAS DISPONIBLES
// ================================
async function cargarPersonasDisponibles(personaSeleccionada, id_select) {
  const select = document.getElementById(id_select);
  if (!select) return;

  try {
    const response = await PersonaApiApi.getAll();
    const personas = response.data;

    select.innerHTML = '<option value="">Seleccione persona...</option>';

    personas.forEach(persona => {
      const option = document.createElement('option');
      
      option.value = persona.n_funcionario;
      option.textContent = `${persona.n_funcionario} - ${persona.nombre} ${persona.apellidos}`;
      
      if (personaSeleccionada && persona.n_funcionario === personaSeleccionada) {
        option.selected = true;
      }

      select.appendChild(option);
    });

  } catch (e) {
    mostrarError(e.message || 'Error cargando personas');
  }
}

// ================================
// RENDER TABLA
// ================================
function renderTablaGuardias(guardias) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';

  guardias.forEach(g => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${g.id_guardia}</td>
      <td>${g.fecha}</td>
      <td>${g.h_inicio}</td>
      <td>${g.h_fin}</td>
      <td class="d-none d-md-table-cell">${g.notas || ''}</td>
      <td class="d-flex justify-content-around">                     
        <button type="button" class="btn p-0 btn-ver" 
                data-bs-toggle="modal" 
                data-bs-target="#modalVer"
                data-id="${g.id_guardia}">
            <i class="bi bi-eye"></i>
        </button>

        <button type="button" class="btn p-0 btn-editar" 
                data-bs-toggle="modal" 
                data-bs-target="#modalEditar" 
                data-id="${g.id_guardia}">
            <i class="bi bi-pencil"></i>
        </button>
        
        <button type="button" class="btn p-0 btn-eliminar" 
                data-bs-toggle="modal"
                data-bs-target="#modalEliminar" 
                data-id="${g.id_guardia}">
            <i class="bi bi-trash3"></i>
        </button>
      </td>  
    `;

    tbody.appendChild(tr);
  });
}

// ================================
// CREAR / INSERTAR GUARDIA
// ================================
function bindCrearGuardia() {
  const form = document.getElementById('formInsertarGuardia');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);

    const data = {
      id_guardia: "0", // se asignará automáticamente
      fecha:    f.get('fecha'),
      h_inicio: f.get('h_inicio'),
      h_fin:    f.get('h_fin'),
      notas:    f.get('notas')
    };

    try {
      await GuardiaApi.create(data);
      await cargarGuardias();
      form.reset();
      mostrarExito('Guardia creada correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error creando guardia');
    }
  });
}


// ================================
// CAMPOS DE LA TABLA
// ================================
const nombresCampos = [
  'Fecha',
  'Hora Inicio',
  'Hora Fin',
  'Notas'
];

const camposBd = [
  'fecha',
  'h_inicio',
  'h_fin',
  'notas'
];

// ================================
// MODAL VER
// ================================
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-ver');
  if (!btn) return;

  const id = btn.dataset.id;

  const guardia = guardias.find(g => g.id_guardia == id);
  if (!guardia) return;

  const modalBody = document.getElementById('modalVerBody');
  modalBody.innerHTML = '';

  nombresCampos.forEach((nombre, index) => {
    const campo = camposBd[index];
    let valor = guardia[campo] ?? '';

    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = nombre + ': ';

    p.appendChild(strong);
    p.appendChild(document.createTextNode(valor));

    modalBody.appendChild(p);
  });
});

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
 

function bindAsignarGuardia() {
  const form = document.getElementById('formAsignarGuardia');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);

    const data = {
      n_funcionario: f.get('n_funcionario'), // persona
      id_guardia: f.get('id_guardia')        // corregido: usar name del select
    };

    if (!data.n_funcionario || !data.id_guardia) {
      mostrarError('Seleccione guardia y persona');
      return;
    }

    try {
      await GuardiaApi.assignToPerson(data); 
      mostrarExito('Persona asignada a la guardia correctamente');
      form.reset();
    } catch (err) {
      mostrarError(err.message || 'Error asignando persona a guardia');
    }
  });

}


// ================================
// Asignar CARNET a Persona
// ================================
function bindAsignarCarnet() {
  const form = document.getElementById('formInsertar');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);

    const data = {
      n_funcionario:    f.get('n_funcionario'),
      id_guardia:     f.get('seleccionarGuardia'), 
      cargo:   f.get('cargo')
    };

    try {
      // Usar el endpoint correcto para asignar (NO create)
      await GuardiaApi.assignToPerson(data);
      await cargarGuardias();
      form.reset();
      mostrarExito('Guardia asignado correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error asignando guardia');
    }
  });
}