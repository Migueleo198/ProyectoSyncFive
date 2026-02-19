import InstalacionApi from '../api_f/InstalacionApi.js';

let instalaciones = []; // variable global para almacenar instalaciones

document.addEventListener('DOMContentLoaded', () => {
  cargarInstalaciones();
  bindCrearInstalacion()
});

// ================================
// CARGAR instalaciones
// ================================
async function cargarInstalaciones() {
  try {
    const response = await InstalacionApi.getAll();
    instalaciones = response.data; // guardamos globalmente
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
  tbody.innerHTML = '';

  instalaciones.forEach(e => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${e.id_instalacion}</td>
      <td>${e.nombre ?? ''}</td>
      <td>${e.direccion ?? ''}</td>
      <td>${e.telefono ?? ''}</td>
      <td>${e.correo ?? ''}</td>
      <td>${e.localidad ?? ''}</td>
      <td class="d-flex justify-content-around">                     
        <button type="button" class="btn p-0 btn-ver" 
                data-bs-toggle="modal" 
                data-bs-target="#modalVer"
                data-id="${e.id_instalacion}">
            <i class="bi bi-eye"></i>
        </button>

        <button type="button" class="btn p-0 btn-editar" 
                data-bs-toggle="modal" 
                data-bs-target="#modalEditar" 
                data-id="${e.id_instalacion}">
            <i class="bi bi-pencil"></i>
        </button>
        
        <button type="button" class="btn p-0 btn-eliminar" 
                data-bs-toggle="modal"                                         
                data-bs-target="#modalEliminar" 
                data-id="${e.id_instalacion}">          
            <i class="bi bi-trash3"></i>
        </button>
        
      </td>  
    `;
    tbody.appendChild(tr);
  });
}

// ================================
// CREAR / INSERTAR INSTALACION
// ================================
function bindCrearInstalacion() {
  const form = document.getElementById('formInsertar');

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
      await InstalacionApi.create(data); // ← INSERT al backend
      await cargarInstalaciones();        // ← refrescar tabla
      form.reset();
      alert('Instalacion creada correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error creando instalacion');
    }
  });
}


// ================================
// MODAL EDITAR
// ================================
document.addEventListener('click', async function (e) {
  const btn = e.target.closest('.btn-editar');
  if (!btn) return;

  const id = btn.dataset.id;

  try {
    // Obtener datos de la instalacion
    const response = await InstalacionApi.getById(id);
    const instalacion = response.data;
    if (!instalacion) return;

    const form = document.getElementById('formEditar');
    form.innerHTML = ''; // Limpiar contenido previo

    // Insertar formulario
    form.innerHTML = `
  <div class="row mb-3">
    <div class="col-lg-6">
      <label class="form-label">Nombre</label>
      <input type="text" class="form-control" name="nombre" value="${instalacion.nombre || ''}">
    </div>

    <div class="col-lg-6">
      <label class="form-label">Teléfono</label>
      <input type="text" class="form-control" name="telefono" value="${instalacion.telefono || ''}">
    </div>
  </div>

  <div class="row mb-3">
    <div class="col-lg-6">
      <label class="form-label">Correo</label>
      <input type="email" class="form-control" name="correo" value="${instalacion.correo || ''}">
    </div>

    <div class="col-lg-6">
      <label class="form-label">Localidad</label>
      <input type="text" class="form-control" name="localidad" value="${instalacion.localidad || ''}">
    </div>
  </div>

  <div class="mb-3">
    <label class="form-label">Dirección</label>
    <input type="text" class="form-control" name="direccion" value="${instalacion.direccion || ''}">
  </div>

  <div class="text-center">
    <button type="button" id="btnGuardarCambios" class="btn btn-primary">
      Guardar cambios
    </button>
  </div>
`;


    await cargarInstalaciones(instalacion.codigo_tipo, 'selectInstalacion'); // DENTRO DEL HTML PREVIO hemos creado un select vacío con id= selectInstalacion, donde se cargarán tipos y marcará el seleccionado


    // Guardar cambios
    document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
      const data = {};

      camposBd.forEach(campo => {
        const input = form.querySelector(`[name="${campo}"]`);
        if (input) data[campo] = input.value;
      });

      await InstalacionApi.update(id, data);             // Enviar datos al backend para actualizar la instalacion
      await cargarInstalaciones();                        // Recargar tabla para mostrar cambios

      const modal = bootstrap.Modal.getInstance(        // Cerrar modal
        document.getElementById('modalEditar')
      );
      modal.hide();
    });

  } catch (error) {
    console.error('Error al editar instalacion:', error);
  }
});

    
// ================================
// CAMPOS DE LA TABLA  estos arrays se usan para mostrar los campos en el modal ver (arriba como lo quieres ver, abajo como están en la base de datos, el orden debe coincidir)  
// ================================
  const nombresCampos = [
    'Nombre',
    'Dirección',
    'Teléfono',
    'Correo',
    'Localidad'
  ];

  const camposBd = [
    'nombre',
    'direccion',
    'telefono',
    'correo',
    'localidad'
  ];


// ================================
// MODAL VER
// ================================
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-ver');
  if (!btn) return;

  const id = btn.dataset.id;

  // Buscar la instalacion correspondiente
  const instalacion = instalaciones.find(em => em.id_instalacion == id);
  if (!instalacion) return;

  const modalBody = document.getElementById('modalVerBody');

  // Limpiar contenido previo
  while (modalBody.firstChild) {
    modalBody.removeChild(modalBody.firstChild);
  }

  nombresCampos.forEach((nombre, index) => {
    const p = document.createElement('p');

    const strong = document.createElement('strong');
    strong.textContent = nombre + ': ';

    const value = document.createTextNode(
      instalacion[camposBd[index]] ?? ''
    );

    p.appendChild(strong);
    p.appendChild(value);
    modalBody.appendChild(p);
  });
});

// ================================
// MODAL ELIMINAR (AÑADIR SI SE REQUIERE)   
// ================================
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-eliminar');
  if (!btn) return;

  const id = btn.dataset.id;

  const btnConfirm = document.getElementById('btnConfirmarEliminar');
  btnConfirm.dataset.id = id;
});

document.getElementById('btnConfirmarEliminar')
  .addEventListener('click', async function () {

    const id = this.dataset.id;
    if (!id) return;

    try {
      await InstalacionApi.delete(id);
      await cargarInstalaciones();

      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById('modalEliminar')
      );
      modal.hide();

    } catch (error) {
      console.error('Error al eliminar instalacion:', error);
    }
});


// ================================
// ERRORES
// ================================
function mostrarError(msg) {
  alert(msg);
}
