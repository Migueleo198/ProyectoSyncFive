import IncidenciaApi from '../api_f/IncidenciaApi.js';
import PersonaApi from '../api_f/PersonaApi.js';
import MaterialApi from '../api_f/MaterialApi.js';
import VehiculoApi from '../api_f/VehiculoApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { validarMatriculaEspanola } from '../helpers/validacion.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';

let incidencias = [];
let personas = [];
let materiales = [];
let vehiculos = [];
let sesionActual = null;
const pagination = new PaginationHelper(15);
pagination.setLoadingCallback((isLoading) => {
    if (isLoading) {
        showTableLoading('#tabla tbody', 6);
    }
});

// CORRECCIÓN: estados válidos según DDL — ENUM('ABIERTA','CERRADA')
const ESTADOS_INCIDENCIA_VALIDOS = ['ABIERTA', 'CERRADA'];

document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('incidencias');
  if (!sesionActual) return;

  cargarDatosIniciales();
  bindFiltros();

  if (sesionActual.puedeEscribir) {
    bindCrearIncidencia();
    bindModalEliminar();
    bindModalEditar();
  }

  bindModalVer();
});

// ================================
// CARGAR DATOS INICIALES
// ================================
async function cargarDatosIniciales() {
  try {
    await Promise.all([cargarPersonas(), cargarMateriales(), cargarVehiculos(), cargarIncidencias()]);
    poblarSelectores();
  } catch (e) {
    console.error('Error cargando datos:', e);
  }
}

// ================================
// CARGAR PERSONAS
// ================================
async function cargarPersonas() {
  try { const r = await PersonaApi.getAll(); personas = r?.data || r || []; } catch (e) { console.error(e); }
}

// ================================
// CARGAR MATERIALES
// ================================
async function cargarMateriales() {
  try { const r = await MaterialApi.getAll(); materiales = r?.data || r || []; } catch (e) { console.error(e); }
}

// ================================
// CARGAR VEHÍCULOS
// ================================
async function cargarVehiculos() {
  try {
    const r = await VehiculoApi.getAll();
    vehiculos = r?.data || r || [];
  } catch (e) {
    vehiculos = [];
  }
}

// ================================
// CARGAR INCIDENCIAS
// ================================
async function cargarIncidencias() {
  try {
    showTableLoading('#tabla tbody', 6);
    const r = await IncidenciaApi.getAll();
    incidencias = r?.data || r || [];
    incidencias.forEach(i => {
      const persona = personas.find(p => p.id_bombero == i.id_bombero);
      i.nombre_responsable = persona ? `${persona.nombre} ${persona.apellidos}` : 'No asignado';
    });
    pagination.setData(incidencias, () => {
      renderTablaIncidencias(incidencias);
    });
    pagination.render('pagination-incidencia');
    renderTablaIncidencias(incidencias);
  } catch (e) {
    incidencias = [];
    pagination.setData([], () => {
      renderTablaIncidencias([]);
    });
    pagination.render('pagination-incidencia');
    renderTablaIncidencias([]);
  }
}

// ================================
// POBLAR SELECTORES DEL FORMULARIO
// ================================
function poblarSelectores() {
  const selResp = document.getElementById('selectResponsable');
  if (selResp) {
    selResp.innerHTML = '<option value="">Seleccione un responsable...</option>';
    personas.forEach(p => {
      const o = document.createElement('option');
      o.value = p.id_bombero;
      o.textContent = `${p.nombre} ${p.apellidos} (${p.id_bombero})`;
      selResp.appendChild(o);
    });
  }
  const selMat = document.getElementById('selectMaterial');
  if (selMat) {
    selMat.innerHTML = '<option value="">Seleccione un material...</option>';
    materiales.forEach(m => {
      const o = document.createElement('option');
      o.value = m.id_material;
      o.textContent = `${m.nombre} (ID: ${m.id_material})`;
      selMat.appendChild(o);
    });
  }
  const selVeh = document.getElementById('selectVehiculo');
  if (selVeh) {
    selVeh.innerHTML = '<option value="">Seleccione un vehículo...</option>';
    vehiculos.forEach(v => {
      const o = document.createElement('option');
      o.value = v.matricula;
      o.textContent = `${v.nombre} (${v.matricula})`;
      selVeh.appendChild(o);
    });
  }
}

