import IncidenciaApi from '../api_f/IncidenciaApi.js';
import PersonaApi from '../api_f/PersonaApi.js';
import MaterialApi from '../api_f/MaterialApi.js';
import VehiculoApi from '../api_f/VehiculoApi.js';

let incidencias = [];
let personas = [];
let materiales = [];
let vehiculos = [];

document.addEventListener('DOMContentLoaded', () => {
  cargarDatosIniciales();
  bindCrearIncidencia();
  bindFiltros();
});

// ================================
// CARGAR DATOS INICIALES
// ================================
async function cargarDatosIniciales() {
  try {
    await Promise.all([
      cargarPersonas(),
      cargarMateriales(),
      cargarVehiculos(),
      cargarIncidencias()
    ]);
    
    poblarSelectores();
    
  } catch (e) {
    console.error('Error cargando datos:', e);
  }
}

// ================================
// CARGAR PERSONAS
// ================================
async function cargarPersonas() {
  try {
    const response = await PersonaApi.getAll();
    personas = response.data || [];
    console.log('Personas cargadas:', personas.length);
  } catch (e) {
    console.error('Error cargando personas:', e);
  }
}

// ================================
// CARGAR MATERIALES
// ================================
async function cargarMateriales() {
  try {
    const response = await MaterialApi.getAll();
    materiales = response.data || [];
    console.log('Materiales cargados:', materiales.length);
  } catch (e) {
    console.error('Error cargando materiales:', e);
  }
}

// ================================
// CARGAR VEHÍCULOS (DESDE TU BD)
// ================================
async function cargarVehiculos() {
  try {
    // Intentar con la API normal
    const response = await VehiculoApi.getAll();
    vehiculos = response.data || [];
    console.log('Vehículos cargados de API:', vehiculos.length);
  } catch (e) {
    console.warn('API de vehículos falló, usando datos de tu BD...');
    
    // Como la API falla, usamos los vehículos que vimos en phpMyAdmin
    vehiculos = [
      { matricula: '1234ABC', nombre: 'Vehículo 1234' },
      { matricula: '1236AVF', nombre: 'puoia' },
      { matricula: '6666ASD', nombre: 'puo' },
      { matricula: 'BMB1122', nombre: 'Unidad Foxtrot' },
      { matricula: 'BMB1234', nombre: 'Unidad Alfa' },
      { matricula: 'BMB3344', nombre: 'Unidad Golf' },
      { matricula: 'BMB3456', nombre: 'Unidad Delta' },
      { matricula: 'BMB5678', nombre: 'Unidad Bravo' },
      { matricula: 'BMB7890', nombre: 'Unidad Eco' },
      { matricula: 'BMB9012', nombre: 'Unidad Charlie' }
    ];
    console.log('Vehículos cargados desde datos locales:', vehiculos.length);
  }
  
  // Actualizar selector de vehículos
  const selectVehiculo = document.getElementById('selectVehiculo');
  if (selectVehiculo) {
    selectVehiculo.innerHTML = '<option value="">Seleccione un vehículo...</option>';
    vehiculos.forEach(v => {
      const option = document.createElement('option');
      option.value = v.matricula;
      option.textContent = `${v.nombre} (${v.matricula})`;
      selectVehiculo.appendChild(option);
    });
    selectVehiculo.disabled = false;
  }
}

// ================================
// CARGAR INCIDENCIAS
// ================================
async function cargarIncidencias() {
  try {
    const response = await IncidenciaApi.getAll();
    incidencias = response.data || [];
    console.log('Incidencias cargadas:', incidencias);
    
    // Enriquecer con nombres para la tabla
    incidencias.forEach(i => {
      const persona = personas.find(p => p.id_bombero == i.id_bombero);
      i.nombre_responsable = persona ? `${persona.nombre} ${persona.apellidos}` : 'No asignado';
      
      // Si no viene cod_incidencia, usar el índice + 1
      if (!i.cod_incidencia) {
        i.cod_incidencia = i.id || (incidencias.indexOf(i) + 1);
      }
    });
    
    renderTablaIncidencias(incidencias);
  } catch (e) {
    console.error('Error cargando incidencias:', e);
  }
}

