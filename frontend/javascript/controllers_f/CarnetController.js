import CarnetApiApi from '../api_f/CarnetApi.js';
import PersonaApiApi from '../api_f/PersonaApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { mostrarError, mostrarExito } from '../helpers/utils.js';

let carnets = [];
let sesionActual = null;

document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('carnets');
  if (!sesionActual) return;

  cargarCarnets();
  cargarTiposCarnet(0, 'filtroTipoCarnet');
  cargarTiposCarnet(0, 'tipoCarnetInsert');
  cargarCarnetsDisponibles(null, 'seleccionarCarnet');
  cargarBomberosDisponibles(null, 'id_bombero');
  bindModalEliminar();
  bindModalEditar();
  bindModalVer();

  if (sesionActual.puedeEscribir) {
    bindCrearCarnet();
    bindAsignarCarnet();
  }
});

// ================================
// CARGAR CARNETS
// ================================
async function cargarCarnets() {
  try {
    const response = await CarnetApiApi.getAll();
    carnets = response.data;
    renderTablaCarnets(carnets);
  } catch (e) {
    mostrarError(e.message || 'Error cargando carnets');
  }
}

// ================================
// CARGAR TIPOS DE CARNET
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
      option.value = tipo.codigo_tipo;
      option.textContent = tipo.nombre;
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
function renderTablaCarnets(lista) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';

  const puedeEscribir = sesionActual?.puedeEscribir ?? false;

  lista.forEach(c => {
    const tr = document.createElement('tr');

    const botonesAccion = puedeEscribir
      ? `<button type="button" class="btn p-0 btn-ver"
              data-bs-toggle="modal" data-bs-target="#modalVer"
              data-id="${c.id_carnet}"><i class="bi bi-eye"></i></button>
         <button type="button" class="btn p-0 btn-editar"
              data-bs-toggle="modal" data-bs-target="#modalEditar"
              data-id="${c.id_carnet}"><i class="bi bi-pencil"></i></button>
         <button type="button" class="btn p-0 btn-eliminar"
              data-bs-toggle="modal" data-bs-target="#modalEliminar"
              data-id="${c.id_carnet}"><i class="bi bi-trash3"></i></button>`
      : `<button type="button" class="btn p-0 btn-ver"
              data-bs-toggle="modal" data-bs-target="#modalVer"
              data-id="${c.id_carnet}"><i class="bi bi-eye"></i></button>`;

    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${c.id_carnet}</td>
      <td>${c.nombre}</td>
      <td>${c.categoria}</td>
      <td>${c.duracion_meses}</td>
            <td>
        <div class="d-flex justify-content-around">
          ${botonesAccion}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ================================
// CREAR CARNET
// ================================
function bindCrearCarnet() {
  const form = document.getElementById('formInsertarCarnet');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const data = {
      nombre:         f.get('nombre'),
      categoria:      f.get('categoria'),
      duracion_meses: f.get('duracion_meses')
    };

    try {
      await CarnetApiApi.create(data);
      await cargarCarnets();
      form.reset();
      mostrarExito('Carnet creado correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error creando carnet');
    }
  });
}

// ================================
// MODAL ELIMINAR
// ================================
function bindModalEliminar() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-eliminar');
    if (!btn) return;
    document.getElementById('btnConfirmarEliminar').dataset.id = btn.dataset.id;
  });

  document.getElementById('btnConfirmarEliminar').addEventListener('click', async function () {
    const id = this.dataset.id;
    if (!id) return;

    try {
      await CarnetApiApi.remove(id);
      await cargarCarnets();
      bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
    } catch (error) {
      mostrarError('Error al eliminar carnet: ' + error.message);
    }
  });
}

// ================================
// CAMPOS BD
// ================================
const nombresCampos = ['nombre', 'categoria', 'duracion_meses'];
const camposBd      = ['nombre', 'categoria', 'duracion_meses'];

// ================================
// MODAL EDITAR
// ================================
function bindModalEditar() {
  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('.btn-editar');
    if (!btn) return;

    const id = btn.dataset.id;

    try {
      const response = await CarnetApiApi.getById(id);
      const carnet = response.data;
      if (!carnet) return;

      const form = document.getElementById('formEditar');
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
            <label class="form-label">Duración (meses)</label>
            <input type="text" class="form-control" name="duracion_meses" value="${carnet.duracion_meses || ''}">
          </div>
        </div>
        <div class="text-center">
          <button type="button" id="btnGuardarCambios" class="btn btn-primary">Guardar cambios</button>
        </div>
      `;

      document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
        const data = {};
        camposBd.forEach(campo => {
          const input = form.querySelector(`[name="${campo}"]`);
          if (input) data[campo] = input.value;
        });

        await CarnetApiApi.update(id, data);
        await cargarCarnets();
        bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
        mostrarExito('Carnet actualizado correctamente');
      });

    } catch (error) {
      mostrarError('Error al editar carnet: ' + error.message);
    }
  });
}

// ================================
// MODAL VER
// ================================
function bindModalVer() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-ver');
    if (!btn) return;

    const carnet = carnets.find(p => p.id_carnet == btn.dataset.id);
    if (!carnet) return;

    const modalBody = document.getElementById('modalVerBody');
    modalBody.innerHTML = '';

    nombresCampos.forEach((nombre, index) => {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = nombre + ': ';
      p.appendChild(strong);
      p.appendChild(document.createTextNode(carnet[camposBd[index]] ?? ''));
      modalBody.appendChild(p);
    });
  });
}

// ================================
// CARGAR CARNETS DISPONIBLES
// ================================
async function cargarCarnetsDisponibles(carnetSeleccionado, id_select) {
  const select = document.getElementById(id_select);
  if (!select) return;

  try {
    const response = await CarnetApiApi.getAll();
    const lista = response.data;
    select.innerHTML = '<option value="">Seleccione carnet...</option>';
    lista.forEach(carnet => {
      const option = document.createElement('option');
      option.value = carnet.id_carnet;
      option.textContent = `${carnet.nombre} - ${carnet.categoria} (${carnet.duracion_meses} meses)`;
      if (carnetSeleccionado && carnet.id_carnet === carnetSeleccionado) option.selected = true;
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
      option.value = bombero.id_bombero;
      option.textContent = `${bombero.id_bombero} - ${bombero.nombre} ${bombero.apellidos}`;
      if (bomberoSeleccionado && bombero.id_bombero === bomberoSeleccionado) option.selected = true;
      select.appendChild(option);
    });
  } catch (e) {
    mostrarError(e.message || 'Error cargando bomberos');
  }
}

// ================================
// ASIGNAR CARNET A PERSONA
// ================================
function bindAsignarCarnet() {
  const form = document.getElementById('formInsertar');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const data = {
      id_bombero:    f.get('id_bombero'),
      ID_Carnet:     f.get('seleccionarCarnet'),
      f_obtencion:   f.get('f_obtencion'),
      f_vencimiento: f.get('f_vencimiento')
    };

    try {
      await CarnetApiApi.assignToPerson(data);
      await cargarCarnets();
      form.reset();
      mostrarExito('Carnet asignado correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error asignando carnet');
    }
  });
}