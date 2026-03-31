import PersonaApiApi from '../api_f/PersonaApi.js';
import RolApi from '../api_f/RolApi.js';
import { authGuard } from '../helpers/authGuard.js';
import {
  validarDNI,
  validarEmail,
  validarTelefono,
  validarPassword,
  validarIdBombero,
  validarNumeroFuncionario
} from '../helpers/validacion.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';

let personas = [];
let rolesDisponibles = [];
let sesionActual = null;
const pagination = new PaginationHelper(15);
pagination.setLoadingCallback((isLoading) => {
    if (isLoading) {
        showTableLoading('#tabla tbody', 9);
    }
});

document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('personas');
  if (!sesionActual) return;

  cargarPersonas();
  cargarSelectRoles();
  bindModalVer();

  if (sesionActual.puedeEscribir) {
    bindCrearPersona();
    bindModalEditar();
    bindModalEliminar();
  }
});

// ================================
// CARGAR PERSONAS
// ================================
async function cargarPersonas() {
  try {
    showTableLoading('#tabla tbody', 9);
    const r = await PersonaApiApi.getAll();
    personas = r?.data || r || [];
    pagination.setData(personas, () => {
      renderTablaPersonas(personas);
    });
    pagination.render('pagination-persona');
    renderTablaPersonas(personas);
    poblarFiltroLocalidad(personas);
    bindFiltros();
  } catch (e) {
    personas = [];
    pagination.setData([], () => {
      renderTablaPersonas([]);
    });
    pagination.render('pagination-persona');
    renderTablaPersonas([]);
  }
}

// ================================
// FILTROS
// ================================
function poblarFiltroLocalidad(lista) {
  const select = document.getElementById('filtroLocalidad');
  if (!select) return;
  const valorActual = select.value;
  select.innerHTML = '<option value="">Todas</option>';
  const unicas = [...new Set(lista.map(p => p.localidad).filter(Boolean))].sort();
  unicas.forEach(l => {
    const opt = document.createElement('option');
    opt.value = l;
    opt.textContent = l;
    select.appendChild(opt);
  });
  select.value = valorActual;
}

function bindFiltros() {
  document.getElementById('filtroIDBombero')?.addEventListener('input', aplicarFiltros);
  document.getElementById('filtroLocalidad')?.addEventListener('change', aplicarFiltros);
  document.getElementById('filtroActivo')?.addEventListener('change', aplicarFiltros);
}

function aplicarFiltros() {
  pagination.goToPage(0);
  const filtroIDBombero = document.getElementById('filtroIDBombero')?.value.toLowerCase().trim() ?? '';
  const filtroLocalidad = document.getElementById('filtroLocalidad')?.value ?? '';
  const filtroActivo    = document.getElementById('filtroActivo')?.value ?? '';

  const filtrados = personas.filter(p => {
    const cumpleID        = !filtroIDBombero || String(p.id_bombero).toLowerCase().includes(filtroIDBombero);
    const cumpleLocalidad = !filtroLocalidad || p.localidad === filtroLocalidad;
    const cumpleActivo    = filtroActivo === '' || String(p.activo) === String(filtroActivo);
    return cumpleID && cumpleLocalidad && cumpleActivo;
  });
  pagination.setData(filtrados, () => {
      renderTablaPersonas(filtrados);
    });
  pagination.render('pagination-persona');
  renderTablaPersonas(filtrados);
}

// ================================
// POBLAR SELECT ROLES
// ================================
async function cargarSelectRoles() {
  const select = document.getElementById('rol'); if (!select) return;
  try {
    rolesDisponibles = await obtenerRolesDisponibles();
    poblarOpcionesRol(select, rolesDisponibles);
  } catch (e) { mostrarError(e.message || 'Error cargando roles'); }
}

async function obtenerRolesDisponibles() {
  if (rolesDisponibles.length) return rolesDisponibles;
  const res = await RolApi.getAll();
  rolesDisponibles = res?.data || res || [];
  return rolesDisponibles;
}

function poblarOpcionesRol(select, roles, selectedValue = '') {
  if (!select) return;

  select.innerHTML = '<option value="">Seleccione rol...</option>';
  roles.forEach((rol) => {
    const option = document.createElement('option');
    option.value = String(rol.id_rol);
    option.textContent = rol.nombre;
    option.selected = String(rol.id_rol) === String(selectedValue ?? '');
    select.appendChild(option);
  });
}

