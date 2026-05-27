import AlmacenApi from '../api_f/AlmacenApi.js';
import InstalacionApi from '../api_f/InstalacionApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';
import { mostrarError, mostrarExito } from '../helpers/utils.js';

let almacenes = [];
let instalaciones = [];
let sesionActual = null;
const pagination = new PaginationHelper(15);
pagination.setLoadingCallback((isLoading) => {
    if (isLoading) {
        showTableLoading('#tabla tbody', 5);
    }
});

document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('almacenes');
  if (!sesionActual) return;

  cargarDatosIniciales();
  bindFiltros();
  bindModales();

  if (sesionActual.puedeEscribir) {
    bindCrearAlmacen();
  }
});

// ================================
// CARGAR DATOS INICIALES
// ================================
async function cargarDatosIniciales() {
  try {
    await Promise.all([cargarInstalaciones()]);
    await cargarTodosLosAlmacenes();
    poblarSelectInstalaciones();
    pagination.setData(almacenes, () => {
      renderTablaAlmacenes(almacenes);
    });
    pagination.render('pagination-almacen');
    renderTablaAlmacenes(almacenes);
  } catch (e) {
    console.error('Error cargando datos:', e);
    mostrarError('Error cargando datos: ' + e.message);
  }
}

// ================================
// CARGAR INSTALACIONES
// ================================
async function cargarInstalaciones() {
  try {
    const response = await InstalacionApi.getAll();
    instalaciones = response?.data || response || [];
  } catch (e) {
    console.error('Error cargando instalaciones:', e);
    mostrarError('Error cargando instalaciones');
  }
}

// ================================
// CARGAR TODOS LOS ALMACENES
// ================================
async function cargarTodosLosAlmacenes() {
  showTableLoading('#tabla tbody', 5);

  try {
    const response = await AlmacenApi.getAll();
    const data = response?.data || response || [];
    almacenes = data.map(a => {
      const instalacion = instalaciones.find(i => i.id_instalacion == a.id_instalacion);
      return {
        ...a,
        nombre_instalacion: a.nombre_instalacion || instalacion?.nombre || 'Desconocida'
      };
    });
  } catch (e) {
    console.error('Error cargando almacenes:', e);
    almacenes = [];
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
    if (select) {
      select.innerHTML = '<option value="">Seleccione una instalación...</option>';
      instalaciones.forEach(i => {
        const option = document.createElement('option');
        option.value = i.id_instalacion;
        option.textContent = `${i.nombre} - ${i.localidad || ''}`;
        select.appendChild(option);
      });
    }
  });
}

