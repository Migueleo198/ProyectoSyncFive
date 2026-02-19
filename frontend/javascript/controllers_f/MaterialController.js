// ================================
// MATERIAL CONTROLLER - VERSIÓN COMPLETA
// ================================

let materiales = [];
let vehiculos = [];
let personas = [];
let instalaciones = [];
let categorias = [];

document.addEventListener('DOMContentLoaded', () => {
  cargarDatosIniciales();
  bindCrearMaterial();
  bindAsignarVehiculo();
  bindAsignarFuncionario();
  bindAsignarAlmacen();
  bindFiltros();
});

// ================================
// CARGAR DATOS INICIALES
// ================================
async function cargarDatosIniciales() {
  try {
    await Promise.all([
      cargarMateriales(),
      cargarVehiculos(),
      cargarPersonas(),
      cargarInstalaciones(),
      cargarCategorias()
    ]);
    
    poblarSelectCategorias();
    poblarSelectMateriales();
    poblarSelectVehiculos();
    poblarSelectPersonas();
    poblarSelectInstalaciones();
    
  } catch (e) {
    mostrarError('Error cargando datos: ' + e.message);
  }
}

// ================================
// CARGAR MATERIALES
// ================================
async function cargarMateriales() {
  try {
    const response = await fetch('/api/materiales');
    const data = await response.json();
    materiales = data.data || [];
    await enrichMateriales();
    renderTablaMateriales(materiales);
  } catch (e) {
    console.error('Error cargando materiales:', e);
    mostrarError('Error cargando materiales');
  }
}

// ================================
// CARGAR VEHÍCULOS
// ================================
async function cargarVehiculos() {
  try {
    const response = await fetch('/api/vehiculos');
    const data = await response.json();
    vehiculos = data.data || [];
  } catch (e) {
    console.error('Error cargando vehículos:', e);
  }
}

// ================================
// CARGAR PERSONAS
// ================================
async function cargarPersonas() {
  try {
    const response = await fetch('/api/personas');
    const data = await response.json();
    personas = data.data || [];
  } catch (e) {
    console.error('Error cargando personas:', e);
  }
}

// ================================
// CARGAR INSTALACIONES
// ================================
async function cargarInstalaciones() {
  try {
    const response = await fetch('/api/instalaciones');
    const data = await response.json();
    instalaciones = data.data || [];
  } catch (e) {
    console.error('Error cargando instalaciones:', e);
  }
}

// ================================
// CARGAR CATEGORÍAS
// ================================
async function cargarCategorias() {
  try {
    const response = await fetch('/api/categorias');
    const data = await response.json();
    categorias = data.data || [];
  } catch (e) {
    console.error('Error cargando categorías:', e);
  }
}

// ================================
// CARGAR ALMACENES POR INSTALACIÓN
// ================================
async function cargarAlmacenesPorInstalacion(id_instalacion) {
  try {
    const response = await fetch(`/api/instalaciones/${id_instalacion}/almacenes`);
    const data = await response.json();
    return data.data || [];
  } catch (e) {
    console.error(`Error cargando almacenes de instalación ${id_instalacion}:`, e);
    return [];
  }
}

// ================================
// POBLAR SELECT DE CATEGORÍAS
// ================================
function poblarSelectCategorias() {
  const select = document.getElementById('insertCategoria');
  if (select) {
    select.innerHTML = '<option value="">Seleccione una categoría...</option>';
    categorias.forEach(c => {
      const option = document.createElement('option');
      option.value = c.id_categoria;
      option.textContent = c.nombre;
      select.appendChild(option);
    });
  }
  
  const editSelect = document.getElementById('editCategoria');
  if (editSelect) {
    editSelect.innerHTML = '<option value="">Seleccione una categoría...</option>';
    categorias.forEach(c => {
      const option = document.createElement('option');
      option.value = c.id_categoria;
      option.textContent = c.nombre;
      editSelect.appendChild(option);
    });
  }
}

// ================================
// POBLAR SELECT DE MATERIALES
// ================================
function poblarSelectMateriales() {
  const selects = [
    'selectMaterialVehiculo',
    'selectMaterialFuncionario',
    'selectMaterialAlmacen'
  ];
  
  selects.forEach(id => {
    const select = document.getElementById(id);
    if (select) {
      select.innerHTML = '<option value="">Seleccione un material...</option>';
      materiales.forEach(m => {
        const option = document.createElement('option');
        option.value = m.id_material;
        option.textContent = `${m.nombre} (ID: ${m.id_material})`;
        select.appendChild(option);
      });
    }
  });
}

