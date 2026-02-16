import TipoEmergenciaApi from '../api_f/TipoEmergenciaApi.js';

let tiposEmergencia = []; // variable global para almacenar los tipos de emergencia

document.addEventListener('DOMContentLoaded', () => {
    cargarTiposEmergencia();
    bindCrearTipoEmergencia();
});

// ================================
// CARGAR TIPOS EMERGENCIA
// ================================
async function cargarTiposEmergencia() {
  try {
    const response = await TipoEmergenciaApi.getAll();
    tiposEmergencia = response.data; // guardamos globalmente
    renderTablaTiposEmergencia(tiposEmergencia);
  } catch (e) {
    mostrarError(e.message || 'Error cargando tipos de emergencia');
  }
}

// ================================
// RENDER TABLA
// ================================
function renderTablaTiposEmergencia(tiposEmergencia) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';

  tiposEmergencia.forEach(e => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${e.codigo_tipo}</td>
      <td>${e.nombre}</td>
      <td>${e.grupo ?? ''}</td>
      <td class="d-flex justify-content-around">                     
        <button type="button" class="btn p-0 btn-ver" 
                data-bs-toggle="modal" 
                data-bs-target="#modalVer"
                data-id="${e.codigo_tipo}">
            <i class="bi bi-eye"></i>
        </button>

        <button type="button" class="btn p-0 btn-editar" 
                data-bs-toggle="modal" 
                data-bs-target="#modalEditar" 
                data-id="${e.codigo_tipo}">
            <i class="bi bi-pencil"></i>
        </button>

        <button type="button" class="btn p-0 btn-eliminar" 
                data-bs-toggle="modal"                                              BOTON ELIMINAR (AÑADIR SI SE REQUIERE) meter dentro del td de botones
                data-bs-target="#modalEliminar" 
                data-id="${e.codigo_tipo}">          
            <i class="bi bi-trash3"></i>
        </button>
        
      </td>  
    `;
        

    tbody.appendChild(tr);
  });
}

// ================================
// CREAR / INSERTAR TIPO EMERGENCIA
// ================================
function bindCrearTipoEmergencia() {
  const form = document.getElementById('formInsertar');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);

    const data = {
      nombre: f.get('nombre'),
      grupo: f.get('grupo'),
    }; 
    try {
      await TipoEmergenciaApi.create(data); // ← INSERT al backend
      await cargarTiposEmergencia();        // ← refrescar tabla
      form.reset();
      alert('Tipo de emergencia creado correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error creando tipo de emergencia');
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
    // Obtener datos del tipo de emergencia a editar
    const response = await TipoEmergenciaApi.getById(id);
    const tipoEmergencia = response.data;
    if (!tipoEmergencia) return;

    const form = document.getElementById('formEditar');
    form.innerHTML = ''; // Limpiar contenido previo

    // Insertar formulario
    form.innerHTML = `
      <div class="row mb-3">
        <div class="col-lg-6">
          <label class="form-label">Nombre</label>
          <input 
            type="text" 
            class="form-control" 
            name="nombre"
            value="${tipoEmergencia.nombre || ''}" 
          >
        </div>

        <div class="col-lg-6">
          <label class="form-label">Grupo</label>
          <select class="form-select" name="grupo">
            <option value="Incendios" ${tipoEmergencia.grupo === 'Incendios' ? 'selected' : ''}>Incendios</option>
            <option value="Accidentes" ${tipoEmergencia.grupo === 'Accidentes' ? 'selected' : ''}>Accidentes</option>
            <option value="Emergencias médicas" ${tipoEmergencia.grupo === 'Emergencias médicas' ? 'selected' : ''}>Emergencias médicas</option>
            <option value="Rescates" ${tipoEmergencia.grupo === 'Rescates' ? 'selected' : ''}>Rescates</option>
          </select>
        </div>

      </div>

      <div class="text-center">
        <button type="button" id="btnGuardarCambios" class="btn btn-primary">
          Guardar cambios
        </button>
      </div>
    `;


    // Guardar cambios
    document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
      const data = {};

      camposBd.forEach(campo => {
        const input = form.querySelector(`[name="${campo}"]`);
        if (input) data[campo] = input.value;
      });

      await TipoEmergenciaApi.update(id, data);             // Enviar datos al backend para actualizar la emergencia
      await cargarTiposEmergencia();                        // Recargar tabla para mostrar cambios

      const modal = bootstrap.Modal.getInstance(        // Cerrar modal
        document.getElementById('modalEditar')
      );
      modal.hide();
    });

  } catch (error) {
    console.error('Error al editar emergencia:', error);
  }
});

// ================================
// CAMPOS DE LA TABLA      estos arrays se usan para mostrar los campos en el modal ver (arriba como lo quieres ver, abajo como están en la base de datos, el orden debe coincidir)  
// ================================
  const nombresCampos = [
    'Nombre',
    'Grupo'
  ];
  const camposBd = [      //tambien se usan para el modal editar, para recoger los datos de los inputs y enviarlos al backend, por eso deben coincidir con los name de los inputs del formulario editar
    'nombre',
    'grupo'
  ];

// ================================
// MODAL VER
// ================================
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-ver');
  if (!btn) return;

  const id = btn.dataset.id;

  // Buscar la Tipo correspondiente
  const tipoEmergencia = tiposEmergencia.find(t => t.codigo_tipo == id);
  if (!tipoEmergencia) return;

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
      tipoEmergencia[camposBd[index]] ?? ''
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
      await TipoEmergenciaApi.delete(id);
      await cargarTiposEmergencia();

      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById('modalEliminar')
      );
      modal.hide();

    } catch (error) {
      mostrarError('Este tipo de emergencia no se puede eliminar porque tiene emergencias asociadas');
    }
});


// ================================
// ERRORES
// ================================
function mostrarError(msg) {
  const container = document.getElementById("alert-container");

  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div class="alert alert-danger alert-dismissible fade show shadow" role="alert">
      <strong>Error:</strong> ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;

  container.append(wrapper);
}
