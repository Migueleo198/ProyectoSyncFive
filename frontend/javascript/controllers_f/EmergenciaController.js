/**
 * EmergenciaController.js  —  con authGuard integrado
 *
 * Ejemplo de cómo integrar el guard en un controlador existente.
 * Los cambios respecto a la versión original están marcados con // ← NUEVO
 */

import EmergenciaApi      from '../api_f/EmergenciaApi.js';
import TipoEmergenciaApi  from '../api_f/TipoEmergenciaApi.js';
import VehiculoApi        from '../api_f/VehiculoApi.js';
import PersonaApi         from '../api_f/PersonaApi.js';
import { authGuard }      from '../helpers/authGuard.js';          // ← NUEVO
import { mostrarError, mostrarExito, formatearFechaHora } from '../helpers/utils.js';

let modalEquipoDesdeInsertar = false;
let emergencias = [];
let vehiculosEnModal = [];
let todasLasPersonas = [];
let sesionActual = null;   // ← NUEVO: guardamos la sesión para usarla en renderTabla

// ================================
// DOM CONTENT LOADED
// ================================
document.addEventListener('DOMContentLoaded', async () => {

  // ── GUARD ── primero verificamos sesión y permisos ──────────  // ← NUEVO
  sesionActual = await authGuard('emergencias');
  if (!sesionActual) return; // redirigido automáticamente
  // ────────────────────────────────────────────────────────────

  cargarEmergencias();
  cargarTiposEmergencia(0, 'filtroTipoEmergencia');
  cargarTiposEmergencia(0, 'tipoEmergenciaInsert');
  cargarSelectVehiculos();
  cargarPersonas();
  bindModalEquipo();

  // Solo vinculamos el form de insertar si puede escribir             // ← NUEVO
  if (sesionActual.puedeEscribir) {
    bindCrearEmergencia();
  }
});

// ================================
// CARGAR EMERGENCIAS
// ================================
async function cargarEmergencias() {
  try {
    const response = await EmergenciaApi.getAll();
    emergencias = response.data;
    renderTablaEmergencias(emergencias);
  } catch (e) {
    mostrarError(e.message || 'Error cargando emergencias');
  }
}