// ================================
// POBLAR SELECT DE VEHÍCULOS
// ================================
function poblarSelectVehiculos() {
  const select = document.getElementById('selectVehiculo');
  if (select) {
    select.innerHTML = '<option value="">Seleccione un vehículo...</option>';
    vehiculos.forEach(v => {
      const option = document.createElement('option');
      option.value = v.matricula;
      option.textContent = `${v.nombre || v.matricula} - ${v.matricula}`;
      select.appendChild(option);
    });
  }
}

// ================================
// POBLAR SELECT DE PERSONAS
// ================================
function poblarSelectPersonas() {
  const select = document.getElementById('selectFuncionario');
  if (select) {
    select.innerHTML = '<option value="">Seleccione un funcionario...</option>';
    personas.forEach(p => {
      const option = document.createElement('option');
      option.value = p.id_bombero;
      option.textContent = `${p.nombre || ''} ${p.apellidos || ''} (${p.id_bombero})`.trim();
      select.appendChild(option);
    });
  }
}

// ================================
// POBLAR SELECT DE INSTALACIONES
// ================================
function poblarSelectInstalaciones() {
  const selectInstalacion = document.getElementById('selectInstalacion');
  if (!selectInstalacion) return;
  
  selectInstalacion.innerHTML = '<option value="">Seleccione una instalación...</option>';
  
  instalaciones.forEach(i => {
    const option = document.createElement('option');
    option.value = i.id_instalacion;
    option.textContent = `${i.nombre} - ${i.localidad || ''}`;
    selectInstalacion.appendChild(option);
  });
  
  selectInstalacion.addEventListener('change', async function() {
    const id_instalacion = this.value;
    const selectAlmacen = document.getElementById('selectAlmacen');
    if (!selectAlmacen) return;
    
    selectAlmacen.innerHTML = '<option value="">Cargando almacenes...</option>';
    selectAlmacen.disabled = true;
    
    if (id_instalacion) {
      const almacenes = await cargarAlmacenesPorInstalacion(id_instalacion);
      
      if (almacenes.length > 0) {
        selectAlmacen.innerHTML = '<option value="">Seleccione un almacén...</option>';
        almacenes.forEach(a => {
          const option = document.createElement('option');
          option.value = a.id_almacen;
          option.textContent = `${a.nombre} - Planta ${a.planta || ''}`;
          selectAlmacen.appendChild(option);
        });
        selectAlmacen.disabled = false;
      } else {
        selectAlmacen.innerHTML = '<option value="">No hay almacenes en esta instalación</option>';
        selectAlmacen.disabled = true;
      }
    } else {
      selectAlmacen.innerHTML = '<option value="">Primero seleccione una instalación</option>';
      selectAlmacen.disabled = true;
    }
  });
  
  const selectAlmacen = document.getElementById('selectAlmacen');
  if (selectAlmacen) {
    selectAlmacen.innerHTML = '<option value="">Primero seleccione una instalación</option>';
    selectAlmacen.disabled = true;
  }
}

// ================================
// OBTENER ASIGNACIONES REALES
// ================================
async function obtenerAsignacionesMaterial(id_material) {
  let asignaciones = [];
  
  // Asignaciones a vehículos
  try {
    const response = await fetch(`/api/vehiculos?material=${id_material}`);
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      data.data.forEach(v => {
        asignaciones.push({
          tipo: 'Vehículo',
          elemento: v.nombre || v.matricula,
          identificador: v.matricula,
          unidades: v.unidades || '-',
          numero_serie: v.nserie || '-',
          instalacionId: null
        });
      });
    }
  } catch (e) {
    console.log(`No hay vehículos para material ${id_material}`);
  }

  // Asignaciones a personas
  try {
    const response = await fetch(`/api/personas?material=${id_material}`);
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      data.data.forEach(p => {
        asignaciones.push({
          tipo: 'Persona',
          elemento: `${p.nombre || ''} ${p.apellidos || ''}`.trim() || p.id_bombero,
          identificador: p.id_bombero,
          unidades: '-',
          numero_serie: p.nserie || '-',
          instalacionId: null
        });
      });
    }
  } catch (e) {
    console.log(`No hay personas para material ${id_material}`);
  }

  // Asignaciones a almacenes
  try {
    const response = await fetch(`/api/almacenes?material=${id_material}`);
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      data.data.forEach(a => {
        asignaciones.push({
          tipo: 'Almacén',
          elemento: a.nombre || `ID ${a.id_almacen}`,
          identificador: a.id_almacen,
          unidades: a.unidades || '-',
          numero_serie: a.n_serie || '-',
          instalacionId: a.id_instalacion
        });
      });
    }
  } catch (e) {
    console.log(`No hay almacenes para material ${id_material}`);
  }

  return asignaciones;
}