// ================================
// RENDER TABLA
// ================================
function renderTablaIncidencias(lista) {
  const tbody = document.querySelector('#tabla tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay incidencias para mostrar</td></tr>';
    return;
  }

  const puedeEscribir = sesionActual?.puedeEscribir ?? false;
  const itemsPagina = pagination.getPageItems(lista);

  itemsPagina.forEach(i => {
    const id = i.id_incidencia;
    const tr = document.createElement('tr');

    const botonesAccion = puedeEscribir
      ? `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${id}"><i class="bi bi-eye"></i></button>
         <button class="btn p-0 btn-editar" data-bs-toggle="modal" data-bs-target="#modalEditar" data-id="${id}"><i class="bi bi-pencil"></i></button>
         <button class="btn p-0 btn-eliminar" data-bs-toggle="modal" data-bs-target="#modalEliminar" data-id="${id}"><i class="bi bi-trash3"></i></button>`
      : `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${id}"><i class="bi bi-eye"></i></button>`;

    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${id}</td>
      <td>${i.fecha ? new Date(i.fecha).toLocaleDateString() : ''}</td>
      <td class="d-none d-md-table-cell">${i.asunto ?? ''}</td>
      <td>${i.estado ?? ''}</td>
      <td class="d-none d-md-table-cell">${i.nombre_responsable ?? ''}</td>
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
// FILTROS
// ================================
function bindFiltros() {
  document.getElementById('estado')?.addEventListener('change', aplicarFiltros);
  document.getElementById('asunto')?.addEventListener('input', aplicarFiltros);
}

// ================================
// APLICAR FILTROS
// ================================
function aplicarFiltros() {
  pagination.goToPage(0);
  const filtroEstado = document.getElementById('estado')?.value;
  const filtroAsunto = document.getElementById('asunto')?.value?.toLowerCase();
  const filtrados = incidencias.filter(i => {
    let cumple = true;
    if (filtroEstado) cumple = cumple && i.estado === filtroEstado;
    if (filtroAsunto) cumple = cumple && i.asunto?.toLowerCase().includes(filtroAsunto);
    return cumple;
  });
  pagination.setData(filtrados, () => {
      renderTablaIncidencias(filtrados);
    });
  pagination.render('pagination-incidencia');
  renderTablaIncidencias(filtrados);
}

const nombresCampos = ['ID','Fecha','Asunto','Estado','Responsable','Material','Vehículo','Descripción'];
const camposBd      = ['id_incidencia','fecha','asunto','estado','id_bombero','id_material','matricula','descripcion'];

// ================================
// VALIDAR DATOS DE INCIDENCIA
// ================================
function validarDatosIncidencia(data) {
  if (!data.fecha) {
    mostrarError('La fecha es obligatoria'); return false;
  }
  if (isNaN(Date.parse(data.fecha))) {
    mostrarError('La fecha no tiene un formato válido'); return false;
  }
  if (!data.asunto?.trim()) {
    mostrarError('El asunto es obligatorio'); return false;
  }
  if (data.asunto.trim().length > 200) {
    mostrarError('El asunto no puede superar los 200 caracteres'); return false;
  }
  // CORRECCIÓN: validar estado contra ENUM del DDL
  if (!data.estado || !ESTADOS_INCIDENCIA_VALIDOS.includes(data.estado.toUpperCase())) {
    mostrarError('El estado no es válido (debe ser ABIERTA o CERRADA)'); return false;
  }
  // CORRECCIÓN: validar matrícula si se proporciona
  if (data.matricula && !validarMatriculaEspanola(data.matricula)) {
    mostrarError('La matrícula no tiene un formato válido'); return false;
  }
  // NUEVA: validar exclusión mutua material/vehículo
  const tieneMaternal = data.id_material && data.id_material !== '';
  const tieneVehiculo = data.matricula && data.matricula !== '';

  if (tieneMaternal && tieneVehiculo) {
    mostrarError('No puedes asignar Material y Vehículo a la vez. Elige uno solo'); return false;
  }
  if (!tieneMaternal && !tieneVehiculo) {
    mostrarError('Debe asignarse al menos un Material o un Vehículo'); return false;
  }
  return true;
}

// ================================
// MODAL VER
// ================================
function bindModalVer() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-ver');
    if (!btn) return;
    const id = btn.dataset.id;
    const inc = incidencias.find(i => i.id_incidencia == id);
    if (!inc) return;
    const modalBody = document.getElementById('modalVerBody');
    if (!modalBody) return;
    modalBody.innerHTML = '';
    nombresCampos.forEach((nombre, index) => {
      const campo = camposBd[index];
      let valor = inc[campo] ?? '';
      if (campo === 'fecha') valor = valor ? new Date(valor).toLocaleDateString() : '';
      if (campo === 'id_bombero') { const p = personas.find(x => x.id_bombero == valor); valor = p ? `${p.nombre} ${p.apellidos}` : 'No asignado'; }
      if (campo === 'id_material') { const m = materiales.find(x => x.id_material == valor); valor = m ? m.nombre : 'No asignado'; }
      if (campo === 'matricula') { const v = vehiculos.find(x => x.matricula == valor); valor = v ? `${v.nombre} (${v.matricula})` : valor || 'No asignado'; }
      const p = document.createElement('p');
      p.innerHTML = `<strong>${nombre}:</strong> ${valor}`;
      modalBody.appendChild(p);
    });
  });
}

