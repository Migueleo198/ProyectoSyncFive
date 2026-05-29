import MeritosApi from '../api_f/MeritoApi.js';
import PersonaApi from '../api_f/PersonaApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { truncar, mostrarError, mostrarExito } from '../helpers/utils.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';

let meritos = [];
let sesionActual = null;
let personasDisponibles = [];

const pagination = new PaginationHelper(15);
const paginacionVerMerito = new PaginationHelper(8);
const paginacionEditMerito = new PaginationHelper(8);
let personasVerMerito = [];
let personasEditMerito = [];
let meritoEnEdicion = null;

pagination.setLoadingCallback((isLoading) => {
    if (isLoading) {
        showTableLoading('#tabla tbody', 4);
    }
});

document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('meritos');
  if (!sesionActual) return;

  cargarMeritos();
  bindModalVer();
  bindModalEliminar();
  cargarPersonasDisponibles();

  if (sesionActual.puedeEscribir) {
    bindCrearMerito();
    bindModalEditar();
    bindDesasignarPersonaMerito();
  }
});

// ================================
// CARGAR MÉRITOS
// ================================
async function cargarMeritos() {
  try {
    showTableLoading('#tabla tbody', 4);
    const r = await MeritosApi.getAll();
    meritos = r?.data || r || [];
    pagination.setData(meritos, () => {
      renderTablaMeritos(meritos);
    });
    pagination.render('pagination-merito');
    renderTablaMeritos(meritos);
  } catch (e) {
    meritos = [];
    pagination.setData([], () => {
      renderTablaMeritos([]);
    });
    pagination.render('pagination-merito');
    renderTablaMeritos([]);
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
      .map(p => `<option value="${p.id_bombero}">${p.n_funcionario} - ${p.nombre} ${p.apellidos ?? ''}</option>`)
      .join('');
}

// ================================
// RENDER TABLA
// ================================
function renderTablaMeritos(lista) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';
  if (!lista.length) { tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No hay méritos registrados</td></tr>'; return; }

  const puedeEscribir = sesionActual?.puedeEscribir ?? false;
  const itemsPagina = pagination.getPageItems(lista);

  itemsPagina.forEach(m => {
    const tr = document.createElement('tr');
    const botonesAccion = puedeEscribir
      ? `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${m.id_merito}"><i class="bi bi-eye"></i></button>
         <button class="btn p-0 btn-editar" data-id="${m.id_merito}"><i class="bi bi-pencil"></i></button>
         <button class="btn p-0 btn-eliminar" data-bs-toggle="modal" data-bs-target="#modalEliminar" data-id="${m.id_merito}"><i class="bi bi-trash3"></i></button>`
      : `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${m.id_merito}"><i class="bi bi-eye"></i></button>`;
    tr.innerHTML = `<td>${m.id_merito}</td><td>${m.nombre??''}</td><td class="d-none d-md-table-cell">${truncar(m.descripcion,80)}</td>
      <td class="celda-acciones">
        <div class="acciones-tabla">
          ${botonesAccion}
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
}

// ================================
// VALIDAR MÉRITO
//   nombre VARCHAR(100) NOT NULL · descripcion TEXT NOT NULL
// ================================
function validarMerito(nombre, descripcion) {
  if (!nombre || !nombre.trim()) {
    mostrarError('El nombre es obligatorio.');
    return false;
  }
  if (nombre.trim().length > 100) {
    mostrarError('El nombre no puede superar los 100 caracteres.');
    return false;
  }
  if (!descripcion || !descripcion.trim()) {
    mostrarError('La descripción es obligatoria.');
    return false;
  }
  return true;
}

// ================================
// CREAR MÉRITO
// ================================
function bindCrearMerito() {
  const form = document.getElementById('formMerito'); if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre      = document.getElementById('nombreMerito').value.trim();
    const descripcion = document.getElementById('descripcionMerito').value.trim();

    if (!validarMerito(nombre, descripcion)) return;

    try {
      await MeritosApi.create({ nombre, descripcion });
      await cargarMeritos();
      form.reset();
      mostrarExito('Mérito creado correctamente');
    } catch (err) { mostrarError(err.message || 'Error creando mérito'); }
  });
}

// ================================
// TABLA DE PERSONAS EN MODALES (paginada)
// ================================
function renderFilasVerMerito() {
  const tbody = document.querySelector('#tablaPersonasMerito tbody');
  if (!tbody) return;
  if (!personasVerMerito.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No hay personas asignadas</td></tr>';
    return;
  }
  tbody.innerHTML = paginacionVerMerito.getPageItems(personasVerMerito)
    .map(p => `<tr><td>${p.id_bombero}</td><td>${p.n_funcionario ?? ''}</td><td>${p.nombre ?? ''} ${p.apellidos ?? ''}</td></tr>`)
    .join('');
}

function renderFilasEditMerito() {
  const tbody = document.querySelector('#tablaPersonasEditMerito tbody');
  if (!tbody) return;
  if (!personasEditMerito.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay personas asignadas</td></tr>';
    return;
  }
  tbody.innerHTML = paginacionEditMerito.getPageItems(personasEditMerito)
    .map(p => `
      <tr>
        <td>${p.id_bombero}</td>
        <td>${p.n_funcionario ?? ''}</td>
        <td>${p.nombre ?? ''} ${p.apellidos ?? ''}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-eliminar-compacto btn-desasignar-persona" data-id-bombero="${p.id_bombero}" title="Desasignar"><i class="bi bi-person-dash"></i></button>
        </td>
      </tr>`)
    .join('');
}

async function refrescarPersonasEditMerito() {
  if (!meritoEnEdicion) return;
  const res = await MeritosApi.getPersonsByMerito(meritoEnEdicion);
  personasEditMerito = res?.data || res || [];
  paginacionEditMerito.setData(personasEditMerito, () => renderFilasEditMerito());
  paginacionEditMerito.render('pagination-edit-merito');
  renderFilasEditMerito();
}

// ================================
// MODAL VER (detalles + personas, solo lectura)
// ================================
function bindModalVer() {
  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('.btn-ver'); if (!btn) return;
    const id = btn.dataset.id;
    const merito = meritos.find(m => String(m.id_merito) === String(id)); if (!merito) return;

    const detalles = document.getElementById('detallesMerito');
    detalles.innerHTML = '';
    [{ label:'ID', valor:merito.id_merito },{ label:'Nombre', valor:merito.nombre },{ label:'Descripción', valor:merito.descripcion??'—' }].forEach(({label,valor}) => {
      const p = document.createElement('p'); p.innerHTML = `<strong>${label}:</strong> ${valor}`; detalles.appendChild(p);
    });

    const tbody = document.querySelector('#tablaPersonasMerito tbody');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center">Cargando...</td></tr>';
    try {
      const res = await MeritosApi.getPersonsByMerito(id);
      personasVerMerito = res?.data || res || [];
      paginacionVerMerito.setData(personasVerMerito, () => renderFilasVerMerito());
      paginacionVerMerito.render('pagination-ver-merito');
      renderFilasVerMerito();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="3" class="text-danger text-center">${err.message||'Error'}</td></tr>`;
    }
  });
}