// ================================
// CARGAR TIPOS DE EMERGENCIA
// ================================
async function cargarTiposEmergencia(tipoSeleccionado, id_select) {
  const select = document.getElementById(id_select);
  if (!select) return;

  try {
    const response = await TipoEmergenciaApi.getAll();
    const tipos = response.data;
    select.innerHTML = '<option value="">Seleccione...</option>';
    tipos.forEach(tipo => {
      const option = document.createElement('option');
      option.value = tipo.codigo_tipo;
      option.textContent = tipo.nombre;
      if (tipoSeleccionado !== 0 && Number(tipo.codigo_tipo) === Number(tipoSeleccionado)) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  } catch (e) {
    mostrarError(e.message || 'Error cargando tipos de emergencia');
  }
}

// ================================
// CARGAR VEHÍCULOS
// ================================
async function cargarSelectVehiculos() {
  const select = document.getElementById('selectVehiculo');
  if (!select) return;

  try {
    const response = await VehiculoApi.getAll();
    const vehiculos = response.data;
    select.innerHTML = '<option value="">Seleccione vehículo...</option>';
    vehiculos.forEach(v => {
      const option = document.createElement('option');
      option.value = v.matricula;
      option.textContent = v.matricula;
      select.appendChild(option);
    });
  } catch (e) {
    mostrarError(e.message || 'Error cargando vehículos');
  }
}

// ================================
// CARGAR PERSONAS
// ================================
async function cargarPersonas() {
  try {
    const response = await PersonaApi.getAll();
    todasLasPersonas = response.data;
  } catch (e) {
    mostrarError(e.message || 'Error cargando personas');
  }
}

// ================================
// RENDER TABLA
// ================================
async function renderTablaEmergencias(lista) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';

  const puedeEscribir = sesionActual?.puedeEscribir ?? false;  
  for (const e of lista) {
    const tr = document.createElement('tr');

    let textoVehiculos = '—';
    try {
      const respV = await EmergenciaApi.getVehiculosEmergencia(e.id_emergencia);
      const vehiculos = respV.data || [];
      if (vehiculos.length > 0) {
        textoVehiculos = vehiculos.map(v => v.matricula).join(', ');
      }
    } catch { /* dejamos — */ }

    // ── Botones de acción según permiso ──────────────────────  
    const botonesAccion = puedeEscribir
      ? `
        <button type="button" class="btn p-0 btn-ver"
                data-bs-toggle="modal" data-bs-target="#modalVer"
                data-id="${e.id_emergencia}">
          <i class="bi bi-eye"></i>
        </button>
        <button type="button" class="btn p-0 btn-editar"
                data-bs-toggle="modal" data-bs-target="#modalEditar"
                data-id="${e.id_emergencia}">
          <i class="bi bi-pencil"></i>
        </button>`
      : `
        <button type="button" class="btn p-0 btn-ver"
                data-bs-toggle="modal" data-bs-target="#modalVer"
                data-id="${e.id_emergencia}">
          <i class="bi bi-eye"></i>
        </button>`;
    // ────────────────────────────────────────────────────────

    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${e.id_emergencia}</td>
      <td>${formatearFechaHora(e.fecha)}</td>
      <td class="d-none d-md-table-cell">${e.descripcion ?? ''}</td>
      <td>${e.estado}</td>
      <td class="d-none d-md-table-cell">${e.direccion ?? ''}</td>
      <td>${e.nombre_tipo ?? ''}</td>
      <td class="d-none d-md-table-cell">${textoVehiculos}</td>
      <td class="d-flex justify-content-around">${botonesAccion}</td>
    `;
    tbody.appendChild(tr);
  }
}

// ================================
// BIND MODAL EQUIPO
// ================================
function bindModalEquipo() {

  document.getElementById('modalInsertarEquipo')
    .addEventListener('show.bs.modal', (event) => {
      const trigger = event.relatedTarget;
      modalEquipoDesdeInsertar = !!(trigger && trigger.closest && trigger.closest('#formIncidencia'));

      if (modalEquipoDesdeInsertar) {
        vehiculosEnModal = [];
        document.getElementById('fechSalida').value  = '';
        document.getElementById('fechLlegada').value = '';
        document.getElementById('fechRegreso').value = '';
      }
      renderVehiculosModal();
    });

  document.getElementById('modalInsertarEquipo')
    .addEventListener('shown.bs.modal', () => {
      document.body.classList.add('modal-open');
    });

  document.getElementById('btnAnadirVehiculo').addEventListener('click', () => {
    const select   = document.getElementById('selectVehiculo');
    const matricula = select.value;
    const label     = select.options[select.selectedIndex]?.text;

    if (!matricula) { mostrarError('Seleccione un vehículo'); return; }
    if (vehiculosEnModal.find(v => v.matricula === matricula)) {
      mostrarError('Este vehículo ya está añadido'); return;
    }

    vehiculosEnModal.push({ matricula, label, personas: [], esNuevo: true });
    renderVehiculosModal();
    select.value = '';
  });

  document.getElementById('btnGuardarEquipo').addEventListener('click', () => {
    if (vehiculosEnModal.length === 0) {
      mostrarError('Añade al menos un vehículo'); return;
    }

    const fechSalida  = document.getElementById('fechSalida').value;
    const fechLlegada = document.getElementById('fechLlegada').value;
    const fechRegreso = document.getElementById('fechRegreso').value;

    vehiculosEnModal = vehiculosEnModal.map(v => ({
      ...v,
      f_salida:  v.esNuevo ? (fechSalida  || null) : v.f_salida,
      f_llegada: v.esNuevo ? (fechLlegada || null) : v.f_llegada,
      f_regreso: v.esNuevo ? (fechRegreso || null) : v.f_regreso,
    }));

    const resumenTexto = vehiculosEnModal.map(v => v.matricula).join(', ') || '—';

    const resumenEditar   = document.getElementById('resumenVehiculosEditar');
    const resumenInsertar = document.getElementById('resumenVehiculosInsertar');
    if (resumenEditar)   resumenEditar.value       = resumenTexto;
    if (resumenInsertar) resumenInsertar.textContent = resumenTexto;

    mostrarExito(`${vehiculosEnModal.length} vehículo(s) listos para guardar`);

    const modalVehiculosEl = document.getElementById('modalInsertarEquipo');
    const modalVehiculos   = bootstrap.Modal.getInstance(modalVehiculosEl);
    modalVehiculos.hide();

    if (!modalEquipoDesdeInsertar) {
      modalVehiculosEl.addEventListener('hidden.bs.modal', function handler() {
        modalVehiculosEl.removeEventListener('hidden.bs.modal', handler);
        const modalEditar = new bootstrap.Modal(document.getElementById('modalEditar'));
        modalEditar.show();
      });
    }
  });
}

// ================================
// RENDER VEHÍCULOS EN EL MODAL
// ================================
function renderVehiculosModal() {
  const contenedor = document.getElementById('listaVehiculosAsignados');
  contenedor.innerHTML = '';

  if (vehiculosEnModal.length === 0) {
    contenedor.innerHTML = '<p class="text-muted text-center">Sin vehículos añadidos</p>';
    return;
  }

  vehiculosEnModal.forEach((vehiculo, idx) => {
    const personasDisponibles = todasLasPersonas.filter(
      p => !vehiculo.personas.find(pa => pa.id_bombero == p.id_bombero)
    );

    const bloque = document.createElement('div');
    bloque.className = 'border rounded p-3 mb-3';
    bloque.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <strong>
          🚒 ${vehiculo.label}
          ${vehiculo.esNuevo ? '<span class="badge bg-success ms-2">Nuevo</span>' : ''}
        </strong>
        <button type="button" class="btn btn-sm btn-outline-secondary btn-quitar-vehiculo"
                data-idx="${idx}">Quitar</button>
      </div>
      <div class="row mb-2 align-items-end">
        <div class="col-md-8">
          <select class="form-select form-select-sm select-persona" data-idx="${idx}">
            <option value="">Añadir persona...</option>
            ${personasDisponibles.map(p =>
              `<option value="${p.id_bombero}">${p.nombre ?? p.id_bombero}</option>`
            ).join('')}
          </select>
        </div>
        <div class="col-md-4">
          <button type="button" class="btn btn-sm btn-outline-primary w-100 btn-añadir-persona"
                  data-idx="${idx}">+ Persona</button>
        </div>
      </div>
      <table class="table table-bordered table-sm text-center align-middle mb-0">
        <thead class="table-secondary">
          <tr><th>ID</th><th>Nombre</th><th></th></tr>
        </thead>
        <tbody>
          ${vehiculo.personas.length === 0
            ? `<tr><td colspan="3" class="text-muted">Sin personal asignado</td></tr>`
            : vehiculo.personas.map((p, pi) => `
                <tr>
                  <td>${p.id_bombero}</td>
                  <td>${p.nombre}</td>
                  <td>
                    <button type="button" class="btn btn-sm btn-outline-danger btn-quitar-persona"
                            data-idx="${idx}" data-pi="${pi}">✕</button>
                  </td>
                </tr>`).join('')
          }
        </tbody>
      </table>
    `;
    contenedor.appendChild(bloque);
  });

  contenedor.querySelectorAll('.btn-quitar-vehiculo').forEach(btn => {
    btn.addEventListener('click', () => {
      vehiculosEnModal.splice(Number(btn.dataset.idx), 1);
      renderVehiculosModal();
    });
  });

  contenedor.querySelectorAll('.btn-añadir-persona').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx          = Number(btn.dataset.idx);
      const selectPersona = contenedor.querySelector(`.select-persona[data-idx="${idx}"]`);
      const idPersona     = selectPersona.value;
      const nombrePersona = selectPersona.options[selectPersona.selectedIndex]?.text;
      if (!idPersona) { mostrarError('Seleccione una persona'); return; }
      vehiculosEnModal[idx].personas.push({ id_bombero: idPersona, nombre: nombrePersona });
      renderVehiculosModal();
    });
  });

  contenedor.querySelectorAll('.btn-quitar-persona').forEach(btn => {
    btn.addEventListener('click', () => {
      vehiculosEnModal[Number(btn.dataset.idx)].personas.splice(Number(btn.dataset.pi), 1);
      renderVehiculosModal();
    });
  });
}

