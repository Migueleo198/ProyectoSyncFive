import SalidaApi from '../api_f/SalidaApi.js';
import {mostrarError, mostrarExito, formatearFechaHora} from '../helpers/utils.js';

let salidas = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarSalidas();
    bindCrearSalida();
});

// ================================
// CARGAR SALIDAS
// ================================
async function cargarSalidas() {
  try {
    const response = await SalidaApi.getAll();
    salidas = response.data; // guardamos globalmente
    renderTablaSalidas(salidas);
  } catch (e) {
    mostrarError(e.message || 'Error cargando salidas');
  }
}

// ================================
// RENDER TABLA
// ================================
function renderTablaSalidas(salidas) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';

  salidas.forEach(s => {
    const tr = document.createElement('tr');
                                                                                // FORMATO FECHA ESPAÑA
    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${s.id_registro}</td>
      <td>${s.matricula}</td>
      <td class="d-none d-md-table-cell">${s.id_bombero ?? ''}</td>
      <td>${formatearFechaHora(s.f_entrega) ?? ''}</td>
      <td>${formatearFechaHora(s.f_recogida) ?? ''}</td>
      <td class="d-none d-md-table-cell">${s.km_inicio ?? ''}</td>
      <td class="d-none d-md-table-cell">${s.km_fin ?? ''}</td>
      
      <td class="d-flex justify-content-around">                     
        <button type="button" class="btn p-0 btn-ver" 
                data-bs-toggle="modal" 
                data-bs-target="#modalVer"
                data-id="${s.id_registro}">
            <i class="bi bi-eye"></i>
        </button>

        <button type="button" class="btn p-0 btn-editar" 
                data-bs-toggle="modal" 
                data-bs-target="#modalEditar" 
                data-id="${s.id_registro}">
            <i class="bi bi-pencil"></i>
        </button>
        
        <button type="button" class="btn p-0 btn-eliminar" 
                data-bs-toggle="modal"                                             
                data-bs-target="#modalEliminar" 
                data-id="${s.id_registro}">          
            <i class="bi bi-trash3"></i>
        </button>
      </td>  
    `;
        

    tbody.appendChild(tr);
  });

}
// ================================
// CREAR / INSERTAR SALIDA
// ================================
function bindCrearSalida() {
  const form = document.getElementById('formSalida');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);

    const data = {
      matricula: f.get('matricula'),
      f_recogida: f.get('f_recogida'),
      f_entrega: f.get('f_entrega'),
      km_inicio: f.get('km_inicio'),
      km_fin: f.get('km_fin'),
      id_bombero: f.get('id_bombero')
    };

    try {
      await SalidaApi.create(data); // ← INSERT al backend
      await cargarSalidas();        // ← refrescar tabla
      form.reset();
      mostrarExito('Salida creada correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error creando salida');
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
    // Obtener datos de la salida
    const response = await SalidaApi.getById(id);
    const salida = response.data;
    if (!salida) return;

    const form = document.getElementById('formEditar');
    form.innerHTML = ''; // Limpiar contenido previo

    // Insertar formulario                                             TENER EN CUENTA EL FORMATO DE LA FECHA
    form.innerHTML = `
      <div class="row mb-3">
          <div class="col-md-6 col-lg-4">
              <label for="n_funcionario" class="form-label">ID Bombero</label>
              <input type="text" class="form-control" id="id_bombero" name="id_bombero" 
              value= "${salida.id_bombero ?? ''}" required>
          </div>
          <div class="col-md-6 col-lg-4">
              <label for="f_entrega" class="form-label">Fecha entrega</label>
              <input type="datetime-local" class="form-control" id="f_entrega" name="f_entrega"
              value= "${salida.f_entrega ?? ''}">
          </div>
          <div class="col-md-6 col-lg-4">
              <label for="f_recogida" class="form-label">Fecha recogida</label>
              <input type="datetime-local" class="form-control" id="f_recogida" name="f_recogida"
              value= "${salida.f_recogida ?? ''}">
          </div>
      </div>

      <div class="row mb-4">
          <div class="col-md-6 col-lg-4">
              <label for="matricula" class="form-label">Matricula</label>
              <input type="text" class="form-control" id="matricula" name="matricula"
              value= "${salida.matricula ?? ''}">
          </div>
          <div class="col-md-6 col-lg-4">
              <label for="km_inicio" class="form-label">KM_inicio</label>
              <input type="number" class="form-control" id="km_inicio" name="km_inicio"
              value= "${salida.km_inicio ?? ''}">
          </div>
          <div class="col-md-6 col-lg-4">
              <label for="km_fin" class="form-label">KM_fin</label>
              <input type="number" class="form-control" id="km_fin" name="km_fin"
              value= "${salida.km_fin ?? ''}">
          </div>
      </div>

      <div class="d-flex justify-content-center gap-2">
          <button type="button" class="btn btn-primary" id="btnGuardarCambios">
            Guardar Registro
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
      
      await SalidaApi.update(id, data);
      await cargarSalidas();
      bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
    });

  } catch (error) {
    mostrarError('Error al editar salida:' || error.message);
  }
});

// ================================
// CAMPOS DE LA TABLA      estos arrays se usan para mostrar los campos en el modal ver (arriba como lo quieres ver, abajo como están en la base de datos, el orden debe coincidir)  
// ================================
  const nombresCampos = [
    'ID Bombero',
    'F_Entrega',
    'F_Recogida',
    'Matricula',
    'KM_Inicio',
    'KM_Fin'
  ];
 const camposBd = [
  'id_bombero',
  'f_entrega',
  'f_recogida',
  'matricula',
  'km_inicio',
  'km_fin'
];

// ================================
// MODAL VER
// ================================
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-ver');
  if (!btn) return;

  const id = btn.dataset.id;

  // Buscar la salida correspondiente
  const salida = salidas.find(em => em.id_registro == id);
  if (!salida) return;

  const modalBody = document.getElementById('modalVerBody');

  // Limpiar contenido previo
  modalBody.innerHTML = '';

  nombresCampos.forEach((nombre, index) => {

    const campo = camposBd[index];
    let valor = salida[campo] ?? '';

    //FECHA FORMATO ESPAÑA
    if (campo === 'f_entrega' || campo === 'f_recogida') {
      valor = formatearFechaHora(valor);
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
      await SalidaApi.delete(id);
      await cargarSalidas();

      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById('modalEliminar')
      );
      modal.hide();

    } catch (error) {
      mostrarError('Error al eliminar emergencia: ' + error.message);
    }
});