// ================================
// MODAL EDITAR
// ================================
function bindModalEditar() {
  // Listener de delegación para botón editar
  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('.btn-editar');
    if (!btn) return;
    const id = btn.dataset.id;
    const inc = incidencias.find(i => i.id_incidencia == id);
    if (!inc) return;

    const form = document.getElementById('formEditar');
    if (!form) return;

    // Generar opciones de selectores
    let personasOpts = '<option value="">Seleccione un responsable...</option>';
    personas.forEach(p => { personasOpts += `<option value="${p.id_bombero}" ${p.id_bombero == inc.id_bombero ? 'selected' : ''}>${p.nombre} ${p.apellidos}</option>`; });
    let materialesOpts = '<option value="">Seleccione un material...</option>';
    materiales.forEach(m => { materialesOpts += `<option value="${m.id_material}" ${m.id_material == inc.id_material ? 'selected' : ''}>${m.nombre}</option>`; });
    let vehiculosOpts = '<option value="">Seleccione un vehículo...</option>';
    vehiculos.forEach(v => { vehiculosOpts += `<option value="${v.matricula}" ${v.matricula == inc.matricula ? 'selected' : ''}>${v.nombre} (${v.matricula})</option>`; });

    // Regenerar HTML del formulario (limpia listeners antiguos implícitamente)
    form.innerHTML = `
      <div class="row mb-3">
        <div class="col-lg-4"><label class="form-label">Fecha</label><input type="date" class="form-control" name="fecha" value="${inc.fecha || ''}"></div>
        <div class="col-lg-4"><label class="form-label">Estado</label>
          <select class="form-select" name="estado">
            <option value="ABIERTA" ${inc.estado==='ABIERTA'?'selected':''}>Abierta</option>
            <option value="CERRADA" ${inc.estado==='CERRADA'?'selected':''}>Cerrada</option>
          </select></div>
        <div class="col-lg-4"><label class="form-label">Tipo</label><input type="text" class="form-control" name="tipo" value="${inc.tipo || ''}"></div>
      </div>
      <div class="row mb-3">
        <div class="col-lg-6"><label class="form-label">Asunto</label><input type="text" class="form-control" name="asunto" value="${inc.asunto || ''}" maxlength="200"></div>
        <div class="col-lg-6"><label class="form-label">Responsable</label><select class="form-select" name="id_bombero">${personasOpts}</select></div>
      </div>
      <div class="row mb-3">
        <div class="col-lg-6"><label class="form-label">Material</label><select class="form-select" name="id_material">${materialesOpts}</select></div>
        <div class="col-lg-6"><label class="form-label">Vehículo</label><select class="form-select" name="matricula">${vehiculosOpts}</select></div>
      </div>
      <div class="mb-3"><label class="form-label">Descripción</label><textarea class="form-control" name="descripcion" rows="3">${inc.descripcion || ''}</textarea></div>
    `;

    // Agregar listener al botón de guardar (que está fuera del form)
    const btnGuardar = document.getElementById('btnGuardarCambios');
    if (btnGuardar) {
      btnGuardar.onclick = async () => {
        const data = {};
        camposBd.forEach(campo => {
          if (campo === 'id_incidencia') return;
          const input = form.querySelector(`[name="${campo}"]`);
          if (input) data[campo] = campo === 'id_material' ? (input.value ? parseInt(input.value) : null) : input.value;
        });
        // Normalizar estado
        if (data.estado) data.estado = data.estado.toUpperCase();
        // Validar antes de guardar
        if (!validarDatosIncidencia(data)) return;
        try {
          await IncidenciaApi.update(id, data);
          await cargarIncidencias();
          bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
          mostrarExito('Incidencia actualizada');
        } catch (err) {
          mostrarError(err.message || 'Error al guardar cambios');
        }
      };
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
    try { await IncidenciaApi.delete(id); await cargarIncidencias(); } catch (e) { mostrarError(e.message || 'Error al eliminar'); }
    bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
  });
}

