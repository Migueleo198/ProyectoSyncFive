import SalidaApi from '../api_f/SalidaApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { validarNumero, validarRangoFechas, validarIdBombero, validarMatriculaEspanola } from '../helpers/validacion.js';
import { mostrarError, mostrarExito, formatearFechaHora } from '../helpers/utils.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';

let salidas = [];
let sesionActual = null;
const pagination = new PaginationHelper(15);
pagination.setLoadingCallback((isLoading) => {
    if (isLoading) {
        showTableLoading('#tabla tbody', 8);
    }
});

document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('salidas');
  if (!sesionActual) return;

  cargarSalidas();
  bindModalVer();

  if (sesionActual.puedeEscribir) {
    bindCrearSalida();
    bindModalEditar();
    bindModalEliminar();
  }
});

// ================================
// CARGAR SALIDAS
// ================================
async function cargarSalidas() {
  try {
    showTableLoading('#tabla tbody', 8);
    const r = await SalidaApi.getAll();
    salidas = r?.data || r || [];
    pagination.setData(salidas, () => {
      renderTablaSalidas(salidas);
    });
    pagination.render('pagination-salida');
    renderTablaSalidas(salidas);
    poblarFiltroMatricula(salidas);
    poblarFiltroBombero(salidas);
    bindFiltros();
  } catch (e) {
    salidas = [];
    pagination.setData([], () => {
      renderTablaSalidas([]);
    });
    pagination.render('pagination-salida');
    renderTablaSalidas([]);
  }
}

// ================================
// FILTROS
// ================================
function poblarFiltroMatricula(lista) {
  const select = document.getElementById('filtroMatricula');
  if (!select) return;
  const valorActual = select.value;
  select.innerHTML = '<option value="">Todas</option>';
  const unicas = [...new Set(lista.map(s => s.matricula).filter(Boolean))].sort();
  unicas.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    select.appendChild(opt);
  });
  select.value = valorActual;
}

function poblarFiltroBombero(lista) {
  const select = document.getElementById('filtroBombero');
  if (!select) return;
  const valorActual = select.value;
  select.innerHTML = '<option value="">Todos</option>';
  const unicos = [...new Set(lista.map(s => s.id_bombero).filter(Boolean))].sort();
  unicos.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b;
    opt.textContent = b;
    select.appendChild(opt);
  });
  select.value = valorActual;
}

function bindFiltros() {
  document.getElementById('filtroMatricula')?.addEventListener('change', aplicarFiltros);
  document.getElementById('filtroBombero')?.addEventListener('change', aplicarFiltros);
  document.getElementById('filtroDesde')?.addEventListener('change', aplicarFiltros);
  document.getElementById('filtroHasta')?.addEventListener('change', aplicarFiltros);
}

function aplicarFiltros() {
  pagination.goToPage(0);
  const filtroMatricula = document.getElementById('filtroMatricula')?.value ?? '';
  const filtroBombero   = document.getElementById('filtroBombero')?.value ?? '';
  const filtroDesde     = document.getElementById('filtroDesde')?.value ?? '';
  const filtroHasta     = document.getElementById('filtroHasta')?.value ?? '';

  const filtrados = salidas.filter(s => {
    const cumpleMatricula = !filtroMatricula || s.matricula === filtroMatricula;
    const cumpleBombero   = !filtroBombero   || String(s.id_bombero) === String(filtroBombero);
    const fSalida = s.f_salida?.slice(0, 10) ?? '';
    const cumpleDesde = !filtroDesde || fSalida >= filtroDesde;
    const cumpleHasta = !filtroHasta || fSalida <= filtroHasta;
    return cumpleMatricula && cumpleBombero && cumpleDesde && cumpleHasta;
  });
  pagination.setData(filtrados, () => {
      renderTablaSalidas(filtrados);
    });
  pagination.render('pagination-salida');
  renderTablaSalidas(filtrados);
}

