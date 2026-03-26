import InstalacionApi from '../api_f/InstalacionApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { mostrarError, mostrarExito } from '../helpers/utils.js';
import { validarEmail, validarTelefono } from '../helpers/validacion.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';

let instalaciones = [];
let sesionActual = null;
const pagination = new PaginationHelper(15);
pagination.setLoadingCallback((isLoading) => {
    if (isLoading) {
        showTableLoading('#tabla tbody', 6);
    }
});

document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('instalaciones');
  if (!sesionActual) return;

  cargarInstalaciones();
  bindFiltros();
  bindCrearInstalacion();
  bindModales();
});

// ================================
// CARGAR INSTALACIONES
// ================================
async function cargarInstalaciones() {
  try {
    showTableLoading('#tabla tbody', 6);
    const response = await InstalacionApi.getAll();
    instalaciones = response?.data || response || [];
    pagination.setData(instalaciones, () => {
      renderTablaInstalaciones(instalaciones);
    });
    pagination.render('pagination-instalacion');
    renderTablaInstalaciones(instalaciones);
    poblarFiltroLocalidad();
    poblarSelectLocalidad();
  } catch (e) {
    instalaciones = [];
    pagination.setData([], () => {
      renderTablaInstalaciones([]);
    });
    pagination.render('pagination-instalacion');
    renderTablaInstalaciones([]);
  }
}

// ================================
// POBLAR SELECT DE LOCALIDAD PARA INSERCIÓN
// ================================
function poblarSelectLocalidad() {
  const select = document.getElementById('insertLocalidad');
  if (!select) return;

  const localidades = [...new Set(
    instalaciones.map(i => i.localidad).filter(Boolean)
  )].sort();

  select.innerHTML = '<option value="">Selecciona una localidad</option>';
  localidades.forEach(loc => {
    const option = document.createElement('option');
    option.value = loc;
    option.textContent = loc;
    select.appendChild(option);
  });
}

// ================================
// POBLAR FILTRO LOCALIDAD
// ================================
function poblarFiltroLocalidad() {
  const select = document.getElementById('localidad');
  if (!select) return;

  const localidades = [...new Set(
    instalaciones.map(i => i.localidad).filter(Boolean)
  )].sort();

  const valorActual = select.value;
  select.innerHTML = '<option value="">Todos</option>';
  localidades.forEach(loc => {
    const option = document.createElement('option');
    option.value = loc;
    option.textContent = loc;
    if (loc === valorActual) option.selected = true;
    select.appendChild(option);
  });
}