// ================================
// MODAL EDITAR (gestión de personas del mérito)
// ================================
function bindModalEditar() {
  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('.btn-editar'); if (!btn) return;
    const id = btn.dataset.id;
    const merito = meritos.find(m => String(m.id_merito) === String(id)); if (!merito) return;

    meritoEnEdicion = id;

    const form = document.getElementById('formEditarMerito');
    form.innerHTML = `
      <p class="mb-3"><strong>Mérito:</strong> ${merito.nombre ?? ''}</p>
      <h6 class="fw-bold">Personas con este mérito</h6>
      <div class="row g-2 align-items-end mb-3">
        <div class="col-md-9">
          <label class="form-label" for="selPersonaMerito">Persona</label>
          <select class="form-select" id="selPersonaMerito">${crearOptionsPersonas()}</select>
        </div>
        <div class="col-md-3">
          <button type="button" class="btn btn-success w-100" id="btnAsignarPersonaMerito">Asignar</button>
        </div>
      </div>
      <table class="table table-bordered table-striped" id="tablaPersonasEditMerito">
        <thead class="table-dark"><tr><th>ID Bombero</th><th>Nº Funcionario</th><th>Nombre</th><th>Acción</th></tr></thead>
        <tbody></tbody>
      </table>
      <div id="pagination-edit-merito" class="mt-2"></div>
    `;

    await refrescarPersonasEditMerito();

    const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
    modal.show();

    document.getElementById('btnAsignarPersonaMerito').addEventListener('click', async () => {
      const id_bombero = document.getElementById('selPersonaMerito').value;
      if (!id_bombero) { mostrarError('Seleccione una persona.'); return; }
      try {
        await MeritosApi.assignToPerson({ id_bombero, id_merito: id });
        await refrescarPersonasEditMerito();
        mostrarExito('Mérito asignado correctamente');
      } catch (err) { mostrarError(err.message || 'Error asignando mérito'); }
    });
  });
}

// ================================
// DESASIGNAR PERSONA (desde el modal editar)
// ================================
function bindDesasignarPersonaMerito() {
  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('.btn-desasignar-persona'); if (!btn || !meritoEnEdicion) return;
    const id_bombero = btn.dataset.idBombero;
    if (!id_bombero) return;
    try {
      await MeritosApi.unassignFromPerson({ id_bombero, id_merito: meritoEnEdicion });
      await refrescarPersonasEditMerito();
      mostrarExito('Mérito desasignado');
    } catch (err) { mostrarError(err.message || 'Error desasignando'); }
  });
}

// ================================
// MODAL ELIMINAR
// ================================
function bindModalEliminar() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-eliminar'); if (!btn) return;
    document.getElementById('btnConfirmarEliminar').dataset.id = btn.dataset.id;
  });
  document.getElementById('btnConfirmarEliminar').addEventListener('click', async function () {
    const id = this.dataset.id; if (!id) return;
    try {
      await MeritosApi.remove(id); await cargarMeritos();
      bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
      mostrarExito('Mérito eliminado correctamente');
    } catch (err) { mostrarError(err.status===409 ? 'No se puede eliminar: el mérito está asignado a usuarios' : err.message || 'Error al eliminar'); }
  });
}