// ================================
// RENDER TABLA
// ================================
function renderTablaAlmacenes(lista) {
  const tbody = document.querySelector('#tabla tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (lista.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="5" class="text-center">No hay almacenes para mostrar</td>';
    tbody.appendChild(tr);
    return;
  }

  const puedeEscribir = sesionActual?.puedeEscribir ?? false;
  const puedeEliminar = sesionActual?.puedeEliminar ?? false;
  const itemsPagina = pagination.getPageItems(lista);

  itemsPagina.forEach(a => {
    const tr = document.createElement('tr');
    tr.dataset.idAlmacen = a.id_almacen;
    tr.dataset.idInstalacion = a.id_instalacion;

    const botonVer = `<button type="button" class="btn p-0 btn-ver"
                data-bs-toggle="modal" data-bs-target="#modalVer"
                data-id-almacen="${a.id_almacen}" data-id-instalacion="${a.id_instalacion}"><i class="bi bi-eye"></i></button>`;
    const botonEditar = puedeEscribir
      ? `<button type="button" class="btn p-0 btn-editar"
                data-bs-toggle="modal" data-bs-target="#modalEditar"
                data-id-almacen="${a.id_almacen}" data-id-instalacion="${a.id_instalacion}"><i class="bi bi-pencil"></i></button>`
      : '';
    const botonEliminar = puedeEliminar
      ? `<button type="button" class="btn p-0 btn-eliminar"
                data-bs-toggle="modal" data-bs-target="#modalEliminar"
                data-id-almacen="${a.id_almacen}" data-id-instalacion="${a.id_instalacion}"><i class="bi bi-trash3"></i></button>`
      : '';
    const botonesAccion = `${botonVer}${botonEditar}${botonEliminar}`;

    tr.innerHTML = `
      <td>${a.id_almacen}</td>
      <td>${a.nombre || ''}</td>
      <td>${a.nombre_instalacion || 'Desconocida'}</td>
      <td class="d-none d-md-table-cell">${a.planta || ''}</td>
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
  const filtroPlanta = document.getElementById('planta');
  const filtroNombre = document.getElementById('nombre');
  if (filtroPlanta) filtroPlanta.addEventListener('change', aplicarFiltros);
  if (filtroNombre) filtroNombre.addEventListener('input', aplicarFiltros);
}

// ================================
// APLICAR FILTROS
// ================================
function aplicarFiltros() {
  pagination.goToPage(0);
  const filtroPlanta = document.getElementById('planta')?.value;
  const filtroNombre = document.getElementById('nombre')?.value?.toLowerCase();

  const filtrados = almacenes.filter(a => {
    let cumple = true;
    if (filtroPlanta && filtroPlanta !== '') cumple = cumple && a.planta == filtroPlanta;
    if (filtroNombre && filtroNombre !== '') cumple = cumple && a.nombre?.toLowerCase().includes(filtroNombre);
    return cumple;
  });

  pagination.setData(filtrados, () => {
      renderTablaAlmacenes(filtrados);
    });
  pagination.render('pagination-almacen');
  renderTablaAlmacenes(filtrados);
}

// ================================
// VALIDAR CAMPOS DE ALMACÉN
// Según DDL: nombre VARCHAR(100) NOT NULL, planta INT NOT NULL
// ================================
function validarCamposAlmacen(id_instalacion, nombre, planta) {
  if (!id_instalacion) {
    mostrarError('Debe seleccionar una instalación.');
    return false;
  }

  if (!nombre?.trim()) {
    mostrarError('El nombre es obligatorio.');
    return false;
  }
  if (nombre.trim().length > 100) {
    mostrarError('El nombre no puede superar los 100 caracteres.');
    return false;
  }

  if (planta === '' || planta === null || planta === undefined) {
    mostrarError('La planta es obligatoria.');
    return false;
  }
  // planta INT: debe ser un entero (puede ser 0, -1, etc.)
  if (!Number.isInteger(Number(planta)) || isNaN(Number(planta))) {
    mostrarError('La planta debe ser un número entero.');
    return false;
  }

  return true;
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
    const nombre         = f.get('nombre');
    const planta         = f.get('planta');

    if (!validarCamposAlmacen(id_instalacion, nombre, planta)) return;

    try {
      await AlmacenApi.create(id_instalacion, { nombre: nombre.trim(), planta: Number(planta) });
      await cargarDatosIniciales();
      form.reset();
      mostrarExito('Almacén creado correctamente');
    } catch (err) {
      mostrarError(err.message);
    }
  });
}

// ================================
// MODALES
// ================================
function bindModales() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-ver');
    if (!btn) return;

    const almacen = almacenes.find(a =>
      a.id_almacen == btn.dataset.idAlmacen && a.id_instalacion == btn.dataset.idInstalacion
    );
    if (!almacen) return;

    document.getElementById('modalVerBody').innerHTML = `
      <p><strong>ID:</strong> ${almacen.id_almacen}</p>
      <p><strong>Nombre:</strong> ${almacen.nombre}</p>
      <p><strong>Planta:</strong> ${almacen.planta}</p>
      <p><strong>Instalación:</strong> ${almacen.nombre_instalacion}</p>
    `;
  });

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-editar');
    if (!btn) return;

    const almacen = almacenes.find(a =>
      a.id_almacen == btn.dataset.idAlmacen && a.id_instalacion == btn.dataset.idInstalacion
    );
    if (!almacen) return;

    const form = document.getElementById('formEditar');
    form.dataset.idAlmacen = almacen.id_almacen;
    form.dataset.idInstalacion = almacen.id_instalacion;
    form.innerHTML = `
      <div class="mb-3">
        <label class="form-label">ID</label>
        <input type="text" class="form-control" value="${almacen.id_almacen}" readonly disabled>
      </div>
      <div class="mb-3">
        <label class="form-label">Nombre</label>
        <input type="text" class="form-control" id="editNombre" value="${almacen.nombre}" maxlength="100" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Planta</label>
        <input type="number" step="1" class="form-control" id="editPlanta" value="${almacen.planta}" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Instalación</label>
        <select class="form-select" id="editInstalacion" required disabled>
          <option value="">Seleccione una instalación...</option>
        </select>
        <div class="form-text">La instalación del almacén no se puede cambiar desde esta edición.</div>
      </div>
    `;

    const selectEdit = document.getElementById('editInstalacion');
    instalaciones.forEach(i => {
      const option = document.createElement('option');
      option.value = i.id_instalacion;
      option.textContent = `${i.nombre} - ${i.localidad || ''}`;
      if (i.id_instalacion == almacen.id_instalacion) option.selected = true;
      selectEdit.appendChild(option);
    });
  });

  // GUARDAR CAMBIOS
  document.getElementById('btnGuardarCambios')?.addEventListener('click', async function () {
    const form           = document.getElementById('formEditar');
    const id             = form.dataset.idAlmacen;
    const id_instalacion = form.dataset.idInstalacion;
    const nombre         = document.getElementById('editNombre').value;
    const planta         = document.getElementById('editPlanta').value;

    if (!validarCamposAlmacen(id_instalacion, nombre, planta)) return;

    try {
      await AlmacenApi.update(id_instalacion, id, { nombre: nombre.trim(), planta: Number(planta) });
      await cargarDatosIniciales();
      bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
      mostrarExito('Almacén actualizado correctamente');
    } catch (error) {
      mostrarError(error.message);
    }
  });

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-eliminar');
    if (!btn) return;

    const almacen = almacenes.find(a =>
      a.id_almacen == btn.dataset.idAlmacen && a.id_instalacion == btn.dataset.idInstalacion
    );
    const btnConfirm = document.getElementById('btnConfirmarEliminar');
    btnConfirm.dataset.idAlmacen = btn.dataset.idAlmacen;
    btnConfirm.dataset.instalacion = almacen?.id_instalacion;

    const modalBody = document.querySelector('#modalEliminar .modal-body');
    if (modalBody && almacen) {
      modalBody.innerHTML = `
        ¿Eliminar el almacén "${almacen.nombre}"?
        <p class="text-muted">Esta acción no se puede deshacer.</p>
        <p class="text-warning">Nota: Si tiene materiales o relaciones, no se podrá eliminar.</p>
      `;
    }
  });

  // CONFIRMAR ELIMINAR
  document.getElementById('btnConfirmarEliminar')?.addEventListener('click', async function () {
    const id = this.dataset.idAlmacen;
    const id_instalacion = this.dataset.instalacion;
    if (!id || !id_instalacion) return;

    try {
      await AlmacenApi.delete(id_instalacion, id);
      await cargarDatosIniciales();
      bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
      mostrarExito('Almacén eliminado correctamente');
    } catch (error) {
      mostrarError('No se puede eliminar: el almacén tiene materiales o relaciones');
    }
  });
}

// ================================
// ALERTAS (importadas de utils.js)
// ================================

window.AlmacenController = { cargarAlmacenes: cargarTodosLosAlmacenes, refrescarAlmacenes: cargarDatosIniciales, aplicarFiltros };
