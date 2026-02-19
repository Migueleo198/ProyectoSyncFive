import FormacionApi from '../api_f/FormacionApi.js';

let formaciones = []; // variable global para almacenar formaciones

document.addEventListener('DOMContentLoaded', () => {
  cargarFormaciones();
  bindCrearFormacion();
});

// ================================
// CARGAR FORMACIONES
// ================================
async function cargarFormaciones() {
  try {
    const response = await FormacionApi.getAll();
    formaciones = response.data; // guardamos globalmente
    renderTablaFormaciones(formaciones);
  } catch (e) {
    mostrarError(e.message || 'Error cargando formaciones');
  }
}

// ================================
// RENDER TABLA
// ================================
function renderTablaFormaciones(formaciones) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';

  formaciones.forEach(f => {
    const tr = document.createElement('tr');
                                                                                // FORMATO FECHA ESPAÑA
    tr.innerHTML = `
      <td">${f.id_formacion}</td>
      <td>${f.nombre}</td>
      <td>${f.descripcion}</td>
      <td class="d-flex justify-content-around">                     
        <button type="button" class="btn p-0 btn-ver" 
                data-bs-toggle="modal" 
                data-bs-target="#modalVer"
                data-id="${f.id_formacion}">
            <i class="bi bi-eye"></i>
        </button>

        <button type="button" class="btn p-0 btn-editar" 
                data-bs-toggle="modal" 
                data-bs-target="#modalEditar" 
                data-id="${f.id_formacion}">
            <i class="bi bi-pencil"></i>
        </button>
        
        <button type="button" class="btn p-0 btn-eliminar" 
                data-bs-toggle="modal"                                              BOTON ELIMINAR (AÑADIR SI SE REQUIERE) meter dentro del td de botones
                data-bs-target="#modalEliminar" 
                data-id="${f.id_formacion}">          
            <i class="bi bi-trash3"></i>
        </button>
        
      </td>  
    `;
        

    tbody.appendChild(tr);
  });
}

// ================================
// CREAR / INSERTAR FORMACION
// ================================
function bindCrearFormacion() {
  const form = document.getElementById('formInsertar');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);

    const data = {
      nombre: f.get('nombre'),
      descripcion: f.get('descripcion')
    };

    try {
      await FormacionApi.create(data); // ← INSERT al backend
      await cargarFormaciones();        // ← refrescar tabla
      form.reset();
      alert('Formacion creada correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error creando formacion');
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
    // Obtener datos de la formacion
    const response = await FormacionApi.getById(id);
    const formacion = response.data;
    if (!formacion) return;

    const form = document.getElementById('formEditar');
    form.innerHTML = ''; // Limpiar contenido previo

    // Insertar formulario                                             TENER EN CUENTA EL FORMATO DE LA FECHA
    form.innerHTML = `
      <div class="row mb-3 d-flex">
          <div class="col-md-4 justify-content-center">
              <label for="insertNombre" class="form-label">Nombre</label>
              <input type="text" class="form-control" id="insertNombre" name="nombre" 
              value="${formacion.nombre}" required>
          </div>
      </div>
      <!-- Descripción -->
      <div class="mb-4">
          <label for="descripcion" class="form-label">Descripción</label>
          <textarea class="form-control" id="descripcion" name="descripcion" rows="4"
          >${formacion.descripcion}</textarea>
      </div>
      <!-- Botones centrados debajo -->
      <div class="d-flex justify-content-center gap-2">
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

      await FormacionApi.update(id, data);             // Enviar datos al backend para actualizar la Formacion
      await cargarFormaciones();                        // Recargar tabla para mostrar cambios

      const modal = bootstrap.Modal.getInstance(        // Cerrar modal
        document.getElementById('modalEditar')
      );
      modal.hide();
    });

  } catch (error) {
    console.error('Error al editar formacion:', error);
  }
});

// ================================
// CAMPOS DE LA TABLA      estos arrays se usan para mostrar los campos en el modal ver (arriba como lo quieres ver, abajo como están en la base de datos, el orden debe coincidir)  
// ================================
  const nombresCampos = [
    'Nombre',
    'Descripcion'
  ];
  const camposBd = [      //tambien se usan para el modal editar, para recoger los datos de los inputs y enviarlos al backend, por eso deben coincidir con los name de los inputs del formulario editar
    'nombre',
    'descripcion'
  ];

// ================================
// MODAL VER
// ================================
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-ver');
  if (!btn) return;

  const id = btn.dataset.id;

  // Buscar la formacion correspondiente
  const formacion = formaciones.find(em => em.id_formacion == id);
  if (!formacion) return;

  const modalBody = document.getElementById('modalVerBody');

  // Limpiar contenido previo
  modalBody.innerHTML = '';

  nombresCampos.forEach((nombre, index) => {

    const campo = camposBd[index];
    let valor = formacion[campo] ?? '';

    //FECHA FORMATO ESPAÑA
    if (campo === 'fecha') {
      valor = Formateos.formatearFechaHora(valor);
    }

    const p = document.createElement('p');

    const strong = document.createElement('strong');
    strong.textContent = nombre + ': ';

    p.appendChild(strong);
    p.appendChild(document.createTextNode(valor));

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
      await FormacionApi.delete(id);
      await cargarFormaciones();

      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById('modalEliminar')
      );
      modal.hide();

    } catch (error) {
      mostrarError('Error al eliminar emergencia: ' + error.message);
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