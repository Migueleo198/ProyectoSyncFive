import IncidenciaApi from '../api_f/IncidenciaApi.js';
import PersonaApi from '../api_f/PersonaApi.js';
import MaterialApi from '../api_f/MaterialApi.js';
import VehiculoApi from '../api_f/VehiculoApi.js';
import { authGuard } from '../helpers/authGuard.js';

let incidencias = [];
let personas = [];
let materiales = [];
let vehiculos = [];
let sesionActual = null;

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
  try { const r = await PersonaApi.getAll(); personas = r.data || []; } catch (e) { console.error(e); }
}

// ================================
// CARGAR MATERIALES
// ================================
async function cargarMateriales() {
  try { const r = await MaterialApi.getAll(); materiales = r.data || []; } catch (e) { console.error(e); }
}

// ================================
// CARGAR VEHÍCULOS
// ================================
async function cargarVehiculos() {
  try {
    const r = await VehiculoApi.getAll();
    vehiculos = r.data || [];
  } catch (e) {
    vehiculos = [];
  }
}

// ================================
// CARGAR INCIDENCIAS
// ================================
async function cargarIncidencias() {
  try {
    const r = await IncidenciaApi.getAll();
    incidencias = r.data || [];
    incidencias.forEach(i => {
      const persona = personas.find(p => p.id_bombero == i.id_bombero);
      i.nombre_responsable = persona ? `${persona.nombre} ${persona.apellidos}` : 'No asignado';
    });
    renderTablaIncidencias(incidencias);
  } catch (e) { console.error(e); }
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
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay incidencias para mostrar</td></tr>';
    return;
  }

  const puedeEscribir = sesionActual?.puedeEscribir ?? false;

  lista.forEach(i => {
    const id = i.cod_incidencia || i.id;
    const tr = document.createElement('tr');

    const botones = puedeEscribir
      ? `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${id}"><i class="bi bi-eye"></i></button>
         <button class="btn p-0 btn-editar" data-bs-toggle="modal" data-bs-target="#modalEditar" data-id="${id}"><i class="bi bi-pencil"></i></button>
         <button class="btn p-0 btn-eliminar" data-bs-toggle="modal" data-bs-target="#modalEliminar" data-id="${id}"><i class="bi bi-trash3"></i></button>`
      : `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${id}"><i class="bi bi-eye"></i></button>`;

    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${id}</td>
      <td>${i.fecha ? new Date(i.fecha).toLocaleDateString() : ''}</td>
      <td>${i.asunto ?? ''}</td>
      <td>${i.estado ?? ''}</td>
      <td class="d-none d-md-table-cell">${i.tipo ?? ''}</td>
      <td class="d-none d-md-table-cell">${i.nombre_responsable ?? ''}</td>
      <td>
        <div class="d-flex justify-content-around">
          ${botones}
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
  const filtroEstado = document.getElementById('estado')?.value;
  const filtroAsunto = document.getElementById('asunto')?.value?.toLowerCase();
  const filtrados = incidencias.filter(i => {
    let cumple = true;
    if (filtroEstado) cumple = cumple && i.estado === filtroEstado;
    if (filtroAsunto) cumple = cumple && i.asunto?.toLowerCase().includes(filtroAsunto);
    return cumple;
  });
  renderTablaIncidencias(filtrados);
}

const nombresCampos = ['ID','Fecha','Asunto','Estado','Tipo','Responsable','Material','Vehículo','Descripción'];
const camposBd      = ['cod_incidencia','fecha','asunto','estado','tipo','id_bombero','id_material','matricula','descripcion'];

// ================================
// MODAL VER
// ================================
function bindModalVer() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-ver');
    if (!btn) return;
    const id = btn.dataset.id;
    const inc = incidencias.find(i => i.cod_incidencia == id || i.id == id);
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
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-editar');
    if (!btn) return;
    const id = btn.dataset.id;
    const inc = incidencias.find(i => i.cod_incidencia == id || i.id == id);
    if (!inc) return;

    const form = document.getElementById('formEditar');
    if (!form) return;

    let personasOpts = '<option value="">Seleccione un responsable...</option>';
    personas.forEach(p => { personasOpts += `<option value="${p.id_bombero}" ${p.id_bombero == inc.id_bombero ? 'selected' : ''}>${p.nombre} ${p.apellidos}</option>`; });
    let materialesOpts = '<option value="">Seleccione un material...</option>';
    materiales.forEach(m => { materialesOpts += `<option value="${m.id_material}" ${m.id_material == inc.id_material ? 'selected' : ''}>${m.nombre}</option>`; });
    let vehiculosOpts = '<option value="">Seleccione un vehículo...</option>';
    vehiculos.forEach(v => { vehiculosOpts += `<option value="${v.matricula}" ${v.matricula == inc.matricula ? 'selected' : ''}>${v.nombre} (${v.matricula})</option>`; });

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
        <div class="col-lg-6"><label class="form-label">Asunto</label><input type="text" class="form-control" name="asunto" value="${inc.asunto || ''}"></div>
        <div class="col-lg-6"><label class="form-label">Responsable</label><select class="form-select" name="id_bombero">${personasOpts}</select></div>
      </div>
      <div class="row mb-3">
        <div class="col-lg-6"><label class="form-label">Material</label><select class="form-select" name="id_material">${materialesOpts}</select></div>
        <div class="col-lg-6"><label class="form-label">Vehículo</label><select class="form-select" name="matricula">${vehiculosOpts}</select></div>
      </div>
      <div class="mb-3"><label class="form-label">Descripción</label><textarea class="form-control" name="descripcion" rows="3">${inc.descripcion || ''}</textarea></div>
      <div class="text-center"><button type="button" id="btnGuardarCambios" class="btn btn-primary">Guardar cambios</button></div>
    `;

    document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
      const data = {};
      camposBd.forEach(campo => {
        if (campo === 'cod_incidencia') return;
        const input = form.querySelector(`[name="${campo}"]`);
        if (input) data[campo] = campo === 'id_material' ? (input.value ? parseInt(input.value) : null) : input.value;
      });
      try {
        await IncidenciaApi.update(id, data);
        await cargarIncidencias();
      } catch (err) { console.error(err); }
      bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
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
    try { await IncidenciaApi.delete(id); await cargarIncidencias(); } catch (e) { console.error(e); }
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
      fecha: f.get('fecha'), asunto: f.get('asunto'), estado: f.get('estado'),
      tipo: f.get('tipo'), id_bombero: f.get('id_bombero') || null,
      id_material: f.get('id_material') ? parseInt(f.get('id_material')) : null,
      matricula: f.get('matricula') || null, descripcion: f.get('descripcion') || ''
    };
    try {
      await IncidenciaApi.create(data);
      await cargarIncidencias();
      form.reset();
    } catch (err) { console.error(err); }
  });
}