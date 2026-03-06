import RolesApi from '../api_f/RolApi.js';
import PersonaApi from '../api_f/PersonaApi.js';
import { authGuard } from '../helpers/authGuard.js';

let roles = [];
let sesionActual = null;

document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('roles');
  if (!sesionActual) return;

  cargarRoles();
  bindModalVer();
  cargarSelectRoles();
  cargarSelectPersonas(null, 'n_funcionario');

  if (sesionActual.puedeEscribir) {
    bindCrearRol();
    bindModalEditar();
    bindAsignarRol();
  }
});

// ================================
// CARGAR ROLES
// ================================
async function cargarRoles() {
  try { const r = await RolesApi.getAll(); roles = r.data; renderTablaRoles(roles); }
  catch (e) { mostrarAlerta(e.message || 'Error cargando roles', 'danger'); }
}

// ================================
// POBLAR SELECT ROLES
// ================================
async function cargarSelectRoles() {
  const select = document.getElementById('rol'); if (!select) return;
  try {
    const res = await RolesApi.getAll();
    select.innerHTML = '<option value="">Seleccione rol...</option>';
    res.data.forEach(r => { const o = document.createElement('option'); o.value = r.id_rol; o.textContent = r.nombre; select.appendChild(o); });
  } catch (e) { mostrarError(e.message || 'Error cargando roles'); }
}

// ================================
// POBLAR SELECT PERSONAS
// ================================
async function cargarSelectPersonas(seleccionado, id_select) {
  const select = document.getElementById(id_select); if (!select) return;
  try {
    const res = await PersonaApi.getAll();
    select.innerHTML = '<option value="">Seleccione persona...</option>';
    res.data.forEach(p => { const o = document.createElement('option'); o.value = p.id_bombero; o.textContent = `${p.n_funcionario} - ${p.nombre} ${p.apellidos}`; if (seleccionado && p.n_funcionario === seleccionado) o.selected = true; select.appendChild(o); });
  } catch (e) { mostrarError(e.message || 'Error cargando personas'); }
}

// ================================
// RENDER TABLA
// ================================
function renderTablaRoles(lista) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';
  if (!lista.length) { tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No hay roles registrados</td></tr>'; return; }
  const puedeEscribir = sesionActual?.puedeEscribir ?? false;

  lista.forEach(r => {
    const tr = document.createElement('tr');
    const botones = puedeEscribir
      ? `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${r.id_rol}"><i class="bi bi-eye"></i></button>
         <button class="btn p-0 btn-editar" data-bs-toggle="modal" data-bs-target="#modalEditar" data-id="${r.id_rol}"><i class="bi bi-pencil text-primary"></i></button>
         <button class="btn p-0 btn-eliminar" data-id="${r.id_rol}"><i class="bi bi-trash3 text-danger"></i></button>`
      : `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${r.id_rol}"><i class="bi bi-eye"></i></button>`;
    tr.innerHTML = `<td class="d-none d-md-table-cell">${r.id_rol}</td><td>${r.nombre??''}</td><td class="d-none d-md-table-cell">${truncar(r.descripcion,80)}</td><td class="d-flex justify-content-around">${botones}</td>`;
    tbody.appendChild(tr);
  });

  if (puedeEscribir) bindEliminarRol();
}

// ================================
// CREAR ROL
// ================================
function bindCrearRol() {
  const form = document.getElementById('formRol'); if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nombre').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    try {
      await RolesApi.create({ nombre, descripcion: descripcion || null });
      await cargarRoles(); form.reset(); mostrarAlerta('Rol creado correctamente', 'success');
    } catch (err) { mostrarAlerta(err.message || 'Error creando rol', 'danger'); }
  });
}

// ================================
// ASIGNAR ROL
// ================================
function bindAsignarRol() {
  const form = document.getElementById('formAsignarRol'); if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const data = { id_bombero: f.get('n_funcionario'), id_rol: f.get('rol') };
    if (!data.id_bombero || !data.id_rol) { mostrarAlerta('Seleccione persona y rol', 'danger'); return; }
    try { await RolesApi.assignToPerson(data); mostrarAlerta('Rol asignado correctamente', 'success'); form.reset(); }
    catch (err) { mostrarAlerta(err.message || 'Error asignando rol', 'danger'); }
  });
}

// ================================
// MODAL VER
// ================================
function bindModalVer() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-ver'); if (!btn) return;
    const rol = roles.find(r => String(r.id_rol) === String(btn.dataset.id)); if (!rol) return;
    const modalBody = document.getElementById('modalVerBody');
    modalBody.innerHTML = '';
    [{ label:'ID', valor:rol.id_rol },{ label:'Nombre', valor:rol.nombre },{ label:'Descripción', valor:rol.descripcion??'—' }].forEach(({label,valor}) => {
      const p = document.createElement('p'); p.innerHTML = `<strong>${label}:</strong> ${valor}`; modalBody.appendChild(p);
    });
  });
}

// ================================
// MODAL EDITAR
// ================================
function bindModalEditar() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-editar'); if (!btn) return;
    const rol = roles.find(r => String(r.id_rol) === String(btn.dataset.id)); if (!rol) return;
    const form = document.getElementById('formEditar');
    form.innerHTML = `
      <input type="hidden" id="editIdRol" value="${rol.id_rol}">
      <div class="mb-3"><label class="form-label">Nombre</label><input type="text" class="form-control" value="${rol.nombre}" readonly></div>
      <div class="mb-3"><label for="editDescripcion" class="form-label">Descripción</label><textarea class="form-control" id="editDescripcion" rows="3">${rol.descripcion??''}</textarea></div>
      <div class="d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-primary" id="btnGuardarCambios">Guardar cambios</button>
      </div>`;
    document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
      const idRol = document.getElementById('editIdRol').value;
      const descripcion = document.getElementById('editDescripcion').value.trim();
      try {
        await RolesApi.update(idRol, { nombre: rol.nombre, descripcion: descripcion || null });
        await cargarRoles();
        bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
        mostrarAlerta('Rol actualizado correctamente', 'success');
      } catch (err) { mostrarAlerta(err.message || 'Error actualizando rol', 'danger'); }
    });
  });
}

// ================================
// ELIMINAR ROL
// ================================
function bindEliminarRol() {
  document.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', async function () {
      if (!confirm('¿Estás seguro de eliminar este rol? Esta acción no se puede deshacer.')) return;
      try {
        await RolesApi.delete(this.dataset.id); await cargarRoles(); mostrarAlerta('Rol eliminado correctamente', 'success');
      } catch (err) { mostrarAlerta(err.status===409 ? 'No se puede eliminar: el rol está asignado a usuarios' : err.message || 'Error al eliminar', 'danger'); }
    });
  });
}

function truncar(texto, max) { if (!texto) return '—'; return texto.length > max ? texto.substring(0, max) + '…' : texto; }

function mostrarAlerta(msg, tipo = 'info') {
  const container = document.getElementById('alert-container');
  if (!container) { alert(msg); return; }
  const id = `alert-${Date.now()}`;
  const div = document.createElement('div');
  div.id = id; div.className = `alert alert-${tipo} alert-dismissible fade show shadow-sm`; div.role = 'alert';
  div.innerHTML = `${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  container.appendChild(div);
  setTimeout(() => { const el = document.getElementById(id); if (el) el.remove(); }, 4000);
}

function mostrarError(msg) { mostrarAlerta(msg, 'danger'); }