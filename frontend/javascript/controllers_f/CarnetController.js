import CarnetApi from '../api_f/CarnetApi.js';
import PersonaApi from '../api_f/PersonaApi.js';
import GrupoApi from '../api_f/GrupoApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { PERMISOS } from '/frontend/config/permissions.js';
import { mostrarError, mostrarExito } from '../helpers/utils.js';
import { validarNumero, validarRangoFechas } from '../helpers/validacion.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';

let carnets = [];
let gruposCarnet = [];
let sesionActual = null;
const pagination = new PaginationHelper(15);
const modalVerPagination = new PaginationHelper(5);
const modalEditarPagination = new PaginationHelper(5);
const modalPersonasConfigs = {
  ver: {
    tableId: 'tablaPersonasCarnet',
    paginationId: 'pagination-modal-ver-carnet',
    pagination: modalVerPagination,
    personas: [],
    carnetId: null,
    permiteEliminar: false
  },
  editar: {
    tableId: 'tablaPersonasCarnetEditar',
    paginationId: 'pagination-modal-editar-carnet',
    pagination: modalEditarPagination,
    personas: [],
    carnetId: null,
    permiteEliminar: true
  }
};

pagination.setLoadingCallback((isLoading) => {
  if (isLoading) {
    showTableLoading('#tabla tbody', 5);
  }
});

modalVerPagination.setLoadingCallback((isLoading) => {
  if (isLoading) {
    showTableLoading('#tablaPersonasCarnet tbody', obtenerColspanTablaPersonas(modalPersonasConfigs.ver));
  }
});

