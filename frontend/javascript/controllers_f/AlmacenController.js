import AlmacenApi from '../api_f/AlmacenApi.js';
import InstalacionApi from '../api_f/InstalacionApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { mostrarError, mostrarExito } from '../helpers/utils.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';

let almacenes = [];
let instalaciones = [];
let sesionActual = null;
const pagination = new PaginationHelper(15);
pagination.setLoadingCallback((isLoading) => {
  if (isLoading) {
    showTableLoading('#tabla tbody', 5);
  }
});

// ================================
// INICIALIZACIÓN
// ================================
document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('almacenes');
  if (!sesionActual) return;

  cargarDatosIniciales();
  bindFiltros();
  bindModalVer();
  bindModalEliminarPreparar();

  if (sesionActual.puedeEscribir) {
    bindCrearAlmacen();
    bindModalEditar();
    bindModalEliminarConfirmar();
  }
});

// ================================
// CARGAR DATOS INICIALES
// ================================
async function cargarDatosIniciales() {
  try {
    await Promise.all([cargarInstalaciones(), cargarAlmacenes()]);
  } catch (e) {
    mostrarError(e.message || 'Error cargando datos');
  }
}

// ================================
// CARGAR INSTALACIONES
// ================================
async function cargarInstalaciones() {
  try {
    const response = await InstalacionApi.getAll();
    instalaciones = response?.data || response || [];
    poblarSelectInstalaciones();
  } catch (e) {
    console.error('Error cargando instalaciones:', e);
  }
}

// ================================
// CARGAR ALMACENES
// ================================
async function cargarAlmacenes() {
  try {
    showTableLoading('#tabla tbody', 5);
    const response = await AlmacenApi.getAll();
    almacenes = response?.data || response || [];

    pagination.setData(almacenes, () => {
      renderTablaAlmacenes(almacenes);
    });
    pagination.render('pagination-almacen');
    renderTablaAlmacenes(almacenes);
  } catch (e) {
    almacenes = [];
    pagination.setData([], () => {
      renderTablaAlmacenes([]);
    });
    pagination.render('pagination-almacen');
    renderTablaAlmacenes([]);
  }
}

// ================================
// POBLAR SELECT DE INSTALACIONES
// ================================
function poblarSelectInstalaciones() {
  const selects = ['selectInstalacion', 'editInstalacion'];
  selects.forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;
    select.innerHTML = '<option value="">Seleccione una instalación...</option>';
    instalaciones.forEach(i => {
      const option = document.createElement('option');
      option.value = i.id_instalacion;
      option.textContent = `${i.nombre} - ${i.localidad || ''}`;
      select.appendChild(option);
    });
  });
}

