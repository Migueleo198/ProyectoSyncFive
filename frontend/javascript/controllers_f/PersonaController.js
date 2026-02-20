import PersonaApiApi from '../api_f/PersonaApi.js';
import LocalidadApi from '../api_f/LocalidadApi.js';
let personas = []; // variable global para almacenar personas

document.addEventListener('DOMContentLoaded', () => {
  cargarPersonas();
  bindCrearPersona();

});

// ================================
// CARGAR PERSONAS
// ================================

async function cargarPersonas() {
  try {
    const response = await PersonaApiApi.getAll();
    personas = response.data; // guardamos globalmente
    renderTablaPersonas(personas);
  } catch (e) {
    mostrarError(e.message || 'Error cargando personas');
  }
}
// ================================
// ERRORES / ÉXITO
// ================================
function mostrarError(msg) {
  const container = document.getElementById('alert-container');
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div class="alert alert-danger alert-dismissible fade show shadow" role="alert">
      <strong>Error:</strong> ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
  container.append(wrapper);
}


// ================================
// RENDER TABLA
// ================================
function renderTablaPersonas(personas) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';

  personas.forEach(p => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${p.id_bombero}</td>
      <td class="d-none d-md-table-cell">${p.n_funcionario}</td>
      <td>${p.correo}</td>
      <td>${p.telefono}</td>
      <td>${p.nombre}</td>
      <td>${p.apellidos}</td>
      <td class="d-none d-md-table-cell">${p.localidad}</td>
      <td>${p.nombre_usuario}</td>
      
      <td class="d-flex justify-content-around">                     
        <button type="button" class="btn p-0 btn-ver" 
                data-bs-toggle="modal" 
                data-bs-target="#modalVer"
                data-id="${p.id_bombero}">
            <i class="bi bi-eye"></i>
        </button>

        <button type="button" class="btn p-0 btn-editar" 
                data-bs-toggle="modal" 
                data-bs-target="#modalEditar" 
                data-id="${p.id_bombero}">
            <i class="bi bi-pencil"></i>
        </button>
        
        <button type="button" class="btn p-0 btn-eliminar" 
                data-bs-toggle="modal"                                           
                data-bs-target="#modalEliminar" 
                data-id="${p.id_bombero}">         
            <i class="bi bi-trash3"></i>
        </button>
        
      </td>  
    `;
        

    tbody.appendChild(tr);
  });
}


// ================================
// CREAR / INSERTAR PERSONA
// ================================
function bindCrearPersona() {
  const form = document.getElementById('formInsertarPersona');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);

    const data = {
      id_bombero:              f.get('id_bombero'), 
      n_funcionario:           f.get('n_funcionario'),
      DNI:                     f.get('dni'),
      correo:                  f.get('correo'),
      telefono:                f.get('telefono'),
      f_ingreso_diputacion:    f.get('f_ingreso_diputacion'),
      talla_superior:          f.get('talla_superior'),
      talla_inferior:          f.get('talla_inferior'),
      talla_calzado:           f.get('talla_calzado'),
      nombre:                  f.get('nombre'),
      apellidos:               f.get('apellidos'),
      f_nacimiento:            f.get('f_nacimiento'),
      telefono_emergencia:     f.get('telefono_emergencia'),
      domicilio:               f.get('domicilio'),
      localidad:               f.get('localidad'),
      id_rol:                  f.get('id_rol'),
      activo:                  f.get('activo') === 'on', // checkbox
      nombre_usuario:          f.get('nombre_usuario'),
      contrasenia:             f.get('contrasenia')
    };

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
        await PersonaApiApi.remove(id);
        await cargarPersonas();

      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById('modalEliminar')
      );
      modal.hide();

    } catch (error) {
      mostrarError('Error al eliminar persona: ' + error.message);
    }
});

// ================================
// CAMPOS DE LA TABLA      estos arrays se usan para mostrar los campos en el modal ver (arriba como lo quieres ver, abajo como están en la base de datos, el orden debe coincidir)  
// ================================
const nombresCampos = [
  'correo',                  
  'telefono',                
  'f_ingreso_diputacion',    
  'talla_superior',          
  'talla_inferior',          
  'talla_calzado',           
  'nombre',                  
  'apellidos',               
  'f_nacimiento',            
  'telefono_emergencia',     
  'domicilio',               
  'localidad',               
  'id_rol',                  
  'activo',
  'nombre_usuario'         
];

const camposBd = [      //tambien se usan para el modal editar, para recoger los datos de los inputs y enviarlos al backend, por eso deben coincidir con los name de los inputs del formulario editar                 
  'correo',                  
  'telefono',                
  'f_ingreso_diputacion',
  'talla_superior',
  'talla_inferior',
  'talla_calzado',           
  'nombre',                  
  'apellidos',               
  'f_nacimiento',            
  'telefono_emergencia',     
  'domicilio',               
  'localidad',               
  'id_rol',                  
  'activo',
  'nombre_usuario'        
];

// ================================
// MODAL EDITAR
// ================================
document.addEventListener('click', async function (e) {
  const btn = e.target.closest('.btn-editar');
  if (!btn) return;

  const id = btn.dataset.id;

  try {
    // Obtener datos de la persona para rellenar el formulario de edición
    const response = await PersonaApiApi.getById(id);
    const persona = response.data;
    if (!persona) return;

    const form = document.getElementById('formEditar');
    form.innerHTML = ''; // Limpiar contenido previo

    // Insertar formulario
    form.innerHTML = `
      <div class="row mb-3">
        <div class="col-lg-4">
          <label class="form-label">Nombre</label>
          <input type="text" class="form-control" name="nombre" value="${persona.nombre || ''}">
        </div>

        <div class="col-lg-4">
          <label class="form-label">Apellidos</label>
          <input type="text" class="form-control" name="apellidos" value="${persona.apellidos || ''}">
        </div>

        <div class="col-lg-4">
          <label class="form-label">Correo</label>
          <input type="email" class="form-control" name="correo" value="${persona.correo || ''}">
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-lg-4">
          <label class="form-label">Teléfono</label>
          <input type="number" class="form-control" name="telefono" value="${persona.telefono || ''}">
        </div>

        <div class="col-lg-4">
          <label class="form-label">Fecha Ingreso Diputación</label>
          <input type="date" class="form-control" name="f_ingreso_diputacion" value="${persona.f_ingreso_diputacion || ''}">
        </div>

        <div class="col-lg-4">
          <label class="form-label">Talla Superior</label>
          <input type="text" class="form-control" name="talla_superior" value="${persona.talla_superior || ''}">
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-lg-4">
          <label class="form-label">Talla Inferior</label>
          <input type="text" class="form-control" name="talla_inferior" value="${persona.talla_inferior || ''}">
        </div>

        <div class="col-lg-4">
          <label class="form-label">Talla Calzado</label>
          <input type="number" class="form-control" name="talla_calzado" value="${persona.talla_calzado || ''}">
        </div>

        <div class="col-lg-4">
          <label class="form-label">Fecha Nacimiento</label>
          <input type="date" class="form-control" name="f_nacimiento" value="${persona.f_nacimiento || ''}">
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-lg-4">
          <label class="form-label">Teléfono Emergencia</label>
          <input type="number" class="form-control" name="telefono_emergencia" value="${persona.telefono_emergencia || ''}">
        </div>

        <div class="col-lg-4">
          <label class="form-label">Domicilio</label>
          <input type="text" class="form-control" name="domicilio" value="${persona.domicilio || ''}">
        </div>

        <div class="col-lg-4">
          <label class="form-label">Localidad</label>
          <input type="text" class="form-control" name="localidad" value="${persona.localidad || ''}">
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-lg-4">
          <label class="form-label">ID Rol</label>
          <select class="form-select" name="activo">
            <option value="1" ${persona.activo == 1 ? 'selected' : ''}>Sí</option>
            <option value="0" ${persona.activo == 0 ? 'selected' : ''}>No</option>
          </select>
        </div>

      <div class="col-lg-4">
        <label class="form-label">Activo</label>
        <select class="form-select" name="activo">
          <option value="1" ${persona.activo == 1 ? 'selected' : ''}>Sí</option>
          <option value="0" ${persona.activo == 0 ? 'selected' : ''}>No</option>
        </select>
      </div>

        <div class="col-lg-4">
          <label class="form-label">Nombre Usuario</label>
          <input type="text" class="form-control" name="nombre_usuario" value="${persona.nombre_usuario || ''}">
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
    if (input) {
      let value = input.value;
      
      // Convertir activo a boolean
      if (campo === 'activo') {
        if (value === '' || value === null || value === undefined) {
          return; // No enviar si está vacío
        }
        value = value === '1' || value === '1' || value === true;
      }
      
      // Convertir talla_calzado a número
      if (campo === 'talla_calzado') {
        if (value === '' || value === null || value === undefined) {
          return; // No enviar si está vacío
        }
        value = Number(value);
      }
      
      // Solo enviar si tiene valor
      if (value !== '' && value !== null && value !== undefined) {
        data[campo] = value;
      }
    }
  });

  try {
    await PersonaApiApi.update(id, data);
    await cargarPersonas();
    
    const modal = bootstrap.Modal.getInstance(
      document.getElementById('modalEditar')
    );
    modal.hide();
    
    mostrarExito('Persona actualizada correctamente');
  } catch (error) {
    console.error('Error al editar persona:', error);
    console.log('Errores de validación:', error.data?.errors);
    mostrarError('Error al editar persona: ' + error.message);
  }
});

  } catch (error) {
    console.error('Error al editar persona:', error);
    mostrarError('Error al cargar datos de persona');
  }
});
 
function mostrarExito(msg) {
  const container = document.getElementById('alert-container');
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div class="alert alert-success alert-dismissible fade show shadow" role="alert">
      <strong>OK:</strong> ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
  container.append(wrapper);
}
// ================================
// MODAL VER
// ================================
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-ver');
  if (!btn) return;

  const id = btn.dataset.id;

  // Buscar la persona correspondiente (usar personas plural, y id_bombero)
  const persona = personas.find(p => p.id_bombero == id);
  if (!persona) return;

  const modalBody = document.getElementById('modalVerBody');

  // Limpiar contenido previo
  modalBody.innerHTML = '';

  nombresCampos.forEach((nombre, index) => {
    const campo = camposBd[index];
    let valor = persona[campo] ?? '';

    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = nombre + ': ';

    p.appendChild(strong);
    p.appendChild(document.createTextNode(valor));

    modalBody.appendChild(p);
  });
});