// ================================
// RENDER TABLA
// ================================
function renderTablaPersonas(lista) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';
  const puedeEscribir = sesionActual?.puedeEscribir ?? false;
  const itemsPagina = pagination.getPageItems(lista);

  itemsPagina.forEach(p => {
    const tr = document.createElement('tr');
    const botonesAccion = puedeEscribir
      ? `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${p.id_bombero}"><i class="bi bi-eye"></i></button>
         <button class="btn p-0 btn-editar" data-bs-toggle="modal" data-bs-target="#modalEditar" data-id="${p.id_bombero}"><i class="bi bi-pencil"></i></button>
         <button class="btn p-0 btn-eliminar" data-bs-toggle="modal" data-bs-target="#modalEliminar" data-id="${p.id_bombero}"><i class="bi bi-trash3"></i></button>`
      : `<button class="btn p-0 btn-ver" data-bs-toggle="modal" data-bs-target="#modalVer" data-id="${p.id_bombero}"><i class="bi bi-eye"></i></button>`;
    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${p.id_bombero}</td>
      <td class="d-none d-md-table-cell">${p.n_funcionario}</td>
      <td>${p.correo}</td>
      <td>${p.telefono}</td>
      <td>${p.nombre}</td>
      <td>${p.apellidos}</td>
      <td class="d-none d-md-table-cell">${p.localidad}</td>
      <td>${p.nombre_usuario}</td>
      <td class="celda-acciones">
        <div class="acciones-tabla">
          ${botonesAccion}
        </div>  
      </td>`;
    tbody.appendChild(tr);
  });
}

const nombresCampos = ['correo','telefono','f_ingreso_diputacion','talla_superior','talla_inferior','talla_calzado','nombre','apellidos','f_nacimiento','telefono_emergencia','domicilio','localidad','id_rol','activo','nombre_usuario'];
const camposBd      = ['correo','telefono','f_ingreso_diputacion','talla_superior','talla_inferior','talla_calzado','nombre','apellidos','f_nacimiento','telefono_emergencia','domicilio','localidad','id_rol','activo','nombre_usuario'];

// ================================
// MODAL VER
// ================================
function bindModalVer() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-ver'); if (!btn) return;
    const persona = personas.find(p => p.id_bombero == btn.dataset.id); if (!persona) return;
    const modalBody = document.getElementById('modalVerBody');
    modalBody.innerHTML = '';
    nombresCampos.forEach((nombre, idx) => {
      const p = document.createElement('p');
      p.innerHTML = `<strong>${nombre}:</strong> ${persona[camposBd[idx]] ?? ''}`;
      modalBody.appendChild(p);
    });
  });
}

// ================================
// VALIDAR DATOS DE PERSONA (CREAR)
// ================================
function validarDatosPersonaCrear(data) {
  // CORRECCIÓN: validar id_bombero con función de validacion.js
  if (!data.id_bombero) {
    mostrarError('El ID del bombero es obligatorio'); return false;
  }
  if (!validarIdBombero(data.id_bombero)) {
    mostrarError('El ID del bombero no tiene un formato válido (ej: B001)'); return false;
  }
  // CORRECCIÓN: validar n_funcionario con función de validacion.js
  if (!data.n_funcionario) {
    mostrarError('El número de funcionario es obligatorio'); return false;
  }
  if (!validarNumeroFuncionario(data.n_funcionario)) {
    mostrarError('El número de funcionario no tiene un formato válido (ej: DGA-2024-0001)'); return false;
  }
  // CORRECCIÓN: validar DNI con función de validacion.js
  if (!data.DNI) {
    mostrarError('El DNI es obligatorio'); return false;
  }
  if (!validarDNI(data.DNI)) {
    mostrarError('El DNI no es válido'); return false;
  }
  if (!data.nombre?.trim()) {
    mostrarError('El nombre es obligatorio'); return false;
  }
  if (!data.apellidos?.trim()) {
    mostrarError('Los apellidos son obligatorios'); return false;
  }
  // CORRECCIÓN: validar correo con función de validacion.js
  if (!data.correo) {
    mostrarError('El correo es obligatorio'); return false;
  }
  if (!validarEmail(data.correo)) {
    mostrarError('El correo no tiene un formato válido'); return false;
  }
  // CORRECCIÓN: validar teléfono principal con función de validacion.js
  if (!data.telefono) {
    mostrarError('El teléfono es obligatorio'); return false;
  }
  if (!validarTelefono(data.telefono)) {
    mostrarError('El teléfono no tiene un formato válido'); return false;
  }
  // CORRECCIÓN: validar teléfono de emergencia si se proporciona
  if (data.telefono_emergencia && !validarTelefono(data.telefono_emergencia)) {
    mostrarError('El teléfono de emergencia no tiene un formato válido'); return false;
  }
  // CORRECCIÓN: validar contraseña con función de validacion.js
  if (!data.contrasenia) {
    mostrarError('La contraseña es obligatoria'); return false;
  }
  if (!validarPassword(data.contrasenia)) {
    mostrarError('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un dígito y un símbolo'); return false;
  }
  if (!data.f_nacimiento) {
    mostrarError('La fecha de nacimiento es obligatoria'); return false;
  }
  if (!data.nombre_usuario?.trim()) {
    mostrarError('El nombre de usuario es obligatorio'); return false;
  }
  return true;
}

// ================================
// VALIDAR DATOS DE PERSONA (EDITAR)
// ================================
function validarDatosPersonaEditar(data) {
  if (data.correo && !validarEmail(data.correo)) {
    mostrarError('El correo no tiene un formato válido'); return false;
  }
  if (data.telefono && !validarTelefono(String(data.telefono))) {
    mostrarError('El teléfono no tiene un formato válido'); return false;
  }
  if (data.telefono_emergencia && !validarTelefono(String(data.telefono_emergencia))) {
    mostrarError('El teléfono de emergencia no tiene un formato válido'); return false;
  }
  return true;
}

// ================================
// CREAR PERSONA
// ================================
function bindCrearPersona() {
  const form = document.getElementById('formInsertarPersona');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const data = {
      id_bombero:           f.get('id_bombero')?.trim(),
      n_funcionario:        f.get('n_funcionario')?.trim(),
      DNI:                  f.get('dni')?.trim(),
      nombre:               f.get('nombre')?.trim(),
      apellidos:            f.get('apellidos')?.trim(),
      f_nacimiento:         f.get('f_nacimiento'),
      correo:               f.get('correo')?.trim(),
      telefono:             f.get('telefono')?.trim(),
      telefono_emergencia:  f.get('telefono_emergencia')?.trim() || null,
      f_ingreso_diputacion: f.get('f_ingreso_diputacion') || null,
      domicilio:            f.get('domicilio')?.trim() || null,
      localidad:            f.get('localidad')?.trim() || null,
      talla_superior:       f.get('talla_superior')?.trim() || null,
      talla_inferior:       f.get('talla_inferior')?.trim() || null,
      talla_calzado:        f.get('talla_calzado')?.trim() || null,
      id_rol:               f.get('id_rol') || null,
      nombre_usuario:       f.get('nombre_usuario')?.trim(),
      contrasenia:          f.get('contrasenia'),
    };

    // CORRECCIÓN: validar todos los campos antes de enviar
    if (!validarDatosPersonaCrear(data)) return;

    try {
      await PersonaApiApi.create(data);
      await cargarPersonas();
      form.reset();
      mostrarExito('Persona creada correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error creando persona');
    }
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
      const r = await PersonaApiApi.getById(id);
      const persona = r?.data || r; if (!persona) return;
      const roles = await obtenerRolesDisponibles();
      const form = document.getElementById('formEditar');
      form.innerHTML = `
        <div class="row mb-3">
          <div class="col-lg-4"><label class="form-label">Nombre</label><input type="text" class="form-control" name="nombre" value="${persona.nombre||''}"></div>
          <div class="col-lg-4"><label class="form-label">Apellidos</label><input type="text" class="form-control" name="apellidos" value="${persona.apellidos||''}"></div>
          <div class="col-lg-4"><label class="form-label">Correo</label><input type="email" class="form-control" name="correo" value="${persona.correo||''}"></div>
        </div>
        <div class="row mb-3">
          <div class="col-lg-4"><label class="form-label">Teléfono</label><input type="text" class="form-control" name="telefono" value="${persona.telefono||''}"></div>
          <div class="col-lg-4"><label class="form-label">Fecha Ingreso Diputación</label><input type="date" class="form-control" name="f_ingreso_diputacion" value="${persona.f_ingreso_diputacion||''}"></div>
          <div class="col-lg-4"><label class="form-label">Talla Superior</label><input type="text" class="form-control" name="talla_superior" value="${persona.talla_superior||''}"></div>
        </div>
        <div class="row mb-3">
          <div class="col-lg-4"><label class="form-label">Talla Inferior</label><input type="text" class="form-control" name="talla_inferior" value="${persona.talla_inferior||''}"></div>
          <div class="col-lg-4"><label class="form-label">Talla Calzado</label><input type="number" class="form-control" name="talla_calzado" value="${persona.talla_calzado||''}"></div>
          <div class="col-lg-4"><label class="form-label">Fecha Nacimiento</label><input type="date" class="form-control" name="f_nacimiento" value="${persona.f_nacimiento||''}"></div>
        </div>
        <div class="row mb-3">
          <div class="col-lg-4"><label class="form-label">Tel. Emergencia</label><input type="text" class="form-control" name="telefono_emergencia" value="${persona.telefono_emergencia||''}"></div>
          <div class="col-lg-4"><label class="form-label">Domicilio</label><input type="text" class="form-control" name="domicilio" value="${persona.domicilio||''}"></div>
          <div class="col-lg-4"><label class="form-label">Localidad</label><input type="text" class="form-control" name="localidad" value="${persona.localidad||''}"></div>
        </div>
        <div class="row mb-3">
          <div class="col-lg-4"><label class="form-label" for="editIdRol">Rol</label><select class="form-select" id="editIdRol" name="id_rol"><option value="">Seleccione rol...</option></select></div>
          <div class="col-lg-4"><label class="form-label">Activo</label>
            <select class="form-select" name="activo">
              <option value="1" ${persona.activo==1?'selected':''}>Sí</option>
              <option value="0" ${persona.activo==0?'selected':''}>No</option>
            </select>
          </div>
          <div class="col-lg-4"><label class="form-label">Nombre Usuario</label><input type="text" class="form-control" name="nombre_usuario" value="${persona.nombre_usuario||''}"></div>
        </div>
        <div class="text-center">
          <button type="button" id="btnGuardarCambios" class="btn btn-primary">Guardar cambios</button>
        </div>`;
      poblarOpcionesRol(form.querySelector('[name="id_rol"]'), roles, persona.id_rol);
      document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
        const data = {};
        camposBd.forEach(campo => {
          const input = form.querySelector(`[name="${campo}"]`); if (!input) return;
          let value = input.value;
          if (campo === 'activo') value = value === '1';
          if (campo === 'id_rol' && value !== '') value = Number(value);
          if (campo === 'talla_calzado' && value !== '') value = Number(value);
          if (value !== '' && value !== null && value !== undefined) data[campo] = value;
        });
        // CORRECCIÓN: validar correo y teléfonos en editar
        if (!validarDatosPersonaEditar(data)) return;
        try {
          await PersonaApiApi.update(id, data);
          await cargarPersonas();
          bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
          mostrarExito('Persona actualizada correctamente');
        } catch (err) { mostrarError('Error al editar persona: ' + err.message); }
      });
    } catch (err) { mostrarError('Error al cargar datos de persona'); }
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
      await PersonaApiApi.remove(id);
      await cargarPersonas();
      bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
      mostrarExito('Persona eliminada correctamente');
    } catch (err) { mostrarError('Error al eliminar persona: ' + err.message); }
  });
}

// ================================
// ALERTAS
// ================================
function mostrarError(msg) {
  const container = document.getElementById('alert-container');
  if (!container) return;
  const alertId = 'alert-' + Date.now();
  container.insertAdjacentHTML('beforeend', `
    <div id="${alertId}" class="alert alert-danger alert-dismissible fade show shadow" role="alert">
      <strong>Error:</strong> ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`);
  setTimeout(() => { const a = document.getElementById(alertId); if (a) { a.classList.remove('show'); setTimeout(() => a.remove(), 150); } }, 5000);
}

function mostrarExito(msg) {
  const container = document.getElementById('alert-container');
  if (!container) return;
  const alertId = 'alert-' + Date.now();
  container.insertAdjacentHTML('beforeend', `
    <div id="${alertId}" class="alert alert-success alert-dismissible fade show shadow" role="alert">
      <strong>Éxito:</strong> ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`);
  setTimeout(() => { const a = document.getElementById(alertId); if (a) { a.classList.remove('show'); setTimeout(() => a.remove(), 150); } }, 5000);
}