import InstalacionApi from '../api_f/InstalacionApi.js';

let instalaciones = [];

document.addEventListener('DOMContentLoaded', () => {
  cargarInstalaciones();
  bindCrearInstalacion();
  bindFiltros();
  bindModales();
});

// ================================
// CARGAR INSTALACIONES
// ================================
async function cargarInstalaciones() {
  try {
    const response = await InstalacionApi.getAll();
    instalaciones = response.data;
    renderTablaInstalaciones(instalaciones);
  } catch (e) {
    mostrarError(e.message || 'Error cargando instalaciones');
  }
}

// ================================
// RENDER TABLA
// ================================
function renderTablaInstalaciones(instalaciones) {
  const tbody = document.querySelector('#tabla tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';

  instalaciones.forEach(i => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${i.id_instalacion}</td>
      <td>${i.nombre ?? ''}</td>
      <td>${i.direccion ?? ''}</td>
      <td>${i.telefono ?? ''}</td>
      <td>${i.correo ?? ''}</td>
      <td>${i.localidad ?? ''}</td>
      <td class="d-flex justify-content-around">                     
        <button type="button" class="btn p-0 btn-ver" 
                data-bs-toggle="modal" 
                data-bs-target="#modalVer"
                data-id="${i.id_instalacion}">
            <i class="bi bi-eye"></i>
        </button>

        <button type="button" class="btn p-0 btn-editar" 
                data-bs-toggle="modal" 
                data-bs-target="#modalEditar" 
                data-id="${i.id_instalacion}">
            <i class="bi bi-pencil"></i>
        </button>
        
        <button type="button" class="btn p-0 btn-eliminar" 
                data-bs-toggle="modal"                                         
                data-bs-target="#modalEliminar" 
                data-id="${i.id_instalacion}">          
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
  const filtroNombre = document.getElementById('nombre');
  const filtroLocalidad = document.getElementById('localidad');
  
  if (filtroNombre) {
    filtroNombre.addEventListener('input', aplicarFiltros);
  }
  if (filtroLocalidad) {
    filtroLocalidad.addEventListener('input', aplicarFiltros);
  }
}

function aplicarFiltros() {
  const filtroNombre = document.getElementById('nombre')?.value?.toLowerCase();
  const filtroLocalidad = document.getElementById('localidad')?.value?.toLowerCase();
  
  const filtrados = instalaciones.filter(i => {
    let cumple = true;
    
    if (filtroNombre && filtroNombre !== '') {
      cumple = cumple && i.nombre?.toLowerCase().includes(filtroNombre);
    }
    
    if (filtroLocalidad && filtroLocalidad !== '') {
      cumple = cumple && i.localidad?.toLowerCase().includes(filtroLocalidad);
    }
    
    return cumple;
  });
  
  renderTablaInstalaciones(filtrados);
}

// ================================
// CREAR / INSERTAR INSTALACIÓN
// ================================
function bindCrearInstalacion() {
  const form = document.getElementById('formInsertar');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);

    const data = {
      nombre: f.get('nombre'),
      direccion: f.get('direccion'),
      telefono: f.get('telefono'),
      correo: f.get('correo'),
      localidad: f.get('localidad')
    };

    try {
      await InstalacionApi.create(data);
      await cargarInstalaciones();
      form.reset();
      mostrarExito('Instalación creada correctamente');
    } catch (err) {
      console.error('Error completo:', err);
      
      if (err.message && err.message.includes('Duplicate entry')) {
        mostrarError('No se puede añadir: ya existe una instalación con ese nombre');
      } else {
        mostrarError(err.message || 'Error creando instalación');
      }
    }
  });
}

// ================================
// CAMPOS DE LA TABLA PARA MODALES
// ================================
const nombresCampos = [
  'ID',
  'Nombre',
  'Dirección',
  'Teléfono',
  'Correo',
  'Localidad'
];

const camposBd = [
  'id_instalacion',
  'nombre',
  'direccion',
  'telefono',
  'correo',
  'localidad'
];

