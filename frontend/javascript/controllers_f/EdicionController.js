import EdicionApi from '../api_f/EdicionApi.js';
import FormacionApi from '../api_f/FormacionApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { formatearFecha, mostrarExito, mostrarError } from '../helpers/utils.js';
import { validarNumero, validarRangoFechas } from '../helpers/validacion.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';

let ediciones = [];
let sesionActual = null;
const pagination = new PaginationHelper(15);
pagination.setLoadingCallback((isLoading) => {
    if (isLoading) {
        showTableLoading('#tabla tbody', 6);
    }
});

document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('ediciones');
  if (!sesionActual) return;

  cargarEdiciones();
  cargarFormaciones(0, 'nombreFormacion');
  cargarPersonas();
  cargarFormaciones(0, 'nombreFormacionPersona');

  bindModalVer();

  if (sesionActual.puedeEscribir) {
    bindCrearEdicion();
    bindInsertarPersona();
    bindModalEditar();
    bindModalEliminarEdicion();
    bindModalEliminarPersona();
  }
});

// ================================
// CARGAR EDICIONES
// ================================
async function cargarEdiciones() {
  try {
    showTableLoading('#tabla tbody', 6);
    const response = await EdicionApi.getAll();
    ediciones = response?.data || response || [];
    pagination.setData(ediciones, () => {
      renderTablaEdiciones(ediciones);
    });
    pagination.render('pagination-edicion');
    renderTablaEdiciones(ediciones);
    bindFiltros();
  } catch (e) {
    ediciones = [];
    pagination.setData([], () => {
      renderTablaEdiciones([]);
    });
    pagination.render('pagination-edicion');
    renderTablaEdiciones([]);
  }
}