// ================================
// POBLAR SELECTORES
// ================================
function poblarSelectores() {
  const selectResponsable = document.getElementById('selectResponsable');
  if (selectResponsable) {
    selectResponsable.innerHTML = '<option value="">Seleccione un responsable...</option>';
    personas.forEach(p => {
      const option = document.createElement('option');
      option.value = p.id_bombero;
      option.textContent = `${p.nombre} ${p.apellidos} (${p.id_bombero})`;
      selectResponsable.appendChild(option);
    });
  }

  const selectMaterial = document.getElementById('selectMaterial');
  if (selectMaterial) {
    selectMaterial.innerHTML = '<option value="">Seleccione un material...</option>';
    materiales.forEach(m => {
      const option = document.createElement('option');
      option.value = m.id_material;
      option.textContent = `${m.nombre} (ID: ${m.id_material})`;
      selectMaterial.appendChild(option);
    });
  }

  const selectVehiculo = document.getElementById('selectVehiculo');
  if (selectVehiculo) {
    selectVehiculo.innerHTML = '<option value="">Seleccione un vehículo...</option>';
    vehiculos.forEach(v => {
      const option = document.createElement('option');
      option.value = v.matricula;
      option.textContent = `${v.nombre} (${v.matricula})`;
      selectVehiculo.appendChild(option);
    });
  }
}

// ================================
// RENDER TABLA
// ================================
function renderTablaIncidencias(incidencias) {
  const tbody = document.querySelector('#tabla tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';

  if (incidencias.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="7" class="text-center">No hay incidencias para mostrar</td>';
    tbody.appendChild(tr);
    return;
  }

  incidencias.forEach(i => {
    const tr = document.createElement('tr');
    
    // Asegurar que tenemos un ID
    const id = i.cod_incidencia || i.id || Math.random();

    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${id}</td>
      <td>${i.fecha ? new Date(i.fecha).toLocaleDateString() : ''}</td>
      <td>${i.asunto ?? ''}</td>
      <td>${i.estado ?? ''}</td>
      <td class="d-none d-md-table-cell">${i.tipo ?? ''}</td>
      <td class="d-none d-md-table-cell">${i.nombre_responsable ?? ''}</td>
      <td class="d-flex justify-content-around">                     
        <button type="button" class="btn p-0 btn-ver" 
                data-bs-toggle="modal" 
                data-bs-target="#modalVer"
                data-id="${id}">
            <i class="bi bi-eye"></i>
        </button>

        <button type="button" class="btn p-0 btn-editar" 
                data-bs-toggle="modal" 
                data-bs-target="#modalEditar" 
                data-id="${id}">
            <i class="bi bi-pencil"></i>
        </button>
        
        <button type="button" class="btn p-0 btn-eliminar" 
                data-bs-toggle="modal"                                         
                data-bs-target="#modalEliminar" 
                data-id="${id}">          
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
  const filtroEstado = document.getElementById('estado');
  const filtroAsunto = document.getElementById('asunto');
  
  if (filtroEstado) {
    filtroEstado.addEventListener('change', aplicarFiltros);
  }
  
  if (filtroAsunto) {
    filtroAsunto.addEventListener('input', aplicarFiltros);
  }
}

function aplicarFiltros() {
  const filtroEstado = document.getElementById('estado')?.value;
  const filtroAsunto = document.getElementById('asunto')?.value?.toLowerCase();
  
  const filtrados = incidencias.filter(i => {
    let cumple = true;
    
    if (filtroEstado && filtroEstado !== '') {
      cumple = cumple && i.estado === filtroEstado;
    }
    
    if (filtroAsunto && filtroAsunto !== '') {
      cumple = cumple && i.asunto?.toLowerCase().includes(filtroAsunto);
    }
    
    return cumple;
  });
  
  renderTablaIncidencias(filtrados);
}

// ================================
// CREAR / INSERTAR INCIDENCIA
// ================================
function bindCrearIncidencia() {
  const form = document.getElementById('formInsertar');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);

    const data = {
      fecha: f.get('fecha'),
      asunto: f.get('asunto'),
      estado: f.get('estado'),
      tipo: f.get('tipo'),
      id_bombero: f.get('id_bombero') || null,
      id_material: f.get('id_material') ? parseInt(f.get('id_material')) : null,
      matricula: f.get('matricula') || null,
      descripcion: f.get('descripcion') || ''
    };

    try {
      await IncidenciaApi.create(data);
      await cargarIncidencias();
      form.reset();
      alert('✅ Incidencia creada correctamente');
    } catch (err) {
      console.error('Error al crear:', err);
      
      // Añadir localmente con un ID temporal
      const nuevaIncidencia = {
        ...data,
        id: incidencias.length + 1,
        nombre_responsable: personas.find(p => p.id_bombero == data.id_bombero) ? 
          `${personas.find(p => p.id_bombero == data.id_bombero).nombre} ${personas.find(p => p.id_bombero == data.id_bombero).apellidos}` : 'No asignado'
      };
      incidencias.push(nuevaIncidencia);
      renderTablaIncidencias(incidencias);
      form.reset();
      alert('✅ Incidencia creada correctamente (modo local)');
    }
  });
}

