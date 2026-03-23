import AvisoApi from '../api_f/AvisoApi.js';
import PersonaApi from '../api_f/PersonaApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { formatearFecha, truncar, mostrarExito, mostrarError } from '../helpers/utils.js';

let avisos = [];
let personas = [];
let sesionActual = null;
let usuarioActual = null;

document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('avisos');
  if (!sesionActual) return;

  usuarioActual = sesionActual.usuario;

  await cargarPersonas();
  await cargarAvisos();

  bindFiltros();

  if (sesionActual.puedeEscribir) {
    bindCrearAviso();
  }

  bindModalVer();
  bindModalEliminar();
});

// ================================
// CARGAR PERSONAS
// ================================
async function cargarPersonas() {
  try {
    const response = await PersonaApi.getAll();
    personas = response.data;
    poblarSelectDestinatarios(personas);
    poblarSelectFiltroRemitente(personas);
  } catch (e) {
    console.error('Error cargando personas:', e.message);
  }
}

function poblarSelectDestinatarios(lista) {
  // Excluir al usuario actual de la lista de destinatarios
  const personasFiltradas = lista.filter(p => 
    !usuarioActual || String(p.id_bombero) !== String(usuarioActual.id_bombero)
  );

  // Ordenar alfabéticamente
  const personasOrdenadas = [...personasFiltradas].sort((a, b) =>
    `${a.nombre} ${a.apellidos}`.localeCompare(`${b.nombre} ${b.apellidos}`)
  );

  // Poblar select único (modo "uno")
  const selectUnico = document.getElementById('destinatarioSelect');
  if (selectUnico) {
    selectUnico.innerHTML = '<option value="">Seleccione un destinatario</option>';
    personasOrdenadas.forEach(p => {
      const option = document.createElement('option');
      option.value = p.id_bombero;
      option.textContent = `${p.nombre} ${p.apellidos} (${p.nombre_usuario})`;
      selectUnico.appendChild(option);
    });
  }

  // Poblar select múltiple (modo "varios")
  const selectMultiple = document.getElementById('destinatariosMultiSelect');
  if (selectMultiple) {
    selectMultiple.innerHTML = '';
    personasOrdenadas.forEach(p => {
      const option = document.createElement('option');
      option.value = p.id_bombero;
      option.textContent = `${p.nombre} ${p.apellidos} (${p.nombre_usuario})`;
      selectMultiple.appendChild(option);
    });
  }

  // Guardar lista de personas para el modo "todos"
  window._personasParaAviso = personasOrdenadas.map(p => p.id_bombero);
}

function poblarSelectFiltroRemitente(lista) {
  const select = document.getElementById('remitente');
  if (!select) return;

  select.innerHTML = '<option value="">Todos</option>';

  const personasOrdenadas = [...lista].sort((a, b) =>
    `${a.nombre} ${a.apellidos}`.localeCompare(`${b.nombre} ${b.apellidos}`)
  );

  personasOrdenadas.forEach(p => {
    const option = document.createElement('option');
    option.value = p.id_bombero;
    option.textContent = `${p.nombre} ${p.apellidos} (${p.nombre_usuario})`;
    select.appendChild(option);
  });
}

// ================================
// CARGAR AVISOS
// ================================
async function cargarAvisos() {
  try {
    const response = await AvisoApi.getAll();
    const todosLosAvisos = response.data;
    const misAvisos = await filtrarAvisosDelUsuario(todosLosAvisos);
    avisos = misAvisos;
    renderTablaAvisos(avisos);
  } catch (e) {
    mostrarError(e.message || 'Error cargando avisos');
  }
}

async function filtrarAvisosDelUsuario(lista) {
  if (!usuarioActual) return lista;

  const resultados = await Promise.allSettled(
    lista.map(a => AvisoApi.getDestinatarios(a.id_aviso))
  );

  return lista.filter((aviso, index) => {
    const resultado = resultados[index];
    if (resultado.status !== 'fulfilled') return false;

    const destinatarios = resultado.value.data ?? [];
    const esDestinatario = destinatarios.some(d => String(d.id_bombero) === String(usuarioActual.id_bombero));
    const esRemitente = String(aviso.remitente) === String(usuarioActual.id_bombero);
    return esDestinatario || esRemitente;
  });
}

