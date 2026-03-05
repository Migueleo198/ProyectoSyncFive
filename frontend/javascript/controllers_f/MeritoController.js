import MeritosApi from '../api_f/MeritoApi.js';
import PersonaApi from '../api_f/PersonaApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { truncar, mostrarError, mostrarExito } from '../helpers/utils.js';

let meritos = [];
let sesionActual = null;

document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('meritos');
  if (!sesionActual) return;

  cargarMeritos();
  bindModalVer();
  bindModalEliminar();
  cargarSelectMeritos('merito');
  cargarSelectPersonas(null, 'n_funcionario');

  if (sesionActual.puedeEscribir) {
    bindCrearMerito();
    bindAsignarMerito();
    bindDesasignarMerito();
    cargarSelectPersonas(null, 'desasignar_persona');
    cargarSelectMeritos('desasignar_merito');
  }
});

async function cargarMeritos() {
  try { const r = await MeritosApi.getAll(); meritos = r.data; renderTablaMeritos(meritos); }
  catch (e) { mostrarError(e.message || 'Error cargando méritos'); }
}

async function cargarSelectMeritos(id_select = 'merito') {
  const select = document.getElementById(id_select); if (!select) return;
  try {
    const res = await MeritosApi.getAll();
    select.innerHTML = '<option value="">Seleccione mérito...</option>';
    res.data.forEach(r => { const o = document.createElement('option'); o.value = r.id_merito; o.textContent = r.nombre; select.appendChild(o); });
  } catch (e) { mostrarError(e.message || 'Error cargando méritos'); }
}

async function cargarSelectPersonas(seleccionado, id_select) {
  const select = document.getElementById(id_select); if (!select) return;
  try {
    const res = await PersonaApi.getAll();
    select.innerHTML = '<option value="">Seleccione persona...</option>';
    res.data.forEach(p => { const o = document.createElement('option'); o.value = p.id_bombero; o.textContent = `${p.n_funcionario} - ${p.nombre} ${p.apellidos}`; if (seleccionado && p.n_funcionario === seleccionado) o.selected = true; select.appendChild(o); });
  } catch (e) { mostrarError(e.message || 'Error cargando personas'); }
}

function renderTablaMeritos(lista) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';
  if (!lista.length) { tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No hay méritos registrados</td></tr>'; return; }

  const puedeEscribir = sesionActual?.puedeEscribir ?? false;

  lista.forEach(m => {
    const tr = document.createElement('tr');
    const botones = puedeEscribir
      ? `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${m.id_merito}"><i class="bi bi-eye"></i></button>
         <button class="btn p-0 btn-eliminar" data-bs-toggle="modal" data-bs-target="#modalEliminar" data-id="${m.id_merito}"><i class="bi bi-trash3 text-danger"></i></button>`
      : `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${m.id_merito}"><i class="bi bi-eye"></i></button>`;
    tr.innerHTML = `<td>${m.id_merito}</td><td>${m.nombre??''}</td><td class="d-none d-md-table-cell">${truncar(m.descripcion,80)}</td><td class="d-flex justify-content-around">${botones}</td>`;
    tbody.appendChild(tr);
  });
}

function bindCrearMerito() {
  const form = document.getElementById('formMerito'); if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nombreMerito').value.trim();
    const descripcion = document.getElementById('descripcionMerito').value.trim();
    if (!nombre) { mostrarError('El nombre es obligatorio'); return; }
    if (!descripcion) { mostrarError('La descripción es obligatoria'); return; }
    try {
      await MeritosApi.create({ nombre, descripcion });
      await cargarMeritos(); form.reset(); mostrarExito('Mérito creado correctamente');
    } catch (err) { mostrarError(err.message || 'Error creando mérito'); }
  });
}

function bindAsignarMerito() {
  const form = document.getElementById('formAsignarMerito'); if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const data = { id_bombero: f.get('n_funcionario'), id_merito: f.get('merito') };
    if (!data.id_bombero || !data.id_merito) { mostrarError('Seleccione persona y mérito'); return; }
    try { await MeritosApi.assignToPerson(data); mostrarExito('Mérito asignado correctamente'); form.reset(); }
    catch (err) { mostrarError(err.message || 'Error asignando mérito'); }
  });
}

function bindDesasignarMerito() {
  const form = document.getElementById('formDesasignarMerito'); if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const data = { id_bombero: f.get('n_funcionario'), id_merito: f.get('merito') };
    if (!data.id_bombero || !data.id_merito) { mostrarError('Seleccione persona y mérito'); return; }
    try { await MeritosApi.unassignFromPerson(data); mostrarExito('Mérito desasignado correctamente'); form.reset(); }
    catch (err) { mostrarError(err.message || 'Error desasignando mérito'); }
  });
}

function bindModalVer() {
  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('.btn-ver'); if (!btn) return;
    const id = btn.dataset.id;
    const merito = meritos.find(m => String(m.id_merito) === String(id)); if (!merito) return;
    const detalles = document.getElementById('detallesMerito');
    detalles.innerHTML = '';
    [{ label:'ID', valor:merito.id_merito },{ label:'Nombre', valor:merito.nombre },{ label:'Descripción', valor:merito.descripcion??'—' }].forEach(({label,valor}) => {
      const p = document.createElement('p'); p.innerHTML = `<strong>${label}:</strong> ${valor}`; detalles.appendChild(p);
    });
    const tbody = document.querySelector('#tablaPersonasMerito tbody');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Cargando...</td></tr>';
    try {
      const res = await MeritosApi.getPersonsByMerito(id);
      tbody.innerHTML = '';
      if (!res.data.length) { tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay personas asignadas</td></tr>'; return; }
      res.data.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${p.id_bombero}</td><td>${p.n_funcionario}</td><td>${p.nombre} ${p.apellidos}</td>
          <td><button class="btn btn-sm btn-danger btn-desasignar-persona" data-id-bombero="${p.id_bombero}" data-id-merito="${id}"><i class="bi bi-person-dash"></i></button></td>`;
        tbody.appendChild(tr);
      });
    } catch (err) { tbody.innerHTML = `<tr><td colspan="4" class="text-danger text-center">${err.message||'Error'}</td></tr>`; }
  });
  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('.btn-desasignar-persona'); if (!btn) return;
    try { await MeritosApi.unassignFromPerson({ id_bombero: btn.dataset.idBombero, id_merito: btn.dataset.idMerito }); mostrarExito('Mérito desasignado'); btn.closest('tr').remove(); }
    catch (err) { mostrarError(err.message || 'Error desasignando'); }
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
      await MeritosApi.remove(id); await cargarMeritos();
      bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
      mostrarExito('Mérito eliminado correctamente');
    } catch (err) { mostrarError(err.status===409 ? 'No se puede eliminar: el mérito está asignado a usuarios' : err.message || 'Error al eliminar'); }
  });
}