modalEditarPagination.setLoadingCallback((isLoading) => {
  if (isLoading) {
    showTableLoading('#tablaPersonasCarnetEditar tbody', obtenerColspanTablaPersonas(modalPersonasConfigs.editar));
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
    cargarGruposCarnet(),
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

  const grupos = [...new Set(lista.map((c) => obtenerNombreGrupo(c, '')).filter(Boolean))].sort();
  grupos.forEach((grupo) => {
    const option = document.createElement('option');
    option.value = grupo;
    option.textContent = grupo;
    select.appendChild(option);
  });

  select.value = grupos.includes(valorActual) ? valorActual : '';
}

async function cargarGruposCarnet() {
  try {
    const response = await GrupoApi.getAll();
    gruposCarnet = response?.data || response || [];
  } catch (_error) {
    gruposCarnet = [];
  }

  poblarSelectGrupos('grupo');
}

function poblarSelectGrupos(idSelect, valorActual = '') {
  const select = document.getElementById(idSelect);
  if (!select) return;

  const valorNormalizado = String(valorActual ?? '').trim();
  const options = gruposCarnet.map((grupo) => {
    const idGrupo = String(grupo.id_grupo ?? '').trim();
    const selected = idGrupo === valorNormalizado ? ' selected' : '';
    return `<option value="${idGrupo}"${selected}>${escapeHtml(grupo.nombre ?? '')}</option>`;
  });

  select.innerHTML = ['<option value="">Seleccione grupo...</option>', ...options].join('');
}

function escapeHtml(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
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
    const grupo = obtenerNombreGrupo(carnet, '');
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
    const grupo = obtenerNombreGrupo(carnet);
    const botones = [`<button type="button" class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${carnet.id_carnet}" title="Ver detalle"><i class="bi bi-eye"></i></button>`];

    if (puedeEditar) {
      botones.push(`<button type="button" class="btn p-0 btn-editar" data-bs-toggle="modal" data-bs-target="#modalEditar" data-id="${carnet.id_carnet}" title="Editar"><i class="bi bi-pencil"></i></button>`);
    }

    if (puedeEliminar) {
      botones.push(`<button type="button" class="btn p-0 btn-eliminar" data-bs-toggle="modal" data-bs-target="#modalEliminar" data-id="${carnet.id_carnet}" title="Eliminar"><i class="bi bi-trash3"></i></button>`);
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${carnet.id_carnet}</td>
      <td>${carnet.nombre ?? ''}</td>
      <td class="d-none d-md-table-cell">${grupo}</td>
      <td>${carnet.duracion_meses ?? ''}</td>
      <td class="celda-acciones"><div class="acciones-tabla">${botones.join('')}</div></td>
    `;
    tbody.appendChild(tr);
  });
}

function validarCarnet(nombre, idGrupo, duracionMeses) {
  if (!nombre || !nombre.trim()) {
    mostrarError('El nombre del carnet es obligatorio.');
    return false;
  }

  if (nombre.trim().length > 50) {
    mostrarError('El nombre del carnet no puede superar los 50 caracteres.');
    return false;
  }

  if (!idGrupo || !String(idGrupo).trim()) {
    mostrarError('El grupo es obligatorio.');
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
    const idGrupo = String(formData.get('id_grupo') ?? '').trim();
    const duracionMeses = String(formData.get('duracion_meses') ?? '').trim();

    if (!validarCarnet(nombre, idGrupo, duracionMeses)) return;

    try {
      await CarnetApi.create({
        nombre,
        id_grupo: Number(idGrupo),
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
    const carnet = carnets.find((item) => String(item.id_carnet) === String(idCarnet));
    const form = document.getElementById('formEditar');
    const tabla = document.getElementById('tablaPersonasCarnetEditar');
    const paginationContainer = document.getElementById('pagination-modal-editar-carnet');
    if (!carnet || !form || !tabla || !paginationContainer) return;

    const contexto = modalPersonasConfigs.editar;
    contexto.personas = [];
    contexto.carnetId = idCarnet;
    contexto.permiteEliminar = true;
    actualizarColumnaAccionTablaPersonasCarnet(contexto);
    showTableLoading('#tablaPersonasCarnetEditar tbody', obtenerColspanTablaPersonas(contexto));
    paginationContainer.innerHTML = '';

    form.innerHTML = `
      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label" for="editNombre">Nombre</label>
          <input type="text" class="form-control" id="editNombre" name="nombre" maxlength="50" value="${carnet.nombre ?? ''}">
        </div>
        <div class="col-md-4">
          <label class="form-label" for="editGrupo">Grupo</label>
          <select class="form-select" id="editGrupo" name="id_grupo" required></select>
        </div>
        <div class="col-md-4">
          <label class="form-label" for="editDuracionMeses">Duracion (meses)</label>
          <input type="number" class="form-control" id="editDuracionMeses" name="duracion_meses" min="1" step="1" value="${carnet.duracion_meses ?? ''}">
        </div>
      </div>
    `;

    poblarSelectGrupos('editGrupo', String(carnet.id_grupo ?? '').trim());

    try {
      const response = await CarnetApi.getPersonsByCarnet(idCarnet);
      const personas = response?.data || response || [];
      actualizarTablaPersonasCarnet('editar', personas, idCarnet, true);
    } catch (error) {
      renderSinResultadosTablaPersonasCarnet(contexto, 'No se pudieron cargar las personas asociadas.');
      paginationContainer.innerHTML = '';
      mostrarError(error.message || 'Error cargando personas asociadas al carnet');
    }

    form.onsubmit = async (event) => {
      event.preventDefault();

      try {
        const data = {
          nombre: String(form.querySelector('[name="nombre"]')?.value ?? '').trim(),
          id_grupo: String(form.querySelector('[name="id_grupo"]')?.value ?? '').trim(),
          duracion_meses: String(form.querySelector('[name="duracion_meses"]')?.value ?? '').trim()
        };

        if (!validarCarnet(data.nombre, data.id_grupo, data.duracion_meses)) return;

        await CarnetApi.update(idCarnet, {
          nombre: data.nombre,
          id_grupo: Number(data.id_grupo),
          duracion_meses: Number(data.duracion_meses)
        });

        await Promise.all([
          cargarCarnets(),
          cargarCarnetsDisponibles(idCarnet, 'seleccionarCarnet')
        ]);

        bootstrap.Modal.getInstance(document.getElementById('modalEditar'))?.hide();
        mostrarExito('Carnet actualizado correctamente');
      } catch (error) {
        mostrarError(error.message || 'Error al editar carnet');
      }
    };
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
    const paginationContainer = document.getElementById('pagination-modal-ver-carnet');
    if (!modalBody || !paginationContainer) return;
    const contexto = modalPersonasConfigs.ver;
    contexto.personas = [];
    contexto.carnetId = idCarnet;
    contexto.permiteEliminar = false;
    actualizarColumnaAccionTablaPersonasCarnet(contexto);
    modalBody.innerHTML = '<p class="text-muted text-center">Cargando...</p>';
    showTableLoading('#tablaPersonasCarnet tbody', obtenerColspanTablaPersonas(contexto));
    paginationContainer.innerHTML = '';

    try {
      const response = await CarnetApi.getPersonsByCarnet(idCarnet);
      const personas = response?.data || response || [];
      const grupo = obtenerNombreGrupo(carnet);

      modalBody.innerHTML = `
        <p><strong>ID:</strong> ${carnet.id_carnet}</p>
        <p><strong>Nombre:</strong> ${carnet.nombre ?? ''}</p>
        <p><strong>Grupo:</strong> ${grupo}</p>
        <p><strong>Duracion:</strong> ${carnet.duracion_meses ?? ''} meses</p>
      `;

      actualizarTablaPersonasCarnet('ver', personas, idCarnet, false);
    } catch (error) {
      modalBody.innerHTML = `
        <p><strong>ID:</strong> ${carnet.id_carnet}</p>
        <p><strong>Nombre:</strong> ${carnet.nombre ?? ''}</p>
        <p><strong>Grupo:</strong> ${obtenerNombreGrupo(carnet)}</p>
        <p><strong>Duracion:</strong> ${carnet.duracion_meses ?? ''} meses</p>
      `;
      renderSinResultadosTablaPersonasCarnet(contexto, 'No se pudieron cargar las personas asociadas.');
      paginationContainer.innerHTML = '';
      mostrarError(error.message || 'Error cargando detalle del carnet');
    }
  });
}

function obtenerColspanTablaPersonas(contexto) {
  return contexto.permiteEliminar ? 5 : 4;
}

function actualizarTablaPersonasCarnet(contextoKey, personas, idCarnet, permitirEliminar) {
  const contexto = modalPersonasConfigs[contextoKey];
  if (!contexto) return;

  contexto.personas = Array.isArray(personas) ? personas : [];
  contexto.carnetId = idCarnet;
  contexto.permiteEliminar = permitirEliminar;

  const tabla = document.getElementById(contexto.tableId);
  const paginationContainer = document.getElementById(contexto.paginationId);
  if (!tabla || !paginationContainer) return;

  actualizarColumnaAccionTablaPersonasCarnet(contexto);
  contexto.pagination.setData(contexto.personas, () => renderTablaPersonasCarnet(contextoKey));
  contexto.pagination.render(contexto.paginationId);
  renderTablaPersonasCarnet(contextoKey);
}

function actualizarColumnaAccionTablaPersonasCarnet(contexto) {
  const headRow = document.querySelector(`#${contexto.tableId} thead tr`);
  if (!headRow) return;

  const thAccion = headRow.querySelector('.th-accion-carnet');
  if (contexto.permiteEliminar && !thAccion) {
    headRow.insertAdjacentHTML('beforeend', '<th class="th-accion-carnet">Acción</th>');
    return;
  }

  if (!contexto.permiteEliminar && thAccion) {
    thAccion.remove();
  }
}

function renderTablaPersonasCarnet(contextoKey) {
  const contexto = modalPersonasConfigs[contextoKey];
  if (!contexto) return;

  const tbody = document.querySelector(`#${contexto.tableId} tbody`);
  const paginationContainer = document.getElementById(contexto.paginationId);
  if (!tbody || !paginationContainer) return;

  tbody.innerHTML = '';

  if (!contexto.personas.length) {
    renderSinResultadosTablaPersonasCarnet(contexto, 'Sin personas asociadas');
    paginationContainer.innerHTML = '';
    return;
  }

  const itemsPagina = contexto.pagination.getPageItems(contexto.personas);
  tbody.innerHTML = itemsPagina.map((persona) => `
    <tr>
      <td>${persona.id_bombero ?? '—'}</td>
      <td>${obtenerNombreCompleto(persona)}</td>
      <td>${persona.f_obtencion ?? '—'}</td>
      <td>${persona.f_vencimiento ?? '—'}</td>
      ${contexto.permiteEliminar ? `<td class="celda-acciones"><div class="acciones-tabla"><button type="button" class="btn btn-sm btn-eliminar-compacto btn-desasignar-persona" data-contexto="${contextoKey}" data-id-carnet="${contexto.carnetId}" data-id-bombero="${persona.id_bombero}" title="Desasignar carnet"><i class="bi bi-trash"></i><span class="visually-hidden">Desasignar carnet</span></button></div></td>` : ''}
    </tr>
  `).join('');
}

function renderSinResultadosTablaPersonasCarnet(contexto, mensaje) {
  const tbody = document.querySelector(`#${contexto.tableId} tbody`);
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="${obtenerColspanTablaPersonas(contexto)}" class="text-center text-muted py-3">${mensaje}</td></tr>`;
}

function obtenerNombreCompleto(persona) {
  return `${persona.nombre ?? ''} ${persona.apellidos ?? ''}`.trim() || '—';
}

function bindDesasignarPersona() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-desasignar-persona');
    if (!btn || !puedeEditarCarnets()) return;

    const idCarnet = btn.dataset.idCarnet;
    const idBombero = btn.dataset.idBombero;
    if (!idCarnet || !idBombero) return;

    try {
      await CarnetApi.unassignFromPerson(idCarnet, idBombero);
      sincronizarDesasignacionEnContextos(idCarnet, idBombero);

      await cargarCarnets();
      mostrarExito('Asignacion eliminada correctamente');
    } catch (error) {
      mostrarError(error.message || 'Error eliminando la asignacion');
    }
  });
}

function sincronizarDesasignacionEnContextos(idCarnet, idBombero) {
  Object.entries(modalPersonasConfigs).forEach(([contextoKey, contexto]) => {
    if (String(contexto.carnetId) !== String(idCarnet)) return;

    contexto.personas = contexto.personas.filter((persona) => String(persona.id_bombero) !== String(idBombero));
    contexto.pagination.totalItems = contexto.personas.length;

    const totalPages = contexto.pagination.getTotalPages();
    if (totalPages === 0) {
      contexto.pagination.currentPage = 0;
    } else if (contexto.pagination.currentPage >= totalPages) {
      contexto.pagination.currentPage = totalPages - 1;
    }

    renderTablaPersonasCarnet(contextoKey);
    contexto.pagination.render(contexto.paginationId);
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
      option.textContent = `${carnet.nombre} - ${obtenerNombreGrupo(carnet)} (${carnet.duracion_meses} meses)`;
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

function obtenerNombreGrupo(carnet, fallback = 'Sin grupo') {
  const grupo = String(carnet?.grupo ?? '').trim();
  return grupo || fallback;
}
