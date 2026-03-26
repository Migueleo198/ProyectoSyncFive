import { authGuard } from '../helpers/authGuard.js';
import { mostrarError, mostrarExito } from '../helpers/utils.js';
import { validarCheck, validarRangoFechas } from '../helpers/validacion.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';

// ================================
// CONSTANTES
// Según DDL Mantenimiento:
//   estado  ENUM('ABIERTO','REALIZADO') NOT NULL
//   f_inicio DATE NOT NULL
//   f_fin    DATE nullable  CHECK (f_fin >= f_inicio) si no null
// ================================
const ESTADOS_MANTENIMIENTO = ['ABIERTO', 'REALIZADO'];

let mantenimientos = [];
let personas = [];
let vehiculos = [];
let materiales = [];
let sesionActual = null;
const pagination = new PaginationHelper(15);
pagination.setLoadingCallback((isLoading) => {
    if (isLoading) {
        showTableLoading('#tabla tbody', 9);
    }
});

document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('mantenimiento');
  if (!sesionActual) return;

  cargarDatosIniciales();
  bindFiltros();

  if (sesionActual.puedeEscribir) {
    bindCrearMantenimiento();
    bindModalEditar();
  }

  if (sesionActual.puedeEliminar) {
    bindModalEliminar();
  }

  bindModalVer();
});

// ================================
// CARGAR DATOS INICIALES
// ================================
async function cargarDatosIniciales() {
  try {
    await Promise.all([cargarPersonas(), cargarVehiculos(), cargarMateriales()]);
    await cargarMantenimientos();
    poblarSelectPersonas();
    poblarSelectVehiculos();
    poblarSelectMateriales();
    renderTabla(mantenimientos);
  } catch (e) { console.error('Error cargando datos:', e); mostrarError('Error cargando datos'); }
}

async function cargarVehiculos()      { try { const r = await fetch('/api/vehiculos');      vehiculos     = (await r.json()).data || []; } catch(e) { console.error(e); } }
async function cargarMateriales()     { try { const r = await fetch('/api/materiales');     materiales    = (await r.json()).data || []; } catch(e) { console.error(e); } }
async function cargarPersonas()       { try { const r = await fetch('/api/personas');       personas      = (await r.json()).data || []; } catch(e) { console.error(e); } }
async function cargarMantenimientos() {
  try {
    showTableLoading('#tabla tbody', 9);
    const r = await fetch('/api/mantenimientos');
    mantenimientos = (await r.json()).data || [];
    pagination.setData(mantenimientos, () => {
      renderTabla(mantenimientos);
    });
    pagination.render('pagination-mantenimiento');
    renderTabla(mantenimientos);
  } catch(e) {
    mantenimientos = [];
    pagination.setData([], () => {
      renderTabla([]);
    });
    pagination.render('pagination-mantenimiento');
    renderTabla([]);
  }
}

// ================================
// POBLAR SELECTS
// ================================
function poblarSelectPersonas() {
  ['selectBomberoInsert','editBombero'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '<option value="">Seleccione un responsable...</option>';
    personas.forEach(p => { const o = document.createElement('option'); o.value = p.id_bombero; o.textContent = `${p.nombre} ${p.apellidos||''} (${p.n_funcionario||p.id_bombero})`; sel.appendChild(o); });
  });
}

function poblarSelectVehiculos() {
  const sel = document.getElementById('selectVehiculoInsert'); if (!sel) return;
  sel.innerHTML = '<option value="">Seleccione un vehículo...</option>';
  vehiculos.forEach(v => { const o = document.createElement('option'); o.value = v.matricula; o.textContent = `${v.nombre||''} (${v.matricula})`; sel.appendChild(o); });
}

function poblarSelectMateriales() {
  const sel = document.getElementById('selectMaterialInsert'); if (!sel) return;
  sel.innerHTML = '<option value="">Seleccione un material...</option>';
  materiales.forEach(m => { const o = document.createElement('option'); o.value = m.id_material; o.textContent = m.nombre||m.id_material; sel.appendChild(o); });
}

