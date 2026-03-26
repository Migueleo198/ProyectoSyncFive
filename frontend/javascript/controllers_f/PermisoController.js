import PermisoApi from '../api_f/PermisoApi.js';
import MotivoApi from '../api_f/MotivoApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { truncar, mostrarError, mostrarExito } from '../helpers/utils.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';

let permisos = [];
let sesionActual = null;
const pagination = new PaginationHelper(15);
pagination.setLoadingCallback((isLoading) => {
    if (isLoading) {
        showTableLoading('#tabla tbody', 8);
    }
});

// CORRECCIÓN: estados del DDL — ENUM('ACEPTADO','REVISION','DENEGADO') — sin tilde en REVISION
const ESTADOS_PERMISO_VALIDOS = ['ACEPTADO', 'REVISION', 'DENEGADO'];

document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('permisos');
  if (!sesionActual) return;

  cargarPermisos();
  bindModalVer();
  cargarSelectMotivos(null, 'motivo');
  cargarSelectEstados();

  if (sesionActual.puedeEscribir) {
    bindCrearPermiso();
    bindModalEditar();
    bindGestionarEstado();
    cargarSelectPermisos();
  }
});

// ================================
// NORMALIZAR ESTADO (elimina tildes, mayúsculas)
// ================================
function normalizarEstado(estado) {
  if (!estado) return '';
  return String(estado)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// ================================
// CARGAR PERMISOS
// ================================
async function cargarPermisos() {
  try {
    showTableLoading('#tabla tbody', 8);
    const r = await PermisoApi.getAll();
    permisos = r?.data || r || [];
    pagination.setData(permisos, () => {
      renderTablaPermisos(permisos);
    });
    pagination.render('pagination-permiso');
    renderTablaPermisos(permisos);
    poblarFiltroMotivo(permisos);
    poblarFiltroEstado(permisos);
    bindFiltros();
  } catch (e) {
    permisos = [];
    pagination.setData([], () => {
      renderTablaPermisos([]);
    });
    pagination.render('pagination-permiso');
    renderTablaPermisos([]);
  }
}

// ================================
// FILTROS
// ================================
function poblarFiltroMotivo(lista) {
  const select = document.getElementById('filtroMotivo');
  if (!select) return;
  const valorActual = select.value;
  select.innerHTML = '<option value="">Todos</option>';
  const motivosUnicos = [...new Set(lista.map(p => p.cod_motivo).filter(Boolean))].sort();
  motivosUnicos.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    select.appendChild(opt);
  });
  select.value = valorActual;
}

function poblarFiltroEstado(lista) {
  const select = document.getElementById('filtroEstado');
  if (!select) return;
  const valorActual = select.value;
  select.innerHTML = '<option value="">Todos</option>';
  const estadosUnicos = [...new Set(lista.map(p => p.estado).filter(Boolean))].sort();
  estadosUnicos.forEach(est => {
    const opt = document.createElement('option');
    opt.value = est;
    opt.textContent = est;
    select.appendChild(opt);
  });
  select.value = valorActual;
}

function bindFiltros() {
  document.getElementById('filtroMotivo')?.addEventListener('change', aplicarFiltros);
  document.getElementById('filtroEstado')?.addEventListener('change', aplicarFiltros);
  document.getElementById('filtroFecha')?.addEventListener('change', aplicarFiltros);
}

function aplicarFiltros() {
  pagination.goToPage(0);
  const filtroMotivo = document.getElementById('filtroMotivo')?.value ?? '';
  const filtroEstado = document.getElementById('filtroEstado')?.value ?? '';
  const filtroFecha  = document.getElementById('filtroFecha')?.value ?? '';

  const filtrados = permisos.filter(p => {
    const cumpleMotivo = !filtroMotivo || String(p.cod_motivo) === String(filtroMotivo);
    const cumpleEstado = !filtroEstado || p.estado === filtroEstado;
    const cumpleFecha  = !filtroFecha  || p.fecha?.startsWith(filtroFecha);
    return cumpleMotivo && cumpleEstado && cumpleFecha;
  });
  pagination.setData(filtrados, () => {
      renderTablaPermisos(filtrados);
    });
  pagination.render('pagination-permiso');
  renderTablaPermisos(filtrados);
}

// ================================
// POBLAR SELECT PERMISOS
// ================================
async function cargarSelectPermisos() {
  const select = document.getElementById('permiso'); if (!select) return;
  try {
    const res = await PermisoApi.getAll();
    select.innerHTML = '<option value="">Seleccione permiso...</option>';
    (res?.data || res || []).forEach(r => {
      const o = document.createElement('option');
      o.value = r.id_permiso;
      o.textContent = `${r.id_permiso} - ${r.fecha} (${r.estado})`;
      select.appendChild(o);
    });
  } catch (e) { mostrarError(e.message || 'Error cargando permisos'); }
}

