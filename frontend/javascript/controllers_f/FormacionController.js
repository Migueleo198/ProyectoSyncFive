import FormacionApi from '../api_f/FormacionApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { mostrarError, mostrarExito } from '../helpers/utils.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';

let formaciones = [];
let sesionActual = null;
const pagination = new PaginationHelper(15);
pagination.setLoadingCallback((isLoading) => {
    if (isLoading) {
        showTableLoading('#tabla tbody', 4);
    }
});

document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('formaciones');
  if (!sesionActual) return;

  cargarFormaciones();

  if (sesionActual.puedeEscribir) {
    bindCrearFormacion();
    bindModalEliminar();
  }

  bindModalVer();
  bindModalEditar();
});

// ================================
// CARGAR FORMACIONES
// ================================
async function cargarFormaciones() {
  try {
    showTableLoading('#tabla tbody', 4);
    const response = await FormacionApi.getAll();
    formaciones = response?.data || response || [];
    pagination.setData(formaciones, () => {
      renderTablaFormaciones(formaciones);
    });
    pagination.render('pagination-formacion');
    renderTablaFormaciones(formaciones);
    bindFiltros();
  } catch (e) {
    formaciones = [];
    pagination.setData([], () => {
      renderTablaFormaciones([]);
    });
    pagination.render('pagination-formacion');
    renderTablaFormaciones([]);
  }
}

// ================================
// RENDER TABLA
// ================================
function renderTablaFormaciones(lista) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';

  const puedeEscribir = sesionActual?.puedeEscribir ?? false;
  const itemsPagina = pagination.getPageItems(lista);

  itemsPagina.forEach(f => {
    const tr = document.createElement('tr');

    const botonesAccion = puedeEscribir
      ? `<button type="button" class="btn p-0 btn-ver"
              data-bs-toggle="modal" data-bs-target="#modalVer"
              data-id="${f.id_formacion}"><i class="bi bi-eye"></i></button>
         <button type="button" class="btn p-0 btn-editar"
              data-bs-toggle="modal" data-bs-target="#modalEditar"
              data-id="${f.id_formacion}"><i class="bi bi-pencil"></i></button>
         <button type="button" class="btn p-0 btn-eliminar"
              data-bs-toggle="modal" data-bs-target="#modalEliminar"
              data-id="${f.id_formacion}"><i class="bi bi-trash3"></i></button>`
      : `<button type="button" class="btn p-0 btn-ver"
              data-bs-toggle="modal" data-bs-target="#modalVer"
              data-id="${f.id_formacion}"><i class="bi bi-eye"></i></button>`;

    tr.innerHTML = `
      <td>${f.id_formacion}</td>
      <td>${f.nombre}</td>
      <td>${f.descripcion}</td>
      <td>
        <div  class="d-flex justify-content-around">
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
  document.getElementById('filtroNombre')?.addEventListener('input', aplicarFiltros);
}

function aplicarFiltros() {
  pagination.goToPage(0);
  const filtroNombre = document.getElementById('filtroNombre')?.value.toLowerCase().trim() ?? '';
  const filtrados = formaciones.filter(f =>
    !filtroNombre || f.nombre?.toLowerCase().includes(filtroNombre)
  );
  pagination.setData(filtrados, () => {
      renderTablaFormaciones(filtrados);
    });
  pagination.render('pagination-formacion');
  renderTablaFormaciones(filtrados);
}
  
// ================================
// VALIDAR FORMACIÓN
// Según DDL Formacion:
//   nombre      VARCHAR(100) NOT NULL
//   descripcion TEXT         NOT NULL
// ================================
function validarFormacion(nombre, descripcion) {
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
// CREAR FORMACION
// ================================
function bindCrearFormacion() {
  const form = document.getElementById('formInsertar');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const nombre      = f.get('nombre');
    const descripcion = f.get('descripcion');

    // ── Validación ──
    if (!validarFormacion(nombre, descripcion)) return;

    try {
      await FormacionApi.create({ nombre: nombre.trim(), descripcion: descripcion.trim() });
      await cargarFormaciones();
      form.reset();
      mostrarExito('Formación creada correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error creando formación');
    }
  });
}

// ================================
// CAMPOS BD
// ================================
const nombresCampos = ['Nombre', 'Descripcion'];
const camposBd      = ['nombre', 'descripcion'];

// ================================
// MODAL VER
// ================================
function bindModalVer() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-ver');
    if (!btn) return;

    const formacion = formaciones.find(f => f.id_formacion == btn.dataset.id);
    if (!formacion) return;

    const modalBody = document.getElementById('modalVerBody');
    modalBody.innerHTML = '';

    nombresCampos.forEach((nombre, index) => {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = nombre + ': ';
      p.appendChild(strong);
      p.appendChild(document.createTextNode(formacion[camposBd[index]] ?? ''));
      modalBody.appendChild(p);
    });
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

    try {
      const response  = await FormacionApi.getById(id);
      const formacion = response?.data || response;
      if (!formacion) return;

      const form = document.getElementById('formEditar');
      form.innerHTML = `
        <div class="row mb-3 d-flex">
          <div class="col-12 justify-content-center">
            <label class="form-label">Nombre</label>
            <input type="text" class="form-control" name="nombre" maxlength="100" value="${formacion.nombre}" required>
          </div>
        </div>
        <div class="mb-4">
          <label class="form-label">Descripción</label>
          <textarea class="form-control" name="descripcion" rows="4">${formacion.descripcion}</textarea>
        </div>
        <div class="d-flex justify-content-center gap-2">
          <button type="button" id="btnGuardarCambios" class="btn btn-primary">Guardar cambios</button>
        </div>
      `;

      document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
        const nombre      = form.querySelector('[name="nombre"]').value;
        const descripcion = form.querySelector('[name="descripcion"]').value;

        // ── Validación ──
        if (!validarFormacion(nombre, descripcion)) return;

        try {
          await FormacionApi.update(id, { nombre: nombre.trim(), descripcion: descripcion.trim() });
          await cargarFormaciones();
          bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
          mostrarExito('Formación actualizada correctamente');
        } catch (err) {
          mostrarError(err.message || 'Error al guardar cambios');
        }
      });

    } catch (error) {
      mostrarError('Error al editar formación: ' + error.message);
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
      await FormacionApi.delete(id);
      await cargarFormaciones();
      bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
      mostrarExito('Formación eliminada correctamente');
    } catch (error) {
      mostrarError('Error al eliminar formación: ' + error.message);
    }
  });
}