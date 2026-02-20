import VehiculoApi from '../api_f/VehiculoApi.js';
import InstalacionApi from '../api_f/InstalacionApi.js';

let vehiculos = [];
let instalaciones = [];

document.addEventListener('DOMContentLoaded', () => {
  cargarDatosIniciales();
  bindCrearVehiculo();
  bindFiltros();
  bindModales();
});

// ================================
// CARGAR DATOS INICIALES
// ================================
async function cargarDatosIniciales() {
  try {
    await Promise.all([
      cargarInstalaciones(),
      cargarVehiculos()
    ]);
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
// ================================
function renderTablaVehiculos(vehiculos) {
  const tbody = document.querySelector('#tabla tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';

  vehiculos.forEach(v => {
    const tr = document.createElement('tr');
    tr.dataset.matricula = v.matricula;

    tr.innerHTML = `
      <td">${v.matricula}</td>
      <td>${v.nombre ?? ''}</td>
      <td class="d-none d-md-table-cell">${v.tipo ?? ''}</td>
      <td>${v.disponibilidad == 1 ? 'Disponible' : 'No disponible'}</td>
      <td class="d-none d-md-table-cell">${v.nombre_instalacion ?? 'Sin asignar'}</td>
      <td class="d-none d-md-table-cell">${v.marca ?? ''} ${v.modelo ?? ''}</td>
      
      <td class="d-flex justify-content-around">                     
        <button type="button" class="btn p-0 btn-ver" 
                data-bs-toggle="modal" 
                data-bs-target="#modalVer"
                data-matricula="${v.matricula}">
            <i class="bi bi-eye"></i>
        </button>

        <button type="button" class="btn p-0 btn-editar" 
                data-bs-toggle="modal" 
                data-bs-target="#modalEditar" 
                data-matricula="${v.matricula}">
            <i class="bi bi-pencil"></i>
        </button>
        
        <button type="button" class="btn p-0 btn-eliminar" 
                data-bs-toggle="modal"                                         
                data-bs-target="#modalEliminar" 
                data-matricula="${v.matricula}">          
            <i class="bi bi-trash3"></i>
        </button>
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
  
  if (filtroDisponibilidad) {
    filtroDisponibilidad.addEventListener('change', aplicarFiltros);
  }
  
  if (filtroNombre) {
    filtroNombre.addEventListener('input', aplicarFiltros);
  }
}

function aplicarFiltros() {
  const filtroDisponibilidad = document.getElementById('disponibilidad')?.value;
  const filtroNombre = document.getElementById('nombre')?.value?.toLowerCase();
  
  const filtrados = vehiculos.filter(v => {
    let cumple = true;
    
    if (filtroDisponibilidad && filtroDisponibilidad !== '') {
      cumple = cumple && v.disponibilidad == filtroDisponibilidad;
    }
    
    if (filtroNombre && filtroNombre !== '') {
      cumple = cumple && v.nombre?.toLowerCase().includes(filtroNombre);
    }
    
    return cumple;
  });
  
  renderTablaVehiculos(filtrados);
}

// ================================
// CREAR / INSERTAR VEHÍCULO (CON INSTALACIÓN)
// ================================
function bindCrearVehiculo() {
  const form = document.getElementById('formInsertar');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);

    const data = {
      matricula: f.get('matricula'),
      nombre: f.get('nombre'),
      marca: f.get('marca'),
      modelo: f.get('modelo'),
      tipo: f.get('tipo'),
      disponibilidad: parseInt(f.get('disponibilidad'))
    };

    const idInstalacion = f.get('id_instalacion') ? parseInt(f.get('id_instalacion')) : null;
    
    if (f.get('ult_latitud')) {
      data.ult_latitud = parseFloat(f.get('ult_latitud'));
    }
    if (f.get('ult_longitud')) {
      data.ult_longitud = parseFloat(f.get('ult_longitud'));
    }

    try {
      // 1. Crear el vehículo
      await VehiculoApi.create(data);
      
      // 2. Si hay instalación, asignarla
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
      console.error('Error completo:', err);
      
      if (err.message && err.message.includes('Duplicate entry')) {
        if (err.message.includes('nombre')) {
          mostrarError('No se puede añadir: ya existe otro vehículo con ese nombre');
        } else if (err.message.includes('matricula')) {
          mostrarError('No se puede añadir: ya existe otro vehículo con esa matrícula');
        } else {
          mostrarError('No se puede añadir: ya existe un vehículo con esos datos');
        }
      } else {
        mostrarError(err.message || 'Error creando vehículo');
      }
    }
  });
}

// ================================
// CAMPOS DE LA TABLA PARA MODALES
// ================================
const nombresCampos = [
  'Matrícula',
  'Nombre',
  'Tipo',
  'Disponibilidad',
  'Instalación',
  'Marca',
  'Modelo'
];

const camposBd = [
  'matricula',
  'nombre',
  'tipo',
  'disponibilidad',
  'id_instalacion',
  'marca',
  'modelo'
];

// ================================
// BIND MODALES
// ================================
function bindModales() {
  
  // MODAL VER
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-ver');
    if (!btn) return;

    const matricula = btn.dataset.matricula;

    const vehiculo = vehiculos.find(v => v.matricula == matricula);
    if (!vehiculo) return;

    const modalBody = document.getElementById('modalVerBody');
    if (!modalBody) return;

    modalBody.innerHTML = '';

    nombresCampos.forEach((nombre, index) => {
      const campo = camposBd[index];
      let valor = vehiculo[campo] ?? '';

      if (campo === 'disponibilidad') {
        valor = valor == 1 ? 'Disponible' : 'No disponible';
      }
      
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

  // MODAL EDITAR
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
      
      form.innerHTML = '';

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
            <input type="text" class="form-control" name="nombre" value="${vehiculo.nombre || ''}" required>
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
            <select class="form-select" name="id_instalacion" id="editInstalacion">
              ${instalacionesOptions}
            </select>
          </div>

          <div class="col-lg-4">
            <label class="form-label">Latitud</label>
            <input type="text" class="form-control" name="ult_latitud" value="${vehiculo.ult_latitud || ''}">
          </div>

          <div class="col-lg-4">
            <label class="form-label">Longitud</label>
            <input type="text" class="form-control" name="ult_longitud" value="${vehiculo.ult_longitud || ''}">
          </div>
        </div>

        <div class="text-center">
          <button type="button" class="btn btn-primary btn-guardar-vehiculo">
            Guardar cambios
          </button>
        </div>
      `;

      form.querySelector('.btn-guardar-vehiculo').addEventListener('click', async function() {
        const form = document.getElementById('formEditar');
        
        const matricula = form.querySelector('input[name="matricula"]').value;
        const instalacionActual = vehiculo.id_instalacion;
        const nuevaInstalacion = document.getElementById('editInstalacion').value ? 
                                  parseInt(document.getElementById('editInstalacion').value) : null;
        
        const data = {};
        
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
          if (input.name && input.name !== 'matricula' && input.name !== 'id_instalacion') {
            if (input.name === 'disponibilidad') {
              data[input.name] = input.value ? parseInt(input.value) : null;
            } else if (input.name === 'ult_latitud' || input.name === 'ult_longitud') {
              data[input.name] = input.value ? parseFloat(input.value) : null;
            } else {
              data[input.name] = input.value;
            }
          }
        });

        try {
          // 1. Actualizar datos básicos del vehículo
          await VehiculoApi.update(matricula, data);
          
          // 2. Actualizar instalación si cambió
          if (nuevaInstalacion !== instalacionActual) {
            if (nuevaInstalacion) {
              // Asignar nueva instalación
              await fetch(`/api/vehiculos/${matricula}/instalacion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_instalacion: nuevaInstalacion })
              });
            } else {
              // Quitar instalación
              await fetch(`/api/vehiculos/${matricula}/instalacion`, {
                method: 'DELETE'
              });
            }
          }
          
          await cargarVehiculos();

          const modal = bootstrap.Modal.getInstance(
            document.getElementById('modalEditar')
          );
          modal.hide();
          
          mostrarExito('Vehículo actualizado correctamente');
          
        } catch (error) {
          console.error('Error al actualizar:', error);
          
          if (error.message && error.message.includes('Duplicate entry')) {
            if (error.message.includes('nombre')) {
              mostrarError('No se puede actualizar: ya existe otro vehículo con ese nombre');
            } else if (error.message.includes('matricula')) {
              mostrarError('No se puede actualizar: ya existe otro vehículo con esa matrícula');
            } else {
              mostrarError('Error: ya existe un vehículo con esos datos');
            }
          } else {
            mostrarError('Error al actualizar vehículo: ' + error.message);
          }
        }
      });

    } catch (error) {
      console.error('Error al editar vehículo:', error);
      mostrarError('Error al cargar datos del vehículo');
    }
  });

  // MODAL ELIMINAR - Preparar
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-eliminar');
    if (!btn) return;

    const matricula = btn.dataset.matricula;

    const btnConfirm = document.getElementById('btnConfirmarEliminar');
    btnConfirm.dataset.matricula = matricula;
  });

  // MODAL ELIMINAR - Confirmar
  document.getElementById('btnConfirmarEliminar')
    .addEventListener('click', async function () {

      const matricula = this.dataset.matricula;
      if (!matricula) return;

      try {
        await VehiculoApi.delete(matricula);
        await cargarVehiculos();

        const modal = bootstrap.Modal.getInstance(
          document.getElementById('modalEliminar')
        );
        modal.hide();
        
        mostrarExito('Vehículo eliminado correctamente');

      } catch (error) {
        console.error('Error al eliminar:', error);
        mostrarError('Error al eliminar vehículo: ' + error.message);
      }
    });
}

// ================================
// FUNCIONES AUXILIARES
// ================================
function mostrarError(msg) {
  const container = document.getElementById("alert-container");
  if (!container) return;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div class="alert alert-danger alert-dismissible fade show shadow" role="alert">
      <strong>Error:</strong> ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;

  container.append(wrapper);
  
  setTimeout(() => {
    wrapper.remove();
  }, 5000);
}

function mostrarExito(msg) {
  const container = document.getElementById("alert-container");
  if (!container) return;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div class="alert alert-success alert-dismissible fade show shadow" role="alert">
      <strong>Éxito:</strong> ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;

  container.append(wrapper);
  
  setTimeout(() => {
    wrapper.remove();
  }, 3000);
}

window.refrescarVehiculos = async function() {
  await cargarVehiculos();
  mostrarExito('Datos actualizados');
};

window.VehiculoController = {
  cargarVehiculos: cargarVehiculos,
  refrescarVehiculos: window.refrescarVehiculos,
  aplicarFiltros: aplicarFiltros
};