// ================================
// ENRIQUECER MATERIALES
// ================================
async function enrichMateriales() {
  for (const material of materiales) {
    const asignaciones = await obtenerAsignacionesMaterial(material.id_material);
    material.asignaciones = asignaciones;

    if (material.id_categoria) {
      const categoria = categorias.find(c => c.id_categoria == material.id_categoria);
      material.categoria_nombre = categoria ? categoria.nombre : material.id_categoria;
    }
  }
}

// ================================
// RENDER TABLA
// ================================
function renderTablaMateriales(materiales) {
  const tbody = document.querySelector('#tabla tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';

  materiales.forEach(m => {
    if (m.asignaciones && m.asignaciones.length > 0) {
      m.asignaciones.forEach(asignacion => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
          <td class="d-none d-md-table-cell">${m.id_material}</td>
          <td>${m.nombre ?? ''}</td>
          <td class="d-none d-md-table-cell">${m.descripcion ?? ''}</td>
          <td>${m.estado ?? ''}</td>
          <td class="d-none d-md-table-cell">${m.categoria_nombre ?? m.id_categoria ?? ''}</td>
          <td>${asignacion.tipo}</td>
          <td>${asignacion.elemento || ''}</td>
          <td>${asignacion.identificador || ''}</td>
          <td>${asignacion.unidades}</td>
          <td>${asignacion.numero_serie}</td>
          <td class="d-flex justify-content-around">
            <button type="button" class="btn p-0 btn-ver" 
                    data-bs-toggle="modal" 
                    data-bs-target="#modalVer"
                    data-id="${m.id_material}">
                <i class="bi bi-eye"></i>
            </button>
            <button type="button" class="btn p-0 btn-editar" 
                    data-bs-toggle="modal" 
                    data-bs-target="#modalEditar" 
                    data-id="${m.id_material}">
                <i class="bi bi-pencil"></i>
            </button>
            <button type="button" class="btn p-0 btn-eliminar-relacion text-danger" 
                    data-tipo="${asignacion.tipo}"
                    data-identificador="${asignacion.identificador}"
                    data-material="${m.id_material}"
                    data-instalacion="${asignacion.instalacionId || ''}"
                    title="Eliminar esta asignación">
                <i class="bi bi-link-45deg"></i>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="d-none d-md-table-cell">${m.id_material}</td>
        <td>${m.nombre ?? ''}</td>
        <td class="d-none d-md-table-cell">${m.descripcion ?? ''}</td>
        <td>${m.estado ?? ''}</td>
        <td class="d-none d-md-table-cell">${m.categoria_nombre ?? m.id_categoria ?? ''}</td>
        <td>Sin asignar</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td class="d-flex justify-content-around">
          <button type="button" class="btn p-0 btn-ver" 
                  data-bs-toggle="modal" 
                  data-bs-target="#modalVer"
                  data-id="${m.id_material}">
              <i class="bi bi-eye"></i>
          </button>
          <button type="button" class="btn p-0 btn-editar" 
                  data-bs-toggle="modal" 
                  data-bs-target="#modalEditar" 
                  data-id="${m.id_material}">
              <i class="bi bi-pencil"></i>
          </button>
          <button type="button" class="btn p-0 btn-eliminar" 
                  data-bs-toggle="modal"                                         
                  data-bs-target="#modalEliminar" 
                  data-id="${m.id_material}">
              <i class="bi bi-trash3"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    }
  });
}

// ================================
// FILTROS
// ================================
function bindFiltros() {
  const filtroEstado = document.getElementById('estado');
  const filtroNombre = document.getElementById('nombre');
  
  if (filtroEstado) filtroEstado.addEventListener('change', aplicarFiltros);
  if (filtroNombre) filtroNombre.addEventListener('input', aplicarFiltros);
}

function aplicarFiltros() {
  const filtroEstado = document.getElementById('estado')?.value;
  const filtroNombre = document.getElementById('nombre')?.value?.toLowerCase();
  
  const filtrados = materiales.filter(m => {
    let cumple = true;
    if (filtroEstado && filtroEstado !== '') cumple = cumple && m.estado === filtroEstado;
    if (filtroNombre && filtroNombre !== '') {
      cumple = cumple && (m.nombre?.toLowerCase().includes(filtroNombre) || 
                         m.descripcion?.toLowerCase().includes(filtroNombre));
    }
    return cumple;
  });
  
  renderTablaMateriales(filtrados);
}

// ================================
// CREAR MATERIAL
// ================================
function bindCrearMaterial() {
  const form = document.getElementById('formInsertar');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);

    const data = {
      id_categoria: f.get('id_categoria'),
      nombre: f.get('nombre'),
      descripcion: f.get('descripcion'),
      estado: f.get('estado')
    };

    try {
      const response = await fetch('/api/materiales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Error al crear material');
      
      await cargarDatosIniciales();
      form.reset();
      mostrarExito('Material creado correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error creando material');
    }
  });
}

