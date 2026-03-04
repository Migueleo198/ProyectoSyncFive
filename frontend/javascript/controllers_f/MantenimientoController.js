let mantenimientos = [];
let personas = [];

document.addEventListener('DOMContentLoaded', () => {
  cargarDatosIniciales();
  bindCrearMantenimientoVehiculo();
  bindCrearMantenimientoMaterial();
  bindFiltros();
  bindModales();
});

// CARGAR DATOS INICIALES

async function cargarDatosIniciales() {
  try {
    await cargarPersonas();
    await cargarMantenimientos();
    poblarSelectPersonas();
    renderTabla(mantenimientos);
  } catch (e) {
    console.error('Error cargando datos:', e);
    mostrarError('Error cargando datos: ' + e.message);
  }
}

async function cargarPersonas() {
  try {
    const response = await fetch('/api/personas');
    const data = await response.json();
    personas = data.data || [];
  } catch (e) {
    console.error('Error cargando personas:', e);
  }
}

async function cargarMantenimientos() {
  try {
    const response = await fetch('/api/mantenimientos');
    const data = await response.json();
    mantenimientos = data.data || [];
  } catch (e) {
    console.error('Error cargando mantenimientos:', e);
    mantenimientos = [];
  }
}

// POBLAR SELECT DE PERSONAS

function poblarSelectPersonas() {
  const selects = ['selectBomberoVeh', 'selectBomberoMat', 'editBombero'];

  selects.forEach(id => {
    const select = document.getElementById(id);
    if (select) {
      select.innerHTML = '<option value="">Seleccione un responsable...</option>';
      personas.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id_bombero;
        option.textContent = `${p.nombre} ${p.apellidos || ''} (${p.n_funcionario || p.id_bombero})`;
        select.appendChild(option);
      });
    }
  });
}

// RENDER TABLA

function renderTabla(lista) {
  const tbody = document.querySelector('#tabla tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!lista || lista.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="8" class="text-center">No hay mantenimientos para mostrar</td>';
    tbody.appendChild(tr);
    return;
  }

  lista.forEach(m => {
    const tr = document.createElement('tr');
    tr.dataset.id = m.cod_mantenimiento;
    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${m.cod_mantenimiento ?? ''}</td>
      <td>${m.nombre_bombero || m.id_bombero || ''}</td>
      <td>${m.tipo ?? ''}</td>
      <td>${m.estado ?? ''}</td>
      <td class="d-none d-lg-table-cell">${m.descripcion ?? ''}</td>
      <td class="d-none d-md-table-cell">${m.f_inicio ?? ''}</td>
      <td class="d-none d-md-table-cell">${m.f_fin ?? ''}</td>
      <td class="d-flex justify-content-around">
        <button type="button" class="btn p-0 btn-ver"
                data-bs-toggle="modal" data-bs-target="#modalVer"
                data-id="${m.cod_mantenimiento}">
          <i class="bi bi-eye"></i>
        </button>
        <button type="button" class="btn p-0 btn-editar"
                data-bs-toggle="modal" data-bs-target="#modalEditar"
                data-id="${m.cod_mantenimiento}">
          <i class="bi bi-pencil"></i>
        </button>
        <button type="button" class="btn p-0 btn-eliminar"
                data-bs-toggle="modal" data-bs-target="#modalEliminar"
                data-id="${m.cod_mantenimiento}">
          <i class="bi bi-trash3"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// FILTROS

function bindFiltros() {
  const filtroResponsable = document.getElementById('filtroResponsable');
  const filtroEstado      = document.getElementById('filtroEstado');
  const filtroTipo        = document.getElementById('filtroTipo');

  if (filtroResponsable) filtroResponsable.addEventListener('input', aplicarFiltros);
  if (filtroEstado)      filtroEstado.addEventListener('change', aplicarFiltros);
  if (filtroTipo)        filtroTipo.addEventListener('change', aplicarFiltros);
}

function aplicarFiltros() {
  const filtroResponsable = document.getElementById('filtroResponsable')?.value?.toLowerCase();
  const filtroEstado      = document.getElementById('filtroEstado')?.value;
  const filtroTipo        = document.getElementById('filtroTipo')?.value;

  const filtrados = mantenimientos.filter(m => {
    let cumple = true;
    if (filtroResponsable) cumple = cumple && (
      m.nombre_bombero?.toLowerCase().includes(filtroResponsable) ||
      m.id_bombero?.toLowerCase().includes(filtroResponsable)
    );
    if (filtroEstado) cumple = cumple && m.estado === filtroEstado;
    if (filtroTipo)   cumple = cumple && m.tipo === filtroTipo;
    return cumple;
  });

  renderTabla(filtrados);
}

// CREAR MANTENIMIENTO VEHICULO

function bindCrearMantenimientoVehiculo() {
  const form = document.getElementById('formInsertarVehiculo');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);
    const id_bombero  = f.get('id_bombero');
    const estado      = f.get('estado');
    const f_inicio    = f.get('f_inicio');
    const f_fin       = f.get('f_fin') || null;
    const descripcion = f.get('descripcion')?.trim() || null;

    if (!id_bombero) { mostrarError('Seleccione un responsable'); return; }
    if (!estado)     { mostrarError('Seleccione un estado'); return; }
    if (!f_inicio)   { mostrarError('La fecha de inicio es obligatoria'); return; }

    try {
      const response = await fetch('/api/mantenimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_bombero, estado, f_inicio, f_fin, descripcion })
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) throw new Error(Object.values(result.errors).flat().join(', '));
        throw new Error(result.message || 'Error al crear');
      }

      await cargarMantenimientos();
      renderTabla(mantenimientos);
      form.reset();
      mostrarExito('Mantenimiento creado correctamente');
    } catch (err) {
      mostrarError(err.message);
    }
  });
}