// ================================
// POBLAR SELECT MOTIVOS
// ================================
async function cargarSelectMotivos(seleccionado, id_select) {
  const select = document.getElementById(id_select); if (!select) return;
  try {
    const res = await MotivoApi.getAll();
    select.innerHTML = '<option value="">Seleccione motivo...</option>';
    (res?.data || res || []).forEach(m => {
      const o = document.createElement('option');
      o.value = m.cod_motivo;
      o.textContent = `${m.nombre} (${m.dias} días)`;
      if (seleccionado && m.cod_motivo == seleccionado) o.selected = true;
      select.appendChild(o);
    });
  } catch (e) { mostrarError(e.message || 'Error cargando motivos'); }
}

// ================================
// POBLAR SELECT ESTADOS
// CORRECCIÓN: usar valores del DDL sin tildes
// ================================
function cargarSelectEstados() {
  const select = document.getElementById('estado'); if (!select) return;
  select.innerHTML = '<option value="">Seleccione el estado...</option>';
  ESTADOS_PERMISO_VALIDOS.forEach(e => {
    const o = document.createElement('option');
    o.value = e;
    o.textContent = e;
    select.appendChild(o);
  });
}

// ================================
// RENDER TABLA
// ================================
function renderTablaPermisos(lista) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No hay permisos registrados</td></tr>';
    return;
  }

  const puedeEscribir = sesionActual?.puedeEscribir ?? false;
  const itemsPagina = pagination.getPageItems(lista);

  itemsPagina.forEach(m => {
    const tr = document.createElement('tr');
    const botonesAccion = puedeEscribir
      ? `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${m.id_permiso}"><i class="bi bi-eye"></i></button>
         <button class="btn p-0 btn-editar" data-bs-toggle="modal" data-bs-target="#modalEditar" data-id="${m.id_permiso}"><i class="bi bi-pencil"></i></button>`
      : `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${m.id_permiso}"><i class="bi bi-eye"></i></button>`;
    tr.innerHTML = `<td class="d-none d-md-table-cell">${m.id_permiso}</td><td>${m.cod_motivo??'—'}</td><td class="d-none d-md-table-cell">${m.fecha??'—'}</td><td>${m.h_inicio??'—'}</td><td>${m.h_fin??'—'}</td><td>${m.estado??'—'}</td><td class="d-none d-md-table-cell">${truncar(m.descripcion,80)}</td>
    <td class="celda-acciones">
        <div class="acciones-tabla">
          ${botonesAccion}
        </div>  
      </td>`;
    tbody.appendChild(tr);
  });
}

// ================================
// VALIDAR DATOS DE PERMISO
// ================================
function validarDatosPermiso(data) {
  if (!data.cod_motivo) {
    mostrarError('El motivo es obligatorio'); return false;
  }
  // CORRECCIÓN: si se pasa estado, validar que sea uno del DDL
  if (data.estado) {
    const estadoNorm = normalizarEstado(data.estado);
    if (!ESTADOS_PERMISO_VALIDOS.includes(estadoNorm)) {
      mostrarError('El estado no es válido (debe ser ACEPTADO, REVISION o DENEGADO)'); return false;
    }
  }
  // CORRECCIÓN: validar rango de horas si ambas presentes
  if (data.h_inicio && data.h_fin) {
    const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!horaRegex.test(data.h_inicio)) {
      mostrarError('La hora de inicio no tiene un formato válido (HH:MM)'); return false;
    }
    if (!horaRegex.test(data.h_fin)) {
      mostrarError('La hora de fin no tiene un formato válido (HH:MM)'); return false;
    }
  }
  return true;
}

// ================================
// CREAR PERMISO
// ================================
function bindCrearPermiso() {
  const form = document.getElementById('formInsertar'); if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const data = {
      cod_motivo:  f.get('cod_motivo'),
      h_inicio:    f.get('h_inicio') || null,
      h_fin:       f.get('h_fin') || null,
      descripcion: f.get('descripcion') || null
    };
    if (!data.cod_motivo) { mostrarError('El motivo es obligatorio'); return; }
    try {
      await PermisoApi.create(data);
      await cargarPermisos();
      form.reset();
      mostrarExito('Permiso creado correctamente');
    } catch (err) { mostrarError(err.message || 'Error creando permiso'); }
  });
}

