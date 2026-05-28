import EdicionApi from '../api_f/EdicionApi.js';
import FormacionApi from '../api_f/FormacionApi.js';
import PersonaApi from '../api_f/PersonaApi.js';

import { authGuard } from '../helpers/authGuard.js';
import { formatearFecha, mostrarExito, mostrarError } from '../helpers/utils.js';
import { validarNumero, validarRangoFechas } from '../helpers/validacion.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';

let ediciones = [];
let sesionActual = null;
let personasDisponibles = [];

const pagination = new PaginationHelper(15);
const paginacionVerPersonas = new PaginationHelper(8);
const paginacionEditPersonas = new PaginationHelper(8);

let personasVer = [];
let personasEdit = [];
let edicionEnEdicion = null; // { id_formacion, id_edicion }

pagination.setLoadingCallback((isLoading) => {
  if (isLoading) {
    showTableLoading('#tabla tbody', 6);
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('ediciones');
  if (!sesionActual) return;
  cargarEdiciones();
  cargarFormaciones(0, 'nombreFormacion');
  cargarPersonasDisponibles();

  bindModalVer();

  if (sesionActual.puedeEscribir) {
    bindCrearEdicion();
    bindModalEditar();
    bindModalEliminarEdicion();
    bindDesasignarPersonaEdicion();
  }
});

// ================================
// CARGAR EDICIONES
// ================================
async function cargarEdiciones() {
  try {
    showTableLoading('#tabla tbody', 6);
    const response = await EdicionApi.getAll();
    ediciones = response?.data || response || [];
    pagination.setData(ediciones, () => {
      renderTablaEdiciones(ediciones);
    });
    pagination.render('pagination-edicion');
    renderTablaEdiciones(ediciones);
    bindFiltros();
  } catch (e) {
    ediciones = [];
    pagination.setData([], () => {
      renderTablaEdiciones([]);
    });
    pagination.render('pagination-edicion');
    renderTablaEdiciones([]);
  }
}

// ================================
// RENDER TABLA EDICIONES
// ================================
function renderTablaEdiciones(lista) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';

  const puedeEscribir = sesionActual?.puedeEscribir ?? false;
  const itemsPagina = pagination.getPageItems(lista);

  itemsPagina.forEach(e => {
    const tr = document.createElement('tr');

    const botonesAccion = puedeEscribir
      ? `<button type="button" class="btn p-0 btn-ver"
              data-id_edicion="${e.id_edicion}" data-id_formacion="${e.id_formacion}">
           <i class="bi bi-eye"></i>
         </button>
         <button type="button" class="btn p-0 btn-editar"
              data-id_edicion="${e.id_edicion}" data-id_formacion="${e.id_formacion}">
           <i class="bi bi-pencil"></i>
         </button>
         <button type="button" class="btn p-0 btn-eliminar"
              data-bs-toggle="modal" data-bs-target="#modalEliminar"
              data-id_edicion="${e.id_edicion}" data-id_formacion="${e.id_formacion}">
           <i class="bi bi-trash3"></i>
         </button>`
      : `<button type="button" class="btn p-0 btn-ver"
              data-id_edicion="${e.id_edicion}" data-id_formacion="${e.id_formacion}">
           <i class="bi bi-eye"></i>
         </button>`;

    tr.innerHTML = `
      <td>${e.nombre_formacion}</td>
      <td>${formatearFecha(e.f_inicio)}</td>
      <td>${formatearFecha(e.f_fin)}</td>
      <td>${e.horas}</td>
      <td class="celda-acciones">
        <div class="acciones-tabla">
          ${botonesAccion}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ================================
// FILTROS
// ================================
function bindFiltros() {
  document.getElementById('nombre')?.addEventListener('input', aplicarFiltros);
  document.getElementById('filtroDesde')?.addEventListener('change', aplicarFiltros);
  document.getElementById('filtroHasta')?.addEventListener('change', aplicarFiltros);
}

function aplicarFiltros() {
  pagination.goToPage(0);
  const filtroNombre = document.getElementById('nombre')?.value.toLowerCase().trim() ?? '';
  const filtroDesde = document.getElementById('filtroDesde')?.value ?? '';
  const filtroHasta = document.getElementById('filtroHasta')?.value ?? '';

  const filtrados = ediciones.filter(e => {
    const cumpleNombre = !filtroNombre || e.nombre_formacion?.toLowerCase().includes(filtroNombre);
    const fInicio = e.f_inicio?.slice(0, 10) ?? '';
    const fFin = e.f_fin?.slice(0, 10) ?? '';
    const cumpleDesde = !filtroDesde || fInicio >= filtroDesde;
    const cumpleHasta = !filtroHasta || fFin <= filtroHasta;
    return cumpleNombre && cumpleDesde && cumpleHasta;
  });
  pagination.setData(filtrados, () => {
    renderTablaEdiciones(filtrados);
  });
  pagination.render('pagination-edicion');
  renderTablaEdiciones(filtrados);
}

// ================================
// CARGAR FORMACIONES
// ================================
async function cargarFormaciones(formacionSeleccionada, id_select) {
  const select = document.getElementById(id_select);
  if (!select) return;

  try {
    const response = await FormacionApi.getAll();
    const formaciones = response?.data || response || [];

    select.innerHTML = '<option value="">Seleccione...</option>';
    formaciones.forEach(formacion => {
      const option = document.createElement('option');
      option.value = formacion.id_formacion;
      option.textContent = formacion.nombre;
      if (formacionSeleccionada !== 0 && Number(formacion.id_formacion) === Number(formacionSeleccionada)) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  } catch (e) {
    mostrarError(e.message || 'Error cargando formaciones');
  }
}

// ================================
// CARGAR PERSONAS DISPONIBLES (para el selector de asignar)
// ================================
async function cargarPersonasDisponibles() {
  try {
    const res = await PersonaApi.getAll();
    personasDisponibles = res?.data || res || [];
  } catch (e) {
    personasDisponibles = [];
  }
}

function crearOptionsPersonas() {
  return '<option value="">Seleccione persona...</option>' +
    personasDisponibles
      .map(p => `<option value="${p.id_bombero}">${p.id_bombero} - ${p.nombre} ${p.apellidos ?? ''}</option>`)
      .join('');
}

// ================================
// VALIDAR EDICIÓN
//   f_inicio DATE NOT NULL · f_fin DATE NOT NULL CHECK (f_fin >= f_inicio)
//   horas INT NOT NULL CHECK (horas > 0) · id_formacion FK NOT NULL
// ================================
function validarEdicion(id_formacion, f_inicio, f_fin, horas) {
  if (!id_formacion) {
    mostrarError('Debe seleccionar una formación.');
    return false;
  }
  if (!f_inicio) {
    mostrarError('La fecha de inicio es obligatoria.');
    return false;
  }
  if (!f_fin) {
    mostrarError('La fecha de fin es obligatoria.');
    return false;
  }
  if (!validarRangoFechas(f_inicio, f_fin)) {
    mostrarError('La fecha de fin debe ser igual o posterior a la fecha de inicio.');
    return false;
  }
  if (!validarNumero(horas)) {
    mostrarError('Las horas deben ser un número entero positivo.');
    return false;
  }
  return true;
}

// ================================
// CREAR EDICION
// ================================
function bindCrearEdicion() {
  const form = document.getElementById('formInsertar');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const id_formacion = f.get('id_formacion');
    const f_inicio = f.get('f_inicio');
    const f_fin = f.get('f_fin');
    const horas = f.get('horas');

    if (!validarEdicion(id_formacion, f_inicio, f_fin, horas)) return;

    try {
      await EdicionApi.create(id_formacion, { id_formacion, f_inicio, f_fin, horas: Number(horas) });
      await cargarEdiciones();
      form.reset();
      mostrarExito('Edición creada correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error creando edición');
    }
  });
}

// ================================
// CAMPOS BD (modal ver)
// ================================
const nombresCampos = ['ID-Formacion', 'Fecha inicio', 'Fecha fin', 'Horas'];
const camposBd = ['id_formacion', 'f_inicio', 'f_fin', 'horas'];

// ================================
// TABLA DE PERSONAS EN MODALES (paginada)
// ================================
function renderTablaPersonasVer() {
  const tbody = document.querySelector('#tablaPersonasVer');
  if (!tbody) return;
  if (!personasVer.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-3">Sin bomberos apuntados a esta edición</td></tr>';
    return;
  }
  const items = paginacionVerPersonas.getPageItems(personasVer);
  tbody.innerHTML = items
    .map(p => `<tr><td>${p.id_bombero}</td><td>${p.nombre ?? ''}</td><td>${p.apellidos ?? ''}</td></tr>`)
    .join('');
}

function renderTablaPersonasEdit() {
  const tbody = document.querySelector('#tablaPersonasEdit');
  if (!tbody) return;
  if (!personasEdit.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">Sin bomberos apuntados a esta edición</td></tr>';
    return;
  }
  const items = paginacionEditPersonas.getPageItems(personasEdit);
  tbody.innerHTML = items
    .map(p => `
      <tr>
        <td>${p.id_bombero}</td>
        <td>${p.nombre ?? ''}</td>
        <td>${p.apellidos ?? ''}</td>
        <td class="text-center">
          <button type="button" class="btn btn-sm btn-outline-danger btn-desasignar-persona-edicion" data-id_bombero="${p.id_bombero}" title="Desapuntar bombero">
            <i class="bi bi-trash3"></i>
          </button>
        </td>
      </tr>`)
    .join('');
}

async function refrescarPersonasEdit() {
  if (!edicionEnEdicion) return;
  const res = await EdicionApi.getPersonas(edicionEnEdicion.id_formacion, edicionEnEdicion.id_edicion);
  personasEdit = res?.data || res || [];
  paginacionEditPersonas.setData(personasEdit, () => renderTablaPersonasEdit());
  paginacionEditPersonas.render('pagination-edit-personas');
  renderTablaPersonasEdit();
}

// ================================
// MODAL VER
// ================================
function bindModalVer() {
  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('.btn-ver');
    if (!btn) return;

    const id_formacion = btn.dataset.id_formacion;
    const id_edicion = btn.dataset.id_edicion;

    try {
      const response = await EdicionApi.getById(id_formacion, id_edicion);
      const edicionData = response?.data || response || [];
      const edicion = edicionData[0];
      if (!edicion) return;

      const modalBody = document.getElementById('modalVerBody');
      let html = '';
      nombresCampos.forEach((nombre, index) => {
        const campo = camposBd[index];
        let valor = edicion[campo] ?? '';
        if (campo === 'f_inicio' || campo === 'f_fin') valor = formatearFecha(valor);
        html += `<p><strong>${nombre}: </strong>${valor}</p>`;
      });
      html += `
        <hr class="my-3">
        <h6 class="fw-bold">Bomberos apuntados a esta edición</h6>
        <table class="table table-bordered table-striped">
          <thead class="table-dark"><tr><th>ID Bombero</th><th>Nombre</th><th>Apellidos</th></tr></thead>
          <tbody id="tablaPersonasVer"></tbody>
        </table>
        <div id="pagination-ver-personas" class="mt-2"></div>`;
      modalBody.innerHTML = html;

      const resP = await EdicionApi.getPersonas(id_formacion, id_edicion);
      personasVer = resP?.data || resP || [];
      paginacionVerPersonas.setData(personasVer, () => renderTablaPersonasVer());
      paginacionVerPersonas.render('pagination-ver-personas');
      renderTablaPersonasVer();

      new bootstrap.Modal(document.getElementById('modalVer')).show();
    } catch (error) {
      mostrarError(error.message || 'Error al cargar la edición');
    }
  });
}

// ================================
// MODAL EDITAR (datos + apuntar/desapuntar bomberos)
// ================================
function bindModalEditar() {
  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('.btn-editar');
    if (!btn) return;

    const id_edicion = btn.dataset.id_edicion;
    const id_formacion = btn.dataset.id_formacion;

    try {
      const response = await EdicionApi.getById(id_formacion, id_edicion);
      const edicionData = response?.data || response || [];
      const edicion = edicionData[0];
      if (!edicion) return;

      edicionEnEdicion = { id_formacion, id_edicion };

      const form = document.getElementById('formEditar');
      form.innerHTML = `
        <div class="row mb-3">
          <div class="col-mg-6 col-lg-4">
            <label class="form-label">Nombre</label>
            <select class="form-select" id="nombreFormacionEdit" name="id_formacion"></select>
          </div>
          <div class="col-mg-6 col-lg-4">
            <label class="form-label">Fecha Inicio</label>
            <input type="date" class="form-control" name="f_inicio" value="${edicion.f_inicio ?? ''}" required>
          </div>
          <div class="col-mg-6 col-lg-4">
            <label class="form-label">Fecha Fin</label>
            <input type="date" class="form-control" name="f_fin" value="${edicion.f_fin ?? ''}" required>
          </div>
          <div class="col-mg-6 col-lg-4">
            <label class="form-label">Horas</label>
            <input type="number" min="1" step="1" class="form-control" name="horas" value="${edicion.horas ?? ''}">
          </div>
        </div>
        <div class="row text-center mb-2">
          <button type="button" id="btnGuardarCambios" class="btn btn-primary">Guardar cambios</button>
        </div>

        <hr class="my-3">
        <h6 class="fw-bold">Bomberos apuntados a esta edición</h6>
        <div class="row g-2 align-items-end mb-3">
          <div class="col-md-9">
            <label class="form-label" for="selPersonaEdicion">Persona</label>
            <select class="form-select" id="selPersonaEdicion">${crearOptionsPersonas()}</select>
          </div>
          <div class="col-md-3">
            <button type="button" class="btn btn-success w-100" id="btnApuntarPersonaEdicion">Apuntar</button>
          </div>
        </div>
        <table class="table table-bordered table-striped">
          <thead class="table-dark"><tr><th>ID Bombero</th><th>Nombre</th><th>Apellidos</th><th>Acción</th></tr></thead>
          <tbody id="tablaPersonasEdit"></tbody>
        </table>
        <div id="pagination-edit-personas" class="mt-2"></div>
      `;

      await cargarFormaciones(edicion.id_formacion, 'nombreFormacionEdit');
      await refrescarPersonasEdit();

      const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
      modal.show();

      document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
        const new_id_formacion = form.querySelector('[name="id_formacion"]').value;
        const f_inicio = form.querySelector('[name="f_inicio"]').value;
        const f_fin = form.querySelector('[name="f_fin"]').value;
        const horas = form.querySelector('[name="horas"]').value;

        if (!validarEdicion(new_id_formacion, f_inicio, f_fin, horas)) return;

        try {
          await EdicionApi.update(id_formacion, id_edicion, {
            id_formacion: new_id_formacion,
            f_inicio,
            f_fin,
            horas: Number(horas)
          });
          await cargarEdiciones();
          modal.hide();
          mostrarExito('Edición actualizada correctamente');
        } catch (err) {
          mostrarError(err.message || 'Error al guardar cambios');
        }
      });

      document.getElementById('btnApuntarPersonaEdicion').addEventListener('click', async () => {
        const id_bombero = document.getElementById('selPersonaEdicion').value;
        if (!id_bombero) { mostrarError('Selecciona un bombero.'); return; }
        try {
          await EdicionApi.setPersonas(id_formacion, id_edicion, { id_bombero });
          await refrescarPersonasEdit();
          mostrarExito('Bombero apuntado correctamente');
        } catch (err) {
          mostrarError(err.message || 'Error apuntando bombero');
        }
      });

    } catch (error) {
      mostrarError(error.message || 'Error al cargar edición para editar');
    }
  });
}

// ================================
// DESAPUNTAR PERSONA (desde el modal editar)
// ================================
function bindDesasignarPersonaEdicion() {
  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('.btn-desasignar-persona-edicion');
    if (!btn || !edicionEnEdicion) return;

    const id_bombero = btn.dataset.id_bombero;
    if (!id_bombero) return;

    try {
      await EdicionApi.deletePersona(edicionEnEdicion.id_formacion, edicionEnEdicion.id_edicion, id_bombero);
      await refrescarPersonasEdit();
      mostrarExito('Bombero desapuntado de la edición');
    } catch (error) {
      mostrarError('Error al desapuntar bombero: ' + error.message);
    }
  });
}

// ================================
// MODAL ELIMINAR EDICION
// ================================
function bindModalEliminarEdicion() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-eliminar');
    if (!btn) return;

    const btnConfirm = document.getElementById('btnConfirmarEliminar');
    btnConfirm.dataset.id_edicion = btn.dataset.id_edicion;
    btnConfirm.dataset.id_formacion = btn.dataset.id_formacion;
  });

  document.getElementById('btnConfirmarEliminar').addEventListener('click', async function () {
    const id_edicion = this.dataset.id_edicion;
    const id_formacion = this.dataset.id_formacion;
    if (!id_edicion || !id_formacion) return;

    try {
      await EdicionApi.delete(id_formacion, id_edicion);
      await cargarEdiciones();
      bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
      mostrarExito('Edición eliminada correctamente');
    } catch (error) {
      mostrarError('Error al eliminar edición: ' + error.message);
    }
  });
}
