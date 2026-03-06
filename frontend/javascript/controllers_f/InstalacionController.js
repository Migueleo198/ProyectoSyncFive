import InstalacionApi from '../api_f/InstalacionApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { mostrarError, mostrarExito } from '../helpers/utils.js';
import { validarEmail, validarTelefono } from '../helpers/validacion.js';

let instalaciones = [];
let sesionActual = null;

document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('instalaciones');
  if (!sesionActual) return;

  cargarInstalaciones();
  bindFiltros();

  if (sesionActual.puedeEscribir) {
    bindCrearInstalacion();
    bindModalesEscritura();
  }

  bindModalVer();
});

// ================================
// CARGAR INSTALACIONES
// ================================
async function cargarInstalaciones() {
  try {
    const r = await InstalacionApi.getAll();
    instalaciones = r.data;
    renderTablaInstalaciones(instalaciones);
  } catch (e) { mostrarError(e.message || 'Error cargando instalaciones'); }
}

const nombresCampos = ['Nombre','Dirección','Teléfono','Correo','Localidad'];
const camposBd      = ['nombre','direccion','telefono','correo','localidad'];

// ================================
// RENDER TABLA
// ================================
function renderTablaInstalaciones(lista) {
  const tbody = document.querySelector('#tabla tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const puedeEscribir = sesionActual?.puedeEscribir ?? false;

  lista.forEach(i => {
    const tr = document.createElement('tr');
    const botones = puedeEscribir
      ? `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${i.id_instalacion}"><i class="bi bi-eye"></i></button>
         <button class="btn p-0 btn-editar" data-bs-toggle="modal" data-bs-target="#modalEditar" data-id="${i.id_instalacion}"><i class="bi bi-pencil"></i></button>
         <button class="btn p-0 btn-eliminar" data-bs-toggle="modal" data-bs-target="#modalEliminar" data-id="${i.id_instalacion}"><i class="bi bi-trash3"></i></button>`
      : `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${i.id_instalacion}"><i class="bi bi-eye"></i></button>`;
    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${i.id_instalacion}</td>
      <td>${i.nombre??''}</td><td>${i.direccion??''}</td>
      <td>${i.telefono??''}</td><td>${i.correo??''}</td><td>${i.localidad??''}</td>
      <td class="d-flex justify-content-around">${botones}</td>`;
    tbody.appendChild(tr);
  });
}

// ================================
// FILTROS
// ================================
function bindFiltros() {
  document.getElementById('nombre')?.addEventListener('input', aplicarFiltros);
  document.getElementById('localidad')?.addEventListener('input', aplicarFiltros);
}

// ================================
// APLICAR FILTROS
// ================================
function aplicarFiltros() {
  const fn = document.getElementById('nombre')?.value?.toLowerCase();
  const fl = document.getElementById('localidad')?.value?.toLowerCase();
  renderTablaInstalaciones(instalaciones.filter(i =>
    (!fn || i.nombre?.toLowerCase().includes(fn)) &&
    (!fl || i.localidad?.toLowerCase().includes(fl))
  ));
}

// ================================
// MODAL VER
// ================================
function bindModalVer() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-ver');
    if (!btn) return;
    const inst = instalaciones.find(i => i.id_instalacion == btn.dataset.id);
    if (!inst) return;
    const modalBody = document.getElementById('modalVerBody');
    if (!modalBody) return;
    modalBody.innerHTML = '';
    nombresCampos.forEach((nombre, idx) => {
      const p = document.createElement('p');
      p.innerHTML = `<strong>${nombre}:</strong> ${inst[camposBd[idx]] ?? ''}`;
      modalBody.appendChild(p);
    });
  });
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
    const data = { nombre: f.get('nombre'), direccion: f.get('direccion'), telefono: f.get('telefono'), correo: f.get('correo'), localidad: f.get('localidad') };
    if (!data.nombre || !data.direccion || !data.localidad) { mostrarError('Nombre, dirección y localidad son obligatorios'); return; }
    if (!validarEmail(data.correo)) { mostrarError('Correo no válido'); return; }
    if (!validarTelefono(data.telefono)) { mostrarError('Teléfono no válido'); return; }
    try {
      await InstalacionApi.create(data);
      await cargarInstalaciones();
      form.reset();
      mostrarExito('Instalación creada correctamente');
    } catch (err) { mostrarError(err.message || 'Error creando instalación'); }
  });
}

// ================================
// MODALES DE ESCRITURA
// ================================
function bindModalesEscritura() {
  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('.btn-editar');
    if (!btn) return;
    const id = btn.dataset.id;
    try {
      const r = await InstalacionApi.getById(id);
      const inst = r.data;
      if (!inst) return;
      const form = document.getElementById('formEditar');
      form.innerHTML = `
        <div class="row mb-3">
          <div class="col-lg-4"><label class="form-label">ID</label><input type="text" class="form-control" value="${inst.id_instalacion}" disabled><input type="hidden" name="id_instalacion" value="${inst.id_instalacion}"></div>
          <div class="col-lg-4"><label class="form-label">Nombre</label><input type="text" class="form-control" name="nombre" value="${inst.nombre||''}" required></div>
          <div class="col-lg-4"><label class="form-label">Teléfono</label><input type="text" class="form-control" name="telefono" value="${inst.telefono||''}" required></div>
        </div>
        <div class="row mb-3">
          <div class="col-lg-6"><label class="form-label">Dirección</label><input type="text" class="form-control" name="direccion" value="${inst.direccion||''}" required></div>
          <div class="col-lg-6"><label class="form-label">Correo</label><input type="email" class="form-control" name="correo" value="${inst.correo||''}" required></div>
        </div>
        <div class="row mb-3"><div class="col-lg-6"><label class="form-label">Localidad</label><input type="text" class="form-control" name="localidad" value="${inst.localidad||''}" required></div></div>
        <div class="text-center"><button type="button" class="btn btn-primary btn-guardar-inst">Guardar cambios</button></div>`;
      form.querySelector('.btn-guardar-inst').addEventListener('click', async function () {
        const data = { nombre: form.querySelector('[name="nombre"]').value, direccion: form.querySelector('[name="direccion"]').value, telefono: form.querySelector('[name="telefono"]').value, correo: form.querySelector('[name="correo"]').value, localidad: form.querySelector('[name="localidad"]').value };
        if (!data.nombre || !data.direccion || !data.localidad) { mostrarError('Nombre, dirección y localidad son obligatorios'); return; }
        if (!validarEmail(data.correo)) { mostrarError('Correo no válido'); return; }
        if (!validarTelefono(data.telefono)) { mostrarError('Teléfono no válido'); return; }
        try {
          await InstalacionApi.update(id, data);
          await cargarInstalaciones();
          bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
          mostrarExito('Instalación actualizada correctamente');
        } catch (err) { mostrarError(err.message || 'Error actualizando'); }
      });
    } catch (err) { mostrarError('Error cargando instalación'); }
  });

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-eliminar');
    if (!btn) return;
    const id = btn.dataset.id;
    const inst = instalaciones.find(i => i.id_instalacion == id);
    document.getElementById('btnConfirmarEliminar').dataset.id = id;
    const modalBody = document.querySelector('#modalEliminar .modal-body');
    if (modalBody && inst) modalBody.innerHTML = `¿Eliminar la instalación "${inst.nombre}"?<p class="text-muted">Esta acción no se puede deshacer.</p>`;
  });

  document.getElementById('btnConfirmarEliminar').addEventListener('click', async function () {
    const id = this.dataset.id;
    if (!id) return;
    try {
      await InstalacionApi.delete(id);
      await cargarInstalaciones();
      bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
      mostrarExito('Instalación eliminada correctamente');
    } catch (err) { mostrarError(err.message?.includes('1451') ? 'No se puede eliminar: tiene vehículos o almacenes asignados' : err.message || 'Error al eliminar'); }
  });
}