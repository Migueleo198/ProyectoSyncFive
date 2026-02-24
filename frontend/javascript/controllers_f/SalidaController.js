import SalidaApi from '../api_f/SalidaApi.js';
import {
  validarNumero,
  validarRangoFechas,
  validarIdBombero,
  validarMatriculaEspanola
} from '../helpers/validacion.js';
import {
  mostrarError,
  mostrarExito,
  formatearFechaHora
} from '../helpers/utils.js';

let salidas = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarSalidas();
    bindCrearSalida();
    bindModalEliminar();
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
    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${s.id_registro}</td>
      <td>${s.matricula}</td>
      <td class="d-none d-md-table-cell">${s.id_bombero ?? ''}</td>
      <td>${formatearFechaHora(s.f_salida) ?? ''}</td>
      <td>${formatearFechaHora(s.f_regreso) ?? ''}</td>
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
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);

    const data = {
      matricula: f.get('matricula'),
      f_regreso: f.get('f_regreso'),
      f_salida: f.get('f_salida'),
      km_inicio: f.get('km_inicio'),
      km_fin: f.get('km_fin'),
      id_bombero: f.get('id_bombero')
    };

    // ================= VALIDACIONES =================

    // ---------- CAMPOS OBLIGATORIOS ----------
    if (!data.matricula?.trim()) {
      mostrarError('La matrícula es obligatoria');
      return;
    }

    if (!data.id_bombero?.trim()) {
      mostrarError('El ID del bombero es obligatorio');
      return;
    }

    if (!data.f_salida) {
      mostrarError('La fecha de salida es obligatoria');
      return;
    }

    if (!data.f_regreso) {
      mostrarError('La fecha de regreso es obligatoria');
      return;
    }

    if (!data.km_inicio) {
      mostrarError('El KM de inicio es obligatorio');
      return;
    }

    if (!data.km_fin) {
      mostrarError('El KM final es obligatorio');
      return;
    }

    // ---------- FORMATO ----------

    if (!validarMatriculaEspanola(data.matricula)) {
      mostrarError('La matrícula no tiene un formato válido (ej: 1234BCD o M1234AB)');
      return;
    }

    if (!validarIdBombero(data.id_bombero)) {
      mostrarError('El ID del bombero debe tener 1 letra seguida de 3 números (ej: A123)');
      return;
    }

    if (!validarNumero(data.km_inicio)) {
      mostrarError('El KM de inicio debe ser un número positivo');
      return;
    }

    if (!validarNumero(data.km_fin)) {
      mostrarError('El KM final debe ser un número positivo');
      return;
    }

    if (Number(data.km_fin) < Number(data.km_inicio)) {
      mostrarError('El KM final no puede ser menor que el KM inicial');
      return;
    }

    if (!validarRangoFechas(data.f_salida, data.f_regreso)) {
      mostrarError('La fecha de regreso debe ser posterior a la fecha de salida');
      return;
    }

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
              <input type="text" class="form-control" id="edit_id_bombero" name="id_bombero" 
              value= "${salida.id_bombero ?? ''}" required>
          </div>
          <div class="col-md-6 col-lg-4">
              <label for="f_salida" class="form-label">Fecha salida</label>
              <input type="datetime-local" class="form-control" id="edit_f_salida" name="f_salida"
              value= "${salida.f_salida ?? ''}">
          </div>
          <div class="col-md-6 col-lg-4">
              <label for="f_regreso" class="form-label">Fecha regreso</label>
              <input type="datetime-local" class="form-control" id="edit_f_regreso" name="f_regreso"
              value= "${salida.f_regreso ?? ''}">
          </div>
      </div>

      <div class="row mb-4">
          <div class="col-md-6 col-lg-4">
              <label for="matricula" class="form-label">Matricula</label>
              <input type="text" class="form-control" id="edit_matricula" name="matricula"
              value= "${salida.matricula ?? ''}">
          </div>
          <div class="col-md-6 col-lg-4">
              <label for="km_inicio" class="form-label">KM_inicio</label>
              <input type="number" class="form-control" id="edit_km_inicio" name="km_inicio"
              value= "${salida.km_inicio ?? ''}">
          </div>
          <div class="col-md-6 col-lg-4">
              <label for="km_fin" class="form-label">KM_fin</label>
              <input type="number" class="form-control" id="edit_km_fin" name="km_fin"
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
    document.getElementById('btnGuardarCambios')
      .addEventListener('click', async () => {

        const data = {
          id_bombero: document.getElementById('edit_id_bombero').value,
          f_salida: document.getElementById('edit_f_salida').value,
          f_regreso: document.getElementById('edit_f_regreso').value,
          matricula: document.getElementById('edit_matricula').value.trim(),
          km_inicio: document.getElementById('edit_km_inicio').value,
          km_fin: document.getElementById('edit_km_fin').value
        };

        // ================= VALIDACIONES =================

        // ---------- CAMPOS OBLIGATORIOS ----------
        if (!data.matricula?.trim()) {
          mostrarError('La matrícula es obligatoria');
          return;
        }

        if (!data.id_bombero?.trim()) {
          mostrarError('El ID del bombero es obligatorio');
          return;
        }

        if (!data.f_salida) {
          mostrarError('La fecha de salida es obligatoria');
          return;
        }

        if (!data.f_regreso) {
          mostrarError('La fecha de regreso es obligatoria');
          return;
        }

        if (!data.km_inicio) {
          mostrarError('El KM de inicio es obligatorio');
          return;
        }

        if (!data.km_fin) {
          mostrarError('El KM final es obligatorio');
          return;
        }

        // ---------- FORMATO ----------

        if (!validarMatriculaEspanola(data.matricula)) {
          mostrarError('La matrícula no tiene un formato válido (ej: 1234BCD o M1234AB)');
          return;
        }

        if (!validarIdBombero(data.id_bombero)) {
          mostrarError('El ID del bombero debe tener 1 letra seguida de 3 números (ej: A123)');
          return;
        }

        if (!validarNumero(data.km_inicio)) {
          mostrarError('El KM de inicio debe ser un número positivo');
          return;
        }

        if (!validarNumero(data.km_fin)) {
          mostrarError('El KM final debe ser un número positivo');
          return;
        }

        if (Number(data.km_fin) < Number(data.km_inicio)) {
          mostrarError('El KM final no puede ser menor que el KM inicial');
          return;
        }

        if (!validarRangoFechas(data.f_salida, data.f_regreso)) {
          mostrarError('La fecha de regreso debe ser posterior a la fecha de salida');
          return;
        }

        await SalidaApi.update(id, data);
        await cargarSalidas();

        bootstrap.Modal.getInstance(
          document.getElementById('modalEditar')
        ).hide();

        mostrarExito('Salida actualizada correctamente');
      });

  } catch (error) {
    console.error('Error al editar salida:', error);
  }
});

// ================================
// CAMPOS DE LA TABLA      estos arrays se usan para mostrar los campos en el modal ver (arriba como lo quieres ver, abajo como están en la base de datos, el orden debe coincidir)  
// ================================
  const nombresCampos = [
    'ID Bombero',
    'f_salida',
    'f_regreso',
    'Matricula',
    'KM_Inicio',
    'KM_Fin'
  ];
 const camposBd = [
  'id_bombero',
  'f_salida',
  'f_regreso',
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
    if (campo === 'f_salida' || campo === 'f_regreso') {
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
function bindModalEliminar() {

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-eliminar');
    if (!btn) return;

    const id = btn.dataset.id;
    document.getElementById('btnConfirmarEliminar').dataset.id = id;
  });

  document.getElementById('btnConfirmarEliminar')
    .addEventListener('click', async function () {

      const id = this.dataset.id;
      if (!id) return;

      try {
        await SalidaApi.delete(id);
        await cargarSalidas();

        bootstrap.Modal.getInstance(
          document.getElementById('modalEliminar')
        ).hide();

        mostrarExito('Salida eliminada correctamente');

      } catch (error) {
        mostrarError(error.message || 'Error al eliminar salida');
      }
    });
}