// ================================
// RENDER TABLA EDICIONES
// ================================
function renderTablaEdiciones(lista) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';

  const puedeEscribir = sesionActual?.puedeEscribir ?? false;
  const itemsPagina = pagination.getPageItems(lista);

  itemsPagina.forEach(e => {
    const tr = document.createElement('tr');

    const botonesAccion = puedeEscribir
      ? `<button type="button" class="btn p-0 btn-ver"
              data-id_edicion="${e.id_edicion}" data-id_formacion="${e.id_formacion}">
           <i class="bi bi-eye"></i>
         </button>
         <button type="button" class="btn p-0 btn-editar"
              data-id_edicion="${e.id_edicion}" data-id_formacion="${e.id_formacion}">
           <i class="bi bi-pencil"></i>
         </button>
         <button type="button" class="btn p-0 btn-eliminar"
              data-bs-toggle="modal" data-bs-target="#modalEliminar"
              data-id_edicion="${e.id_edicion}" data-id_formacion="${e.id_formacion}">
           <i class="bi bi-trash3"></i>
         </button>`
      : `<button type="button" class="btn p-0 btn-ver"
              data-id_edicion="${e.id_edicion}" data-id_formacion="${e.id_formacion}">
           <i class="bi bi-eye"></i>
         </button>`;

    tr.innerHTML = `
      <td>${e.nombre_formacion}</td>
      <td>${formatearFecha(e.f_inicio)}</td>
      <td>${formatearFecha(e.f_fin)}</td>
      <td>${e.horas}</td>
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
  document.getElementById('nombre')?.addEventListener('input', aplicarFiltros);
  document.getElementById('filtroDesde')?.addEventListener('change', aplicarFiltros);
  document.getElementById('filtroHasta')?.addEventListener('change', aplicarFiltros);
}

function aplicarFiltros() {
  pagination.goToPage(0);
  const filtroNombre = document.getElementById('nombre')?.value.toLowerCase().trim() ?? '';
  const filtroDesde  = document.getElementById('filtroDesde')?.value ?? '';
  const filtroHasta  = document.getElementById('filtroHasta')?.value ?? '';

  const filtrados = ediciones.filter(e => {
    const cumpleNombre = !filtroNombre || e.nombre_formacion?.toLowerCase().includes(filtroNombre);
    const fInicio = e.f_inicio?.slice(0, 10) ?? '';
    const fFin    = e.f_fin?.slice(0, 10) ?? '';
    const cumpleDesde = !filtroDesde || fInicio >= filtroDesde;
    const cumpleHasta = !filtroHasta || fFin    <= filtroHasta;
    return cumpleNombre && cumpleDesde && cumpleHasta;
  });
  pagination.setData(filtrados, () => {
      renderTablaEdiciones(filtrados);
    });
  pagination.render('pagination-edicion');
  renderTablaEdiciones(filtrados);
}

// ================================
// CARGAR FORMACIONES
// ================================
async function cargarFormaciones(formacionSeleccionada, id_select) {
  const select = document.getElementById(id_select);
  if (!select) return;

  try {
    const response = await FormacionApi.getAll();
    const formaciones = response?.data || response || [];

    select.innerHTML = '<option value="">Seleccione...</option>';
    formaciones.forEach(formacion => {
      const option = document.createElement('option');
      option.value = formacion.id_formacion;
      option.textContent = formacion.nombre;
      if (formacionSeleccionada !== 0 && Number(formacion.id_formacion) === Number(formacionSeleccionada)) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  } catch (e) {
    mostrarError(e.message || 'Error cargando formaciones');
  }
}

// ================================
// VALIDAR EDICIÓN
// Según DDL Edicion:
//   f_inicio     DATE NOT NULL
//   f_fin        DATE NOT NULL  CHECK (f_fin >= f_inicio)
//   horas        INT  NOT NULL  CHECK (horas > 0)
//   id_formacion FK  NOT NULL
// ================================
function validarEdicion(id_formacion, f_inicio, f_fin, horas) {
  if (!id_formacion) {
    mostrarError('Debe seleccionar una formación.');
    return false;
  }

  if (!f_inicio) {
    mostrarError('La fecha de inicio es obligatoria.');
    return false;
  }

  if (!f_fin) {
    mostrarError('La fecha de fin es obligatoria.');
    return false;
  }

  // CHECK (f_fin >= f_inicio)
  if (!validarRangoFechas(f_inicio, f_fin)) {
    mostrarError('La fecha de fin debe ser igual o posterior a la fecha de inicio.');
    return false;
  }

  // CHECK (horas > 0)
  if (!validarNumero(horas)) {
    mostrarError('Las horas deben ser un número entero positivo.');
    return false;
  }

  return true;
}

// ================================
// CREAR EDICION
// ================================
function bindCrearEdicion() {
  const form = document.getElementById('formInsertar');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const id_formacion = f.get('id_formacion');
    const f_inicio     = f.get('f_inicio');
    const f_fin        = f.get('f_fin');
    const horas        = f.get('horas');

    // ── Validación ──
    if (!validarEdicion(id_formacion, f_inicio, f_fin, horas)) return;

    try {
      await EdicionApi.create(id_formacion, { id_formacion, f_inicio, f_fin, horas: Number(horas) });
      await cargarEdiciones();
      form.reset();
      mostrarExito('Edición creada correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error creando edición');
    }
  });
}

// ================================
// CAMPOS BD
// ================================
const nombresCampos = ['ID-Formacion', 'Fecha inicio', 'Fecha fin', 'Horas'];
const camposBd      = ['id_formacion', 'f_inicio', 'f_fin', 'horas'];

// ================================
// MODAL VER
// ================================
function bindModalVer() {
  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('.btn-ver');
    if (!btn) return;

    const id_formacion = btn.dataset.id_formacion;
    const id_edicion   = btn.dataset.id_edicion;

    try {
      const response = await EdicionApi.getById(id_formacion, id_edicion);
      const edicionData = response?.data || response || [];
      const edicion  = edicionData[0];
      if (!edicion) return;

      const modalBody = document.getElementById('modalVerBody');
      modalBody.innerHTML = '';

      nombresCampos.forEach((nombre, index) => {
        const campo = camposBd[index];
        let valor = edicion[campo] ?? '';
        if (campo === 'f_inicio' || campo === 'f_fin') valor = formatearFecha(valor);

        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = nombre + ': ';
        p.appendChild(strong);
        p.appendChild(document.createTextNode(valor));
        modalBody.appendChild(p);
      });

      new bootstrap.Modal(document.getElementById('modalVer')).show();
    } catch (error) {
      mostrarError(error.message || 'Error al cargar la edición');
    }
  });
}

// ================================
// MODAL EDITAR
// ================================
function bindModalEditar() {
  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('.btn-editar');
    if (!btn) return;

    const id_edicion   = btn.dataset.id_edicion;
    const id_formacion = btn.dataset.id_formacion;

    try {
      const response = await EdicionApi.getById(id_formacion, id_edicion);
      const edicionData = response?.data || response || [];
      const edicion  = edicionData[0];
      if (!edicion) return;

      const form = document.getElementById('formEditar');
      form.innerHTML = `
        <div class="row mb-3">
          <div class="col-mg-6 col-lg-4">
            <label class="form-label">Nombre</label>
            <select class="form-select" id="nombreFormacionEdit" name="id_formacion"></select>
          </div>
          <div class="col-mg-6 col-lg-4">
            <label class="form-label">Fecha Inicio</label>
            <input type="date" class="form-control" name="f_inicio" value="${edicion.f_inicio ?? ''}" required>
          </div>
          <div class="col-mg-6 col-lg-4">
            <label class="form-label">Fecha Fin</label>
            <input type="date" class="form-control" name="f_fin" value="${edicion.f_fin ?? ''}" required>
          </div>
          <div class="col-mg-6 col-lg-4">
            <label class="form-label">Horas</label>
            <input type="number" min="1" step="1" class="form-control" name="horas" value="${edicion.horas ?? ''}">
          </div>
        </div>
        <div class="row text-center">
          <button type="button" id="btnGuardarCambios" class="btn btn-primary">Guardar cambios</button>
        </div>
      `;

      await cargarFormaciones(edicion.id_formacion, 'nombreFormacionEdit');

      const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
      modal.show();

      document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
        const new_id_formacion = form.querySelector('[name="id_formacion"]').value;
        const f_inicio         = form.querySelector('[name="f_inicio"]').value;
        const f_fin            = form.querySelector('[name="f_fin"]').value;
        const horas            = form.querySelector('[name="horas"]').value;

        // ── Validación ──
        if (!validarEdicion(new_id_formacion, f_inicio, f_fin, horas)) return;

        try {
          await EdicionApi.update(id_formacion, id_edicion, {
            id_formacion: new_id_formacion,
            f_inicio,
            f_fin,
            horas: Number(horas)
          });
          await cargarEdiciones();
          modal.hide();
          mostrarExito('Edición actualizada correctamente');
        } catch (err) {
          mostrarError(err.message || 'Error al guardar cambios');
        }
      });

    } catch (error) {
      mostrarError(error.message || 'Error al cargar edición para editar');
    }
  });
}

// ================================
// MODAL ELIMINAR EDICION
// ================================
function bindModalEliminarEdicion() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-eliminar');
    if (!btn) return;

    const btnConfirm = document.getElementById('btnConfirmarEliminar');
    btnConfirm.dataset.id_edicion   = btn.dataset.id_edicion;
    btnConfirm.dataset.id_formacion = btn.dataset.id_formacion;
  });

  document.getElementById('btnConfirmarEliminar').addEventListener('click', async function () {
    const id_edicion   = this.dataset.id_edicion;
    const id_formacion = this.dataset.id_formacion;
    if (!id_edicion || !id_formacion) return;

    try {
      await EdicionApi.delete(id_formacion, id_edicion);
      await cargarEdiciones();
      bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
      mostrarExito('Edición eliminada correctamente');
    } catch (error) {
      mostrarError('Error al eliminar edición: ' + error.message);
    }
  });
}

// ================================
// CARGAR PERSONAS EN EDICIONES
// ================================
async function cargarPersonas() {
  try {
    const resEdiciones   = await EdicionApi.getAll();
    const todasEdiciones = resEdiciones?.data || resEdiciones || [];

    const tbody = document.querySelector('#tablaPersonas tbody');
    tbody.innerHTML = '';

    const promesas = todasEdiciones.map(e =>
      EdicionApi.getPersonas(e.id_formacion, e.id_edicion)
        .then(res => ({ edicion: e, personas: res?.data || res || [] }))
        .catch(() => ({ edicion: e, personas: [] }))
    );

    const resultados = await Promise.all(promesas);
    const puedeEscribir = sesionActual?.puedeEscribir ?? false;

    resultados.forEach(({ edicion, personas }) => {
      if (!personas || personas.length === 0) return;

      personas.forEach(persona => {
        const tr = document.createElement('tr');

        const btnEliminar = puedeEscribir
          ? `<button type="button" class="btn p-0 btn-eliminar-persona"
                    data-bs-toggle="modal" data-bs-target="#modalEliminarPersona"
                    data-id_edicion="${edicion.id_edicion}"
                    data-id_formacion="${edicion.id_formacion}"
                    data-id_bombero="${persona.id_bombero}">
               <i class="bi bi-trash3"></i>
             </button>`
          : '';

        tr.innerHTML = `
          <td>${edicion.nombre_formacion}</td>
          <td>${formatearFecha(edicion.f_inicio)}</td>
          <td>${persona.id_bombero}</td>
          <td class="text-center">${btnEliminar}</td>
        `;
        tbody.appendChild(tr);
      });
    });

  } catch (e) {
    mostrarError(e.message || 'Error cargando personas');
  }
}

// ================================
// INSERTAR PERSONA EN EDICIÓN
// ================================
function bindInsertarPersona() {
  const form = document.getElementById('formInsertarPersona');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const id_formacion = f.get('id_formacion');
    const id_bombero   = f.get('id_bombero');

    if (!id_formacion) { mostrarError('Selecciona una formación.'); return; }
    if (!id_bombero)   { mostrarError('Introduce el ID del bombero.'); return; }

    try {
      const resEdiciones   = await EdicionApi.getAll();
      const edicionesFormacion = resEdiciones?.data || resEdiciones || []
        .filter(e => Number(e.id_formacion) === Number(id_formacion))
        .sort((a, b) => new Date(b.f_inicio) - new Date(a.f_inicio));

      if (edicionesFormacion.length === 0) {
        mostrarError('No hay ediciones para la formación seleccionada.');
        return;
      }

      const ultimaEdicion = edicionesFormacion[0];
      await EdicionApi.setPersonas(ultimaEdicion.id_formacion, ultimaEdicion.id_edicion, { id_bombero });

      await cargarPersonas();
      form.reset();
      mostrarExito('Bombero apuntado correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error apuntando bombero');
    }
  });
}

// ================================
// MODAL ELIMINAR PERSONA
// ================================
function bindModalEliminarPersona() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-eliminar-persona');
    if (!btn) return;

    const btnConfirm = document.getElementById('btnConfirmarEliminarPersona');
    btnConfirm.dataset.id_edicion   = btn.dataset.id_edicion;
    btnConfirm.dataset.id_formacion = btn.dataset.id_formacion;
    btnConfirm.dataset.id_bombero   = btn.dataset.id_bombero;
  });

  document.getElementById('btnConfirmarEliminarPersona').addEventListener('click', async function () {
    const { id_edicion, id_formacion, id_bombero } = this.dataset;
    if (!id_edicion || !id_formacion || !id_bombero) return;

    try {
      await EdicionApi.deletePersona(id_formacion, id_edicion, id_bombero);
      await cargarPersonas();
      bootstrap.Modal.getInstance(document.getElementById('modalEliminarPersona')).hide();
      mostrarExito('Persona eliminada correctamente');
    } catch (error) {
      mostrarError('Error al eliminar persona: ' + error.message);
    }
  });
}