// ================================
// ASIGNAR A VEHÍCULO
// ================================
function bindAsignarVehiculo() {
  const form = document.getElementById('formAsignarVehiculo');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);
    const id_material = parseInt(f.get('id_material'));
    const matricula = f.get('matricula');
    const nserie = f.get('nserie') || null;
    const unidades = parseInt(f.get('unidades'));

    if (isNaN(id_material) || id_material <= 0) {
      mostrarError('Seleccione un material válido');
      return;
    }

    if (!matricula) {
      mostrarError('Seleccione un vehículo');
      return;
    }

    if (isNaN(unidades) || unidades <= 0) {
      mostrarError('Las unidades deben ser un número mayor que 0');
      return;
    }

    const data = { nserie, unidades };

    try {
      const response = await fetch(`/api/vehiculos/${matricula}/materiales/${id_material}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Error al asignar');
      
      await cargarDatosIniciales();
      form.reset();
      mostrarExito('Material asignado a vehículo correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error asignando material a vehículo');
    }
  });
}

// ================================
// ASIGNAR A FUNCIONARIO
// ================================
function bindAsignarFuncionario() {
  const form = document.getElementById('formAsignarFuncionario');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);
    let id_bombero = f.get('id_bombero');
    const id_material = parseInt(f.get('id_material'));
    const nserie = f.get('nserie');

    if (isNaN(id_material) || id_material <= 0) {
      mostrarError('Seleccione un material válido');
      return;
    }

    if (!id_bombero) {
      mostrarError('Seleccione un funcionario');
      return;
    }

    if (!nserie) {
      mostrarError('El número de serie es obligatorio');
      return;
    }

    // Extraer SOLO el número si viene como "B100"
    if (typeof id_bombero === 'string' && id_bombero.startsWith('B')) {
      id_bombero = parseInt(id_bombero.substring(1));
    } else {
      id_bombero = parseInt(id_bombero);
    }

    try {
      const response = await fetch(`/api/personas/${id_bombero}/material/${id_material}/${nserie}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Error al asignar');
      
      await cargarDatosIniciales();
      form.reset();
      mostrarExito('Material asignado a funcionario correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error asignando material a funcionario');
    }
  });
}

