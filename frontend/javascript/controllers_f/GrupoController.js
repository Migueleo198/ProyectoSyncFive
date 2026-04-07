import GrupoApi from '../api_f/GrupoApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { mostrarError, mostrarExito } from '../helpers/utils.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';

let grupos = [];
let sesionActual = null;
const pagination = new PaginationHelper(15);
pagination.setLoadingCallback((isLoading) => {
    if (isLoading) {
        showTableLoading('#tabla tbody', 4);
    }
});

document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('grupos');
  if (!sesionActual) return;

  cargarGrupos();
  bindFiltros();

  if (sesionActual.puedeEscribir) {
    bindCrearGrupo();
    bindModalEditar();
  }

  if (sesionActual.puedeEliminar) {
    bindModalEliminar();
  }

  bindModalVer();
});

// ================================
// CARGAR GRUPOS
// ================================
async function cargarGrupos() {
  try {
    showTableLoading('#tabla tbody', 4);
    const response = await GrupoApi.getAll();
    grupos = response?.data || response || [];
    pagination.setData(grupos, () => {
      renderTablaGrupos(grupos);
    });
    pagination.render('pagination-grupo');
    renderTablaGrupos(grupos);
  } catch (e) {
    grupos = [];
    pagination.setData([], () => {
      renderTablaGrupos([]);
    });
    pagination.render('pagination-grupo');
    renderTablaGrupos([]);
    mostrarError(e.message || 'Error cargando grupos');
  }
}

// ================================
// RENDER TABLA
// ================================
function renderTablaGrupos(lista) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';

  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No hay grupos registrados</td></tr>';
    return;
  }

  const itemsPagina = pagination.getPageItems(lista);

  const puedeEscribir = sesionActual?.puedeEscribir ?? false;
  const puedeEliminar = sesionActual?.puedeEliminar ?? false;

  itemsPagina.forEach(g => {
    const tr = document.createElement('tr');

    const botonesAccion = puedeEscribir
      ? `<button type="button" class="btn p-0 btn-ver"
              data-bs-toggle="modal" data-bs-target="#modalVer"
              data-id="${g.id_grupo}">
            <i class="bi bi-eye"></i>
          </button>
          <button type="button" class="btn p-0 btn-editar"
              data-bs-toggle="modal" data-bs-target="#modalEditar"
              data-id="${g.id_grupo}">
            <i class="bi bi-pencil"></i>
          </button>${puedeEliminar
            ? `
          <button type="button" class="btn p-0 btn-eliminar"
              data-bs-toggle="modal" data-bs-target="#modalEliminar"
              data-id="${g.id_grupo}">
            <i class="bi bi-trash3"></i>
          </button>`
            : ''}`
      : `<button type="button" class="btn p-0 btn-ver"
              data-bs-toggle="modal" data-bs-target="#modalVer"
              data-id="${g.id_grupo}">
            <i class="bi bi-eye"></i>
          </button>`;

    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${g.id_grupo}</td>
      <td>${g.nombre ?? ''}</td>
      <td>${g.descripcion ?? ''}</td>
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
}

function aplicarFiltros() {
  pagination.goToPage(0);
  const filtroNombre = document.getElementById('nombre')?.value.toLowerCase().trim() ?? '';

  const filtrados = grupos.filter(g => {
    const cumpleNombre = !filtroNombre || (g.nombre?.toLowerCase().includes(filtroNombre));
    return cumpleNombre;
  });
  pagination.setData(filtrados, () => {
    renderTablaGrupos(filtrados);
  });
  pagination.render('pagination-grupo');
  renderTablaGrupos(filtrados);
}

// ================================
// VALIDAR GRUPO
// Según DDL Grupo:
//   nombre      VARCHAR(100) NOT NULL
//   descripcion TEXT
// ================================
function validarGrupo(nombre, descripcion) {
  if (!nombre || !nombre.trim()) {
    mostrarError('El nombre del grupo es obligatorio.');
    return false;
  }
  if (nombre.trim().length > 100) {
    mostrarError('El nombre no puede superar los 100 caracteres.');
    return false;
  }

  return true;
}

// ================================
// CREAR GRUPO
// ================================
function bindCrearGrupo() {
  const form = document.getElementById('formInsertar');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);
    const nombre = f.get('nombre');
    const descripcion = f.get('descripcion') || '';

    // ── Validación ──
    if (!validarGrupo(nombre, descripcion)) return;

    try {
      await GrupoApi.create({ nombre: nombre.trim(), descripcion: descripcion.trim() });
      await cargarGrupos();
      form.reset();
      mostrarExito('Grupo creado correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error creando grupo');
    }
  });
}

// ================================
// MODAL EDITAR
// ================================
function bindModalEditar() {
  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('.btn-editar');
    if (!btn) return;

    const id = btn.dataset.id;
    const grupo = grupos.find(g => String(g.id_grupo) === String(id));
    if (!grupo) return;

    document.getElementById('editIdGrupo').value = grupo.id_grupo;
    document.getElementById('editNombre').value = grupo.nombre || '';
    document.getElementById('editDescripcion').value = grupo.descripcion || '';
  });

  const formEditar = document.getElementById('formEditar');
  if (!formEditar) return;

  formEditar.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(formEditar);
    const id = f.get('id_grupo');
    const nombre = f.get('nombre');
    const descripcion = f.get('descripcion') || '';

    // ── Validación ──
    if (!validarGrupo(nombre, descripcion)) return;

    try {
      await GrupoApi.update(id, { nombre: nombre.trim(), descripcion: descripcion.trim() });
      await cargarGrupos();
      bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
      mostrarExito('Grupo actualizado correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error actualizando grupo');
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
      await GrupoApi.delete(id);
      await cargarGrupos();
      bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
      mostrarExito('Grupo eliminado correctamente');
    } catch (error) {
      mostrarError('Error al eliminar grupo: ' + error.message);
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

    const id = btn.dataset.id;
    const grupo = grupos.find(g => String(g.id_grupo) === String(id));
    if (!grupo) return;

    const modalBody = document.getElementById('modalVerBody');

    const campos = [
      { label: 'ID', valor: grupo.id_grupo },
      { label: 'Nombre', valor: grupo.nombre },
      { label: 'Descripción', valor: grupo.descripcion || '—' },
    ];

    modalBody.innerHTML = '';
    campos.forEach(({ label, valor }) => {
      const p = document.createElement('p');
      p.innerHTML = `<strong>${label}:</strong> ${valor ?? ''}`;
      modalBody.appendChild(p);
    });
  });
}