// CREAR MANTENIMIENTO MATERIAL

function bindCrearMantenimientoMaterial() {
  const form = document.getElementById('formInsertarMaterial');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);
    const id_bombero  = f.get('id_bombero');
    const estado      = f.get('estado');
    const f_inicio    = f.get('f_inicio');
    const f_fin       = f.get('f_fin') || null;
    const descripcion = f.get('descripcion')?.trim() || null;

    if (!id_bombero) { mostrarError('Seleccione un responsable'); return; }
    if (!estado)     { mostrarError('Seleccione un estado'); return; }
    if (!f_inicio)   { mostrarError('La fecha de inicio es obligatoria'); return; }

    try {
      const response = await fetch('/api/mantenimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_bombero, estado, f_inicio, f_fin, descripcion })
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) throw new Error(Object.values(result.errors).flat().join(', '));
        throw new Error(result.message || 'Error al crear');
      }

      await cargarMantenimientos();
      renderTabla(mantenimientos);
      form.reset();
      mostrarExito('Mantenimiento creado correctamente');
    } catch (err) {
      mostrarError(err.message);
    }
  });
}

// MODALES

function bindModales() {

  // MODAL VER
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-ver');
    if (!btn) return;

    const id   = btn.dataset.id;
    const mant = mantenimientos.find(m => m.cod_mantenimiento == id);
    if (!mant) return;

    const modalBody = document.getElementById('modalVerBody');
    if (!modalBody) return;
    modalBody.innerHTML = `
      <p><strong>ID:</strong> ${mant.cod_mantenimiento}</p>
      <p><strong>Responsable:</strong> ${mant.nombre_bombero || mant.id_bombero || '-'}</p>
      <p><strong>Tipo:</strong> ${mant.tipo || '-'}</p>
      <p><strong>Estado:</strong> ${mant.estado}</p>
      <p><strong>Fecha inicio:</strong> ${mant.f_inicio || '-'}</p>
      <p><strong>Fecha fin:</strong> ${mant.f_fin || '-'}</p>
      <p><strong>Descripcion:</strong> ${mant.descripcion || '-'}</p>
    `;
  });

  // MODAL EDITAR - Cargar datos
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-editar');
    if (!btn) return;

    const id   = btn.dataset.id;
    const mant = mantenimientos.find(m => m.cod_mantenimiento == id);
    if (!mant) return;

    document.getElementById('editId').value     = mant.cod_mantenimiento;
    document.getElementById('editFInicio').value = mant.f_inicio || '';
    document.getElementById('editFFin').value    = mant.f_fin || '';
    document.getElementById('editDescripcion').value = mant.descripcion || '';

    // Estado
    const selEstado = document.getElementById('editEstado');
    if (selEstado) selEstado.value = mant.estado;

    // Poblar y seleccionar responsable
    const selBombero = document.getElementById('editBombero');
    if (selBombero) {
      selBombero.innerHTML = '<option value="">Seleccione un responsable...</option>';
      personas.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id_bombero;
        option.textContent = `${p.nombre} ${p.apellidos || ''}`;
        if (p.id_bombero === mant.id_bombero) option.selected = true;
        selBombero.appendChild(option);
      });
    }
  });

  // GUARDAR CAMBIOS
  document.getElementById('btnGuardarCambios')?.addEventListener('click', async function() {
    const id          = document.getElementById('editId').value;
    const id_bombero  = document.getElementById('editBombero').value;
    const estado      = document.getElementById('editEstado').value;
    const f_inicio    = document.getElementById('editFInicio').value;
    const f_fin       = document.getElementById('editFFin').value || null;
    const descripcion = document.getElementById('editDescripcion').value.trim() || null;

    if (!id_bombero) { mostrarError('Seleccione un responsable'); return; }
    if (!estado)     { mostrarError('Seleccione un estado'); return; }
    if (!f_inicio)   { mostrarError('La fecha de inicio es obligatoria'); return; }

    try {
      const response = await fetch(`/api/mantenimientos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_bombero, estado, f_inicio, f_fin, descripcion })
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) throw new Error(Object.values(result.errors).flat().join(', '));
        throw new Error(result.message || 'Error al actualizar');
      }

      await cargarMantenimientos();
      renderTabla(mantenimientos);

      const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditar'));
      modal.hide();
      mostrarExito('Mantenimiento actualizado correctamente');
    } catch (error) {
      mostrarError(error.message);
    }
  });

  // MODAL ELIMINAR - Preparar
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-eliminar');
    if (!btn) return;

    const id   = btn.dataset.id;
    const mant = mantenimientos.find(m => m.cod_mantenimiento == id);

    const btnConfirm = document.getElementById('btnConfirmarEliminar');
    if (btnConfirm) btnConfirm.dataset.id = id;

    const modalBody = document.querySelector('#modalEliminar .modal-body');
    if (modalBody && mant) {
      modalBody.innerHTML = `
        ¿Eliminar el mantenimiento <strong>#${mant.cod_mantenimiento}</strong>?
        <p class="text-muted mb-0">Esta acción no se puede deshacer.</p>
      `;
    }
  });

  // CONFIRMAR ELIMINAR
  document.getElementById('btnConfirmarEliminar')?.addEventListener('click', async function() {
    const id = this.dataset.id;
    if (!id) return;

    try {
      const response = await fetch(`/api/mantenimientos/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        mostrarError(result.message || 'Error al eliminar');
        return;
      }

      await cargarMantenimientos();
      renderTabla(mantenimientos);

      const modal = bootstrap.Modal.getInstance(document.getElementById('modalEliminar'));
      modal.hide();
      mostrarExito('Mantenimiento eliminado correctamente');
    } catch (error) {
      mostrarError('Error al eliminar');
    }
  });
}

// FUNCIONES AUXILIARES

function mostrarError(msg) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3';
  alertDiv.style.zIndex = '9999';
  alertDiv.innerHTML = `
    <strong>Error:</strong> ${msg}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 5000);
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
  setTimeout(() => alertDiv.remove(), 3000);
}

window.MantenimientoController = {
  cargarMantenimientos,
  aplicarFiltros
};