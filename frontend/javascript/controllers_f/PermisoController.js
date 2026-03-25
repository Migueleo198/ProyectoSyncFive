import PermisoApi from '../api_f/PermisoApi.js';
import MotivoApi from '../api_f/MotivoApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { formatearFechaHora, truncar, mostrarError, mostrarExito } from '../helpers/utils.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';

let permisos = [];
let motivos = [];
let sesionActual = null;
let filtrosInicializados = false;
const pagination = new PaginationHelper(15);

pagination.setLoadingCallback((isLoading) => {
  if (isLoading) {
    showTableLoading('#tabla tbody', 8);
  }
});

const ESTADOS_PERMISO_VALIDOS = ['ACEPTADO', 'REVISION', 'DENEGADO'];
const modalPersonasPagination = new PaginationHelper(5);

modalPersonasPagination.setLoadingCallback((isLoading) => {
  if (isLoading) {
    showTableLoading('#tablaPersonasPermiso tbody', 3);
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('permisos');
  if (!sesionActual) return;

  await cargarMotivos();
  await cargarPermisos();
  bindModalVer();
  await cargarSelectMotivos(null, 'motivo');

  if (sesionActual.puedeEscribir) {
    bindCrearPermiso();
    bindAutocalculoFechaFin();
  }

  if (puedeGestionarPermisos()) {
    bindModalEditar();
  }
});

function puedeGestionarPermisos() {
  return (sesionActual?.rol ?? 0) >= 4;
}

function normalizarEstado(estado) {
  if (!estado) return '';
  return String(estado)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizarFechaHoraLocal(valor) {
  if (!valor) return null;
  return `${valor.replace('T', ' ')}:00`;
}

function valorInputFechaHora(valor) {
  if (!valor) return '';
  return String(valor).replace(' ', 'T').slice(0, 16);
}

function normalizarTextoOpcional(valor) {
  const texto = String(valor ?? '').trim();
  return texto || null;
}

function construirPayloadEdicionPermiso() {
  return {
    fecha_hora_inicio: normalizarFechaHoraLocal(document.getElementById('editFechaHoraInicio')?.value || ''),
    fecha_hora_fin: normalizarFechaHoraLocal(document.getElementById('editFechaHoraFin')?.value || ''),
    estado: normalizarEstado(document.getElementById('editEstado')?.value || ''),
    descripcion: normalizarTextoOpcional(document.getElementById('editDescripcion')?.value)
  };
}

function obtenerCambiosEdicionPermiso(permiso, data) {
  const original = {
    fecha_hora_inicio: permiso.fecha_hora_inicio ?? null,
    fecha_hora_fin: permiso.fecha_hora_fin ?? null,
    estado: normalizarEstado(permiso.estado ?? ''),
    descripcion: normalizarTextoOpcional(permiso.descripcion)
  };

  return Object.fromEntries(
    Object.entries(data).filter(([clave, valor]) => valor !== original[clave])
  );
}

function formatearFechaHoraCorta(valor) {
  return valor ? formatearFechaHora(valor) : '—';
}

function formatearRangoPermiso(permiso) {
  return `${formatearFechaHoraCorta(permiso.fecha_hora_inicio)} - ${formatearFechaHoraCorta(permiso.fecha_hora_fin)}`;
}

function obtenerClaseEstado(estado) {
  switch (normalizarEstado(estado)) {
    case 'ACEPTADO':
      return 'bg-success';
    case 'DENEGADO':
      return 'bg-danger';
    case 'REVISION':
      return 'bg-warning text-dark';
    default:
      return 'bg-secondary';
  }
}

function renderEstadoBadge(estado) {
  const estadoFormateado = estado ?? 'SIN ESTADO';
  return `<span class="badge rounded-pill ${obtenerClaseEstado(estado)}">${estadoFormateado}</span>`;
}

function obtenerSolicitante(permiso) {
  return permiso?.bombero_nombre
    ? `${permiso.bombero_nombre} ${permiso.bombero_apellidos ?? ''}`.trim()
    : (permiso?.id_bombero ?? '—');
}

function renderTablaPersonasPermiso(lista) {
  const tbody = document.querySelector('#tablaPersonasPermiso tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">No hay personas asignadas</td></tr>';
    return;
  }

  const itemsPagina = modalPersonasPagination.getPageItems(lista);

  itemsPagina.forEach((persona) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${persona.id_bombero ?? '—'}</td>
      <td>${persona.n_funcionario ?? '—'}</td>
      <td>${`${persona.nombre ?? ''} ${persona.apellidos ?? ''}`.trim() || '—'}</td>`;
    tbody.appendChild(tr);
  });
}

async function cargarPermisos() {
  try {
    showTableLoading('#tabla tbody', 8);
    const respuesta = await PermisoApi.getAll();
    permisos = respuesta?.data || respuesta || [];
    pagination.setData(permisos, () => renderTablaPermisos(permisos));
    pagination.render('pagination-permiso');
    renderTablaPermisos(permisos);
    poblarFiltroMotivo(permisos);
    poblarFiltroEstado(permisos);
    bindFiltros();
  } catch (_error) {
    permisos = [];
    pagination.setData([], () => renderTablaPermisos([]));
    pagination.render('pagination-permiso');
    renderTablaPermisos([]);
  }
}

async function cargarMotivos() {
  try {
    const respuesta = await MotivoApi.getAll();
    motivos = respuesta?.data || respuesta || [];
  } catch (_error) {
    motivos = [];
  }
}

function poblarFiltroMotivo(lista) {
  const select = document.getElementById('filtroMotivo');
  if (!select) return;

  const valorActual = select.value;
  select.innerHTML = '<option value="">Todos</option>';

  const motivosUnicos = [...new Set(lista.map((permiso) => permiso.cod_motivo).filter(Boolean))].sort((a, b) => a - b);
  motivosUnicos.forEach((motivo) => {
    const permisoConMotivo = lista.find((permiso) => String(permiso.cod_motivo) === String(motivo));
    const option = document.createElement('option');
    option.value = motivo;
    option.textContent = formatearMotivo(permisoConMotivo);
    select.appendChild(option);
  });

  select.value = valorActual;
}

function poblarFiltroEstado(lista) {
  const select = document.getElementById('filtroEstado');
  if (!select) return;

  const valorActual = select.value;
  select.innerHTML = '<option value="">Todos</option>';

  [...new Set(lista.map((permiso) => permiso.estado).filter(Boolean))]
    .sort()
    .forEach((estado) => {
      const option = document.createElement('option');
      option.value = estado;
      option.textContent = estado;
      select.appendChild(option);
    });

  select.value = valorActual;
}

function bindFiltros() {
  if (filtrosInicializados) return;

  document.getElementById('filtroMotivo')?.addEventListener('change', aplicarFiltros);
  document.getElementById('filtroEstado')?.addEventListener('change', aplicarFiltros);
  document.getElementById('filtroFecha')?.addEventListener('change', aplicarFiltros);
  filtrosInicializados = true;
}

function aplicarFiltros() {
  pagination.goToPage(0);

  const filtroMotivo = document.getElementById('filtroMotivo')?.value ?? '';
  const filtroEstado = document.getElementById('filtroEstado')?.value ?? '';
  const filtroFecha = document.getElementById('filtroFecha')?.value ?? '';

  const filtrados = permisos.filter((permiso) => {
    const cumpleMotivo = !filtroMotivo || String(permiso.cod_motivo) === String(filtroMotivo);
    const cumpleEstado = !filtroEstado || permiso.estado === filtroEstado;
    const cumpleFecha = !filtroFecha || String(permiso.fecha_hora_inicio || '').startsWith(filtroFecha);
    return cumpleMotivo && cumpleEstado && cumpleFecha;
  });

  pagination.setData(filtrados, () => renderTablaPermisos(filtrados));
  pagination.render('pagination-permiso');
  renderTablaPermisos(filtrados);
}

async function cargarSelectMotivos(seleccionado, idSelect) {
  const select = document.getElementById(idSelect);
  if (!select) return;

  try {
    select.innerHTML = '<option value="">Seleccione motivo...</option>';

    motivos.forEach((motivo) => {
      const option = document.createElement('option');
      option.value = motivo.cod_motivo;
      option.textContent = `${motivo.nombre} (${motivo.dias} dias)`;
      if (seleccionado && String(motivo.cod_motivo) === String(seleccionado)) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  } catch (error) {
    mostrarError(error.message || 'Error cargando motivos');
  }
}

function obtenerMotivoPorCodigo(codMotivo) {
  return motivos.find((motivo) => String(motivo.cod_motivo) === String(codMotivo)) || null;
}

function sumarDiasAFecha(valorInicio, dias) {
  if (!valorInicio) return '';

  const fechaInicio = new Date(valorInicio);
  if (Number.isNaN(fechaInicio.getTime())) return '';

  fechaInicio.setDate(fechaInicio.getDate() + Number(dias || 0));

  const anio = fechaInicio.getFullYear();
  const mes = String(fechaInicio.getMonth() + 1).padStart(2, '0');
  const dia = String(fechaInicio.getDate()).padStart(2, '0');
  const horas = String(fechaInicio.getHours()).padStart(2, '0');
  const minutos = String(fechaInicio.getMinutes()).padStart(2, '0');

  return `${anio}-${mes}-${dia}T${horas}:${minutos}`;
}

function autocompletarFechaFin({ forzar = false } = {}) {
  const motivoSelect = document.getElementById('motivo');
  const inicioInput = document.getElementById('fechaHoraInicio');
  const finInput = document.getElementById('fechaHoraFin');
  if (!motivoSelect || !inicioInput || !finInput) return;

  const motivo = obtenerMotivoPorCodigo(motivoSelect.value);
  const puedeRecalcular = forzar || !finInput.value || finInput.dataset.autoCalculated === 'true';

  if (!motivo || !inicioInput.value || !puedeRecalcular) return;

  const valorCalculado = sumarDiasAFecha(inicioInput.value, motivo.dias);
  if (!valorCalculado) return;

  finInput.value = valorCalculado;
  finInput.dataset.autoCalculated = 'true';
}

function bindAutocalculoFechaFin() {
  const form = document.getElementById('formInsertar');
  const motivoSelect = document.getElementById('motivo');
  const inicioInput = document.getElementById('fechaHoraInicio');
  const finInput = document.getElementById('fechaHoraFin');
  if (!form || !motivoSelect || !inicioInput || !finInput) return;

  motivoSelect.addEventListener('change', () => autocompletarFechaFin());
  inicioInput.addEventListener('change', () => autocompletarFechaFin());
  inicioInput.addEventListener('input', () => autocompletarFechaFin());
  finInput.addEventListener('input', () => {
    finInput.dataset.autoCalculated = 'false';
  });
  form.addEventListener('reset', () => {
    finInput.dataset.autoCalculated = 'true';
  });
}

function renderTablaPermisos(lista) {
  const tbody = document.querySelector('#tabla tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No hay permisos registrados</td></tr>';
    return;
  }

  const itemsPagina = pagination.getPageItems(lista);
  const puedeEditar = puedeGestionarPermisos();

  itemsPagina.forEach((permiso) => {
    const tr = document.createElement('tr');

    let botonesAccion = `
      <button type="button" class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${permiso.id_permiso}" title="Ver detalle">
        <i class="bi bi-eye"></i>
      </button>`;

    if (puedeEditar) {
      botonesAccion += `
      <button type="button" class="btn p-0 btn-editar" data-bs-toggle="modal" data-bs-target="#modalEditar" data-id="${permiso.id_permiso}" title="Editar permiso">
        <i class="bi bi-pencil text-primary"></i>
      </button>`;
    }

    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${permiso.id_permiso}</td>
      <td>${formatearMotivo(permiso)}</td>
      <td class="d-none d-lg-table-cell">${permiso.bombero_nombre ? `${permiso.bombero_nombre} ${permiso.bombero_apellidos ?? ''}`.trim() : (permiso.id_bombero ?? '—')}</td>
      <td>${formatearFechaHoraCorta(permiso.fecha_hora_inicio)}</td>
      <td>${formatearFechaHoraCorta(permiso.fecha_hora_fin)}</td>
      <td>${renderEstadoBadge(permiso.estado)}</td>
      <td class="d-none d-md-table-cell">${truncar(permiso.descripcion, 80) || '—'}</td>
      <td>
        <div class="d-flex justify-content-around">
          ${botonesAccion}
        </div>
      </td>`;

    tbody.appendChild(tr);
  });
}

function formatearMotivo(permiso) {
  if (!permiso?.cod_motivo) return '—';
  if (!permiso?.motivo_nombre) return permiso.cod_motivo;
  return `${permiso.cod_motivo} - ${permiso.motivo_nombre}`;
}

function validarDatosPermiso(data, opciones = {}) {
  const { requiereMotivo = false, requiereRango = false } = opciones;

  if (requiereMotivo && !data.cod_motivo) {
    mostrarError('El motivo es obligatorio');
    return false;
  }

  if (data.estado) {
    const estado = normalizarEstado(data.estado);
    if (!ESTADOS_PERMISO_VALIDOS.includes(estado)) {
      mostrarError('El estado no es valido (debe ser ACEPTADO, REVISION o DENEGADO)');
      return false;
    }
  }

  if (requiereRango && (!data.fecha_hora_inicio || !data.fecha_hora_fin)) {
    mostrarError('La fecha y hora de inicio y fin son obligatorias');
    return false;
  }

  const inicio = data.fecha_hora_inicio ? Date.parse(data.fecha_hora_inicio.replace(' ', 'T')) : null;
  const fin = data.fecha_hora_fin ? Date.parse(data.fecha_hora_fin.replace(' ', 'T')) : null;

  if (data.fecha_hora_inicio && Number.isNaN(inicio)) {
    mostrarError('La fecha y hora de inicio no tiene un formato valido');
    return false;
  }

  if (data.fecha_hora_fin && Number.isNaN(fin)) {
    mostrarError('La fecha y hora de fin no tiene un formato valido');
    return false;
  }

  if (inicio !== null && fin !== null && fin < inicio) {
    mostrarError('La fecha y hora de fin debe ser igual o posterior a la fecha y hora de inicio');
    return false;
  }

  return true;
}

function bindCrearPermiso() {
  const form = document.getElementById('formInsertar');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const data = {
      cod_motivo: formData.get('cod_motivo'),
      fecha_hora_inicio: normalizarFechaHoraLocal(formData.get('fecha_hora_inicio')),
      fecha_hora_fin: normalizarFechaHoraLocal(formData.get('fecha_hora_fin')),
      descripcion: formData.get('descripcion')?.trim() || null
    };

    if (!validarDatosPermiso(data, { requiereMotivo: true, requiereRango: true })) return;

    try {
      await PermisoApi.create(data);
      await cargarPermisos();
      form.reset();
      document.getElementById('fechaHoraFin')?.setAttribute('data-auto-calculated', 'true');
      mostrarExito('Permiso creado correctamente');
    } catch (error) {
      mostrarError(error.message || 'Error creando permiso');
    }
  });
}