// ================================
// CREAR / INSERTAR EMERGENCIA
// ================================
function bindCrearEmergencia() {
  const form = document.getElementById('formIncidencia');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);

    const data = {
      fecha:              f.get('fecha'),
      estado:             f.get('estado'),
      direccion:          f.get('direccion'),
      codigo_tipo:        Number(f.get('codigo_tipo')),
      id_bombero:         f.get('id_bombero'),
      nombre_solicitante: f.get('nombre_solicitante'),
      tlf_solicitante:    f.get('tlf_solicitante'),
      descripcion:        f.get('descripcion'),
    };

    try {
      const nuevaEmergencia = await EmergenciaApi.create(data);
      const idEmergencia    = nuevaEmergencia.data.id_emergencia;

      if (vehiculosEnModal.length > 0) {
        for (const vehiculo of vehiculosEnModal) {
          await EmergenciaApi.addVehiculo(idEmergencia, {
            matricula: vehiculo.matricula,
            f_salida:  vehiculo.f_salida  || null,
            f_llegada: vehiculo.f_llegada || null,
            f_regreso: vehiculo.f_regreso || null,
          });

          for (const persona of (vehiculo.personas ?? [])) {
            await EmergenciaApi.setPersonal(idEmergencia, vehiculo.matricula, {
              id_bombero: persona.id_bombero,
            });
          }
        }
        vehiculosEnModal = [];
      }

      await cargarEmergencias();
      form.reset();
      const resumenInsertar = document.getElementById('resumenVehiculosInsertar');
      if (resumenInsertar) resumenInsertar.textContent = 'Sin vehículos asignados';
      mostrarExito('Emergencia creada correctamente');

    } catch (err) {
      mostrarError(err.message || 'Error creando emergencia');
    }
  });
}

