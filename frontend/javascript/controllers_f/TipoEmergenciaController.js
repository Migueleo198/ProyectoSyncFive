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
// ERRORES
// ================================
function mostrarError(msg) {
  alert(msg);
}