import RolesApi from '../api_f/RolApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';

let roles = [];
let sesionActual = null;
const modalVerPagination = new PaginationHelper(5);

modalVerPagination.setLoadingCallback((isLoading) => {
  if (isLoading) {
    showTableLoading('#tablaPersonasRol tbody', 4);
  }
});

// ================================
// CONSTANTES
// Según DDL Rol:
//   nombre      ENUM('BOMBERO','OFICIAL','JEFE DE INTERVENCIÓN','JEFE DE MANDO','INSPECTOR') NOT NULL
//   descripcion TEXT (nullable)
// ================================
const ROLES_VALIDOS = ['BOMBERO', 'OFICIAL', 'JEFE DE INTERVENCIÓN', 'JEFE DE MANDO', 'INSPECTOR'];

document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('roles');
  if (!sesionActual) return;

  cargarRoles();
  bindModalVer();

  if (sesionActual.puedeEscribir) {
    bindCrearRol();
    bindModalEditar();
    bindModalEliminar();
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
// RENDER TABLA
// ================================
function renderTablaRoles(lista) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';
  if (!lista.length) { tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No hay roles registrados</td></tr>'; return; }
  const puedeEscribir = sesionActual?.puedeEscribir ?? false;

  lista.forEach(r => {
    const tr = document.createElement('tr');
    const botonesAccion = puedeEscribir
      ? `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${r.id_rol}"><i class="bi bi-eye"></i></button>
         <button class="btn p-0 btn-editar" data-bs-toggle="modal" data-bs-target="#modalEditar" data-id="${r.id_rol}"><i class="bi bi-pencil"></i></button>
         <button class="btn p-0 btn-eliminar" data-bs-toggle="modal" data-bs-target="#modalEliminar" data-id="${r.id_rol}"><i class="bi bi-trash3"></i></button>`
      : `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${r.id_rol}"><i class="bi bi-eye"></i></button>`;
    tr.innerHTML = `<td class="d-none d-md-table-cell">${r.id_rol}</td><td>${r.nombre??''}</td><td class="d-none d-md-table-cell">${truncar(r.descripcion,80)}</td>
    <td>
        <div  class="d-flex justify-content-around">
          ${botonesAccion}
        </div>
      </td>`;
    tbody.appendChild(tr);
  });

}

// ================================
// VALIDAR ROL
// nombre: ENUM NOT NULL — debe ser uno de ROLES_VALIDOS
// descripcion: TEXT nullable — sin restricción de longitud práctica mínima
// ================================
function validarRol(nombre, descripcion = null) {
  if (!nombre || !nombre.trim()) {
    mostrarAlerta('El nombre del rol es obligatorio.', 'danger');
    return false;
  }
  if (!ROLES_VALIDOS.includes(nombre.trim())) {
    mostrarAlerta(`El nombre del rol no es válido. Opciones: ${ROLES_VALIDOS.join(', ')}.`, 'danger');
    return false;
  }
  return true;
}

// ================================
// CREAR ROL
// ================================
function bindCrearRol() {
  const form = document.getElementById('formRol'); if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre      = document.getElementById('nombre').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();

    // ── Validación ──
    if (!validarRol(nombre)) return;

    try {
      await RolesApi.create({ nombre, descripcion: descripcion || null });
      await cargarRoles(); form.reset(); mostrarAlerta('Rol creado correctamente', 'success');
    } catch (err) { mostrarAlerta(err.message || 'Error creando rol', 'danger'); }
  });
}

// ================================
// MODAL VER
// ================================
function bindModalVer() {
  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('.btn-ver'); if (!btn) return;
    const rol = roles.find(r => String(r.id_rol) === String(btn.dataset.id)); if (!rol) return;
    const modalBody = document.getElementById('modalVerBody');
    const tbody = document.querySelector('#tablaPersonasRol tbody');
    const paginationContainer = document.getElementById('pagination-modal-ver-rol');
    if (!modalBody || !tbody || !paginationContainer) return;

    modalBody.innerHTML = '';
    [{ label:'ID', valor:rol.id_rol },{ label:'Nombre', valor:rol.nombre },{ label:'Descripción', valor:rol.descripcion??'—' }].forEach(({label,valor}) => {
      const p = document.createElement('p'); p.innerHTML = `<strong>${label}:</strong> ${valor}`; modalBody.appendChild(p);
    });

    showTableLoading('#tablaPersonasRol tbody', 4);
    paginationContainer.innerHTML = '';

    try {
      const response = await RolesApi.getPersonsByRole(rol.id_rol);
      const personas = response?.data || [];

      actualizarTablaPersonasRol(personas);
    } catch (err) {
      renderSinResultadosTabla('#tablaPersonasRol tbody', 4, err.message || 'Error cargando personas');
      paginationContainer.innerHTML = '';
    }
  });
}

function actualizarTablaPersonasRol(personas) {
  const paginationContainer = document.getElementById('pagination-modal-ver-rol');
  if (!paginationContainer) return;

  modalVerPagination.setData(personas, () => {
    renderTablaPersonasRol(personas);
  });
  modalVerPagination.render('pagination-modal-ver-rol');
  renderTablaPersonasRol(personas);
}

function renderTablaPersonasRol(personas) {
  const tbody = document.querySelector('#tablaPersonasRol tbody');
  const paginationContainer = document.getElementById('pagination-modal-ver-rol');
  if (!tbody || !paginationContainer) return;

  tbody.innerHTML = '';

  if (!personas.length) {
    renderSinResultadosTabla('#tablaPersonasRol tbody', 4, 'No hay personas con este rol');
    paginationContainer.innerHTML = '';
    return;
  }

  const itemsPagina = modalVerPagination.getPageItems(personas);
  tbody.innerHTML = itemsPagina.map((persona) => `
    <tr>
      <td>${persona.id_bombero ?? '—'}</td>
      <td>${persona.n_funcionario ?? '—'}</td>
      <td>${obtenerNombreCompleto(persona)}</td>
      <td>${persona.correo ?? '—'}</td>
    </tr>
  `).join('');
}

function renderSinResultadosTabla(selector, colspan, mensaje) {
  const tbody = document.querySelector(selector);
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="${colspan}" class="text-center text-muted py-4">${mensaje}</td></tr>`;
}

function obtenerNombreCompleto(persona) {
  return `${persona.nombre ?? ''} ${persona.apellidos ?? ''}`.trim() || '—';
}

// ================================
// MODAL EDITAR
// Solo se puede editar la descripción (nombre es ENUM inmutable una vez creado)
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
      const idRol      = document.getElementById('editIdRol').value;
      const descripcion = document.getElementById('editDescripcion').value.trim();

      // nombre es readonly, no puede cambiar; descripcion es TEXT nullable sin restricción de longitud
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
      await RolesApi.delete(id);
      await cargarRoles();
      bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
      mostrarAlerta('Rol eliminado correctamente', 'success');
    } catch (err) {
      mostrarAlerta(err.status===409 ? 'No se puede eliminar: el rol está asignado a usuarios' : err.message || 'Error al eliminar', 'danger');
    }
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