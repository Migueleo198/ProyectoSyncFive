import CarnetApiApi from '../api_f/CarnetApi.js';
import PersonaApiApi from '../api_f/PersonaApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { mostrarError, mostrarExito } from '../helpers/utils.js';
import { validarNumero, validarRangoFechas } from '../helpers/validacion.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';

let carnets = [];
let sesionActual = null;
const pagination = new PaginationHelper(15);
pagination.setLoadingCallback((isLoading) => {
    if (isLoading) {
        showTableLoading('#tabla tbody', 5);
    }
});

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
    showTableLoading('#tabla tbody', 5);
    const response = await CarnetApiApi.getAll();
    carnets = response?.data || response || [];
    pagination.setData(carnets, () => {
      renderTablaCarnets(carnets);
    });
    pagination.render('pagination-carnet');
    renderTablaCarnets(carnets);
    poblarFiltroCategoria(carnets);
    bindFiltros();
  } catch (e) {
    carnets = [];
    pagination.setData([], () => {
      renderTablaCarnets([]);
    });
    pagination.render('pagination-carnet');
    renderTablaCarnets([]);
  }
}

function poblarFiltroCategoria(lista) {
  const select = document.getElementById('filtroCategoria');
  if (!select) return;
  const valorActual = select.value;
  select.innerHTML = '<option value="">Todas</option>';
  const categoriasUnicas = [...new Set(lista.map(c => c.categoria).filter(Boolean))].sort();
  categoriasUnicas.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
  select.value = valorActual;
}

function bindFiltros() {
  document.getElementById('filtroNombre')?.addEventListener('input', aplicarFiltros);
  document.getElementById('filtroCategoria')?.addEventListener('change', aplicarFiltros);
}

function aplicarFiltros() {
  pagination.goToPage(0);
  const filtroNombre    = document.getElementById('filtroNombre')?.value.toLowerCase().trim() ?? '';
  const filtroCategoria = document.getElementById('filtroCategoria')?.value ?? '';

  const filtrados = carnets.filter(c => {
    const cumpleNombre    = !filtroNombre    || c.nombre?.toLowerCase().includes(filtroNombre);
    const cumpleCategoria = !filtroCategoria || c.categoria === filtroCategoria;
    return cumpleNombre && cumpleCategoria;
  });
  pagination.setData(filtrados, () => {
      renderTablaCarnets(filtrados);
    });
  pagination.render('pagination-carnet');
  renderTablaCarnets(filtrados);
}

// ================================
// CARGAR TIPOS DE CARNET
// ================================
async function cargarTiposCarnet(tipoSeleccionado, id_select) {
  const select = document.getElementById(id_select);
  if (!select) return;

  try {
    const response = await CarnetApiApi.getAll();
    const tipos = response?.data || response || [];

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
  const itemsPagina = pagination.getPageItems(lista);

  itemsPagina.forEach(c => {
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
// VALIDAR CARNET (tipo)
// Según DDL Carnet:
//   nombre          VARCHAR(50) NOT NULL
//   categoria       VARCHAR(20) NOT NULL
//   duracion_meses  INT NOT NULL  CHECK (duracion_meses > 0)
// ================================
function validarCarnet(nombre, categoria, duracion_meses) {
  if (!nombre || !nombre.trim()) {
    mostrarError('El nombre del carnet es obligatorio.');
    return false;
  }
  if (nombre.trim().length > 50) {
    mostrarError('El nombre del carnet no puede superar los 50 caracteres.');
    return false;
  }

  if (!categoria || !categoria.trim()) {
    mostrarError('La categoría es obligatoria.');
    return false;
  }
  if (categoria.trim().length > 20) {
    mostrarError('La categoría no puede superar los 20 caracteres.');
    return false;
  }

  // CHECK (duracion_meses > 0)
  if (!validarNumero(duracion_meses)) {
    mostrarError('La duración en meses debe ser un número entero positivo.');
    return false;
  }

  return true;
}

// ================================
// VALIDAR ASIGNACIÓN DE CARNET A PERSONA
// Según DDL Carnet_Persona:
//   f_obtencion   DATE NOT NULL
//   f_vencimiento DATE NOT NULL  CHECK (f_vencimiento > f_obtencion)
// ================================
function validarAsignacionCarnet(id_bombero, id_carnet, f_obtencion, f_vencimiento) {
  if (!id_bombero) {
    mostrarError('Debe seleccionar un bombero.');
    return false;
  }

  if (!id_carnet) {
    mostrarError('Debe seleccionar un carnet.');
    return false;
  }

  if (!f_obtencion) {
    mostrarError('La fecha de obtención es obligatoria.');
    return false;
  }

  if (!f_vencimiento) {
    mostrarError('La fecha de vencimiento es obligatoria.');
    return false;
  }

  // CHECK (f_vencimiento > f_obtencion)
  if (!validarRangoFechas(f_obtencion, f_vencimiento)) {
    mostrarError('La fecha de vencimiento debe ser posterior a la fecha de obtención.');
    return false;
  }

  return true;
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
    const nombre         = f.get('nombre');
    const categoria      = f.get('categoria');
    const duracion_meses = f.get('duracion_meses');

    // ── Validación ──
    if (!validarCarnet(nombre, categoria, duracion_meses)) return;

    try {
      await CarnetApiApi.create({
        nombre:         nombre.trim(),
        categoria:      categoria.trim(),
        duracion_meses: Number(duracion_meses)
      });
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
      mostrarExito('Carnet eliminado correctamente');
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
      const carnet = response?.data || response;
      if (!carnet) return;

      const form = document.getElementById('formEditar');
      form.innerHTML = `
        <div class="row mb-3">
          <div class="col-lg-4">
            <label class="form-label">Nombre</label>
            <input type="text" class="form-control" name="nombre" maxlength="50" value="${carnet.nombre || ''}">
          </div>
          <div class="col-lg-4">
            <label class="form-label">Categoría</label>
            <input type="text" class="form-control" name="categoria" maxlength="20" value="${carnet.categoria || ''}">
          </div>
          <div class="col-lg-4">
            <label class="form-label">Duración (meses)</label>
            <input type="number" min="1" step="1" class="form-control" name="duracion_meses" value="${carnet.duracion_meses || ''}">
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

        // ── Validación ──
        if (!validarCarnet(data.nombre, data.categoria, data.duracion_meses)) return;

        await CarnetApiApi.update(id, {
          nombre:         data.nombre.trim(),
          categoria:      data.categoria.trim(),
          duracion_meses: Number(data.duracion_meses)
        });
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
    const lista = response?.data || response || [];
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
    const bomberos = response?.data || response || [];
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
    const id_bombero    = f.get('id_bombero');
    const id_carnet     = f.get('seleccionarCarnet');
    const f_obtencion   = f.get('f_obtencion');
    const f_vencimiento = f.get('f_vencimiento');

    // ── Validación ──
    if (!validarAsignacionCarnet(id_bombero, id_carnet, f_obtencion, f_vencimiento)) return;

    try {
      await CarnetApiApi.assignToPerson({
        id_bombero,
        ID_Carnet:  id_carnet,
        f_obtencion,
        f_vencimiento
      });
      await cargarCarnets();
      form.reset();
      mostrarExito('Carnet asignado correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error asignando carnet');
    }
  });
}a