function bindModalVer() {
  document.addEventListener('click', async (event) => {
    const boton = event.target.closest('.btn-ver');
    if (!boton) return;

    const permiso = permisos.find((item) => String(item.id_permiso) === String(boton.dataset.id));
    if (!permiso) return;

    const modalBody = document.getElementById('modalVerBody');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div class="mb-3">
        <p><strong>ID:</strong> ${permiso.id_permiso ?? '—'}</p>
        <p><strong>Motivo:</strong> ${formatearMotivo(permiso)}</p>
        <p><strong>Solicitante:</strong> ${obtenerSolicitante(permiso)}</p>
        <p><strong>Fecha solicitud:</strong> ${formatearFechaHoraCorta(permiso.fecha_solicitud)}</p>
        <p><strong>Inicio efectivo:</strong> ${formatearFechaHoraCorta(permiso.fecha_hora_inicio)}</p>
        <p><strong>Fin efectivo:</strong> ${formatearFechaHoraCorta(permiso.fecha_hora_fin)}</p>
        <p><strong>Estado:</strong> ${renderEstadoBadge(permiso.estado)}</p>
        <p><strong>Descripcion:</strong> ${permiso.descripcion ?? '—'}</p>
      </div>
      <hr>
      <h6 class="fw-bold">Personas con este permiso</h6>
      <div id="personas-container" class="table-responsive">
        <table class="table table-bordered table-striped mt-2" id="tablaPersonasPermiso">
          <thead class="table-dark">
            <tr>
              <th>ID</th>
              <th>N. Funcionario</th>
              <th>Nombre</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="3" class="text-center text-muted py-4">Cargando...</td>
            </tr>
          </tbody>
        </table>
        <div id="pagination-personas-permiso" class="mt-3"></div>
      </div>`;

    try {
      const respuesta = await PermisoApi.getPersonsByPermiso(permiso.id_permiso);
      const personasAsignadas = respuesta?.data || [];
      modalPersonasPagination.setData(personasAsignadas, () => renderTablaPersonasPermiso(personasAsignadas));
      modalPersonasPagination.render('pagination-personas-permiso');
      renderTablaPersonasPermiso(personasAsignadas);
    } catch (error) {
      const tbody = document.querySelector('#tablaPersonasPermiso tbody');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger py-4">${error.message || 'Error cargando personas'}</td></tr>`;
      }
      const paginationContainer = document.getElementById('pagination-personas-permiso');
      if (paginationContainer) {
        paginationContainer.innerHTML = '';
      }
    }
  });
}