// ================================
// MODAL EDITAR  (solo se vincula si puedeEscribir, gracias al CSS guard)
// ================================
document.addEventListener('click', async function (e) {
  // Abrir modal vehículos desde modal editar
  const btnEditarVehiculos = e.target.closest('.btn-editar-vehiculos');
  if (btnEditarVehiculos) {
    const modalEditarEl = document.getElementById('modalEditar');
    const modalEditar   = bootstrap.Modal.getInstance(modalEditarEl);
    if (modalEditar) modalEditar.hide();

    modalEditarEl.addEventListener('hidden.bs.modal', function handler() {
      modalEditarEl.removeEventListener('hidden.bs.modal', handler);
      new bootstrap.Modal(document.getElementById('modalInsertarEquipo')).show();
    });
    return;
  }

  // Abrir modal editar
  const btnEditar = e.target.closest('.btn-editar');
  if (!btnEditar) return;

  const id = btnEditar.dataset.id;

  try {
    const response   = await EmergenciaApi.getById(id);
    const emergencia = response.data;
    if (!emergencia) return;

    vehiculosEnModal = [];

    try {
      const respVehiculos = await EmergenciaApi.getVehiculosEmergencia(id);
      vehiculosEnModal = await Promise.all(
        (respVehiculos.data || []).map(async (v) => {
          let personas = [];
          try {
            const respPersonal = await EmergenciaApi.getPersonal(id, v.matricula);
            personas = (respPersonal.data || []).map(p => {
              const local = todasLasPersonas.find(tp => tp.id_bombero == p.id_bombero);
              return { id_bombero: p.id_bombero, nombre: local?.nombre ?? p.nombre ?? p.id_bombero };
            });
          } catch {}
          return {
            matricula: v.matricula, label: v.matricula, personas,
            personasOriginales: personas.map(p => p.id_bombero),
            f_salida: v.f_salida || null, f_llegada: v.f_llegada || null, f_regreso: v.f_regreso || null,
            esNuevo: false,
          };
        })
      );
    } catch (err) {
      console.error('Error al cargar vehículos:', err);
    }

    const vehiculosOriginales = vehiculosEnModal.map(v => v.matricula);

    const form = document.getElementById('formEditar');
    form.innerHTML = `
      <div class="row mb-3">
        <div class="col-lg-4">
          <label class="form-label">Fecha</label>
          <input type="text" class="form-control"
                 value="${formatearFechaHora(emergencia.fecha) || ''}" disabled>
        </div>
        <div class="col-lg-4">
          <label class="form-label">Estado</label>
          <select class="form-select" name="estado">
            <option value="ACTIVA"  ${emergencia.estado === 'ACTIVA'  ? 'selected' : ''}>ACTIVA</option>
            <option value="CERRADA" ${emergencia.estado === 'CERRADA' ? 'selected' : ''}>CERRADA</option>
          </select>
        </div>
        <div class="col-lg-4">
          <label class="form-label">Dirección</label>
          <input type="text" class="form-control" name="direccion" value="${emergencia.direccion || ''}">
        </div>
      </div>
      <div class="row mb-3">
        <div class="col-lg-4">
          <label class="form-label">Tipo</label>
          <select class="form-select" name="codigo_tipo" id="selectTipoEmergencia">
            <option value="">Seleccione...</option>
          </select>
        </div>
        <div class="col-lg-4">
          <label class="form-label">ID Bombero</label>
          <input type="text" class="form-control" name="id_bombero" value="${emergencia.id_bombero || ''}">
        </div>
        <div class="col-lg-4">
          <label class="form-label">Nombre Solicitante</label>
          <input type="text" class="form-control" name="nombre_solicitante"
                 value="${emergencia.nombre_solicitante || ''}">
        </div>
      </div>
      <div class="row mb-3">
        <div class="col-lg-4">
          <label class="form-label">Teléfono Solicitante</label>
          <input type="tel" class="form-control" name="tlf_solicitante"
                 value="${emergencia.tlf_solicitante || ''}">
        </div>
        <div class="col-lg-8">
          <label class="form-label">Vehículos asignados</label>
          <div class="input-group">
            <input type="text" class="form-control"
                   value="${vehiculosEnModal.map(v => v.matricula).join(', ') || '—'}"
                   disabled id="resumenVehiculosEditar">
            <button type="button" class="btn btn-primary btn-editar-vehiculos">✏️</button>
          </div>
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label">Descripción</label>
        <textarea class="form-control" name="descripcion" rows="4">${emergencia.descripcion || ''}</textarea>
      </div>
      <div class="text-center">
        <button type="button" id="btnGuardarCambios" class="btn btn-primary">Guardar cambios</button>
      </div>
    `;

    await cargarTiposEmergencia(emergencia.codigo_tipo, 'selectTipoEmergencia');

    document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
      const camposBd = ['fecha','estado','direccion','codigo_tipo','id_bombero','nombre_solicitante','tlf_solicitante','descripcion'];
      const data = {};
      camposBd.forEach(campo => {
        const input = form.querySelector(`[name="${campo}"]`);
        if (input) data[campo] = input.value;
      });

      await EmergenciaApi.update(id, data);

      const vehiculosActuales   = vehiculosEnModal.map(v => v.matricula);
      const vehiculosNuevos     = vehiculosEnModal.filter(v => !vehiculosOriginales.includes(v.matricula));
      const vehiculosEliminados = vehiculosOriginales.filter(v => !vehiculosActuales.includes(v));
      const vehiculosExistentes = vehiculosEnModal.filter(v => vehiculosOriginales.includes(v.matricula));

      for (const matricula of vehiculosEliminados) {
        try { await EmergenciaApi.deleteVehiculo(id, matricula); } catch {}
      }
      for (const vehiculo of vehiculosNuevos) {
        try {
          await EmergenciaApi.addVehiculo(id, {
            matricula: vehiculo.matricula,
            f_salida: vehiculo.f_salida || null,
            f_llegada: vehiculo.f_llegada || null,
            f_regreso: vehiculo.f_regreso || null,
          });
        } catch {}
        for (const persona of (vehiculo.personas ?? [])) {
          try { await EmergenciaApi.setPersonal(id, vehiculo.matricula, { id_bombero: persona.id_bombero }); } catch {}
        }
      }
      for (const vehiculo of vehiculosExistentes) {
        const originales    = vehiculo.personasOriginales || [];
        const personasNuevas = vehiculo.personas.filter(p => !originales.includes(p.id_bombero));
        for (const persona of personasNuevas) {
          try { await EmergenciaApi.setPersonal(id, vehiculo.matricula, { id_bombero: persona.id_bombero }); } catch {}
        }
        const actuales          = vehiculo.personas.map(p => p.id_bombero);
        const personasEliminadas = originales.filter(idB => !actuales.includes(idB));
        for (const idBombero of personasEliminadas) {
          try { await EmergenciaApi.deletePersonal(id, vehiculo.matricula, idBombero); } catch {}
        }
      }

      await cargarEmergencias();
      bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
      mostrarExito('Emergencia actualizada correctamente');
    });

  } catch (error) {
    mostrarError('Error al editar emergencia: ' + error.message);
  }
});

