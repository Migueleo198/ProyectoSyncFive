import VehiculoApi from '../api_f/VehiculoApi.js';
import InstalacionApi from '../api_f/InstalacionApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { mostrarError, mostrarExito } from '../helpers/utils.js';
import { validarMatriculaEspanola } from '../helpers/validacion.js';

let vehiculos = [];
let instalaciones = [];
let sesionActual = null;

// ================================
// INICIALIZACIÓN
// ================================
document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('vehiculos');
  if (!sesionActual) return;

  cargarDatosIniciales();
  bindFiltros();
  bindModalVer();
  bindModalEliminarPreparar();

  if (sesionActual.puedeEscribir) {
    bindCrearVehiculo();
    bindModalEditar();
    bindModalEliminarConfirmar();
  }
});

// ================================
// CARGAR DATOS INICIALES
// ================================
async function cargarDatosIniciales() {
  try {
    await Promise.all([cargarInstalaciones(), cargarVehiculos()]);
  } catch (e) {
    mostrarError(e.message || 'Error cargando datos');
  }
}

// ================================
// CARGAR INSTALACIONES
// ================================
async function cargarInstalaciones() {
  try {
    const response = await InstalacionApi.getAll();
    instalaciones = response.data;
    poblarSelectInstalaciones();
  } catch (e) {
    console.error('Error cargando instalaciones:', e);
  }
}

// ================================
// CARGAR VEHÍCULOS
// ================================
async function cargarVehiculos() {
  try {
    const response = await VehiculoApi.getAll();
    vehiculos = response.data;
    vehiculos.forEach(v => {
      const instalacion = instalaciones.find(i => i.id_instalacion == v.id_instalacion);
      v.nombre_instalacion = instalacion ? instalacion.nombre : 'Sin asignar';
    });
    renderTablaVehiculos(vehiculos);
  } catch (e) {
    mostrarError(e.message || 'Error cargando vehículos');
  }
}

// ================================
// POBLAR SELECT DE INSTALACIONES
// ================================
function poblarSelectInstalaciones() {
  const selectInsert = document.getElementById('selectInstalacion');
  if (!selectInsert) return;
  selectInsert.innerHTML = '<option value="">Seleccione una instalación...</option>';
  instalaciones.forEach(i => {
    const option = document.createElement('option');
    option.value = i.id_instalacion;
    option.textContent = `${i.nombre} - ${i.localidad || ''}`;
    selectInsert.appendChild(option);
  });
}