// ================================
// RENDER TABLA
// ================================
function renderTablaAvisos(lista) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';

  if (!lista.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted py-4">No hay avisos registrados</td>
      </tr>`;
    return;
  }

  const puedeEscribir = sesionActual?.puedeEscribir ?? false;

  lista.forEach(a => {
    const tr = document.createElement('tr');

    const remitentePersona = personas.find(p => String(p.id_bombero) === String(a.remitente));
    const nombreRemitente = remitentePersona
      ? `${remitentePersona.nombre} ${remitentePersona.apellidos}`
      : (a.remitente || '—');

    const botonesAccion = puedeEscribir
      ? `<button type="button" class="btn p-0 btn-ver"
              data-bs-toggle="modal" data-bs-target="#modalVer"
              data-id="${a.id_aviso}" title="Ver detalle">
            <i class="bi bi-eye"></i>
         </button>
         <button type="button" class="btn p-0 btn-eliminar"
              data-bs-toggle="modal" data-bs-target="#modalEliminar"
              data-id="${a.id_aviso}" title="Eliminar">
            <i class="bi bi-trash3 text-danger"></i>
         </button>`
      : `<button type="button" class="btn p-0 btn-ver"
              data-bs-toggle="modal" data-bs-target="#modalVer"
              data-id="${a.id_aviso}" title="Ver detalle">
            <i class="bi bi-eye"></i>
         </button>`;

    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${a.id_aviso}</td>
      <td>${a.asunto ?? ''}</td>
      <td>${truncar(a.mensaje, 60)}</td>
      <td class="d-none d-md-table-cell">${formatearFecha(a.fecha)}</td>
      <td class="d-none d-md-table-cell">${a.remitente ?? '—'}</td>
      <td>
        <div class="d-flex justify-content-around">
          ${botonesAccion}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ================================
// FILTROS
// ================================
function bindFiltros() {
  document.getElementById('asunto')?.addEventListener('input', aplicarFiltros);
  document.getElementById('remitente')?.addEventListener('change', aplicarFiltros);
}

function aplicarFiltros() {
  const filtroAsunto    = document.getElementById('asunto')?.value.toLowerCase().trim() ?? '';
  const filtroRemitente = document.getElementById('remitente')?.value ?? '';

  renderTablaAvisos(avisos.filter(a => {
    const cumpleAsunto    = !filtroAsunto    || (a.asunto?.toLowerCase().includes(filtroAsunto));
    const cumpleRemitente = !filtroRemitente || String(a.remitente) === String(filtroRemitente);
    return cumpleAsunto && cumpleRemitente;
  }));
}

// ================================
// VALIDAR AVISO
// Según DDL Aviso:
//   asunto  VARCHAR(150) NOT NULL
//   mensaje TEXT         NOT NULL
// ================================
function validarAviso(asunto, mensaje) {
  if (!asunto) {
    mostrarError('El asunto es obligatorio.');
    return false;
  }
  if (asunto.length > 150) {
    mostrarError('El asunto no puede superar los 150 caracteres.');
    return false;
  }

  if (!mensaje) {
    mostrarError('El mensaje es obligatorio.');
    return false;
  }

  return true;
}

// ================================
// TOGGLE MODO DESTINATARIOS
// ================================
function bindDestinatarioModeToggle() {
  const radios = document.querySelectorAll('input[name="destinatarioMode"]');
  const selectUnico = document.getElementById('destinatarioSelect');
  const selectMultiple = document.getElementById('destinatariosMultiSelect');
  const infoText = document.getElementById('destinatarioInfo');

  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      const modo = radio.value;

      if (modo === 'todos') {
        selectUnico.style.display = 'none';
        selectMultiple.style.display = 'none';
        infoText.textContent = 'El aviso se enviará a TODOS los usuarios del sistema';
      } else if (modo === 'uno') {
        selectUnico.style.display = 'block';
        selectMultiple.style.display = 'none';
        selectUnico.value = '';
        infoText.textContent = 'Seleccione un único destinatario';
      } else if (modo === 'varios') {
        selectUnico.style.display = 'none';
        selectMultiple.style.display = 'block';
        // Limpiar selección múltiple
        Array.from(selectMultiple.options).forEach(opt => opt.selected = false);
        infoText.textContent = 'Seleccione uno o varios destinatarios (mantenga Ctrl/Cmd para múltiples)';
      }
    });
  });
}

// ================================
// CREAR AVISO
// ================================
function bindCrearAviso() {
  bindDestinatarioModeToggle();

  const form = document.getElementById('formInsertar');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const asunto  = document.getElementById('insertAsunto').value.trim();
    const mensaje = document.getElementById('insertMensaje').value.trim();

    // ── Validación ──
    if (!validarAviso(asunto, mensaje)) return;

    // ── Obtener destinatarios según modo ──
    const modo = document.querySelector('input[name="destinatarioMode"]:checked')?.value || 'uno';
    let destinatarios = [];

    if (modo === 'todos') {
      // Modo "todos": todos los usuarios excepto el actual
      destinatarios = window._personasParaAviso || [];
    } else if (modo === 'uno') {
      // Modo "uno": un solo destinatario
      const selectUnico = document.getElementById('destinatarioSelect');
      if (selectUnico?.value) {
        destinatarios = [selectUnico.value];
      }
    } else if (modo === 'varios') {
      // Modo "varios": múltiples destinatarios seleccionados
      const selectMultiple = document.getElementById('destinatariosMultiSelect');
      if (selectMultiple) {
        destinatarios = Array.from(selectMultiple.selectedOptions).map(opt => opt.value);
      }
    }

    // Validar que haya al menos un destinatario
    if (destinatarios.length === 0) {
      mostrarError('Debe seleccionar al menos un destinatario');
      return;
    }

    try {
      const response = await AvisoApi.create({
        asunto,
        mensaje,
        fecha: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });

      const idAviso = response.data.id;

      if (usuarioActual?.id_bombero) {
        await AvisoApi.setRemitente(idAviso, usuarioActual.id_bombero);
      }

      for (const idBombero of destinatarios) {
        await AvisoApi.setDestinatario(idAviso, idBombero);
      }

      await cargarAvisos();
      form.reset();
      
      // Resetear modo a "uno" por defecto
      const radioUno = document.getElementById('modeUno');
      if (radioUno) radioUno.checked = true;
      bindDestinatarioModeToggle();
      
      mostrarExito('Aviso creado correctamente');

    } catch (err) {
      if (err.errors) {
        mostrarError(Object.values(err.errors).flat().join(', '));
      } else {
        mostrarError(err.message || 'Error creando aviso');
      }
    }
  });
}

// ================================
// MODAL VER
// ================================
function bindModalVer() {
  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('.btn-ver');
    if (!btn) return;

    const id    = btn.dataset.id;
    const aviso = avisos.find(a => String(a.id_aviso) === String(id));
    if (!aviso) return;

    const modalBody = document.getElementById('modalVerBody');
    modalBody.innerHTML = '<p class="text-muted text-center">Cargando...</p>';

    const remitentePersona = personas.find(p => String(p.id_bombero) === String(aviso.remitente));
    const nombreRemitente = remitentePersona
      ? `${remitentePersona.nombre} ${remitentePersona.apellidos} (${remitentePersona.nombre_usuario})`
      : (aviso.remitente || '—');

    const campos = [
      { label: 'ID',        valor: aviso.id_aviso },
      { label: 'Asunto',    valor: aviso.asunto },
      { label: 'Mensaje',   valor: aviso.mensaje },
      { label: 'Fecha',     valor: formatearFecha(aviso.fecha) },
      { label: 'Remitente', valor: nombreRemitente },
    ];

    modalBody.innerHTML = '';
    campos.forEach(({ label, valor }) => {
      const p = document.createElement('p');
      p.innerHTML = `<strong>${label}:</strong> ${valor ?? ''}`;
      modalBody.appendChild(p);
    });

    try {
      const res     = await AvisoApi.getDestinatarios(id);
      const destList = res.data ?? [];

      modalBody.appendChild(document.createElement('hr'));
      const titulo = document.createElement('p');
      titulo.innerHTML = `<strong>Destinatarios:</strong>`;
      modalBody.appendChild(titulo);

      if (destList.length === 0) {
        const vacio = document.createElement('p');
        vacio.textContent = 'Sin destinatarios asignados';
        vacio.className   = 'text-muted';
        modalBody.appendChild(vacio);
      } else {
        const ul = document.createElement('ul');
        ul.className = 'mb-0';
        destList.forEach(d => {
          const li = document.createElement('li');
          const persona = personas.find(p => String(p.id_bombero) === String(d.id_bombero));
          li.textContent = persona ? `${persona.nombre} ${persona.apellidos}` : d.id_bombero;
          ul.appendChild(li);
        });
        modalBody.appendChild(ul);
      }
    } catch { /* no bloqueamos el modal */ }
  });
}

// ================================
// MODAL ELIMINAR
// ================================
function bindModalEliminar() {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-eliminar');
    if (!btn) return;
    document.getElementById('btnConfirmarEliminar').dataset.id = btn.dataset.id;
  });

  document.getElementById('btnConfirmarEliminar').addEventListener('click', async function () {
    const id = this.dataset.id;
    if (!id) return;

    try {
      const resDest      = await AvisoApi.getDestinatarios(id);
      const destinatarios = resDest.data ?? [];
      for (const d of destinatarios) {
        await AvisoApi.deleteDestinatario(id, d.id_bombero);
      }

      try {
        const resRem   = await AvisoApi.getRemitente(id);
        const remitente = resRem.data;
        if (remitente?.id_bombero) {
          await AvisoApi.deleteRemitente(id, remitente.id_bombero);
        }
      } catch { /* sin remitente, continuamos */ }

      await AvisoApi.remove(id);
      await cargarAvisos();

      bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
      mostrarExito('Aviso eliminado correctamente');

    } catch (error) {
      mostrarError(error.message || 'Error al eliminar el aviso');
    }
  });
}