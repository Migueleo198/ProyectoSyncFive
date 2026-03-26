import MotivoApi from '../api_f/MotivoApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { truncar, mostrarError, mostrarExito } from '../helpers/utils.js';
import { validarNumero } from '../helpers/validacion.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';

let motivos = [];
let sesionActual = null;
const pagination = new PaginationHelper(15);
pagination.setLoadingCallback((isLoading) => {
    if (isLoading) {
        showTableLoading('#tabla tbody', 4);
    }
});

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

// ================================
// CARGAR MOTIVOS
// ================================
async function cargarMotivos() {
  try {
    showTableLoading('#tabla tbody', 4);
    const r = await MotivoApi.getAll();
    motivos = r?.data || r || [];
    pagination.setData(motivos, () => {
      renderTablaMotivos(motivos);
    });
    pagination.render('pagination-motivo');
    renderTablaMotivos(motivos);
  } catch (e) {
    motivos = [];
    pagination.setData([], () => {
      renderTablaMotivos([]);
    });
    pagination.render('pagination-motivo');
    renderTablaMotivos([]);
  }
}

// ================================
// RENDER TABLA
// ================================
function renderTablaMotivos(lista) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';
  if (!lista.length) { tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No hay motivos registrados</td></tr>'; return; }

  const puedeEscribir = sesionActual?.puedeEscribir ?? false;
  const itemsPagina = pagination.getPageItems(lista);

  itemsPagina.forEach(m => {
    const tr = document.createElement('tr');
    const botonesAccion = puedeEscribir
      ? `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${m.cod_motivo}"><i class="bi bi-eye"></i></button>
         <button class="btn p-0 btn-editar" data-bs-toggle="modal" data-bs-target="#modalEditar" data-id="${m.cod_motivo}"><i class="bi bi-pencil"></i></button>
         <button class="btn p-0 btn-eliminar" data-bs-toggle="modal" data-bs-target="#modalEliminar" data-id="${m.cod_motivo}"><i class="bi bi-trash3"></i></button>`
      : `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${m.cod_motivo}"><i class="bi bi-eye"></i></button>`;
    tr.innerHTML = `<td class="d-none d-md-table-cell">${m.cod_motivo}</td><td>${m.nombre??''}</td><td class="d-none d-md-table-cell">${m.dias??''}</td>
    <td class="celda-acciones">
        <div class="acciones-tabla">
          ${botonesAccion}
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
}

// ================================
// VALIDAR MOTIVO
// Según DDL Motivo:
//   nombre VARCHAR(100) NOT NULL
//   dias   INT          NOT NULL  (sin CHECK explícito, pero debe ser positivo por lógica)
// ================================
function validarMotivo(nombre, dias) {
  if (!nombre || !nombre.trim()) {
    mostrarError('El nombre es obligatorio.');
    return false;
  }
  if (nombre.trim().length > 100) {
    mostrarError('El nombre no puede superar los 100 caracteres.');
    return false;
  }
  if (!validarNumero(dias)) {
    mostrarError('Los días deben ser un número entero positivo.');
    return false;
  }
  return true;
}

// ================================
// CREAR MOTIVO
// ================================
function bindCrearMotivo() {
  const form = document.getElementById('formMotivo'); if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const nombre = f.get('nombre');
    const dias   = f.get('dias');

    // ── Validación ──
    if (!validarMotivo(nombre, dias)) return;

    try {
      await MotivoApi.create({ nombre: nombre.trim(), dias: Number(dias) });
      await cargarMotivos();
      form.reset();
      mostrarExito('Motivo creado correctamente');
    } catch (err) { mostrarError(err.message || 'Error creando motivo'); }
  });
}

// ================================
// MODAL VER
// ================================
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

// ================================
// MODAL EDITAR
// ================================
function bindModalEditar() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-editar'); if (!btn) return;
    const id = btn.dataset.id;
    const motivo = motivos.find(m => String(m.cod_motivo) === String(id)); if (!motivo) return;
    const form = document.getElementById('formEditar');
    form.innerHTML = `
      <div class="mb-3"><label class="form-label">Nombre</label><input type="text" class="form-control" id="editNombre" maxlength="100" value="${motivo.nombre}"></div>
      <div class="mb-3"><label class="form-label">Días</label><input type="number" min="1" step="1" class="form-control" id="editDias" value="${motivo.dias}"></div>
      <div class="d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-primary" id="btnGuardarCambios">Guardar cambios</button>
      </div>`;
    document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
      const nombre = document.getElementById('editNombre').value.trim();
      const dias   = document.getElementById('editDias').value;

      // ── Validación ──
      if (!validarMotivo(nombre, dias)) return;

      try {
        await MotivoApi.update(id, { nombre, dias: Number(dias) });
        await cargarMotivos();
        bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
        mostrarExito('Motivo actualizado correctamente');
      } catch (err) { mostrarError(err.message || 'Error actualizando motivo'); }
    });
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
      await MotivoApi.remove(id); await cargarMotivos();
      bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
      mostrarExito('Motivo eliminado correctamente');
    } catch (err) { mostrarError(err.status===409 ? 'No se puede eliminar: el motivo está en uso' : err.message || 'Error al eliminar'); }
  });
}