// ================================
// RENDER TABLA
// CORRECCIÓN: bug tipográfico en <td"> corregido a <td>
// ================================
function renderTablaVehiculos(lista) {
  const tbody = document.querySelector('#tabla tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const puedeEscribir = sesionActual?.puedeEscribir ?? false;

  lista.forEach(v => {
    const tr = document.createElement('tr');
    tr.dataset.matricula = v.matricula;
    const botonesAccion = puedeEscribir
      ? `<button type="button" class="btn p-0 btn-ver" 
                data-bs-toggle="modal" data-bs-target="#modalVer"
                data-matricula="${v.matricula}"><i class="bi bi-eye"></i></button>
         <button type="button" class="btn p-0 btn-editar" 
                data-bs-toggle="modal" data-bs-target="#modalEditar" 
                data-matricula="${v.matricula}"><i class="bi bi-pencil"></i></button>
         <button type="button" class="btn p-0 btn-eliminar" 
                data-bs-toggle="modal" data-bs-target="#modalEliminar" 
                data-matricula="${v.matricula}"><i class="bi bi-trash3"></i></button>`
      : `<button type="button" class="btn p-0 btn-ver" 
                data-bs-toggle="modal" data-bs-target="#modalVer"
                data-matricula="${v.matricula}"><i class="bi bi-eye"></i></button>`;
    tr.innerHTML = `
      <td>${v.matricula}</td>
      <td class="d-none d-md-table-cell">${v.nombre ?? ''}</td>
      <td class="d-none d-md-table-cell">${v.tipo ?? ''}</td>
      <td>${v.disponibilidad == 1 ? 'Disponible' : 'No disponible'}</td>
      <td class="d-none d-md-table-cell">${v.nombre_instalacion ?? 'Sin asignar'}</td>
      <td class="d-none d-md-table-cell">${v.marca ?? ''} ${v.modelo ?? ''}</td>
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
  const filtroDisponibilidad = document.getElementById('disponibilidad');
  const filtroNombre = document.getElementById('nombre');
  if (filtroDisponibilidad) filtroDisponibilidad.addEventListener('change', aplicarFiltros);
  if (filtroNombre) filtroNombre.addEventListener('input', aplicarFiltros);
}

function aplicarFiltros() {
  const filtroDisponibilidad = document.getElementById('disponibilidad')?.value;
  const filtroNombre = document.getElementById('nombre')?.value?.toLowerCase();
  const filtrados = vehiculos.filter(v => {
    let cumple = true;
    if (filtroDisponibilidad && filtroDisponibilidad !== '') cumple = cumple && v.disponibilidad == filtroDisponibilidad;
    if (filtroNombre && filtroNombre !== '') cumple = cumple && v.nombre?.toLowerCase().includes(filtroNombre);
    return cumple;
  });
  renderTablaVehiculos(filtrados);
}

// ================================
// VALIDAR DATOS DE VEHÍCULO
// ================================
function validarDatosVehiculo(data, esCrear = true) {
  // CORRECCIÓN: validar matrícula con función de validacion.js
  if (esCrear) {
    if (!data.matricula?.trim()) { mostrarError('La matrícula es obligatoria'); return false; }
    if (!validarMatriculaEspanola(data.matricula)) {
      mostrarError('La matrícula no tiene un formato válido (ej: 1234BCD o AB1234CD)'); return false;
    }
  }
  if (!data.nombre?.trim()) { mostrarError('El nombre es obligatorio'); return false; }
  if (data.nombre.trim().length > 100) { mostrarError('El nombre no puede superar los 100 caracteres'); return false; }
  if (!data.tipo?.trim()) { mostrarError('El tipo es obligatorio'); return false; }

  // CORRECCIÓN: disponibilidad debe ser 0 o 1
  const disp = parseInt(data.disponibilidad);
  if (isNaN(disp) || ![0, 1].includes(disp)) {
    mostrarError('La disponibilidad no es válida'); return false;
  }

  // CORRECCIÓN: validar rango de coordenadas
  if (data.ult_latitud !== null && data.ult_latitud !== undefined && data.ult_latitud !== '') {
    const lat = parseFloat(data.ult_latitud);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      mostrarError('La latitud debe ser un número entre -90 y 90'); return false;
    }
  }
  if (data.ult_longitud !== null && data.ult_longitud !== undefined && data.ult_longitud !== '') {
    const lng = parseFloat(data.ult_longitud);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      mostrarError('La longitud debe ser un número entre -180 y 180'); return false;
    }
  }
  return true;
}

// ================================
// CREAR / INSERTAR VEHÍCULO
// ================================
function bindCrearVehiculo() {
  const form = document.getElementById('formInsertar');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const data = {
      matricula:      f.get('matricula')?.trim(),
      nombre:         f.get('nombre')?.trim(),
      marca:          f.get('marca')?.trim(),
      modelo:         f.get('modelo')?.trim(),
      tipo:           f.get('tipo')?.trim(),
      // CORRECCIÓN: parseInt controlado
      disponibilidad: parseInt(f.get('disponibilidad'))
    };

    const idInstalacion = f.get('id_instalacion') ? parseInt(f.get('id_instalacion')) : null;

    // CORRECCIÓN: parsear coordenadas y validar rango
    const latRaw = f.get('ult_latitud');
    const lngRaw = f.get('ult_longitud');
    if (latRaw) data.ult_latitud  = parseFloat(latRaw);
    if (lngRaw) data.ult_longitud = parseFloat(lngRaw);

    // CORRECCIÓN: validar antes de enviar
    if (!validarDatosVehiculo(data, true)) return;

    try {
      await VehiculoApi.create(data);
      if (idInstalacion) {
        await fetch(`/api/vehiculos/${data.matricula}/instalacion`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_instalacion: idInstalacion })
        });
      }
      await cargarVehiculos();
      form.reset();
      mostrarExito('Vehículo creado correctamente');
    } catch (err) {
      if (err.message?.includes('Duplicate entry')) {
        mostrarError(err.message.includes('nombre')
          ? 'No se puede añadir: ya existe otro vehículo con ese nombre'
          : err.message.includes('matricula')
          ? 'No se puede añadir: ya existe otro vehículo con esa matrícula'
          : 'No se puede añadir: ya existe un vehículo con esos datos');
      } else {
        mostrarError(err.message || 'Error creando vehículo');
      }
    }
  });
}

// ================================
// CAMPOS DE LA TABLA PARA MODALES
// ================================
const nombresCampos = ['Matrícula', 'Nombre', 'Tipo', 'Disponibilidad', 'Instalación', 'Marca', 'Modelo'];
const camposBd      = ['matricula', 'nombre', 'tipo', 'disponibilidad', 'id_instalacion', 'marca', 'modelo'];

// ================================
// MODAL VER
// ================================
function bindModalVer() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-ver');
    if (!btn) return;
    const vehiculo = vehiculos.find(v => v.matricula == btn.dataset.matricula);
    if (!vehiculo) return;
    const modalBody = document.getElementById('modalVerBody');
    if (!modalBody) return;
    modalBody.innerHTML = '';
    nombresCampos.forEach((nombre, index) => {
      const campo = camposBd[index];
      let valor = vehiculo[campo] ?? '';
      if (campo === 'disponibilidad') valor = valor == 1 ? 'Disponible' : 'No disponible';
      if (campo === 'id_instalacion') {
        const inst = instalaciones.find(i => i.id_instalacion == valor);
        valor = inst ? inst.nombre : 'Sin asignar';
      }
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = nombre + ': ';
      p.appendChild(strong);
      p.appendChild(document.createTextNode(valor));
      modalBody.appendChild(p);
    });
  });
}

// ================================
// MODAL EDITAR
// ================================
function bindModalEditar() {
  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('.btn-editar');
    if (!btn) return;
    const matricula = btn.dataset.matricula;
    try {
      const response = await VehiculoApi.getByMatricula(matricula);
      const vehiculo = response.data;
      if (!vehiculo) return;
      const form = document.getElementById('formEditar');
      if (!form) return;

      let instalacionesOptions = '<option value="">Seleccione una instalación...</option>';
      instalaciones.forEach(i => {
        const selected = i.id_instalacion == vehiculo.id_instalacion ? 'selected' : '';
        instalacionesOptions += `<option value="${i.id_instalacion}" ${selected}>${i.nombre} - ${i.localidad || ''}</option>`;
      });

      form.innerHTML = `
        <div class="row mb-3">
          <div class="col-lg-4">
            <label class="form-label">Matrícula</label>
            <input type="text" class="form-control" value="${vehiculo.matricula || ''}" disabled>
            <input type="hidden" name="matricula" value="${vehiculo.matricula || ''}">
          </div>
          <div class="col-lg-4">
            <label class="form-label">Nombre</label>
            <input type="text" class="form-control" name="nombre" value="${vehiculo.nombre || ''}" required maxlength="100">
          </div>
          <div class="col-lg-4">
            <label class="form-label">Tipo</label>
            <input type="text" class="form-control" name="tipo" value="${vehiculo.tipo || ''}" required>
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-lg-4">
            <label class="form-label">Marca</label>
            <input type="text" class="form-control" name="marca" value="${vehiculo.marca || ''}" required>
          </div>
          <div class="col-lg-4">
            <label class="form-label">Modelo</label>
            <input type="text" class="form-control" name="modelo" value="${vehiculo.modelo || ''}" required>
          </div>
          <div class="col-lg-4">
            <label class="form-label">Disponibilidad</label>
            <select class="form-select" name="disponibilidad" required>
              <option value="1" ${vehiculo.disponibilidad == 1 ? 'selected' : ''}>Disponible</option>
              <option value="0" ${vehiculo.disponibilidad == 0 ? 'selected' : ''}>No disponible</option>
            </select>
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-lg-4">
            <label class="form-label">Instalación</label>
            <select class="form-select" name="id_instalacion" id="editInstalacion">${instalacionesOptions}</select>
          </div>
          <div class="col-lg-4">
            <label class="form-label">Latitud</label>
            <input type="number" step="0.0000001" min="-90" max="90" class="form-control" name="ult_latitud" value="${vehiculo.ult_latitud || ''}">
          </div>
          <div class="col-lg-4">
            <label class="form-label">Longitud</label>
            <input type="number" step="0.0000001" min="-180" max="180" class="form-control" name="ult_longitud" value="${vehiculo.ult_longitud || ''}">
          </div>
        </div>
        <div class="text-center">
          <button type="button" class="btn btn-primary btn-guardar-vehiculo">Guardar cambios</button>
        </div>
      `;

      form.querySelector('.btn-guardar-vehiculo').addEventListener('click', async function () {
        const mat = form.querySelector('input[name="matricula"]').value;
        const instalacionActual = vehiculo.id_instalacion;
        const nuevaInstalacion = document.getElementById('editInstalacion').value
          ? parseInt(document.getElementById('editInstalacion').value) : null;

        const data = {};
        form.querySelectorAll('input, select').forEach(input => {
          if (!input.name || input.name === 'matricula' || input.name === 'id_instalacion') return;
          if (input.name === 'disponibilidad') {
            data[input.name] = input.value ? parseInt(input.value) : null;
          } else if (input.name === 'ult_latitud' || input.name === 'ult_longitud') {
            // CORRECCIÓN: parsear coordenadas y dejarlas null si vacías
            data[input.name] = input.value !== '' ? parseFloat(input.value) : null;
          } else {
            data[input.name] = input.value;
          }
        });

        // CORRECCIÓN: validar datos antes de guardar (esCrear=false no valida matrícula)
        if (!validarDatosVehiculo({ ...data, matricula: mat }, false)) return;

        try {
          await VehiculoApi.update(mat, data);
          if (nuevaInstalacion !== instalacionActual) {
            if (nuevaInstalacion) {
              await fetch(`/api/vehiculos/${mat}/instalacion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_instalacion: nuevaInstalacion })
              });
            } else {
              await fetch(`/api/vehiculos/${mat}/instalacion`, { method: 'DELETE' });
            }
          }
          await cargarVehiculos();
          bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
          mostrarExito('Vehículo actualizado correctamente');
        } catch (error) {
          if (error.message?.includes('Duplicate entry')) {
            mostrarError(error.message.includes('nombre')
              ? 'No se puede actualizar: ya existe otro vehículo con ese nombre'
              : 'Error: ya existe un vehículo con esos datos');
          } else {
            mostrarError('Error al actualizar vehículo: ' + error.message);
          }
        }
      });
    } catch (error) {
      mostrarError('Error al cargar datos del vehículo');
    }
  });
}

// ================================
// MODAL ELIMINAR
// ================================
function bindModalEliminarPreparar() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-eliminar');
    if (!btn) return;
    document.getElementById('btnConfirmarEliminar').dataset.matricula = btn.dataset.matricula;
  });
}

function bindModalEliminarConfirmar() {
  document.getElementById('btnConfirmarEliminar')?.addEventListener('click', async function () {
    const matricula = this.dataset.matricula;
    if (!matricula) return;
    try {
      await VehiculoApi.delete(matricula);
      await cargarVehiculos();
      bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
      mostrarExito('Vehículo eliminado correctamente');
    } catch (error) {
      mostrarError('Error al eliminar vehículo: ' + error.message);
    }
  });
}

window.refrescarVehiculos = async function () {
  await cargarVehiculos();
  mostrarExito('Datos actualizados');
};

window.VehiculoController = {
  cargarVehiculos,
  refrescarVehiculos: window.refrescarVehiculos,
  aplicarFiltros
};