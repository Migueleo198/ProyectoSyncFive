import CategoriaApi from '../api_f/CategoriaApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { mostrarError, mostrarExito } from '../helpers/utils.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';

let categorias = [];
let sesionActual = null;
const pagination = new PaginationHelper(15);
pagination.setLoadingCallback((isLoading) => {
    if (isLoading) {
        showTableLoading('#tabla tbody', 4);
    }
});

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
    showTableLoading('#tabla tbody', 4);
    const response = await CategoriaApi.getAll();
    categorias = response?.data || response || [];
    pagination.setData(categorias, () => {
      renderTablaCategorias(categorias);
    });
    pagination.render('pagination-categoria');
    renderTablaCategorias(categorias);
  } catch (e) {
    categorias = [];
    pagination.setData([], () => {
      renderTablaCategorias([]);
    });
    pagination.render('pagination-categoria');
    renderTablaCategorias([]);
    mostrarError(e.message || 'Error cargando categorías');
  }
}

// ================================
// RENDER TABLA
// ================================
function renderTablaCategorias(lista) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';

  const itemsPagina = pagination.getPageItems(lista);

  const puedeEscribir = sesionActual?.puedeEscribir ?? false;

  itemsPagina.forEach(c => {
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
        <div class="d-flex justify-content-around">
          ${botonesAccion}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ================================
// VALIDAR CATEGORÍA
// Según DDL Categoria:
//   nombre        VARCHAR(100) NOT NULL
//   inventariable BOOLEAN      NOT NULL  (se envía como 0 o 1)
// ================================
function validarCategoria(nombre, inventariable) {
  if (!nombre || !nombre.trim()) {
    mostrarError('El nombre de la categoría es obligatorio.');
    return false;
  }
  if (nombre.trim().length > 100) {
    mostrarError('El nombre no puede superar los 100 caracteres.');
    return false;
  }

  // inventariable debe ser 0 o 1 (el parseInt de un select vacío da NaN)
  if (isNaN(inventariable) || (inventariable !== 0 && inventariable !== 1)) {
    mostrarError('El campo "Inventariable" es obligatorio y debe ser Sí o No.');
    return false;
  }

  return true;
}

// ================================
// CREAR CATEGORIA
// ================================
function bindCrearCategoria() {
  const form = document.getElementById('formInsertar');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f            = new FormData(form);
    const nombre       = f.get('nombre');
    const inventariable = parseInt(f.get('inventariable'));

    // ── Validación ──
    if (!validarCategoria(nombre, inventariable)) return;

    try {
      await CategoriaApi.create({ nombre: nombre.trim(), inventariable });
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