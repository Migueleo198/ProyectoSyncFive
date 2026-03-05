import MotivoApi from '../api_f/MotivoApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { truncar, mostrarError, mostrarExito } from '../helpers/utils.js';

let motivos = [];
let sesionActual = null;

document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('motivos');
  if (!sesionActual) return;

  cargarMotivos();
  bindModalVer();

  if (sesionActual.puedeEscribir) {
    bindCrearMotivo();
    bindModalEditar();
    bindModalEliminar();
  }
});

async function cargarMotivos() {
  try { const r = await MotivoApi.getAll(); motivos = r.data; renderTablaMotivos(motivos); }
  catch (e) { mostrarError(e.message || 'Error cargando motivos'); }
}

function renderTablaMotivos(lista) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';
  if (!lista.length) { tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No hay motivos registrados</td></tr>'; return; }

  const puedeEscribir = sesionActual?.puedeEscribir ?? false;

  lista.forEach(m => {
    const tr = document.createElement('tr');
    const botones = puedeEscribir
      ? `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${m.cod_motivo}"><i class="bi bi-eye"></i></button>
         <button class="btn p-0 btn-editar" data-bs-toggle="modal" data-bs-target="#modalEditar" data-id="${m.cod_motivo}"><i class="bi bi-pencil text-primary"></i></button>
         <button class="btn p-0 btn-eliminar" data-bs-toggle="modal" data-bs-target="#modalEliminar" data-id="${m.cod_motivo}"><i class="bi bi-trash3 text-danger"></i></button>`
      : `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${m.cod_motivo}"><i class="bi bi-eye"></i></button>`;
    tr.innerHTML = `<td class="d-none d-md-table-cell">${m.cod_motivo}</td><td>${m.nombre??''}</td><td class="d-none d-md-table-cell">${m.dias??''}</td><td class="d-flex justify-content-around">${botones}</td>`;
    tbody.appendChild(tr);
  });
}

function bindCrearMotivo() {
  const form = document.getElementById('formMotivo'); if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const data = { nombre: f.get('nombre'), dias: f.get('dias') };
    if (!data.nombre || !data.dias) { mostrarError('Nombre y días son obligatorios'); return; }
    try { await MotivoApi.create(data); await cargarMotivos(); form.reset(); mostrarExito('Motivo creado correctamente'); }
    catch (err) { mostrarError(err.message || 'Error creando motivo'); }
  });
}

function bindModalVer() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-ver'); if (!btn) return;
    const motivo = motivos.find(m => String(m.cod_motivo) === String(btn.dataset.id)); if (!motivo) return;
    const modalBody = document.getElementById('modalVerBody');
    modalBody.innerHTML = '';
    [{ label:'Código', valor:motivo.cod_motivo },{ label:'Nombre', valor:motivo.nombre },{ label:'Días', valor:motivo.dias }].forEach(({label,valor}) => {
      const p = document.createElement('p'); p.innerHTML = `<strong>${label}:</strong> ${valor}`; modalBody.appendChild(p);
    });
  });
}

function bindModalEditar() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-editar'); if (!btn) return;
    const id = btn.dataset.id;
    const motivo = motivos.find(m => String(m.cod_motivo) === String(id)); if (!motivo) return;
    const form = document.getElementById('formEditar');
    form.innerHTML = `
      <div class="mb-3"><label class="form-label">Nombre</label><input type="text" class="form-control" id="editNombre" value="${motivo.nombre}"></div>
      <div class="mb-3"><label class="form-label">Días</label><input type="number" class="form-control" id="editDias" value="${motivo.dias}" min="1"></div>
      <div class="d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-primary" id="btnGuardarCambios">Guardar cambios</button>
      </div>`;
    document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
      const nombre = document.getElementById('editNombre').value.trim();
      const dias = document.getElementById('editDias').value;
      if (!nombre || !dias) { mostrarError('Nombre y días son obligatorios'); return; }
      try {
        await MotivoApi.update(id, { nombre, dias });
        await cargarMotivos();
        bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
        mostrarExito('Motivo actualizado correctamente');
      } catch (err) { mostrarError(err.message || 'Error actualizando motivo'); }
    });
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
      await MotivoApi.remove(id); await cargarMotivos();
      bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
      mostrarExito('Motivo eliminado correctamente');
    } catch (err) { mostrarError(err.status===409 ? 'No se puede eliminar: el motivo está en uso' : err.message || 'Error al eliminar'); }
  });
}