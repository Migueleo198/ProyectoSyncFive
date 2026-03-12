import TipoEmergenciaApi from '../api_f/TipoEmergenciaApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { mostrarError, mostrarExito } from '../helpers/utils.js';

let tiposEmergencia = [];
let sesionActual = null;

const nombresCampos = ['Nombre', 'Grupo'];
const camposBd      = ['nombre', 'grupo'];

// CORRECCIÓN: lista de grupos válidos para validar en insertar y editar
const GRUPOS_VALIDOS = ['Incendios', 'Accidentes', 'Emergencias médicas', 'Rescates'];

document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('tiposEmergencia');
  if (!sesionActual) return;

  cargarTiposEmergencia();
  bindFiltros();
  bindModalVer();

  if (sesionActual.puedeEscribir) {
    bindCrearTipoEmergencia();
    bindModalEditar();
    bindModalEliminar();
  }
});

async function cargarTiposEmergencia() {
  try {
    const r = await TipoEmergenciaApi.getAll();
    tiposEmergencia = r.data;
    renderTablaTiposEmergencia(tiposEmergencia);
    poblarFiltroGrupo(tiposEmergencia); // ← AÑADIR
  } catch (e) {
    mostrarError(e.message || 'Error cargando tipos de emergencia');
  }
}

function poblarFiltroGrupo(lista) {
  const select = document.getElementById('grupo');
  if (!select) return;
  const valorActual = select.value;
  select.innerHTML = '<option value="">Todos</option>';
  const gruposUnicos = [...new Set(lista.map(t => t.grupo).filter(Boolean))].sort();
  gruposUnicos.forEach(grupo => {
    const opt = document.createElement('option');
    opt.value = grupo;
    opt.textContent = grupo;
    select.appendChild(opt);
  });
  select.value = valorActual;
}

function renderTablaTiposEmergencia(lista) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';
  const puedeEscribir = sesionActual?.puedeEscribir ?? false;

  lista.forEach(e => {
    const tr = document.createElement('tr');
    const botonesAccion = puedeEscribir
      ? `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${e.codigo_tipo}"><i class="bi bi-eye"></i></button>
         <button class="btn p-0 btn-editar" data-bs-toggle="modal" data-bs-target="#modalEditar" data-id="${e.codigo_tipo}"><i class="bi bi-pencil"></i></button>
         <button class="btn p-0 btn-eliminar" data-bs-toggle="modal" data-bs-target="#modalEliminar" data-id="${e.codigo_tipo}"><i class="bi bi-trash3"></i></button>`
      : `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${e.codigo_tipo}"><i class="bi bi-eye"></i></button>`;
    tr.innerHTML = `<td>${e.codigo_tipo}</td><td>${e.nombre}</td><td>${e.grupo??''}</td>
    <td>
        <div  class="d-flex justify-content-around">
          ${botonesAccion}
        </div>  
      </td>`;
    tbody.appendChild(tr);
  });
}

// ================================
// VALIDAR DATOS
// ================================
function validarDatosTipo(data) {
  if (!data.nombre?.trim()) { mostrarError('El nombre es obligatorio'); return false; }
  if (data.nombre.trim().length > 100) { mostrarError('El nombre no puede superar los 100 caracteres'); return false; }
  // CORRECCIÓN: validar grupo contra lista de valores permitidos
  if (!data.grupo?.trim()) { mostrarError('El grupo es obligatorio'); return false; }
  if (!GRUPOS_VALIDOS.includes(data.grupo.trim())) {
    mostrarError(`El grupo no es válido. Opciones: ${GRUPOS_VALIDOS.join(', ')}`); return false;
  }
  return true;
}

// ================================
// FILTROS
// ================================
function bindFiltros() {
  document.getElementById('nombre')?.addEventListener('input', aplicarFiltros);
  document.getElementById('grupo')?.addEventListener('change', aplicarFiltros);
}

function aplicarFiltros() {
  const filtroNombre = document.getElementById('nombre')?.value.toLowerCase().trim() ?? '';
  const filtroGrupo  = document.getElementById('grupo')?.value ?? '';

  renderTablaTiposEmergencia(tiposEmergencia.filter(t => {
    const cumpleNombre = !filtroNombre || t.nombre?.toLowerCase().includes(filtroNombre);
    const cumpleGrupo  = !filtroGrupo  || t.grupo === filtroGrupo;
    return cumpleNombre && cumpleGrupo;
  }));
}

function bindCrearTipoEmergencia() {
  const form = document.getElementById('formInsertar'); if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const data = { nombre: f.get('nombre')?.trim(), grupo: f.get('grupo')?.trim() };
    if (!data.nombre) { mostrarError('El nombre es obligatorio'); return; }
    if (!data.grupo)  { mostrarError('El grupo es obligatorio'); return; }
    try {
      await TipoEmergenciaApi.create(data);
      await cargarTiposEmergencia();
      form.reset();
      mostrarExito('Tipo de emergencia creado correctamente');
    } catch (err) { mostrarError(err.message || 'Error creando tipo de emergencia'); }
  });
}

function bindModalVer() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-ver'); if (!btn) return;
    const tipo = tiposEmergencia.find(t => t.codigo_tipo == btn.dataset.id); if (!tipo) return;
    const modalBody = document.getElementById('modalVerBody');
    modalBody.innerHTML = '';
    nombresCampos.forEach((nombre, idx) => {
      const p = document.createElement('p');
      p.innerHTML = `<strong>${nombre}:</strong> ${tipo[camposBd[idx]]??''}`;
      modalBody.appendChild(p);
    });
  });
}

function bindModalEditar() {
  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('.btn-editar'); if (!btn) return;
    const id = btn.dataset.id;
    try {
      const r = await TipoEmergenciaApi.getById(id);
      const tipo = r.data; if (!tipo) return;
      const form = document.getElementById('formEditar');
      form.innerHTML = `
        <div class="row mb-3">
          <div class="col-lg-6"><label class="form-label">Nombre</label><input type="text" class="form-control" name="nombre" value="${tipo.nombre||''}" maxlength="100"></div>
          <div class="col-lg-6"><label class="form-label">Grupo</label>
            <select class="form-select" name="grupo">
              ${GRUPOS_VALIDOS.map(g => `<option value="${g}" ${tipo.grupo===g?'selected':''}>${g}</option>`).join('')}
            </select></div>
        </div>
        <div class="text-center"><button type="button" id="btnGuardarCambios" class="btn btn-primary">Guardar cambios</button></div>`;
      document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
        const data = {};
        camposBd.forEach(campo => { const input = form.querySelector(`[name="${campo}"]`); if (input) data[campo] = input.value?.trim(); });
        if (!validarDatosTipo(data)) return;
        try {
          await TipoEmergenciaApi.update(id, data);
          await cargarTiposEmergencia();
          bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
          mostrarExito('Tipo de emergencia actualizado correctamente');
        } catch (err) { mostrarError(err.message || 'Error actualizando'); }
      });
    } catch (err) { console.error(err); }
  });
}

function bindModalEliminar() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-eliminar'); if (!btn) return;
    document.getElementById('btnConfirmarEliminar').dataset.id = btn.dataset.id;
  });
  document.getElementById('btnConfirmarEliminar').addEventListener('click', async function () {
    const id = this.dataset.id; if (!id) return;
    try {
      await TipoEmergenciaApi.delete(id);
      await cargarTiposEmergencia();
      bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
      mostrarExito('Tipo de emergencia eliminado correctamente');
    } catch (err) { mostrarError('Este tipo de emergencia no se puede eliminar porque tiene emergencias asociadas'); }
  });
}