function bindModalEditar() {
  document.addEventListener('click', (event) => {
    const boton = event.target.closest('.btn-editar');
    if (!boton) return;

    const permiso = permisos.find((item) => String(item.id_permiso) === String(boton.dataset.id));
    if (!permiso) return;

    const form = document.getElementById('formEditar');
    if (!form) return;

    form.innerHTML = `
      <input type="hidden" id="editIdPermiso" value="${permiso.id_permiso}">
      <div class="mb-3">
        <label class="form-label">Motivo</label>
        <input type="text" class="form-control" value="${formatearMotivo(permiso)}" readonly>
      </div>
      <div class="row">
        <div class="col-md-8 mb-3">
          <label class="form-label">Interesado</label>
          <input type="text" class="form-control" value="${obtenerSolicitante(permiso)}" readonly>
        </div>
        <div class="col-md-4 mb-3">
          <label class="form-label">ID interesado</label>
          <input type="text" class="form-control" value="${permiso.id_bombero ?? '—'}" readonly>
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label">Fecha solicitud</label>
        <input type="text" class="form-control" value="${formatearFechaHoraCorta(permiso.fecha_solicitud)}" readonly>
      </div>
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">Inicio efectivo</label>
          <input type="datetime-local" class="form-control" id="editFechaHoraInicio" value="${valorInputFechaHora(permiso.fecha_hora_inicio)}">
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">Fin efectivo</label>
          <input type="datetime-local" class="form-control" id="editFechaHoraFin" value="${valorInputFechaHora(permiso.fecha_hora_fin)}">
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label">Estado</label>
        <select class="form-select" id="editEstado">
          <option value="ACEPTADO" ${permiso.estado === 'ACEPTADO' ? 'selected' : ''}>ACEPTADO</option>
          <option value="REVISION" ${permiso.estado === 'REVISION' ? 'selected' : ''}>REVISION</option>
          <option value="DENEGADO" ${permiso.estado === 'DENEGADO' ? 'selected' : ''}>DENEGADO</option>
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label">Descripcion</label>
        <textarea class="form-control" id="editDescripcion" rows="3">${permiso.descripcion ?? ''}</textarea>
      </div>
      <div class="d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-primary" id="btnGuardarCambios">Guardar cambios</button>
      </div>`;

    document.getElementById('btnGuardarCambios')?.addEventListener('click', async () => {
      const data = construirPayloadEdicionPermiso();

      if (!validarDatosPermiso(data, { requiereRango: true })) return;

      const cambios = obtenerCambiosEdicionPermiso(permiso, data);

      if (Object.keys(cambios).length === 0) {
        mostrarError('No hay cambios para guardar.');
        return;
      }

      try {
        await PermisoApi.update(permiso.id_permiso, cambios);
        await cargarPermisos();
        bootstrap.Modal.getInstance(document.getElementById('modalEditar'))?.hide();
        mostrarExito('Permiso actualizado correctamente');
      } catch (error) {
        mostrarError(error.message || 'Error actualizando permiso');
      }
    });
  });
}
