import CarnetApi from '../api_f/CarnetApi.js';
import PersonaApi from '../api_f/PersonaApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { PERMISOS } from '/frontend/config/permissions.js';
import { mostrarError, mostrarExito } from '../helpers/utils.js';
import { validarNumero, validarRangoFechas } from '../helpers/validacion.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';

let carnets = [];
let sesionActual = null;
const pagination = new PaginationHelper(15);

pagination.setLoadingCallback((isLoading) => {
  if (isLoading) {
    showTableLoading('#tabla tbody', 5);
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('carnets');
  if (!sesionActual) return;

  bindFiltros();
  bindModalVer();
  bindModalEditar();
  bindModalEliminar();
  bindDesasignarPersona();

  if (sesionActual.puedeEscribir) {
    bindCrearCarnet();
    bindAsignarCarnet();
    bindAutocalculoVencimiento();
  }

  await Promise.all([
    cargarCarnets(),
    cargarCarnetsDisponibles(null, 'seleccionarCarnet'),
    cargarBomberosDisponibles(null, 'id_bombero')
  ]);
});

function puedeEditarCarnets() {
  return PERMISOS.carnets.rolesEditar.includes(sesionActual?.rol ?? 0);
}

function puedeEliminarCarnets() {
  return PERMISOS.carnets.rolesEliminar.includes(sesionActual?.rol ?? 0);
}

async function cargarCarnets() {
  try {
    showTableLoading('#tabla tbody', 5);
    const response = await CarnetApi.getAll();
    carnets = response?.data || response || [];
    poblarFiltroGrupo(carnets);
    aplicarFiltros();
    recalcularVencimientoAsignacion();
  } catch (_e) {
    carnets = [];
    pagination.setData([], () => renderTablaCarnets([]));
    pagination.render('pagination-carnet');
    renderTablaCarnets([]);
  }
}

function poblarFiltroGrupo(lista) {
  const select = document.getElementById('filtroGrupo');
  if (!select) return;

  const valorActual = select.value;
  select.innerHTML = '<option value="">Todos</option>';

  const grupos = [...new Set(lista.map((c) => c.grupo ?? c.categoria).filter(Boolean))].sort();
  grupos.forEach((grupo) => {
    const option = document.createElement('option');
    option.value = grupo;
    option.textContent = grupo;
    select.appendChild(option);
  });

  select.value = grupos.includes(valorActual) ? valorActual : '';
}

function bindFiltros() {
  document.getElementById('filtroNombre')?.addEventListener('input', aplicarFiltros);
  document.getElementById('filtroGrupo')?.addEventListener('change', aplicarFiltros);
}

function aplicarFiltros() {
  pagination.goToPage(0);
  const filtroNombre = document.getElementById('filtroNombre')?.value.toLowerCase().trim() ?? '';
  const filtroGrupo = document.getElementById('filtroGrupo')?.value ?? '';

  const filtrados = carnets.filter((carnet) => {
    const grupo = carnet.grupo ?? carnet.categoria ?? '';
    const cumpleNombre = !filtroNombre || String(carnet.nombre ?? '').toLowerCase().includes(filtroNombre);
    const cumpleGrupo = !filtroGrupo || grupo === filtroGrupo;
    return cumpleNombre && cumpleGrupo;
  });

  pagination.setData(filtrados, () => renderTablaCarnets(filtrados));
  pagination.render('pagination-carnet');
  renderTablaCarnets(filtrados);
}

function renderTablaCarnets(lista) {
  const tbody = document.querySelector('#tabla tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No hay carnets registrados</td></tr>';
    return;
  }

  const itemsPagina = pagination.getPageItems(lista);
  const puedeEditar = puedeEditarCarnets();
  const puedeEliminar = puedeEliminarCarnets();

  itemsPagina.forEach((carnet) => {
    const grupo = carnet.grupo ?? carnet.categoria ?? 'Sin grupo';
    const botones = [`<button type="button" class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${carnet.id_carnet}" title="Ver detalle"><i class="bi bi-eye"></i></button>`];

    if (puedeEditar) {
      botones.push(`<button type="button" class="btn p-0 btn-editar" data-bs-toggle="modal" data-bs-target="#modalEditar" data-id="${carnet.id_carnet}" title="Editar"><i class="bi bi-pencil text-primary"></i></button>`);
    }

    if (puedeEliminar) {
      botones.push(`<button type="button" class="btn p-0 btn-eliminar" data-bs-toggle="modal" data-bs-target="#modalEliminar" data-id="${carnet.id_carnet}" title="Eliminar"><i class="bi bi-trash3 text-danger"></i></button>`);
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${carnet.id_carnet}</td>
      <td>${carnet.nombre ?? ''}</td>
      <td>${grupo}</td>
      <td>${carnet.duracion_meses ?? ''}</td>
      <td><div class="d-flex justify-content-around">${botones.join('')}</div></td>
    `;
    tbody.appendChild(tr);
  });
}

function validarCarnet(nombre, grupo, duracionMeses) {
  if (!nombre || !nombre.trim()) {
    mostrarError('El nombre del carnet es obligatorio.');
    return false;
  }

  if (nombre.trim().length > 50) {
    mostrarError('El nombre del carnet no puede superar los 50 caracteres.');
    return false;
  }

  if (!grupo || !grupo.trim()) {
    mostrarError('El grupo es obligatorio.');
    return false;
  }

  if (grupo.trim().length > 20) {
    mostrarError('El grupo no puede superar los 20 caracteres.');
    return false;
  }

  if (!validarNumero(duracionMeses)) {
    mostrarError('La duracion en meses debe ser un numero entero positivo.');
    return false;
  }

  return true;
}

function validarAsignacionCarnet(idBombero, idCarnet, fechaObtencion, fechaVencimiento) {
  if (!idBombero) {
    mostrarError('Debe seleccionar un bombero.');
    return false;
  }

  if (!idCarnet) {
    mostrarError('Debe seleccionar un carnet.');
    return false;
  }

  if (!fechaObtencion) {
    mostrarError('La fecha de obtencion es obligatoria.');
    return false;
  }

  if (!fechaVencimiento) {
    mostrarError('La fecha de vencimiento es obligatoria.');
    return false;
  }

  if (!validarRangoFechas(fechaObtencion, fechaVencimiento)) {
    mostrarError('La fecha de vencimiento debe ser posterior a la fecha de obtencion.');
    return false;
  }

  return true;
}

function bindCrearCarnet() {
  const form = document.getElementById('formInsertarCarnet');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const nombre = String(formData.get('nombre') ?? '').trim();
    const grupo = String(formData.get('grupo') ?? '').trim();
    const duracionMeses = String(formData.get('duracion_meses') ?? '').trim();

    if (!validarCarnet(nombre, grupo, duracionMeses)) return;

    try {
      await CarnetApi.create({
        nombre,
        grupo,
        duracion_meses: Number(duracionMeses)
      });

      await Promise.all([
        cargarCarnets(),
        cargarCarnetsDisponibles(null, 'seleccionarCarnet')
      ]);

      form.reset();
      mostrarExito('Carnet creado correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error creando carnet');
    }
  });
}

function bindModalEliminar() {
  if (!puedeEliminarCarnets()) return;

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-eliminar');
    if (!btn) return;
    document.getElementById('btnConfirmarEliminar').dataset.id = btn.dataset.id;
  });

  document.getElementById('btnConfirmarEliminar')?.addEventListener('click', async function () {
    const id = this.dataset.id;
    if (!id) return;

    try {
      await CarnetApi.remove(id);
      await Promise.all([
        cargarCarnets(),
        cargarCarnetsDisponibles(null, 'seleccionarCarnet')
      ]);
      bootstrap.Modal.getInstance(document.getElementById('modalEliminar'))?.hide();
      mostrarExito('Carnet eliminado correctamente');
    } catch (error) {
      mostrarError(error.message || 'Error al eliminar carnet');
    }
  });
}

function bindModalEditar() {
  if (!puedeEditarCarnets()) return;

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-editar');
    if (!btn) return;

    const idCarnet = btn.dataset.id;

    try {
      const [carnetResponse, personsResponse] = await Promise.all([
        CarnetApi.getById(idCarnet),
        CarnetApi.getPersonsByCarnet(idCarnet)
      ]);

      const carnet = carnetResponse?.data || carnetResponse;
      const personas = personsResponse?.data || personsResponse || [];
      const grupo = carnet.grupo ?? carnet.categoria ?? '';
      const form = document.getElementById('formEditar');
      if (!form || !carnet) return;

      form.innerHTML = `
        <div class="row g-3 mb-4">
          <div class="col-lg-4">
            <label class="form-label">Nombre</label>
            <input type="text" class="form-control" name="nombre" maxlength="50" value="${carnet.nombre ?? ''}">
          </div>
          <div class="col-lg-4">
            <label class="form-label">Grupo</label>
            <input type="text" class="form-control" name="grupo" maxlength="20" value="${grupo}">
          </div>
          <div class="col-lg-4">
            <label class="form-label">Duracion (meses)</label>
            <input type="number" min="1" step="1" class="form-control" name="duracion_meses" value="${carnet.duracion_meses ?? ''}">
          </div>
        </div>
        ${renderPersonasAsociadas(personas, idCarnet, true)}
        <div class="text-center mt-4">
          <button type="button" id="btnGuardarCambiosCarnet" class="btn btn-primary">Guardar cambios</button>
        </div>
      `;

      document.getElementById('btnGuardarCambiosCarnet')?.addEventListener('click', async () => {
        const data = {
          nombre: String(form.querySelector('[name="nombre"]')?.value ?? '').trim(),
          grupo: String(form.querySelector('[name="grupo"]')?.value ?? '').trim(),
          duracion_meses: String(form.querySelector('[name="duracion_meses"]')?.value ?? '').trim()
        };

        if (!validarCarnet(data.nombre, data.grupo, data.duracion_meses)) return;

        await CarnetApi.update(idCarnet, {
          nombre: data.nombre,
          grupo: data.grupo,
          duracion_meses: Number(data.duracion_meses)
        });

        await Promise.all([
          cargarCarnets(),
          cargarCarnetsDisponibles(idCarnet, 'seleccionarCarnet')
        ]);

        bootstrap.Modal.getInstance(document.getElementById('modalEditar'))?.hide();
        mostrarExito('Carnet actualizado correctamente');
      });
    } catch (error) {
      mostrarError(error.message || 'Error al editar carnet');
    }
  });
}

function bindModalVer() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-ver');
    if (!btn) return;

    const idCarnet = btn.dataset.id;
    const carnet = carnets.find((item) => String(item.id_carnet) === String(idCarnet));
    if (!carnet) return;

    const modalBody = document.getElementById('modalVerBody');
    if (!modalBody) return;
    modalBody.innerHTML = '<p class="text-muted text-center">Cargando...</p>';

    try {
      const response = await CarnetApi.getPersonsByCarnet(idCarnet);
      const personas = response?.data || response || [];
      const grupo = carnet.grupo ?? carnet.categoria ?? 'Sin grupo';

      modalBody.innerHTML = `
        <p><strong>ID:</strong> ${carnet.id_carnet}</p>
        <p><strong>Nombre:</strong> ${carnet.nombre ?? ''}</p>
        <p><strong>Grupo:</strong> ${grupo}</p>
        <p><strong>Duracion:</strong> ${carnet.duracion_meses ?? ''} meses</p>
        ${renderPersonasAsociadas(personas, idCarnet, false)}
      `;
    } catch (error) {
      modalBody.innerHTML = '<p class="text-danger mb-0">No se pudieron cargar las personas asociadas.</p>';
      mostrarError(error.message || 'Error cargando detalle del carnet');
    }
  });
}

function renderPersonasAsociadas(personas, idCarnet, permitirEliminar) {
  const columnasAccion = permitirEliminar ? '<th class="text-end">Accion</th>' : '';
  const filas = !personas.length
    ? `<tr><td colspan="${permitirEliminar ? 5 : 4}" class="text-center text-muted py-3">Sin personas asociadas</td></tr>`
    : personas.map((persona) => `
        <tr>
          <td>${persona.id_bombero}</td>
          <td>${persona.nombre ?? ''} ${persona.apellidos ?? ''}</td>
          <td>${persona.f_obtencion ?? '—'}</td>
          <td>${persona.f_vencimiento ?? '—'}</td>
          ${permitirEliminar ? `<td class="text-end"><button type="button" class="btn btn-sm btn-outline-danger btn-desasignar-carnet" data-id-carnet="${idCarnet}" data-id-bombero="${persona.id_bombero}">Quitar</button></td>` : ''}
        </tr>
      `).join('');

  return `
    <div class="mt-4">
      <h6 class="mb-3">Personas asociadas</h6>
      <div class="table-responsive">
        <table class="table table-sm table-bordered align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>Bombero</th>
              <th>Nombre</th>
              <th>Obtencion</th>
              <th>Vencimiento</th>
              ${columnasAccion}
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
      </div>
    </div>
  `;
}

function bindDesasignarPersona() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-desasignar-carnet');
    if (!btn || !puedeEditarCarnets()) return;

    const idCarnet = btn.dataset.idCarnet;
    const idBombero = btn.dataset.idBombero;
    if (!idCarnet || !idBombero) return;

    try {
      await CarnetApi.unassignFromPerson(idCarnet, idBombero);
      btn.closest('tr')?.remove();
      await cargarCarnets();
      mostrarExito('Asignacion eliminada correctamente');
    } catch (error) {
      mostrarError(error.message || 'Error eliminando la asignacion');
    }
  });
}

async function cargarCarnetsDisponibles(carnetSeleccionado, idSelect) {
  const select = document.getElementById(idSelect);
  if (!select) return;

  try {
    const response = await CarnetApi.getAll();
    const lista = response?.data || response || [];
    select.innerHTML = '<option value="">Seleccione carnet...</option>';

    lista.forEach((carnet) => {
      const option = document.createElement('option');
      option.value = carnet.id_carnet;
      option.textContent = `${carnet.nombre} - ${carnet.grupo ?? carnet.categoria} (${carnet.duracion_meses} meses)`;
      if (String(carnetSeleccionado ?? '') === String(carnet.id_carnet)) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  } catch (e) {
    mostrarError(e.message || 'Error cargando carnets');
  }
}

async function cargarBomberosDisponibles(bomberoSeleccionado, idSelect) {
  const select = document.getElementById(idSelect);
  if (!select) return;

  try {
    const response = await PersonaApi.getAll();
    const bomberos = response?.data || response || [];
    select.innerHTML = '<option value="">Seleccione bombero...</option>';

    bomberos.forEach((bombero) => {
      const option = document.createElement('option');
      option.value = bombero.id_bombero;
      option.textContent = `${bombero.id_bombero} - ${bombero.nombre} ${bombero.apellidos}`;
      if (String(bomberoSeleccionado ?? '') === String(bombero.id_bombero)) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  } catch (e) {
    mostrarError(e.message || 'Error cargando bomberos');
  }
}

function bindAsignarCarnet() {
  const form = document.getElementById('formInsertar');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const idBombero = String(formData.get('id_bombero') ?? '');
    const idCarnet = String(formData.get('seleccionarCarnet') ?? '');
    const fechaObtencion = String(formData.get('f_obtencion') ?? '');
    const fechaVencimiento = String(formData.get('f_vencimiento') ?? '');

    if (!validarAsignacionCarnet(idBombero, idCarnet, fechaObtencion, fechaVencimiento)) return;

    try {
      await CarnetApi.assignToPerson({
        id_bombero: idBombero,
        ID_Carnet: idCarnet,
        f_obtencion: fechaObtencion,
        f_vencimiento: fechaVencimiento
      });

      await cargarCarnets();
      form.reset();
      mostrarExito('Carnet asignado correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error asignando carnet');
    }
  });
}

function bindAutocalculoVencimiento() {
  document.getElementById('seleccionarCarnet')?.addEventListener('change', recalcularVencimientoAsignacion);
  document.getElementById('f_obtencion')?.addEventListener('input', recalcularVencimientoAsignacion);
}

function recalcularVencimientoAsignacion() {
  const selectCarnet = document.getElementById('seleccionarCarnet');
  const inputObtencion = document.getElementById('f_obtencion');
  const inputVencimiento = document.getElementById('f_vencimiento');
  if (!selectCarnet || !inputObtencion || !inputVencimiento) return;

  const carnet = carnets.find((item) => String(item.id_carnet) === String(selectCarnet.value));
  if (!carnet || !inputObtencion.value) {
    inputVencimiento.value = '';
    return;
  }

  inputVencimiento.value = sumarMeses(inputObtencion.value, Number(carnet.duracion_meses ?? 0));
}

function sumarMeses(fechaIso, meses) {
  if (!fechaIso || !meses) return '';

  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  if (!anio || !mes || !dia) return '';

  const totalMeses = (mes - 1) + meses;
  const anioObjetivo = anio + Math.floor(totalMeses / 12);
  const mesObjetivo = (totalMeses % 12) + 1;
  const ultimoDiaMesObjetivo = new Date(anioObjetivo, mesObjetivo, 0).getDate();
  const diaObjetivo = Math.min(dia, ultimoDiaMesObjetivo);

  const yyyy = String(anioObjetivo);
  const mm = String(mesObjetivo).padStart(2, '0');
  const dd = String(diaObjetivo).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