// ================================
// RENDER TABLA
// ================================
function renderTablaInstalaciones(lista) {
  const tbody = document.querySelector('#tabla tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const puedeEscribir = sesionActual?.puedeEscribir ?? false;
  const itemsPagina = pagination.getPageItems(lista);

  itemsPagina.forEach(i => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i.nombre ?? ''}</td>
      <td class="d-none d-md-table-cell">${i.direccion ?? ''}</td>
      <td class="d-none d-md-table-cell">${i.telefono ?? ''}</td>
      <td class="d-none d-md-table-cell">${i.correo ?? ''}</td>
      <td>${i.localidad ?? ''}</td>
      <td class="celda-acciones">
        <div class="acciones-tabla">
        <button type="button" class="btn p-0 btn-ver"
                data-bs-toggle="modal"
                data-bs-target="#modalVer"
                data-id="${i.id_instalacion}">
          <i class="bi bi-eye"></i>
        </button>
        ${puedeEscribir ? `
        <button type="button" class="btn p-0 btn-editar"
                data-bs-toggle="modal"
                data-bs-target="#modalEditar"
                data-id="${i.id_instalacion}">
          <i class="bi bi-pencil"></i>
        </button>
        <button type="button" class="btn p-0 btn-eliminar"
                data-bs-toggle="modal"
                data-bs-target="#modalEliminar"
                data-id="${i.id_instalacion}">
          <i class="bi bi-trash3"></i>
        </button>` : ''}
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
  document.getElementById('localidad')?.addEventListener('change', aplicarFiltros);
}

function aplicarFiltros() {
  pagination.goToPage(0);
  const filtroNombre    = document.getElementById('nombre')?.value?.toLowerCase() || '';
  const filtroLocalidad = document.getElementById('localidad')?.value?.toLowerCase() || '';

  const filtrados = instalaciones.filter(i => {
    const cumpleNombre    = !filtroNombre    || i.nombre?.toLowerCase().includes(filtroNombre);
    const cumpleLocalidad = !filtroLocalidad || i.localidad?.toLowerCase() === filtroLocalidad;
    return cumpleNombre && cumpleLocalidad;
  });

  pagination.setData(filtrados, () => {
      renderTablaInstalaciones(filtrados);
    });
  pagination.render('pagination-instalacion');
  renderTablaInstalaciones(filtrados);
}

// ================================
// VALIDAR INSTALACIÓN
// Según DDL Instalacion:
//   nombre    VARCHAR(100) NOT NULL
//   direccion VARCHAR(150) NOT NULL
//   telefono  VARCHAR(15)  NOT NULL  (formato español)
//   correo    VARCHAR(100) NOT NULL  (formato email)
//   localidad FK          NOT NULL
// ================================
function validarInstalacion(data) {
  if (!data.nombre || !data.nombre.trim()) {
    mostrarError('El nombre es obligatorio.');
    return false;
  }
  if (data.nombre.trim().length > 100) {
    mostrarError('El nombre no puede superar los 100 caracteres.');
    return false;
  }

  if (!data.direccion || !data.direccion.trim()) {
    mostrarError('La dirección es obligatoria.');
    return false;
  }
  if (data.direccion.trim().length > 150) {
    mostrarError('La dirección no puede superar los 150 caracteres.');
    return false;
  }

  if (!data.telefono || !data.telefono.trim()) {
    mostrarError('El teléfono es obligatorio.');
    return false;
  }
  if (!validarTelefono(data.telefono)) {
    mostrarError('El teléfono no tiene un formato válido.');
    return false;
  }
  if (data.telefono.trim().length > 15) {
    mostrarError('El teléfono no puede superar los 15 caracteres.');
    return false;
  }

  if (!data.correo || !data.correo.trim()) {
    mostrarError('El correo es obligatorio.');
    return false;
  }
  if (!validarEmail(data.correo)) {
    mostrarError('El correo no tiene un formato válido.');
    return false;
  }
  if (data.correo.trim().length > 100) {
    mostrarError('El correo no puede superar los 100 caracteres.');
    return false;
  }

  if (!data.localidad) {
    mostrarError('La localidad es obligatoria.');
    return false;
  }

  return true;
}

// ================================
// CREAR INSTALACIÓN
// ================================
function bindCrearInstalacion() {
  const form = document.getElementById('formInsertar');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const data = {
      nombre:    f.get('nombre'),
      direccion: f.get('direccion'),
      telefono:  f.get('telefono'),
      correo:    f.get('correo'),
      localidad: f.get('localidad')
    };

    // ── Validación ──
    if (!validarInstalacion(data)) return;

    try {
      await InstalacionApi.create(data);
      await cargarInstalaciones();
      form.reset();
      mostrarExito('Instalación creada correctamente');
    } catch (err) {
      if (err.message?.includes('Duplicate entry')) {
        mostrarError('No se puede añadir: ya existe una instalación con ese nombre');
      } else {
        mostrarError(err.message || 'Error creando instalación');
      }
    }
  });
}

// ================================
// CAMPOS PARA MODAL VER
// ================================
const nombresCampos = ['Nombre', 'Dirección', 'Teléfono', 'Correo', 'Localidad'];
const camposBd      = ['nombre', 'direccion', 'telefono', 'correo', 'localidad'];