// ================================
// RENDER TABLA
// ================================
function renderTablaAlmacenes(lista) {
  const tbody = document.querySelector('#tabla tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const puedeEscribir = sesionActual?.puedeEscribir ?? false;
  const itemsPagina = pagination.getPageItems(lista);

  itemsPagina.forEach(a => {
    const tr = document.createElement('tr');
    tr.dataset.id_almacen = a.id_almacen;
    tr.dataset.id_instalacion = a.id_instalacion;

    const botonesAccion = puedeEscribir
      ? `<button type="button" class="btn p-0 btn-ver" 
                data-bs-toggle="modal" data-bs-target="#modalVer"
                data-id_almacen="${a.id_almacen}" data-id_instalacion="${a.id_instalacion}"><i class="bi bi-eye"></i></button>
         <button type="button" class="btn p-0 btn-editar" 
                data-bs-toggle="modal" data-bs-target="#modalEditar" 
                data-id_almacen="${a.id_almacen}" data-id_instalacion="${a.id_instalacion}"><i class="bi bi-pencil"></i></button>
         <button type="button" class="btn p-0 btn-eliminar" 
                data-bs-toggle="modal" data-bs-target="#modalEliminar" 
                data-id_almacen="${a.id_almacen}" data-id_instalacion="${a.id_instalacion}"><i class="bi bi-trash3"></i></button>`
      : `<button type="button" class="btn p-0 btn-ver" 
                data-bs-toggle="modal" data-bs-target="#modalVer"
                data-id_almacen="${a.id_almacen}" data-id_instalacion="${a.id_instalacion}"><i class="bi bi-eye"></i></button>`;

    tr.innerHTML = `
      <td>${a.id_almacen}</td>
      <td>${a.nombre}</td>
      <td class="d-none d-md-table-cell">${a.nombre_instalacion || 'Desconocida'}</td>
      <td class="d-none d-md-table-cell">${a.planta}</td>
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
  const inputNombre = document.getElementById('nombre');
  const selectPlanta = document.getElementById('planta');

  const filtrar = () => {
    pagination.goToPage(0);
    const nom = inputNombre?.value.toLowerCase() || '';
    const pla = selectPlanta?.value || '';

    const filtrados = almacenes.filter(a => {
      let ok = true;
      if (nom) ok = ok && a.nombre.toLowerCase().includes(nom);
      if (pla !== '') ok = ok && a.planta == pla;
      return ok;
    });

    pagination.setData(filtrados, () => renderTablaAlmacenes(filtrados));
    pagination.render('pagination-almacen');
    renderTablaAlmacenes(filtrados);
  };

  inputNombre?.addEventListener('input', filtrar);
  selectPlanta?.addEventListener('change', filtrar);
}

// ================================
// MODAL VER
// ================================
function bindModalVer() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-ver');
    if (!btn) return;

    const { id_almacen, id_instalacion } = btn.dataset;
    const a = almacenes.find(x => x.id_almacen == id_almacen && x.id_instalacion == id_instalacion);
    if (!a) return;

    document.getElementById('modalVerBody').innerHTML = `
      <div class="row mb-2">
        <div class="col-4 fw-bold">ID:</div>
        <div class="col-8">${a.id_almacen}</div>
      </div>
      <div class="row mb-2">
        <div class="col-4 fw-bold">Nombre:</div>
        <div class="col-8">${a.nombre}</div>
      </div>
      <div class="row mb-2">
        <div class="col-4 fw-bold">Instalación:</div>
        <div class="col-8">${a.nombre_instalacion || 'Desconocida'}</div>
      </div>
      <div class="row mb-2">
        <div class="col-4 fw-bold">Planta:</div>
        <div class="col-8">${a.planta}</div>
      </div>
    `;
  });
}

// ================================
// CREAR ALMACÉN
// ================================
function bindCrearAlmacen() {
  const form = document.getElementById('formInsertar');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const id_instalacion = f.get('id_instalacion');
    const data = {
      nombre: f.get('nombre').trim(),
      planta: parseInt(f.get('planta'))
    };

    if (!data.nombre || isNaN(data.planta) || !id_instalacion) {
      mostrarError('Por favor, rellene todos los campos correctamente.');
      return;
    }

    try {
      await AlmacenApi.create(id_instalacion, data);
      mostrarExito('Almacén creado correctamente');
      form.reset();
      cargarDatosIniciales();
    } catch (err) {
      mostrarError(err.message || 'Error al crear el almacén');
    }
  });
}

// ================================
// MODAL EDITAR
// ================================
function bindModalEditar() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-editar');
    if (!btn) return;

    const { id_almacen, id_instalacion } = btn.dataset;
    const a = almacenes.find(x => x.id_almacen == id_almacen && x.id_instalacion == id_instalacion);
    if (!a) return;

    // Poblar campos
    document.getElementById('editId').value = a.id_almacen;
    document.getElementById('editNombre').value = a.nombre;
    document.getElementById('editPlanta').value = a.planta;
    document.getElementById('editInstalacion').value = a.id_instalacion;

    // Guardar referencia para el update
    const btnGuardar = document.getElementById('btnGuardarCambios');
    btnGuardar.dataset.id_almacen = a.id_almacen;
    btnGuardar.dataset.id_instalacion_original = a.id_instalacion;
  });

  document.getElementById('btnGuardarCambios')?.addEventListener('click', async function () {
    const id_almacen = this.dataset.id_almacen;
    const instOriginal = this.dataset.id_instalacion_original;
    const instNueva = document.getElementById('editInstalacion').value;

    const data = {
      nombre: document.getElementById('editNombre').value.trim(),
      planta: parseInt(document.getElementById('editPlanta').value)
    };

    try {
      // Usamos la instalación original para la ruta, el backend se encarga de identificar el registro
      await AlmacenApi.update(instOriginal, id_almacen, data);
      mostrarExito('Almacén actualizado correctamente');
      bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
      cargarDatosIniciales();
    } catch (err) {
      mostrarError(err.message || 'Error al actualizar');
    }
  });
}

// ================================
// MODAL ELIMINAR (PREPARAR)
// ================================
function bindModalEliminarPreparar() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-eliminar');
    if (!btn) return;

    const { id_almacen, id_instalacion } = btn.dataset;
    const btnConfirm = document.getElementById('btnConfirmarEliminar');
    if (btnConfirm) {
      btnConfirm.dataset.id_almacen = id_almacen;
      btnConfirm.dataset.id_instalacion = id_instalacion;
    }
  });
}

// ================================
// MODAL ELIMINAR (CONFIRMAR)
// ================================
function bindModalEliminarConfirmar() {
  document.getElementById('btnConfirmarEliminar')?.addEventListener('click', async function () {
    const { id_almacen, id_instalacion } = this.dataset;
    try {
      await AlmacenApi.delete(id_instalacion, id_almacen);
      mostrarExito('Almacén eliminado correctamente');
      bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
      cargarDatosIniciales();
    } catch (err) {
      mostrarError(err.message || 'No se pudo eliminar el almacén');
    }
  });
}

window.AlmacenController = { cargarAlmacenes, refrescarAlmacenes: cargarDatosIniciales, aplicarFiltros: () => { } };