// ================================
// ASIGNAR A ALMACÉN
// ================================
function bindAsignarAlmacen() {
  const form = document.getElementById('formAsignarAlmacen');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);
    const id_almacen = parseInt(f.get('id_almacen'));
    const id_instalacion = parseInt(f.get('id_instalacion'));
    const id_material = parseInt(f.get('id_material'));
    const n_serie = f.get('n_serie') || null;
    const unidades = parseInt(f.get('unidades'));

    if (isNaN(id_almacen) || id_almacen <= 0) {
      mostrarError('Seleccione un almacén válido');
      return;
    }

    if (isNaN(id_instalacion) || id_instalacion <= 0) {
      mostrarError('Seleccione una instalación válida');
      return;
    }

    if (isNaN(id_material) || id_material <= 0) {
      mostrarError('Seleccione un material válido');
      return;
    }

    if (isNaN(unidades) || unidades <= 0) {
      mostrarError('Las unidades deben ser un número mayor que 0');
      return;
    }

    const data = { 
      id_material, 
      id_instalacion, 
      n_serie, 
      unidades 
    };

    try {
      const response = await fetch(`/api/almacenes/${id_almacen}/material`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Error al asignar');
      
      await cargarDatosIniciales();
      form.reset();
      
      const selectInstalacion = document.getElementById('selectInstalacion');
      const selectAlmacen = document.getElementById('selectAlmacen');
      if (selectInstalacion) selectInstalacion.value = '';
      if (selectAlmacen) {
        selectAlmacen.innerHTML = '<option value="">Primero seleccione una instalación</option>';
        selectAlmacen.disabled = true;
      }
      
      mostrarExito('Material asignado a almacén correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error asignando material a almacén');
    }
  });
}

// ================================
// MODAL VER
// ================================
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-ver');
  if (!btn) return;

  const id = btn.dataset.id;
  const material = materiales.find(m => m.id_material == id);
  if (!material) return;

  const modalBody = document.getElementById('modalVerBody');
  if (!modalBody) return;

  let asignacionesHTML = '';
  if (material.asignaciones && material.asignaciones.length > 0) {
    asignacionesHTML = '<p><strong>Asignaciones:</strong></p><ul>';
    material.asignaciones.forEach(a => {
      asignacionesHTML += `<li>${a.tipo}: ${a.elemento} (${a.identificador}) - Uds: ${a.unidades} - Serie: ${a.numero_serie}</li>`;
    });
    asignacionesHTML += '</ul>';
  } else {
    asignacionesHTML = '<p><strong>Asignado a:</strong> No asignado</p>';
  }

  modalBody.innerHTML = `
    <p><strong>ID:</strong> ${material.id_material}</p>
    <p><strong>Nombre:</strong> ${material.nombre}</p>
    <p><strong>Descripción:</strong> ${material.descripcion || 'Sin descripción'}</p>
    <p><strong>Estado:</strong> ${material.estado}</p>
    <p><strong>Categoría:</strong> ${material.categoria_nombre || material.id_categoria}</p>
    ${asignacionesHTML}
  `;
});

