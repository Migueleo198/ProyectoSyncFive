import FormacionApi from '../api_f/FormacionApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { mostrarError, mostrarExito } from '../helpers/utils.js';

let formaciones = [];
let sesionActual = null;

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
    const response = await FormacionApi.getAll();
    formaciones = response.data;
    renderTablaFormaciones(formaciones);
  } catch (e) {
    mostrarError(e.message || 'Error cargando formaciones');
  }
}

// ================================
// RENDER TABLA
// ================================
function renderTablaFormaciones(lista) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';

  const puedeEscribir = sesionActual?.puedeEscribir ?? false;

  lista.forEach(f => {
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
      <td class="d-flex justify-content-around">${botonesAccion}</td>
    `;
    tbody.appendChild(tr);
  });
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
    const data = {
      nombre:      f.get('nombre'),
      descripcion: f.get('descripcion')
    };

    try {
      await FormacionApi.create(data);
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
      const formacion = response.data;
      if (!formacion) return;

      const form = document.getElementById('formEditar');
      form.innerHTML = `
        <div class="row mb-3 d-flex">
          <div class="col-12 justify-content-center">
            <label class="form-label">Nombre</label>
            <input type="text" class="form-control" name="nombre" value="${formacion.nombre}" required>
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
        const data = {};
        camposBd.forEach(campo => {
          const input = form.querySelector(`[name="${campo}"]`);
          if (input) data[campo] = input.value;
        });

        try {
          await FormacionApi.update(id, data);
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