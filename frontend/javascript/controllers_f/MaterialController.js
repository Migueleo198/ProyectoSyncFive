import MaterialApi from '../api_f/MaterialApi.js';

let materiales = []; // variable global para almacenar materiales

document.addEventListener('DOMContentLoaded', () => {
  cargarMateriales();
  bindCrearMaterial()
});

// ================================
// CARGAR materiales
// ================================
async function cargarMateriales() {
  try {
    const response = await MaterialApi.getAll();
    materiales = response.data; // guardamos globalmente
    renderTablaMateriales(materiales);
  } catch (e) {
    mostrarError(e.message || 'Error cargando materiales');
  }
}


// ================================
// RENDER TABLA
// ================================
function renderTablaMateriales(materiales) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';

  materiales.forEach(e => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${e.id_material}</td>
      <td>${e.nombre ?? ''}</td>
      <td>${e.descripcion ?? ''}</td>
      <td>${e.estado ?? ''}</td>
      <td class="d-flex justify-content-around">                     
        <button type="button" class="btn p-0 btn-ver" 
                data-bs-toggle="modal" 
                data-bs-target="#modalVer"
                data-id="${e.id_material}">
            <i class="bi bi-eye"></i>
        </button>

        <button type="button" class="btn p-0 btn-editar" 
                data-bs-toggle="modal" 
                data-bs-target="#modalEditar" 
                data-id="${e.id_material}">
            <i class="bi bi-pencil"></i>
        </button>
        
        <button type="button" class="btn p-0 btn-eliminar" 
                data-bs-toggle="modal"                                         
                data-bs-target="#modalEliminar" 
                data-id="${e.id_material}">          
            <i class="bi bi-trash3"></i>
        </button>
        
      </td>  
    `;
    tbody.appendChild(tr);
  });
}

// ================================
// CREAR / INSERTAR MATERIAL
// ================================
function bindCrearMaterial() {
  const form = document.getElementById('formInsertar');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);

    const data = {
      nombre: f.get('nombre'),
      descripcion: f.get('descripcion'),
      estado: f.get('estado'),
    };

    try {
      await MaterialApi.create(data); // ← INSERT al backend
      await cargarMateriales();        // ← refrescar tabla
      form.reset();
      alert('Material creada correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error creando material');
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
    // Obtener datos de la material
    const response = await MaterialApi.getById(id);
    const material = response.data;
    if (!material) return;

    const form = document.getElementById('formEditar');
    form.innerHTML = ''; // Limpiar contenido previo

    // Insertar formulario
    form.innerHTML = `
  <div class="row mb-3">
    <div class="col-lg-6">
      <label class="form-label">Nombre</label>
      <input type="text" class="form-control" name="nombre" value="${material.nombre || ''}">
    </div>

    <div class="col-lg-6">
      <label class="form-label">Estado</label>
      <input type="text" class="form-control" name="estado" value="${material.estado || ''}">
    </div>
  </div>

  <div class="mb-3">
    <label class="form-label">Dirección</label>
    <input type="text" class="form-control" name="descripcion" value="${material.descripcion || ''}">
  </div>

  <div class="text-center">
    <button type="button" id="btnGuardarCambios" class="btn btn-primary">
      Guardar cambios
    </button>
  </div>
`;


    await cargarMaterial(material.codigo_tipo, 'selectMaterial'); // DENTRO DEL HTML PREVIO hemos creado un select vacío con id= selectMaterial, donde se cargarán tipos y marcará el seleccionado


    // Guardar cambios
    document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
      const data = {};

      camposBd.forEach(campo => {
        const input = form.querySelector(`[name="${campo}"]`);
        if (input) data[campo] = input.value;
      });

      await MaterialApi.update(id, data);             // Enviar datos al backend para actualizar la material
      await cargarMateriales();                        // Recargar tabla para mostrar cambios

      const modal = bootstrap.Modal.getInstance(        // Cerrar modal
        document.getElementById('modalEditar')
      );
      modal.hide();
    });

  } catch (error) {
    console.error('Error al editar material:', error);
  }
});

    
// ================================
// CAMPOS DE LA TABLA  estos arrays se usan para mostrar los campos en el modal ver (arriba como lo quieres ver, abajo como están en la base de datos, el orden debe coincidir)  
// ================================
  const nombresCampos = [
    'Nombre',
    'Descripcion',
    'Estado'
  ];

  const camposBd = [
    'nombre',
    'descripcion',
    'estado'
  ];


// ================================
// MODAL VER
// ================================
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-ver');
  if (!btn) return;

  const id = btn.dataset.id;

  // Buscar la material correspondiente
  const material = materiales.find(em => em.id_material == id);
  if (!material) return;

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
      material[camposBd[index]] ?? ''
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
      await MaterialApi.delete(id);
      await cargarMateriales();

      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById('modalEliminar')
      );
      modal.hide();

    } catch (error) {
      console.error('Error al eliminar material:', error);
    }
});


// ================================
// ERRORES
// ================================
function mostrarError(msg) {
  alert(msg);
}
