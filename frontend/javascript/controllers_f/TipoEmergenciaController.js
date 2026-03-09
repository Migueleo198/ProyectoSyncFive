import TipoEmergenciaApi from '../api_f/TipoEmergenciaApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { mostrarError, mostrarExito } from '../helpers/utils.js';

let tiposEmergencia = [];
let sesionActual = null;

const nombresCampos = ['Nombre','Grupo'];
const camposBd      = ['nombre','grupo'];

document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('tiposEmergencia');
  if (!sesionActual) return;

  cargarTiposEmergencia();
  bindModalVer();

  if (sesionActual.puedeEscribir) {
    bindCrearTipoEmergencia();
    bindModalEditar();
    bindModalEliminar();
  }
});

// ================================
// CARGAR TIPOS DE EMERGENCIA
// ================================
async function cargarTiposEmergencia() {
  try { const r = await TipoEmergenciaApi.getAll(); tiposEmergencia = r.data; renderTablaTiposEmergencia(tiposEmergencia); }
  catch (e) { mostrarError(e.message || 'Error cargando tipos de emergencia'); }
}

// ================================
// RENDER TABLA
// ================================
function renderTablaTiposEmergencia(lista) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';
  const puedeEscribir = sesionActual?.puedeEscribir ?? false;

  lista.forEach(e => {
    const tr = document.createElement('tr');
    const botones = puedeEscribir
      ? `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${e.codigo_tipo}"><i class="bi bi-eye"></i></button>
         <button class="btn p-0 btn-editar" data-bs-toggle="modal" data-bs-target="#modalEditar" data-id="${e.codigo_tipo}"><i class="bi bi-pencil"></i></button>
         <button class="btn p-0 btn-eliminar" data-bs-toggle="modal" data-bs-target="#modalEliminar" data-id="${e.codigo_tipo}"><i class="bi bi-trash3"></i></button>`
      : `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${e.codigo_tipo}"><i class="bi bi-eye"></i></button>`;
    tr.innerHTML = `<td>${e.codigo_tipo}</td><td>${e.nombre}</td><td>${e.grupo??''}</td>
    <td>
        <div class="d-flex justify-content-around">
          ${botones}
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
}

// ================================
// CREAR TIPO DE EMERGENCIA
// ================================
function bindCrearTipoEmergencia() {
  const form = document.getElementById('formInsertar'); if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const data = { nombre: f.get('nombre')?.trim(), grupo: f.get('grupo')?.trim() };
    if (!data.nombre) { mostrarError('El nombre es obligatorio'); return; }
    if (!data.grupo) { mostrarError('El grupo es obligatorio'); return; }
    try { await TipoEmergenciaApi.create(data); await cargarTiposEmergencia(); form.reset(); mostrarExito('Tipo de emergencia creado correctamente'); }
    catch (err) { mostrarError(err.message || 'Error creando tipo de emergencia'); }
  });
}

// ================================
// MODAL VER
// ================================
function bindModalVer() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-ver'); if (!btn) return;
    const tipo = tiposEmergencia.find(t => t.codigo_tipo == btn.dataset.id); if (!tipo) return;
    const modalBody = document.getElementById('modalVerBody');
    modalBody.innerHTML = '';
    nombresCampos.forEach((nombre, idx) => {
      const p = document.createElement('p'); p.innerHTML = `<strong>${nombre}:</strong> ${tipo[camposBd[idx]]??''}`; modalBody.appendChild(p);
    });
  });
}

// ================================
// MODAL EDITAR
// ================================
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
          <div class="col-lg-6"><label class="form-label">Nombre</label><input type="text" class="form-control" name="nombre" value="${tipo.nombre||''}"></div>
          <div class="col-lg-6"><label class="form-label">Grupo</label>
            <select class="form-select" name="grupo">
              <option value="Incendios" ${tipo.grupo==='Incendios'?'selected':''}>Incendios</option>
              <option value="Accidentes" ${tipo.grupo==='Accidentes'?'selected':''}>Accidentes</option>
              <option value="Emergencias médicas" ${tipo.grupo==='Emergencias médicas'?'selected':''}>Emergencias médicas</option>
              <option value="Rescates" ${tipo.grupo==='Rescates'?'selected':''}>Rescates</option>
            </select></div>
        </div>
        <div class="text-center"><button type="button" id="btnGuardarCambios" class="btn btn-primary">Guardar cambios</button></div>`;
      document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
        const data = {};
        camposBd.forEach(campo => { const input = form.querySelector(`[name="${campo}"]`); if (input) data[campo] = input.value; });
        if (!data.nombre) { mostrarError('El nombre es obligatorio'); return; }
        if (!data.grupo) { mostrarError('El grupo es obligatorio'); return; }
        try {
          await TipoEmergenciaApi.update(id, data); await cargarTiposEmergencia();
          bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
          mostrarExito('Tipo de emergencia actualizado correctamente');
        } catch (err) { mostrarError(err.message || 'Error actualizando'); }
      });
    } catch (err) { console.error(err); }
  });
}

// ================================
// MODAL ELIMINAR
// ================================
function bindModalEliminar() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-eliminar'); if (!btn) return;
    document.getElementById('btnConfirmarEliminar').dataset.id = btn.dataset.id;
  });
  document.getElementById('btnConfirmarEliminar').addEventListener('click', async function () {
    const id = this.dataset.id; if (!id) return;
    try {
      await TipoEmergenciaApi.delete(id); await cargarTiposEmergencia();
      bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
    } catch (err) { mostrarError('Este tipo de emergencia no se puede eliminar porque tiene emergencias asociadas'); }
  });
} 