// ================================
// RENDER TABLA
// ================================
function renderTabla(lista) {
  const tbody = document.querySelector('#tabla tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!lista?.length) { tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">No hay mantenimientos registrados</td></tr>'; return; }

  const puedeEscribir = sesionActual?.puedeEscribir ?? false;
  const puedeEliminar = sesionActual?.puedeEliminar ?? false;
  const itemsPagina = pagination.getPageItems(lista);

  itemsPagina.forEach(m => {
    const tr = document.createElement('tr');
    const botonesAccion = puedeEscribir
      ? `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${m.cod_mantenimiento}"><i class="bi bi-eye"></i></button>
         <button class="btn p-0 btn-editar" data-bs-toggle="modal" data-bs-target="#modalEditar" data-id="${m.cod_mantenimiento}"><i class="bi bi-pencil"></i></button>
         ${puedeEliminar
           ? `<button class="btn p-0 btn-eliminar" data-bs-toggle="modal" data-bs-target="#modalEliminar" data-id="${m.cod_mantenimiento}"><i class="bi bi-trash3"></i></button>`
           : ''}`
      : `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${m.cod_mantenimiento}"><i class="bi bi-eye"></i></button>`;
    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${m.cod_mantenimiento??''}</td>
      <td>${m.nombre_bombero||''}</td><td class="d-none d-lg-table-cell">${m.tipo||'-'}</td>
      <td>${m.recurso||'-'}</td><td class="d-none d-md-table-cell">${m.estado??''}</td>
      <td class="d-none d-xl-table-cell">${m.descripcion||'-'}</td>
      <td class="d-none d-md-table-cell">${m.f_inicio||'-'}</td><td class="d-none d-lg-table-cell">${m.f_fin||'-'}</td>
      <td>
        <div class="d-flex justify-content-center gap-2">
          ${botonesAccion}
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
}

// ================================
// FILTROS
// ================================
function bindFiltros() {
  document.getElementById('filtroResponsable')?.addEventListener('input', aplicarFiltros);
  document.getElementById('filtroEstado')?.addEventListener('change', aplicarFiltros);
  document.getElementById('filtroTipo')?.addEventListener('change', aplicarFiltros);
}

function aplicarFiltros() {
  pagination.goToPage(0);
  const fr = document.getElementById('filtroResponsable')?.value?.toLowerCase();
  const fe = document.getElementById('filtroEstado')?.value;
  const ft = document.getElementById('filtroTipo')?.value;
  const filtrados = mantenimientos.filter(m => {
    let c = true;
    if (fr) c = c && (m.nombre_bombero?.toLowerCase().includes(fr) || m.id_bombero?.toLowerCase().includes(fr));
    if (fe) c = c && m.estado === fe;
    if (ft) c = c && m.tipo === ft;
    return c;
  });
  pagination.setData(filtrados, () => {
      renderTabla(filtrados);
    });
  pagination.render('pagination-mantenimiento');
  renderTabla(filtrados);
}

// ================================
// VALIDAR MANTENIMIENTO
// Según DDL Mantenimiento:
//   id_bombero FK         NOT NULL
//   estado     ENUM('ABIERTO','REALIZADO') NOT NULL
//   f_inicio   DATE       NOT NULL
//   f_fin      DATE       nullable  CHECK (f_fin >= f_inicio) si no null
//   descripcion TEXT      nullable
// ================================
function validarMantenimiento(id_bombero, estado, f_inicio, f_fin = null) {
  if (!id_bombero) {
    mostrarError('Seleccione un responsable.');
    return false;
  }
  if (!validarCheck(estado, ESTADOS_MANTENIMIENTO)) {
    mostrarError('El estado no es válido. Debe ser ABIERTO o REALIZADO.');
    return false;
  }
  if (!f_inicio) {
    mostrarError('La fecha de inicio es obligatoria.');
    return false;
  }
  if (estado === 'REALIZADO' && !f_fin) {
    mostrarError('Antes de marcar el mantenimiento como REALIZADO, debes añadir la fecha de fin.');
    return false;
  }
  if (estado !== 'REALIZADO' && f_fin) {
    mostrarError('La fecha de fin solo puede informarse cuando el mantenimiento está en estado REALIZADO.');
    return false;
  }
  // CHECK (f_fin >= f_inicio) solo si f_fin tiene valor
  if (f_fin && !validarRangoFechas(f_inicio, f_fin)) {
    mostrarError('La fecha de fin debe ser igual o posterior a la fecha de inicio.');
    return false;
  }
  return true;
}

function sincronizarRequerimientoFechaFin(selectEstado, inputFechaFin) {
  if (!selectEstado || !inputFechaFin) return;

  const actualizarRequerido = () => {
    inputFechaFin.required = selectEstado.value === 'REALIZADO';
    inputFechaFin.setCustomValidity('');
  };

  selectEstado.addEventListener('change', actualizarRequerido);
  actualizarRequerido();
}

// ================================
// CREAR MANTENIMIENTO
// ================================
async function crearMantenimiento(form, tipo) {
  const f = new FormData(form);
  const id_bombero  = f.get('id_bombero');
  const estado      = 'ABIERTO';
  const f_inicio    = f.get('f_inicio');
  const descripcion = f.get('descripcion')?.trim() || null;
  const matricula   = f.get('matricula') || null;
  const id_material = f.get('id_material') || null;

  // ── Validación ──
  if (!validarMantenimiento(id_bombero, estado, f_inicio)) return;
  if (!['vehiculo', 'material'].includes(tipo)) {
    mostrarError('Seleccione si el mantenimiento es sobre un vehículo o un material.');
    return;
  }
  if (tipo === 'vehiculo' && !matricula) {
    mostrarError('Seleccione un vehículo.');
    return;
  }
  if (tipo === 'material' && !id_material) {
    mostrarError('Seleccione un material.');
    return;
  }

  try {
    const r = await fetch('/api/mantenimientos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_bombero, estado, f_inicio, descripcion, tipo_recurso: tipo, matricula, id_material })
    });
    const result = await r.json();
    if (!r.ok) throw new Error(result.message || 'Error al crear');

    await cargarMantenimientos();
    renderTabla(mantenimientos);
    form.reset();
    actualizarSelectorTipo(form);
    mostrarExito('Mantenimiento creado correctamente');
  } catch (err) { mostrarError(err.message); }
}

function actualizarSelectorTipo(form) {
  if (!form) return;

  const selectTipo = form.querySelector('[name="tipo_recurso"]');
  const labelRecurso = document.getElementById('labelRecursoInsert');
  const contVacio = document.getElementById('contenedorRecursoVacio');
  const contVehiculo = document.getElementById('contenedorVehiculoInsert');
  const contMaterial = document.getElementById('contenedorMaterialInsert');
  const selectVehiculo = document.getElementById('selectVehiculoInsert');
  const selectMaterial = document.getElementById('selectMaterialInsert');

  if (!selectTipo || !contVacio || !contVehiculo || !contMaterial || !selectVehiculo || !selectMaterial) return;

  const tipo = selectTipo.value;
  const esVehiculo = tipo === 'vehiculo';
  const esMaterial = tipo === 'material';

  contVacio.classList.toggle('d-none', esVehiculo || esMaterial);
  contVehiculo.classList.toggle('d-none', !esVehiculo);
  contMaterial.classList.toggle('d-none', !esMaterial);

  selectVehiculo.required = esVehiculo;
  selectMaterial.required = esMaterial;
  selectVehiculo.disabled = !esVehiculo;
  selectMaterial.disabled = !esMaterial;

  if (labelRecurso) {
    labelRecurso.textContent = esVehiculo ? 'Vehiculo' : esMaterial ? 'Material' : 'Vehiculo/Material';
    labelRecurso.setAttribute('for', esMaterial ? 'selectMaterialInsert' : 'selectVehiculoInsert');
  }

  if (!esVehiculo) selectVehiculo.value = '';
  if (!esMaterial) selectMaterial.value = '';
}

function bindCrearMantenimiento() {
  const form = document.getElementById('formInsertarMantenimiento');
  if (!form) return;
  form.querySelector('[name="tipo_recurso"]')?.addEventListener('change', () => actualizarSelectorTipo(form));
  actualizarSelectorTipo(form);
  form.addEventListener('reset', () => {
    window.requestAnimationFrame(() => actualizarSelectorTipo(form));
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    crearMantenimiento(form, form.querySelector('[name="tipo_recurso"]')?.value);
  });
}

// ================================
// MODAL VER
// ================================
function bindModalVer() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-ver');
    if (!btn) return;
    const mant = mantenimientos.find(m => m.cod_mantenimiento == btn.dataset.id);
    if (!mant) return;
    const modalBody = document.getElementById('modalVerBody');
    if (!modalBody) return;
    modalBody.innerHTML = `
      <p><strong>ID:</strong> ${mant.cod_mantenimiento}</p>
      <p><strong>Responsable:</strong> ${mant.nombre_bombero||mant.id_bombero||'-'}</p>
      <p><strong>Tipo:</strong> ${mant.tipo||'-'}</p>
      <p><strong>Vehículo/Material:</strong> ${mant.recurso||'-'}</p>
      <p><strong>Estado:</strong> ${mant.estado}</p>
      <p><strong>Fecha inicio:</strong> ${mant.f_inicio||'-'}</p>
      <p><strong>Fecha fin:</strong> ${mant.f_fin||'-'}</p>
      <p><strong>Descripción:</strong> ${mant.descripcion||'-'}</p>`;
  });
}

