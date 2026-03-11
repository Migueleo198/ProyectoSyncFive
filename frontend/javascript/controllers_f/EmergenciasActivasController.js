import EmergenciaApi from '../api_f/EmergenciaApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { mostrarError, mostrarExito, formatearFechaHora } from '../helpers/utils.js';
import { validarTelefono, validarIdBombero } from '../helpers/validacion.js';

let emergencias = [];
let sesionActual = null;

document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('emergencias');
  if (!sesionActual) return;

  if (document.getElementById('contenedor-emergencias')) {
    cargarEmergenciasActivas();
    bindEventos();
  }
});

// =================================
// CARGAR EMERGENCIAS ACTIVAS
// CORRECCIÓN: filtrar por 'ACTIVA' (valor del DDL), no 'ABIERTA'
// =================================
async function cargarEmergenciasActivas() {
  const contenedor = document.getElementById('contenedor-emergencias');
  if (!contenedor) return;
  contenedor.innerHTML = '';

  try {
    const response = await EmergenciaApi.getAll();
    emergencias = response.data;

    const activas = emergencias.filter(e => e.estado === 'ACTIVA');

    if (activas.length === 0) {
      contenedor.innerHTML = `
        <div class="alert alert-info">
          No hay emergencias activas actualmente.
        </div>
      `;
      return;
    }

    activas.forEach(e => {
      contenedor.appendChild(crearCard(e));
    });

  } catch (error) {
    mostrarError(error.message || 'Error cargando emergencias activas');
  }
}

// =================================
// CREAR CARD
// =================================
function crearCard(e) {
  const card = document.createElement('div');
  card.className = 'card mb-4 shadow border-danger';

  const puedeEscribir = sesionActual?.puedeEscribir ?? false;

  const botonCerrar = puedeEscribir
    ? `<button 
        class="btn btn-outline-danger btn-sm btn-cerrar"
        data-bs-toggle="modal"
        data-bs-target="#modalCerrarEmergencia"
        data-id="${e.id_emergencia}">
        <i class="bi bi-check-circle"></i> Cerrar emergencia
      </button>`
    : '';

  card.innerHTML = `
    <div class="card-body">
      <div class="row">

        <div class="col-md-5 mb-3 mb-md-0">
          <div class="ratio ratio-16x9 border rounded d-flex align-items-center justify-content-center bg-light">
            <span class="text-muted">Mapa no disponible</span>
          </div>
        </div>

        <div class="col-md-7">
          <div class="d-flex justify-content-between align-items-start">
            <h4 class="text-danger">${e.nombre_tipo}</h4>
            <span class="badge bg-danger">ACTIVA</span>
          </div>

          <p><strong>ID Emergencia:</strong> ${e.id_emergencia}</p>
          <p><strong>Fecha:</strong> ${formatearFechaHora(e.fecha)}</p>
          <p><strong>Dirección:</strong> ${e.direccion ?? ''}</p>
          <p><strong>Solicitante:</strong> ${e.nombre_solicitante ?? 'No informado'}</p>

          <div class="d-flex flex-column gap-2 mt-3" style="max-width: 200px;">
            <button 
              class="btn btn-outline-primary btn-sm btn-ver"
              data-bs-toggle="modal"
              data-bs-target="#modalVerEmergencia"
              data-id="${e.id_emergencia}">
              <i class="bi bi-eye"></i> Ver detalle
            </button>

            ${botonCerrar}
          </div>
        </div>

      </div>
    </div>
  `;

  return card;
}

// =================================
// EVENTOS
// =================================
function bindEventos() {

  // MODAL VER
  document.addEventListener('click', function (e) {
    const btnVer = e.target.closest('.btn-ver');
    if (btnVer) {
      const id = btnVer.dataset.id;
      const emergencia = emergencias.find(em => em.id_emergencia == id);
      if (!emergencia) return;

      const modalBody = document.getElementById('modalVerEmergenciaBody');
      modalBody.innerHTML = '';

      const campos = [
        ['ID Emergencia',      emergencia.id_emergencia],
        ['Fecha',              formatearFechaHora(emergencia.fecha)],
        ['Estado',             emergencia.estado],
        ['Dirección',          emergencia.direccion],
        ['Tipo',               emergencia.nombre_tipo],
        ['ID Bombero',         emergencia.id_bombero],
        ['Nombre Solicitante', emergencia.nombre_solicitante],
        ['Teléfono Solicitante', emergencia.tlf_solicitante ?? 'No informado'],
        ['Descripción',        emergencia.descripcion ?? '']
      ];

      campos.forEach(([nombre, valor]) => {
        const p = document.createElement('p');
        p.innerHTML = `<strong>${nombre}:</strong> ${valor ?? ''}`;
        modalBody.appendChild(p);
      });
    }

    const btnCerrar = e.target.closest('.btn-cerrar');
    if (btnCerrar) {
      document.getElementById('cerrarEmergenciaId').value = btnCerrar.dataset.id;
    }
  });

  if (!sesionActual?.puedeEscribir) return;

  const btnConfirmar = document.getElementById('btnConfirmarCerrarEmergencia');
  if (!btnConfirmar) return;

  btnConfirmar.addEventListener('click', async function () {
    const id = document.getElementById('cerrarEmergenciaId').value;
    if (!id) return;

    try {
      const response = await EmergenciaApi.getById(id);
      const emergencia = response.data;

      // CORRECCIÓN: validar teléfono e id_bombero antes de actualizar
      if (emergencia.tlf_solicitante && !validarTelefono(emergencia.tlf_solicitante)) {
        mostrarError('El teléfono del solicitante registrado no es válido');
        return;
      }
      if (emergencia.id_bombero && !validarIdBombero(emergencia.id_bombero)) {
        mostrarError('El ID del bombero registrado no es válido');
        return;
      }

      const data = {
        fecha:             emergencia.fecha,
        descripcion:       emergencia.descripcion,
        direccion:         emergencia.direccion,
        // CORRECCIÓN: usar 'CERRADA' (valor del DDL)
        estado:            'CERRADA',
        codigo_tipo:       emergencia.codigo_tipo,
        id_bombero:        emergencia.id_bombero,
        nombre_solicitante: emergencia.nombre_solicitante,
        tlf_solicitante:   emergencia.tlf_solicitante
      };

      await EmergenciaApi.update(id, data);
      mostrarExito('Emergencia cerrada correctamente');

      bootstrap.Modal.getInstance(
        document.getElementById('modalCerrarEmergencia')
      ).hide();

      await cargarEmergenciasActivas();
      mostrarEmergenciasHeader();

    } catch (error) {
      mostrarError(error.message || 'Error cerrando emergencia');
    }
  });
}

// =================================
// MOSTRAR CONTADOR EN HEADER
// CORRECCIÓN: filtrar por 'ACTIVA' (valor del DDL)
// =================================
export async function mostrarEmergenciasHeader() {
  try {
    const response = await EmergenciaApi.getAll();
    emergencias = response.data;
    const count = emergencias.filter(e => e.estado === 'ACTIVA').length;
    const el = document.getElementById('header-emergencias-count');
    const icono = document.querySelector('.bi-exclamation-triangle-fill');
    if (!el) return;

    if (count > 0) {
      el.textContent = count;
      el.style.display = 'inline-block';
      icono?.classList.add('alerta-activa');
    } else {
      el.style.display = 'none';
      icono?.classList.remove('alerta-activa');
    }
  } catch (error) {
    console.error('Error cargando emergencias para el header:', error);
  }
}