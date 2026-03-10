import CategoriaApi from '../api_f/CategoriaApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { mostrarError, mostrarExito } from '../helpers/utils.js';

let categorias = [];
let sesionActual = null;

document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('categorias');
  if (!sesionActual) return;

  cargarCategorias();

  if (sesionActual.puedeEscribir) {
    bindCrearCategoria();
    bindModalEliminar();
  }
});

// ================================
// CARGAR CATEGORIAS
// ================================
async function cargarCategorias() {
  try {
    const response = await CategoriaApi.getAll();
    categorias = response.data;
    renderTablaCategorias(categorias);
  } catch (e) {
    mostrarError(e.message || 'Error cargando categorías');
  }
}

// ================================
// RENDER TABLA
// ================================
function renderTablaCategorias(lista) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';

  const puedeEscribir = sesionActual?.puedeEscribir ?? false;

  lista.forEach(c => {
    const tr = document.createElement('tr');

    const botonesAccion = puedeEscribir
      ? `<button type="button" class="btn p-0 btn-eliminar"
              data-bs-toggle="modal" data-bs-target="#modalEliminar"
              data-id="${c.id_categoria}">
           <i class="bi bi-trash3"></i>
         </button>`
      : '';

    tr.innerHTML = `
      <td>${c.id_categoria}</td>
      <td>${c.nombre}</td>
      <td>${Number(c.inventariable) === 1 ? 'Sí' : 'No'}</td>
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
// CREAR CATEGORIA
// ================================
function bindCrearCategoria() {
  const form = document.getElementById('formInsertar');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const data = {
      nombre:        f.get('nombre'),
      inventariable: parseInt(f.get('inventariable'))
    };

    try {
      await CategoriaApi.create(data);
      await cargarCategorias();
      form.reset();
      mostrarExito('Categoría creada correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error creando categoría');
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
      await CategoriaApi.delete(id);
      await cargarCategorias();
      bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
      mostrarExito('Categoría eliminada correctamente');
    } catch (error) {
      mostrarError('Error al eliminar categoría: ' + error.message);
    }
  });
}