// ================================
// CREAR INCIDENCIA
// ================================
function bindCrearIncidencia() {
  const form = document.getElementById('formInsertar');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const data = {
      fecha:       f.get('fecha'),
      asunto:      f.get('asunto'),
      // CORRECCIÓN: forzar mayúsculas para comparar con ENUM del DDL
      estado:      (f.get('estado') || '').toUpperCase(),
      tipo:        f.get('tipo'),
      id_bombero:  f.get('id_bombero') || null,
      id_material: f.get('id_material') ? parseInt(f.get('id_material')) : null,
      matricula:   f.get('matricula') || null,
      descripcion: f.get('descripcion') || ''
    };
    // CORRECCIÓN: validar antes de enviar
    if (!validarDatosIncidencia(data)) return;
    try {
      await IncidenciaApi.create(data);
      await cargarIncidencias();
      form.reset();
    } catch (err) { mostrarError(err.message || 'Error creando incidencia'); }
  });
}

// ================================
// ALERTAS
// ================================
function mostrarError(msg) {
  const container = document.getElementById('alert-container');
  if (!container) return;
  const alertId = 'alert-' + Date.now();
  container.insertAdjacentHTML('beforeend', `
    <div id="${alertId}" class="alert alert-danger alert-dismissible fade show shadow" role="alert">
      <strong>Error:</strong> ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`);
  setTimeout(() => { const a = document.getElementById(alertId); if (a) { a.classList.remove('show'); setTimeout(() => a.remove(), 150); } }, 5000);
}

function mostrarExito(msg) {
  const container = document.getElementById('alert-container');
  if (!container) return;
  const alertId = 'alert-' + Date.now();
  container.insertAdjacentHTML('beforeend', `
    <div id="${alertId}" class="alert alert-success alert-dismissible fade show shadow" role="alert">
      <strong>Éxito:</strong> ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`);
  setTimeout(() => { const a = document.getElementById(alertId); if (a) { a.classList.remove('show'); setTimeout(() => a.remove(), 150); } }, 5000);
}