// ================================
// MODAL VER
// ================================
document.addEventListener('click', async function (e) {
  const btn = e.target.closest('.btn-ver');
  if (!btn) return;

  const id        = btn.dataset.id;
  const emergencia = emergencias.find(em => em.id_emergencia == id);
  if (!emergencia) return;

  const modalBody = document.getElementById('modalVerBody');
  modalBody.innerHTML = '<p class="text-center text-muted">Cargando...</p>';

  const filas = [
    { label: 'ID Emergencia',      valor: emergencia.id_emergencia },
    { label: 'Fecha',              valor: formatearFechaHora(emergencia.fecha) },
    { label: 'Estado',             valor: emergencia.estado },
    { label: 'Dirección',          valor: emergencia.direccion          ?? '—' },
    { label: 'Tipo Emergencia',    valor: emergencia.nombre_tipo        ?? '—' },
    { label: 'ID Bombero',         valor: emergencia.id_bombero         ?? '—' },
    { label: 'Nombre Solicitante', valor: emergencia.nombre_solicitante ?? '—' },
    { label: 'Teléfono',           valor: emergencia.tlf_solicitante    ?? '—' },
    { label: 'Descripción',        valor: emergencia.descripcion        ?? '—' },
  ];

  let html = '<table class="table table-sm table-bordered mb-4">';
  filas.forEach(f => {
    html += `<tr><th class="table-secondary w-40">${f.label}</th><td>${f.valor}</td></tr>`;
  });
  html += '</table>';

  html += '<h6 class="fw-bold mb-2">🚒 Vehículos y Personal</h6>';

  try {
    const respV    = await EmergenciaApi.getVehiculosEmergencia(id);
    const vehiculos = respV.data || [];

    if (vehiculos.length === 0) {
      html += '<p class="text-muted">Sin vehículos asignados</p>';
    } else {
      for (const vehiculo of vehiculos) {
        html += `
          <div class="border rounded p-3 mb-3">
            <div class="fw-bold mb-2">🚒 ${vehiculo.matricula}</div>
            <div class="row text-muted small mb-2">
              <div class="col-md-4"><strong>Salida:</strong> ${vehiculo.f_salida  ? formatearFechaHora(vehiculo.f_salida)  : '—'}</div>
              <div class="col-md-4"><strong>Llegada:</strong> ${vehiculo.f_llegada ? formatearFechaHora(vehiculo.f_llegada) : '—'}</div>
              <div class="col-md-4"><strong>Regreso:</strong> ${vehiculo.f_regreso ? formatearFechaHora(vehiculo.f_regreso) : '—'}</div>
            </div>`;

        try {
          const respP   = await EmergenciaApi.getPersonal(id, vehiculo.matricula);
          const personal = respP.data || [];
          if (personal.length === 0) {
            html += '<p class="text-muted small mb-0">Sin personal asignado</p>';
          } else {
            html += `
              <table class="table table-sm table-bordered mb-0 text-center">
                <thead class="table-secondary"><tr><th>ID Bombero</th><th>Nombre</th></tr></thead>
                <tbody>
                  ${personal.map(p => `<tr><td>${p.id_bombero ?? '—'}</td><td>${p.nombre ?? '—'}</td></tr>`).join('')}
                </tbody>
              </table>`;
          }
        } catch {
          html += '<p class="text-danger small mb-0">Error al cargar personal</p>';
        }

        html += '</div>';
      }
    }
  } catch {
    html += '<p class="text-danger">Error al cargar vehículos</p>';
  }

  modalBody.innerHTML = html;
});