// ================================
// MODAL VER
// ================================
function bindModales() {
  
  // MODAL VER
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-ver');
    if (!btn) return;

    const id = btn.dataset.id;
    const instalacion = instalaciones.find(i => i.id_instalacion == id);
    if (!instalacion) return;

    const modalBody = document.getElementById('modalVerBody');
    if (!modalBody) return;

    modalBody.innerHTML = '';

    nombresCampos.forEach((nombre, index) => {
      const campo = camposBd[index];
      let valor = instalacion[campo] ?? '';

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
    
    const id = btn.dataset.id;

    try {
      const response = await InstalacionApi.getById(id);
      const instalacion = response.data;
      if (!instalacion) return;

      const form = document.getElementById('formEditar');
      if (!form) return;
      
      form.innerHTML = '';

      form.innerHTML = `
        <div class="row mb-3">
          <div class="col-lg-4">
            <label class="form-label">ID</label>
            <input type="text" class="form-control" value="${instalacion.id_instalacion || ''}" disabled>
            <input type="hidden" name="id_instalacion" value="${instalacion.id_instalacion || ''}">
          </div>

          <div class="col-lg-4">
            <label class="form-label">Nombre</label>
            <input type="text" class="form-control" name="nombre" value="${instalacion.nombre || ''}" required>
          </div>

          <div class="col-lg-4">
            <label class="form-label">Teléfono</label>
            <input type="text" class="form-control" name="telefono" value="${instalacion.telefono || ''}" required>
          </div>
        </div>

        <div class="row mb-3">
          <div class="col-lg-6">
            <label class="form-label">Dirección</label>
            <input type="text" class="form-control" name="direccion" value="${instalacion.direccion || ''}" required>
          </div>

          <div class="col-lg-6">
            <label class="form-label">Correo</label>
            <input type="email" class="form-control" name="correo" value="${instalacion.correo || ''}" required>
          </div>
        </div>

        <div class="row mb-3">
          <div class="col-lg-6">
            <label class="form-label">Localidad</label>
            <input type="text" class="form-control" name="localidad" value="${instalacion.localidad || ''}" required>
          </div>
        </div>

        <div class="text-center">
          <button type="button" class="btn btn-primary btn-guardar-instalacion">
            Guardar cambios
          </button>
        </div>
      `;

      form.querySelector('.btn-guardar-instalacion').addEventListener('click', async function() {
        const form = document.getElementById('formEditar');
        const id = form.querySelector('input[name="id_instalacion"]').value;
        
        const data = {
          nombre: form.querySelector('input[name="nombre"]').value,
          direccion: form.querySelector('input[name="direccion"]').value,
          telefono: form.querySelector('input[name="telefono"]').value,
          correo: form.querySelector('input[name="correo"]').value,
          localidad: form.querySelector('input[name="localidad"]').value
        };

        try {
          await InstalacionApi.update(id, data);
          await cargarInstalaciones();

          const modal = bootstrap.Modal.getInstance(
            document.getElementById('modalEditar')
          );
          modal.hide();
          
          mostrarExito('Instalación actualizada correctamente');
          
        } catch (error) {
          console.error('Error al actualizar:', error);
          
          if (error.message && error.message.includes('Duplicate entry')) {
            mostrarError('No se puede actualizar: ya existe una instalación con ese nombre');
          } else {
            mostrarError('Error al actualizar instalación: ' + error.message);
          }
        }
      });

    } catch (error) {
      console.error('Error al editar instalación:', error);
      mostrarError('Error al cargar datos de la instalación');
    }
  });

  // MODAL ELIMINAR - Preparar
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-eliminar');
    if (!btn) return;

    const id = btn.dataset.id;
    const instalacion = instalaciones.find(i => i.id_instalacion == id);

    const btnConfirm = document.getElementById('btnConfirmarEliminar');
    btnConfirm.dataset.id = id;
    
    const modalBody = document.querySelector('#modalEliminar .modal-body');
    if (modalBody && instalacion) {
      modalBody.innerHTML = `
        ¿Eliminar la instalación "${instalacion.nombre}"?
        <p class="text-muted">Esta acción no se puede deshacer.</p>
      `;
    }
  });

  // MODAL ELIMINAR - Confirmar
  document.getElementById('btnConfirmarEliminar').addEventListener('click', async function () {
    const id = this.dataset.id;
    if (!id) return;

    try {
      await InstalacionApi.delete(id);
      await cargarInstalaciones();

      const modal = bootstrap.Modal.getInstance(
        document.getElementById('modalEliminar')
      );
      modal.hide();
      
      mostrarExito('✅ Instalación eliminada correctamente');

    } catch (error) {
      console.error('Error al eliminar:', error);
      
      // FORZAMOS el mensaje para cualquier error 1451
      if (error.message && error.message.includes('1451')) {
        mostrarError('❌ No se puede eliminar: la instalación tiene vehículos o almacenes asignados');
      } else {
        mostrarError('❌ Error al eliminar: ' + error.message);
      }
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

// ================================
// REFRESCAR DATOS
// ================================
window.refrescarInstalaciones = async function() {
  await cargarInstalaciones();
  mostrarExito('Datos actualizados');
};

// ================================
// EXPORTAR FUNCIONES PARA USO GLOBAL
// ================================
window.InstalacionController = {
  cargarInstalaciones: cargarInstalaciones,
  refrescarInstalaciones: window.refrescarInstalaciones,
  aplicarFiltros: aplicarFiltros
};