// ================================
// MODALES
// ================================
function bindModales() {

  // MODAL VER
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-ver');
    if (!btn) return;

    const instalacion = instalaciones.find(i => i.id_instalacion == btn.dataset.id);
    if (!instalacion) return;

    const modalBody = document.getElementById('modalVerBody');
    if (!modalBody) return;

    modalBody.innerHTML = '';
    nombresCampos.forEach((nombre, index) => {
      const campo = camposBd[index];
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = nombre + ': ';
      p.appendChild(strong);
      p.appendChild(document.createTextNode(instalacion[campo] ?? ''));
      modalBody.appendChild(p);
    });
  });

  // MODAL EDITAR
  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('.btn-editar');
    if (!btn) return;

    const id = btn.dataset.id;
    try {
      const response    = await InstalacionApi.getById(id);
      const instalacion = response.data;
      if (!instalacion) return;

      const form = document.getElementById('formEditar');
      if (!form) return;

      const localidades = [...new Set(
        instalaciones.map(i => i.localidad).filter(Boolean)
      )].sort();

      let optionsHtml = '<option value="">Selecciona una localidad</option>';
      localidades.forEach(loc => {
        const selected = loc === instalacion.localidad ? 'selected' : '';
        optionsHtml += `<option value="${loc}" ${selected}>${loc}</option>`;
      });

      form.innerHTML = `
        <div class="row mb-3">
          <div class="col-lg-4">
            <label class="form-label">ID</label>
            <input type="text" class="form-control" value="${instalacion.id_instalacion || ''}" disabled>
            <input type="hidden" name="id_instalacion" value="${instalacion.id_instalacion || ''}">
          </div>
          <div class="col-lg-4">
            <label class="form-label">Nombre</label>
            <input type="text" class="form-control" name="nombre" maxlength="100" value="${instalacion.nombre || ''}" required>
          </div>
          <div class="col-lg-4">
            <label class="form-label">Teléfono</label>
            <input type="text" class="form-control" name="telefono" maxlength="15" value="${instalacion.telefono || ''}" required>
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-lg-6">
            <label class="form-label">Dirección</label>
            <input type="text" class="form-control" name="direccion" maxlength="150" value="${instalacion.direccion || ''}" required>
          </div>
          <div class="col-lg-6">
            <label class="form-label">Correo</label>
            <input type="email" class="form-control" name="correo" maxlength="100" value="${instalacion.correo || ''}" required>
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-lg-6">
            <label class="form-label">Localidad</label>
            <select class="form-select" name="localidad" required>
              ${optionsHtml}
            </select>
          </div>
        </div>
        <div class="text-center">
          <button type="button" class="btn btn-primary btn-guardar-instalacion">
            Guardar cambios
          </button>
        </div>
      `;

      form.querySelector('.btn-guardar-instalacion').addEventListener('click', async () => {
        const editId = form.querySelector('input[name="id_instalacion"]').value;
        const data = {
          nombre:    form.querySelector('input[name="nombre"]').value,
          direccion: form.querySelector('input[name="direccion"]').value,
          telefono:  form.querySelector('input[name="telefono"]').value,
          correo:    form.querySelector('input[name="correo"]').value,
          localidad: form.querySelector('select[name="localidad"]').value
        };

        // ── Validación ──
        if (!validarInstalacion(data)) return;

        try {
          await InstalacionApi.update(editId, data);
          await cargarInstalaciones();
          bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
          mostrarExito('Instalación actualizada correctamente');
        } catch (error) {
          if (error.message?.includes('Duplicate entry')) {
            mostrarError('No se puede actualizar: ya existe una instalación con ese nombre');
          } else {
            mostrarError('Error al actualizar instalación: ' + error.message);
          }
        }
      });

    } catch (error) {
      mostrarError('Error al cargar datos de la instalación');
    }
  });

  // MODAL ELIMINAR - Preparar
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-eliminar');
    if (!btn) return;

    const id          = btn.dataset.id;
    const instalacion = instalaciones.find(i => i.id_instalacion == id);

    const btnConfirm = document.getElementById('btnConfirmarEliminar');
    if (!btnConfirm) return;
    btnConfirm.dataset.id = id;

    const modalBody = document.querySelector('#modalEliminar .modal-body');
    if (modalBody && instalacion) {
      modalBody.innerHTML = `¿Eliminar la instalación "<strong>${instalacion.nombre}</strong>"?<p class="text-muted">Esta acción no se puede deshacer.</p>`;
    }
  });

  // MODAL ELIMINAR - Confirmar
  document.getElementById('btnConfirmarEliminar')?.addEventListener('click', async function () {
    const id = this.dataset.id;
    if (!id) return;

    try {
      await InstalacionApi.delete(id);
      await cargarInstalaciones();
      bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
      mostrarExito('Instalación eliminada correctamente');
    } catch (error) {
      if (error.message?.includes('1451')) {
        mostrarError('No se puede eliminar: la instalación tiene vehículos o almacenes asignados');
      } else {
        mostrarError('Error al eliminar: ' + error.message);
      }
    }
  });
}