// ================================
// MODAL EDITAR
// ================================
document.addEventListener('click', async function (e) {
  const btn = e.target.closest('.btn-editar');
  if (!btn) return;

  const id = btn.dataset.id;

  try {
    const response = await fetch(`/api/materiales/${id}`);
    const data = await response.json();
    const material = data.data;
    if (!material) return;

    let categoriasOptions = '<option value="">Seleccione una categoría...</option>';
    categorias.forEach(c => {
      categoriasOptions += `<option value="${c.id_categoria}" ${c.id_categoria == material.id_categoria ? 'selected' : ''}>${c.nombre}</option>`;
    });

    const form = document.getElementById('formEditar');
    if (!form) return;

    form.innerHTML = `
      <div class="mb-3">
        <label class="form-label">ID Material</label>
        <input type="text" class="form-control" value="${material.id_material || ''}" readonly disabled>
        <input type="hidden" name="id_material" value="${material.id_material || ''}">
      </div>

      <div class="row mb-3">
        <div class="col-lg-6">
          <label class="form-label">Nombre</label>
          <input type="text" class="form-control" name="nombre" value="${material.nombre || ''}" required>
        </div>

        <div class="col-lg-6">
          <label class="form-label">Categoría</label>
          <select class="form-select" name="id_categoria" required>
            ${categoriasOptions}
          </select>
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label">Descripción</label>
        <textarea class="form-control" name="descripcion" rows="3" required>${material.descripcion || ''}</textarea>
      </div>

      <div class="mb-3">
        <label class="form-label">Estado</label>
        <select class="form-select" name="estado" required>
          <option value="ALTA" ${material.estado === 'ALTA' ? 'selected' : ''}>ALTA</option>
          <option value="BAJA" ${material.estado === 'BAJA' ? 'selected' : ''}>BAJA</option>
        </select>
      </div>
    `;

    document.getElementById('btnGuardarCambios').onclick = async () => {
      const form = document.getElementById('formEditar');
      const data = {
        nombre: form.querySelector('[name="nombre"]').value,
        id_categoria: parseInt(form.querySelector('[name="id_categoria"]').value),
        descripcion: form.querySelector('[name="descripcion"]').value,
        estado: form.querySelector('[name="estado"]').value
      };

      try {
        const response = await fetch(`/api/materiales/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error('Error al actualizar');
        
        await cargarDatosIniciales();

        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditar'));
        modal.hide();
        mostrarExito('Material actualizado correctamente');
      } catch (error) {
        mostrarError('Error al actualizar material: ' + error.message);
      }
    };

  } catch (error) {
    console.error('Error al editar material:', error);
    mostrarError('Error al cargar datos del material');
  }
});

// ================================
// ELIMINAR SOLO LA RELACIÓN
// ================================
document.addEventListener('click', async function(e) {
  const btn = e.target.closest('.btn-eliminar-relacion');
  if (!btn) return;
  
  const tipo = btn.dataset.tipo;
  const identificador = btn.dataset.identificador;
  const idMaterial = btn.dataset.material;
  const idInstalacion = btn.dataset.instalacion;
  
  if (!confirm(`¿Eliminar esta asignación de ${tipo}?`)) return;
  
  try {
    let url = '';
    let options = {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (tipo === 'Vehículo') {
      url = `/api/vehiculos/${identificador}/materiales/${idMaterial}`;
    } 
    else if (tipo === 'Persona') {
      url = `/api/personas/${identificador}/material/${idMaterial}`;
    } 
    else if (tipo === 'Almacén') {
      url = `/api/almacenes/${identificador}/material/${idMaterial}`;
      if (idInstalacion) {
        options.body = JSON.stringify({ id_instalacion: parseInt(idInstalacion) });
      }
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) throw new Error('Error al eliminar la relación');
    
    await cargarDatosIniciales();
    mostrarExito('Asignación eliminada correctamente');
    
  } catch (error) {
    mostrarError('Error al eliminar la asignación: ' + error.message);
  }
});

// ================================
// MODAL ELIMINAR (PARA MATERIALES SIN ASIGNACIONES)
// ================================
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-eliminar');
  if (!btn) return;

  const id = btn.dataset.id;
  const material = materiales.find(m => m.id_material == id);
  
  const btnConfirm = document.getElementById('btnConfirmarEliminar');
  if (btnConfirm) {
    btnConfirm.dataset.id = id;
    
    const modalBody = document.querySelector('#modalEliminar .modal-body');
    if (modalBody && material) {
      modalBody.innerHTML = `
        ¿Estás seguro de que deseas eliminar el material "${material.nombre}"?
        <p class="text-muted mb-0 mt-2">Esta acción no se puede deshacer.</p>
      `;
    }
  }
});

document.getElementById('btnConfirmarEliminar')?.addEventListener('click', async function() {
  const id = this.dataset.id;
  if (!id) return;

  try {
    const response = await fetch(`/api/materiales/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Error al eliminar');
    
    await cargarDatosIniciales();

    const modal = bootstrap.Modal.getInstance(document.getElementById('modalEliminar'));
    modal.hide();
    mostrarExito('Material eliminado correctamente');
  } catch (error) {
    if (error.message.includes('foreign key constraint')) {
      mostrarError('No se puede eliminar el material porque tiene asignaciones');
    } else {
      mostrarError('Error al eliminar material: ' + error.message);
    }
  }
});

// ================================
// FUNCIONES AUXILIARES
// ================================
function mostrarError(msg) {
  console.error(msg);
  
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3';
  alertDiv.style.zIndex = '9999';
  alertDiv.innerHTML = `
    <strong>Error:</strong> ${msg}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

function mostrarExito(msg) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3';
  alertDiv.style.zIndex = '9999';
  alertDiv.innerHTML = `
    <strong>Éxito:</strong> ${msg}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.remove();
  }, 3000);
}

window.refrescarMateriales = async function() {
  await cargarDatosIniciales();
  mostrarExito('Datos actualizados');
};

window.MaterialController = {
  cargarMateriales,
  refrescarMateriales,
  aplicarFiltros
};