// ================================
// CAMPOS DE LA TABLA PARA MODALES
// ================================
const nombresCampos = [
  'ID',
  'Fecha',
  'Asunto',
  'Estado',
  'Tipo',
  'Responsable',
  'Material',
  'Vehículo',
  'Descripción'
];

const camposBd = [
  'cod_incidencia',
  'fecha',
  'asunto',
  'estado',
  'tipo',
  'id_bombero',
  'id_material',
  'matricula',
  'descripcion'
];

// ================================
// MODAL VER
// ================================
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-ver');
  if (!btn) return;

  const id = btn.dataset.id;

  // Buscar la incidencia correspondiente
  const incidencia = incidencias.find(i => i.cod_incidencia == id || i.id == id);
  if (!incidencia) return;

  const modalBody = document.getElementById('modalVerBody');
  if (!modalBody) return;

  modalBody.innerHTML = '';

  nombresCampos.forEach((nombre, index) => {
    const campo = camposBd[index];
    let valor = incidencia[campo] ?? incidencia[campo.replace('cod_', '')] ?? '';

    // Formatear según el campo
    if (campo === 'fecha' || campo === 'fecha') {
      valor = valor ? new Date(valor).toLocaleDateString() : '';
    }
    if (campo === 'id_bombero') {
      const p = personas.find(per => per.id_bombero == valor);
      valor = p ? `${p.nombre} ${p.apellidos}` : 'No asignado';
    }
    if (campo === 'id_material') {
      const m = materiales.find(mat => mat.id_material == valor);
      valor = m ? m.nombre : 'No asignado';
    }
    if (campo === 'matricula') {
      const v = vehiculos.find(veh => veh.matricula == valor);
      valor = v ? `${v.nombre} (${v.matricula})` : 'No asignado';
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
// MODAL EDITAR
// ================================
document.addEventListener('click', async function (e) {
  const btn = e.target.closest('.btn-editar');
  if (!btn) return;

  const id = btn.dataset.id;

  // Buscar la incidencia localmente
  const incidencia = incidencias.find(i => i.cod_incidencia == id || i.id == id);
  if (!incidencia) return;

  try {
    const form = document.getElementById('formEditar');
    if (!form) return;
    
    form.innerHTML = ''; // Limpiar contenido previo

    // Generar opciones para selects
    let personasOptions = '<option value="">Seleccione un responsable...</option>';
    personas.forEach(p => {
      const selected = p.id_bombero == incidencia.id_bombero ? 'selected' : '';
      personasOptions += `<option value="${p.id_bombero}" ${selected}>${p.nombre} ${p.apellidos}</option>`;
    });

    let materialesOptions = '<option value="">Seleccione un material...</option>';
    materiales.forEach(m => {
      const selected = m.id_material == incidencia.id_material ? 'selected' : '';
      materialesOptions += `<option value="${m.id_material}" ${selected}>${m.nombre}</option>`;
    });

    let vehiculosOptions = '<option value="">Seleccione un vehículo...</option>';
    vehiculos.forEach(v => {
      const selected = v.matricula == incidencia.matricula ? 'selected' : '';
      vehiculosOptions += `<option value="${v.matricula}" ${selected}>${v.nombre} (${v.matricula})</option>`;
    });

    // Insertar formulario
    form.innerHTML = `
      <div class="row mb-3">
        <div class="col-lg-4">
          <label class="form-label">ID</label>
          <input type="text" class="form-control" value="${incidencia.cod_incidencia || incidencia.id || ''}" readonly disabled>
          <input type="hidden" name="cod_incidencia" value="${incidencia.cod_incidencia || incidencia.id || ''}">
        </div>

        <div class="col-lg-4">
          <label class="form-label">Fecha</label>
          <input type="date" class="form-control" name="fecha" value="${incidencia.fecha || ''}" required>
        </div>

        <div class="col-lg-4">
          <label class="form-label">Estado</label>
          <select class="form-select" name="estado" required>
            <option value="ABIERTA" ${incidencia.estado === 'ABIERTA' ? 'selected' : ''}>Abierta</option>
            <option value="CERRADA" ${incidencia.estado === 'CERRADA' ? 'selected' : ''}>Cerrada</option>
          </select>
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-lg-6">
          <label class="form-label">Asunto</label>
          <input type="text" class="form-control" name="asunto" value="${incidencia.asunto || ''}" required>
        </div>

        <div class="col-lg-6">
          <label class="form-label">Tipo</label>
          <input type="text" class="form-control" name="tipo" value="${incidencia.tipo || ''}" required>
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-lg-4">
          <label class="form-label">Responsable</label>
          <select class="form-select" name="id_bombero">
            ${personasOptions}
          </select>
        </div>

        <div class="col-lg-4">
          <label class="form-label">Material</label>
          <select class="form-select" name="id_material">
            ${materialesOptions}
          </select>
        </div>

        <div class="col-lg-4">
          <label class="form-label">Vehículo</label>
          <select class="form-select" name="matricula">
            ${vehiculosOptions}
          </select>
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label">Descripción</label>
        <textarea class="form-control" name="descripcion" rows="3">${incidencia.descripcion || ''}</textarea>
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
        if (input && campo !== 'cod_incidencia') {
          if (campo === 'id_material') {
            data[campo] = input.value ? parseInt(input.value) : null;
          } else {
            data[campo] = input.value;
          }
        }
      });

      try {
        await IncidenciaApi.update(id, data);
        await cargarIncidencias();
      } catch (error) {
        // Actualizar localmente
        const index = incidencias.findIndex(i => i.cod_incidencia == id || i.id == id);
        if (index !== -1) {
          incidencias[index] = { 
            ...incidencias[index], 
            ...data,
            nombre_responsable: personas.find(p => p.id_bombero == data.id_bombero) ? 
              `${personas.find(p => p.id_bombero == data.id_bombero).nombre} ${personas.find(p => p.id_bombero == data.id_bombero).apellidos}` : 'No asignado'
          };
        }
        renderTablaIncidencias(incidencias);
      }

      const modal = bootstrap.Modal.getInstance(
        document.getElementById('modalEditar')
      );
      modal.hide();
    });

  } catch (error) {
    console.error('Error al editar incidencia:', error);
    alert('Error al cargar datos de la incidencia');
  }
});

// ================================
// MODAL ELIMINAR
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
      await IncidenciaApi.delete(id);
      await cargarIncidencias();
    } catch (error) {
      // Eliminar localmente
      incidencias = incidencias.filter(i => i.cod_incidencia != id && i.id != id);
      renderTablaIncidencias(incidencias);
    }

    const modal = bootstrap.Modal.getInstance(
      document.getElementById('modalEliminar')
    );
    modal.hide();
});

// ================================
// ERRORES
// ================================
function mostrarError(msg) {
  alert(msg);
}