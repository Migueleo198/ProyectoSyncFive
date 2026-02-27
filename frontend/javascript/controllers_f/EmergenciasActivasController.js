import EmergenciaApi from '../api_f/EmergenciaApi.js';
import { mostrarError, mostrarExito, formatearFechaHora } from '../helpers/utils.js';

let emergencias = []; // almacenamiento global

document.addEventListener('DOMContentLoaded', () => {
  cargarEmergenciasActivas();
  bindEventos();
});

// =================================
// CARGAR EMERGENCIAS ACTIVAS
// =================================
async function cargarEmergenciasActivas() {

  const contenedor = document.getElementById('contenedor-emergencias');
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

          <div class="d-flex gap-2 mt-3">
            <button 
              class="btn btn-outline-primary btn-sm btn-ver"
              data-bs-toggle="modal"
              data-bs-target="#modalVerEmergencia"
              data-id="${e.id_emergencia}">
              <i class="bi bi-eye"></i> Ver detalle
            </button>

            <button 
              class="btn btn-outline-danger btn-sm btn-cerrar"
              data-bs-toggle="modal"
              data-bs-target="#modalCerrarEmergencia"
              data-id="${e.id_emergencia}">
              <i class="bi bi-check-circle"></i> Cerrar emergencia
            </button>
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

  // =============================
  // MODAL VER
  // =============================
  document.addEventListener('click', function (e) {

    const btnVer = e.target.closest('.btn-ver');
    if (btnVer) {
      const id = btnVer.dataset.id;
      const emergencia = emergencias.find(em => em.id_emergencia == id);
      if (!emergencia) return;

      const modalBody = document.getElementById('modalVerEmergenciaBody');
      modalBody.innerHTML = '';

      const campos = [
        ['ID Emergencia', emergencia.id_emergencia],
        ['Fecha', formatearFechaHora(emergencia.fecha)],
        ['Estado', emergencia.estado],
        ['Dirección', emergencia.direccion],
        ['Tipo', emergencia.nombre_tipo],
        ['ID Bombero', emergencia.id_bombero],
        ['Nombre Solicitante', emergencia.nombre_solicitante],
        ['Teléfono Solicitante', emergencia.tlf_solicitante ?? 'No informado'],
        ['Descripción', emergencia.descripcion ?? '']
      ];

      campos.forEach(([nombre, valor]) => {
        const p = document.createElement('p');
        p.innerHTML = `<strong>${nombre}:</strong> ${valor ?? ''}`;
        modalBody.appendChild(p);
      });
    }

    // =============================
    // ABRIR MODAL CERRAR
    // =============================
    const btnCerrar = e.target.closest('.btn-cerrar');
    if (btnCerrar) {
      const id = btnCerrar.dataset.id;
      document.getElementById('cerrarEmergenciaId').value = id;
    }

  });

  // =============================
  // CONFIRMAR CIERRE
  // =============================
  document
  .getElementById('btnConfirmarCerrarEmergencia')
  .addEventListener('click', async function () {

    const id = document.getElementById('cerrarEmergenciaId').value;
    if (!id) return;

    try {

      // 1️⃣ Obtener datos actuales
      const response = await EmergenciaApi.getById(id);
      const emergencia = response.data;

      // 2️⃣ Construir objeto completo
      const data = {
        fecha: emergencia.fecha,
        descripcion: emergencia.descripcion,
        direccion: emergencia.direccion,
        estado: 'CERRADA',
        codigo_tipo: emergencia.codigo_tipo,
        id_bombero: emergencia.id_bombero,
        nombre_solicitante: emergencia.nombre_solicitante,
        tlf_solicitante: emergencia.tlf_solicitante
      };

      // 3️⃣ Enviar update completo
      await EmergenciaApi.update(id, data);

      mostrarExito('Emergencia cerrada correctamente');

      const modal = bootstrap.Modal.getInstance(
        document.getElementById('modalCerrarEmergencia')
      );
      modal.hide();

      await cargarEmergenciasActivas();

    } catch (error) {
      mostrarError(error.message || 'Error cerrando emergencia');
    }
  });
}