// ================================
// MODALES DE ESCRITURA
// ================================
function bindModalEditar() {
  sincronizarRequerimientoFechaFin(document.getElementById('editEstado'), document.getElementById('editFFin'));

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-editar');
    if (!btn) return;
    const mant = mantenimientos.find(m => m.cod_mantenimiento == btn.dataset.id);
    if (!mant) return;
    document.getElementById('editId').value = mant.cod_mantenimiento;
    document.getElementById('editFInicio').value = mant.f_inicio || '';
    document.getElementById('editFFin').value = mant.f_fin || '';
    document.getElementById('editDescripcion').value = mant.descripcion || '';
    const selEstado = document.getElementById('editEstado');
    if (selEstado) {
      selEstado.value = mant.estado;
      selEstado.dispatchEvent(new Event('change'));
    }
    const selBombero = document.getElementById('editBombero');
    if (selBombero) {
      selBombero.innerHTML = '<option value="">Seleccione un responsable...</option>';
      personas.forEach(p => { const o = document.createElement('option'); o.value = p.id_bombero; o.textContent = `${p.nombre} ${p.apellidos||''}`; if (p.id_bombero === mant.id_bombero) o.selected = true; selBombero.appendChild(o); });
    }
  });

  document.getElementById('btnGuardarCambios')?.addEventListener('click', async function () {
    const id          = document.getElementById('editId').value;
    const id_bombero  = document.getElementById('editBombero').value;
    const estado      = document.getElementById('editEstado').value;
    const f_inicio    = document.getElementById('editFInicio').value;
    const f_fin       = document.getElementById('editFFin').value || null;
    const descripcion = document.getElementById('editDescripcion').value.trim() || null;

    // ── Validación ──
    if (!validarMantenimiento(id_bombero, estado, f_inicio, f_fin)) return;

    try {
      const r = await fetch(`/api/mantenimientos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_bombero, estado, f_inicio, f_fin, descripcion })
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.message || 'Error al actualizar');
      await cargarMantenimientos();
      renderTabla(mantenimientos);
      bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
      mostrarExito('Mantenimiento actualizado correctamente');
    } catch (err) { mostrarError(err.message); }
  });

}

function bindModalEliminar() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-eliminar');
    if (!btn) return;
    const mant = mantenimientos.find(m => m.cod_mantenimiento == btn.dataset.id);
    const btnConfirm = document.getElementById('btnConfirmarEliminar');
    if (btnConfirm) btnConfirm.dataset.id = btn.dataset.id;
    const modalBody = document.querySelector('#modalEliminar .modal-body');
    if (modalBody && mant) modalBody.innerHTML = `¿Eliminar el mantenimiento <strong>#${mant.cod_mantenimiento}</strong>?<p class="text-muted mb-0">Esta acción no se puede deshacer.</p>`;
  });

  document.getElementById('btnConfirmarEliminar')?.addEventListener('click', async function () {
    const id = this.dataset.id;
    if (!id) return;
    try {
      const r = await fetch(`/api/mantenimientos/${id}`, { method: 'DELETE' });
      if (!r.ok) { const res = await r.json().catch(()=>({})); mostrarError(res.message || 'Error al eliminar'); return; }
      await cargarMantenimientos();
      renderTabla(mantenimientos);
      bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
      mostrarExito('Mantenimiento eliminado correctamente');
    } catch (err) { mostrarError(err.message || 'Error'); }
  });
}

window.MantenimientoController = { cargarMantenimientos, aplicarFiltros };