import EdicionApi from '../api_f/EdicionApi.js';
import FormacionApi from '../api_f/FormacionApi.js';
import Formateos from '../helpers/formateos.js';

let ediciones = [];

document.addEventListener('DOMContentLoaded', () => {
  cargarEdiciones();
  bindCrearEdicion();
  cargarFormaciones(0, "nombreFormacion");
});

// ================================
// CARGAR EDICIONES
// ================================
async function cargarEdiciones() {
  try {
    const response = await EdicionApi.getAll();
    ediciones = response.data;
    renderTablaEdiciones(ediciones);
  } catch (e) {
    mostrarError(e.message || 'Error cargando ediciones');
  }
}

// ================================
// RENDER TABLA
// ================================
function renderTablaEdiciones(ediciones) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';

  ediciones.forEach(e => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${e.nombre_formacion}</td>
      <td>${Formateos.formatearFechaHora(e.f_inicio)}</td>
      <td>${Formateos.formatearFechaHora(e.f_fin)}</td>
      <td>${e.horas}</td>
      <td class="d-flex justify-content-around">   
        <button type="button" class="btn p-0 btn-ver" 
                data-id_edicion="${e.id_edicion}"
                data-id_formacion="${e.id_formacion}">
            <i class="bi bi-eye"></i>
        </button>
        <button type="button" class="btn p-0 btn-editar" 
                data-id_edicion="${e.id_edicion}"
                data-id_formacion="${e.id_formacion}">
            <i class="bi bi-pencil"></i>
        </button>
        <button type="button" class="btn p-0 btn-eliminar" 
              data-bs-toggle="modal"
              data-bs-target="#modalEliminar"
              data-id_edicion="${e.id_edicion}"
              data-id_formacion="${e.id_formacion}">          
          <i class="bi bi-trash3"></i>
      </button>
      </td>  
    `;
    tbody.appendChild(tr);
  });
}

// ================================
// CARGAR FORMACIONES
// ================================
async function cargarFormaciones(formacionSeleccionada, id_select) {
  const select = document.getElementById(id_select);
  if (!select) return;

  try {
    const response = await FormacionApi.getAll();
    const formaciones = response.data;
    
    select.innerHTML = '<option value="">Seleccione...</option>';

    formaciones.forEach(formacion => {
      const option = document.createElement('option');
      option.value = formacion.id_formacion;
      option.textContent = formacion.nombre;

      if (formacionSeleccionada !== 0 && Number(formacion.id_formacion) === Number(formacionSeleccionada)) {
        option.selected = true;
      }

      select.appendChild(option);
    });

  } catch (e) {
    mostrarError(e.message || 'Error cargando formaciones');
  }
}

// ================================
// CREAR / INSERTAR EDICION
// ================================
function bindCrearEdicion() {
  const form = document.getElementById('formInsertar');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);
    const data = { 
      id_formacion: f.get('id_formacion'),
      f_inicio: f.get('f_inicio'),
      f_fin: f.get('f_fin'),
      horas: f.get('horas')
    };

    try {
      await EdicionApi.create(data.id_formacion, data);
      await cargarEdiciones();
      form.reset();
      alert('Edicion creada correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error creando Edicion');
    }
  });
}

// ================================
// CAMPOS BD
// ================================
const nombresCampos = [
  'ID-Formacion',
  'Fecha inicio',
  'Fecha fin',
  'Horas'
];
const camposBd = [
  'id_formacion',
  'f_inicio',
  'f_fin',
  'horas'
];

// ================================
// MODAL VER
// ================================
document.addEventListener('click', async function (e) {
  const btn = e.target.closest('.btn-ver');
  if (!btn) return;

  const id_formacion = btn.dataset.id_formacion;
  const id_edicion = btn.dataset.id_edicion;

  try {
    const response = await EdicionApi.getById(id_formacion, id_edicion);
    const edicion = response.data[0];
    if (!edicion) return;

    const modalBody = document.getElementById('modalVerBody');
    modalBody.innerHTML = '';

    nombresCampos.forEach((nombre, index) => {
      const campo = camposBd[index];
      let valor = edicion[campo] ?? '';

      if (campo === 'f_inicio' || campo === 'f_fin') {
        valor = Formateos.formatearFechaHora(valor);
      }

      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = nombre + ': ';
      p.appendChild(strong);
      p.appendChild(document.createTextNode(valor));
      modalBody.appendChild(p);
    });

    // Abrir modal manualmente
    const modal = new bootstrap.Modal(document.getElementById('modalVer'));
    modal.show();

  } catch (error) {
    mostrarError(error.message || 'Error al cargar la edición');
  }
});

// ================================
// MODAL EDITAR
// ================================
document.addEventListener('click', async function (e) {
  const btn = e.target.closest('.btn-editar');
  if (!btn) return;

  const id_edicion = btn.dataset.id_edicion;
  const id_formacion = btn.dataset.id_formacion;

  try {
    const response = await EdicionApi.getById(id_formacion, id_edicion);
    const edicion = response.data[0];
    console.log(edicion);
    if (!edicion) return;

    const form = document.getElementById('formEditar');
    form.innerHTML = '';

    form.innerHTML = `
      <div class="row mb-3">
          <div class="col-mg-6 col-lg-4">
              <label class="form-label">Nombre</label>
              <select class="form-select" id="nombreFormacionEdit" name="id_formacion"></select>
          </div>
          <div class="col-mg-6 col-lg-4">
              <label for="f_inicio" class="form-label">Fecha Inicio</label>
              <input type="date" class="form-control" id="f_inicio" name="f_inicio" 
                     value="${edicion.f_inicio ?? ''}" required>
          </div>
          <div class="col-mg-6 col-lg-4">
              <label for="f_fin" class="form-label">Fecha Fin</label>
              <input type="date" class="form-control" id="f_fin" name="f_fin" 
                     value="${edicion.f_fin ?? ''}" required>
          </div>
          <div class="col-mg-6 col-lg-4">
              <label for="horas" class="form-label">Horas</label>
              <input type="number" class="form-control" id="horas" name="horas" 
                     value="${edicion.horas ?? ''}">
          </div>
      </div>
      <div class="row text-center">
        <button type="button" id="btnGuardarCambios" class="btn btn-primary">
          Guardar cambios
        </button>
      </div>
    `;

    await cargarFormaciones(edicion.id_formacion, 'nombreFormacionEdit');

    // Abrir modal manualmente
    const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
    modal.show();

    document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
      const data = {};

      camposBd.forEach(campo => {
        const input = form.querySelector(`[name="${campo}"]`);
        if (input) data[campo] = input.value;
      });

      try {
        await EdicionApi.update(id_formacion, id_edicion, data);
        await cargarEdiciones();
        modal.hide();
      } catch (err) {
        mostrarError(err.message || 'Error al guardar cambios');
      }
    });

  } catch (error) {
    mostrarError(error.message || 'Error al cargar edición para editar');
  }
});

// ================================
// MODAL ELIMINAR
// ================================
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-eliminar');
  if (!btn) return;

  const btnConfirm = document.getElementById('btnConfirmarEliminar');
  btnConfirm.dataset.id_edicion = btn.dataset.id_edicion;
  btnConfirm.dataset.id_formacion = btn.dataset.id_formacion;
});

document.getElementById('btnConfirmarEliminar')
  .addEventListener('click', async function () {
    const id_edicion = this.dataset.id_edicion;
    const id_formacion = this.dataset.id_formacion;
    if (!id_edicion || !id_formacion) return;

    try {
      await EdicionApi.delete(id_formacion, id_edicion);
      await cargarEdiciones();

      const modal = bootstrap.Modal.getInstance(
        document.getElementById('modalEliminar')
      );
      modal.hide();
    } catch (error) {
      mostrarError('Error al eliminar edición: ' + error.message);
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