// ================================
// MODAL VER
// ================================
function bindModalVer() {
  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('.btn-ver'); if (!btn) return;
    const id = btn.dataset.id;
    const permiso = permisos.find(p => String(p.id_permiso) === String(id)); if (!permiso) return;
    
    // Usar modalVerBody que es el elemento correcto en el HTML
    const modalBody = document.getElementById('modalVerBody');
    modalBody.innerHTML = `
      <div class="mb-3">
        <p><strong>ID:</strong> ${permiso.id_permiso ?? '—'}</p>
        <p><strong>Motivo:</strong> ${permiso.cod_motivo ?? '—'}</p>
        <p><strong>Fecha:</strong> ${permiso.fecha ?? '—'}</p>
        <p><strong>Hora inicio:</strong> ${permiso.h_inicio ?? '—'}</p>
        <p><strong>Hora fin:</strong> ${permiso.h_fin ?? '—'}</p>
        <p><strong>Estado:</strong> ${permiso.estado ?? '—'}</p>
        <p><strong>Descripción:</strong> ${permiso.descripcion ?? '—'}</p>
      </div>
      <hr>
      <h6>Personas con este permiso:</h6>
      <div id="personas-container">
        <p class="text-muted">Cargando...</p>
      </div>
    `;
    
    // Cargar personas asynchronously
    try {
      const res = await PermisoApi.getPersonsByPermiso(id);
      const container = document.getElementById('personas-container');
      if (!res.data || !res.data.length) {
        container.innerHTML = '<p class="text-muted">No hay personas asignadas</p>';
        return;
      }
      let html = '<table class="table table-sm table-bordered mt-2"><thead><tr><th>ID</th><th>N° Funcionario</th><th>Nombre</th></tr></thead><tbody>';
      res.data.forEach(p => {
        html += `<tr><td>${p.id_bombero ?? '—'}</td><td>${p.n_funcionario ?? '—'}</td><td>${p.nombre ?? ''} ${p.apellidos ?? ''}</td></tr>`;
      });
      html += '</tbody></table>';
      container.innerHTML = html;
    } catch (err) {
      document.getElementById('personas-container').innerHTML = 
        `<p class="text-danger">${err.message || 'Error cargando personas'}</p>`;
    }
  });
}

// ================================
// MODAL EDITAR
// CORRECCIÓN: opciones del select usan valores del DDL sin tilde
// ================================
function bindModalEditar() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-editar'); if (!btn) return;
    const id = btn.dataset.id;
    const permiso = permisos.find(p => String(p.id_permiso) === String(id)); if (!permiso) return;
    const form = document.getElementById('formEditar');
    form.innerHTML = `
      <input type="hidden" id="editIdPermiso" value="${permiso.id_permiso}">
      <div class="mb-3"><label class="form-label">Motivo</label><input type="text" class="form-control" value="${permiso.cod_motivo??'—'}" readonly></div>
      <div class="mb-3"><label class="form-label">Fecha solicitud</label><input type="text" class="form-control" value="${permiso.fecha??'—'}" readonly></div>
      <div class="row">
        <div class="col-md-6 mb-3"><label class="form-label">Hora inicio</label><input type="time" class="form-control" id="editHInicio" value="${permiso.h_inicio??''}"></div>
        <div class="col-md-6 mb-3"><label class="form-label">Hora fin</label><input type="time" class="form-control" id="editHFin" value="${permiso.h_fin??''}"></div>
      </div>
      <div class="mb-3"><label class="form-label">Estado</label>
        <select class="form-select" id="editEstado">
          <option value="ACEPTADO" ${permiso.estado==='ACEPTADO'?'selected':''}>ACEPTADO</option>
          <option value="REVISION" ${permiso.estado==='REVISION'?'selected':''}>REVISION</option>
          <option value="DENEGADO" ${permiso.estado==='DENEGADO'?'selected':''}>DENEGADO</option>
        </select>
      </div>
      <div class="mb-3"><label class="form-label">Descripción</label><textarea class="form-control" id="editDescripcion" rows="3">${permiso.descripcion??''}</textarea></div>
      <div class="d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-primary" id="btnGuardarCambios">Guardar cambios</button>
      </div>`;
    document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
      const estadoRaw = document.getElementById('editEstado').value;
      // CORRECCIÓN: normalizar estado antes de validar y enviar
      const estadoNorm = normalizarEstado(estadoRaw);
      if (!ESTADOS_PERMISO_VALIDOS.includes(estadoNorm)) {
        mostrarError('El estado no es válido'); return;
      }
      const dataEditar = {
        h_inicio:    document.getElementById('editHInicio').value || null,
        h_fin:       document.getElementById('editHFin').value || null,
        estado:      estadoNorm,
        descripcion: document.getElementById('editDescripcion').value.trim() || null
      };
      try {
        await PermisoApi.update(id, {
          h_inicio:    document.getElementById('editHInicio').value || null,
          h_fin:       document.getElementById('editHFin').value || null,
          estado:      document.getElementById('editEstado').value,
          descripcion: document.getElementById('editDescripcion').value.trim() || null
        });
        await cargarPermisos();
        bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
        mostrarExito('Permiso actualizado correctamente');
      } catch (err) { mostrarError(err.message || 'Error actualizando permiso'); }
    });
  });
}

// ================================
// GESTIONAR ESTADO
// CORRECCIÓN: normalizar estado antes de enviar
// ================================
function bindGestionarEstado() {
  const form = document.getElementById('formGestionarEstado'); if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const id_permiso = f.get('id_permiso');
    const estadoRaw  = f.get('estado') || '';
    const estado     = normalizarEstado(estadoRaw);

    if (!id_permiso) { mostrarError('Seleccione un permiso'); return; }
    if (!estado || !ESTADOS_PERMISO_VALIDOS.includes(estado)) {
      mostrarError('El estado no es válido (debe ser ACEPTADO, REVISION o DENEGADO)'); return;
    }
    try {
      await PermisoApi.update(id_permiso, { estado: estado });
      await cargarPermisos();
      await cargarSelectPermisos();
      form.reset();
      mostrarExito('Estado actualizado correctamente');
    } catch (err) { mostrarError(err.message || 'Error actualizando estado'); }
  });
}