// ================================
// RENDER TABLA
// ================================
function renderTablaSalidas(lista) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';
  const puedeEscribir = sesionActual?.puedeEscribir ?? false;
  const itemsPagina = pagination.getPageItems(lista);

  itemsPagina.forEach(s => {
    const tr = document.createElement('tr');
    const botonesAccion = puedeEscribir
      ? `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${s.id_registro}"><i class="bi bi-eye"></i></button>
         <button class="btn p-0 btn-editar" data-bs-toggle="modal" data-bs-target="#modalEditar" data-id="${s.id_registro}"><i class="bi bi-pencil"></i></button>
         <button class="btn p-0 btn-eliminar" data-bs-toggle="modal" data-bs-target="#modalEliminar" data-id="${s.id_registro}"><i class="bi bi-trash3"></i></button>`
      : `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${s.id_registro}"><i class="bi bi-eye"></i></button>`;
    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${s.id_registro}</td>
      <td>${s.matricula}</td><td class="d-none d-md-table-cell">${s.id_bombero??''}</td>
      <td>${formatearFechaHora(s.f_salida)??''}</td><td>${formatearFechaHora(s.f_regreso)??''}</td>
      <td class="d-none d-md-table-cell">${s.km_inicio??''}</td><td class="d-none d-md-table-cell">${s.km_fin??''}</td>
      <td>
        <div  class="d-flex justify-content-around">
          ${botonesAccion}
        </div>  
      </td>`;
    tbody.appendChild(tr);
  });
}

const nombresCampos = ['ID Bombero','f_salida','f_regreso','Matricula','KM_Inicio','KM_Fin'];
const camposBd = ['id_bombero','f_salida','f_regreso','matricula','km_inicio','km_fin'];

// ================================
// MODAL VER
// ================================
function bindModalVer() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-ver'); if (!btn) return;
    const salida = salidas.find(s => s.id_registro == btn.dataset.id); if (!salida) return;
    const modalBody = document.getElementById('modalVerBody');
    modalBody.innerHTML = '';
    nombresCampos.forEach((nombre, idx) => {
      const campo = camposBd[idx];
      let valor = salida[campo] ?? '';
      if (campo === 'f_salida' || campo === 'f_regreso') valor = formatearFechaHora(valor);
      const p = document.createElement('p');
      p.innerHTML = `<strong>${nombre}:</strong> ${valor}`;
      modalBody.appendChild(p);
    });
  });
}

// ================================
// VALIDACIONES
// ================================
function validarDatosSalida(data) {
  if (!data.matricula?.trim()) { mostrarError('La matrícula es obligatoria'); return false; }
  if (!data.id_bombero?.trim()) { mostrarError('El ID del bombero es obligatorio'); return false; }
  if (!data.f_salida) { mostrarError('La fecha de salida es obligatoria'); return false; }
  if (!data.km_inicio) { mostrarError('El KM de inicio es obligatorio'); return false; }
  if (!data.km_fin) { mostrarError('El KM final es obligatorio'); return false; }

  if (!validarMatriculaEspanola(data.matricula)) { mostrarError('Matrícula no válida (ej: 1234BCD)'); return false; }

  // CORRECCIÓN: validarIdBombero espera formato A000, forzar mayúsculas
  if (!validarIdBombero(data.id_bombero.toUpperCase())) {
    mostrarError('ID bombero inválido (ej: B001)'); return false;
  }

  // CORRECCIÓN: validarNumero valida enteros positivos — correcto para km
  if (!validarNumero(data.km_inicio)) { mostrarError('KM inicio debe ser número entero positivo'); return false; }
  if (!validarNumero(data.km_fin)) { mostrarError('KM fin debe ser número entero positivo'); return false; }
  if (Number(data.km_fin) < Number(data.km_inicio)) { mostrarError('KM final no puede ser menor que KM inicial'); return false; }

  // CORRECCIÓN: f_regreso es opcional (vehículo puede estar en curso)
  if (data.f_regreso && !validarRangoFechas(data.f_salida, data.f_regreso)) {
    mostrarError('La fecha de regreso debe ser posterior a la de salida'); return false;
  }
  return true;
}

// ================================
// CREAR SALIDA
// ================================
function bindCrearSalida() {
  const form = document.getElementById('formSalida'); if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const data = {
      matricula:   f.get('matricula'),
      f_regreso:   f.get('f_regreso') || null,
      f_salida:    f.get('f_salida'),
      km_inicio:   f.get('km_inicio'),
      km_fin:      f.get('km_fin'),
      id_bombero:  f.get('id_bombero')
    };
    if (!validarDatosSalida(data)) return;
    try {
      await SalidaApi.create(data);
      await cargarSalidas();
      form.reset();
      mostrarExito('Salida creada correctamente');
    } catch (err) { mostrarError(err.message || 'Error creando salida'); }
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
      const r = await SalidaApi.getById(id);
      const salida = r.data; if (!salida) return;
      const form = document.getElementById('formEditar');
      form.innerHTML = `
        <div class="row mb-3">
          <div class="col-md-6 col-lg-4"><label class="form-label">ID Bombero</label><input type="text" class="form-control" name="id_bombero" value="${salida.id_bombero??''}" required></div>
          <div class="col-md-6 col-lg-4"><label class="form-label">Fecha salida</label><input type="datetime-local" class="form-control" name="f_salida" value="${salida.f_salida??''}"></div>
          <div class="col-md-6 col-lg-4"><label class="form-label">Fecha regreso</label><input type="datetime-local" class="form-control" name="f_regreso" value="${salida.f_regreso??''}"></div>
        </div>
        <div class="row mb-4">
          <div class="col-md-6 col-lg-4"><label class="form-label">Matrícula</label><input type="text" class="form-control" name="matricula" value="${salida.matricula??''}"></div>
          <div class="col-md-6 col-lg-4"><label class="form-label">KM inicio</label><input type="number" class="form-control" name="km_inicio" value="${salida.km_inicio??''}"></div>
          <div class="col-md-6 col-lg-4"><label class="form-label">KM fin</label><input type="number" class="form-control" name="km_fin" value="${salida.km_fin??''}"></div>
        </div>
        <div class="d-flex justify-content-center gap-2">
          <button type="button" id="btnGuardarCambios" class="btn btn-primary">Guardar Registro</button>
        </div>`;
      document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
        const data = {
          id_bombero: form.querySelector('[name="id_bombero"]').value,
          f_salida:   form.querySelector('[name="f_salida"]').value,
          f_regreso:  form.querySelector('[name="f_regreso"]').value || null,
          matricula:  form.querySelector('[name="matricula"]').value.trim(),
          km_inicio:  form.querySelector('[name="km_inicio"]').value,
          km_fin:     form.querySelector('[name="km_fin"]').value
        };
        if (!validarDatosSalida(data)) return;
        await SalidaApi.update(id, data);
        await cargarSalidas();
        bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
        mostrarExito('Salida actualizada correctamente');
      });
    } catch (err) { mostrarError('Error al editar salida: ' + err.message); }
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
      await SalidaApi.delete(id);
      await cargarSalidas();
      bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
      mostrarExito('Salida eliminada correctamente');
    } catch (err) { mostrarError(err.message || 'Error al eliminar'); }
  });
}