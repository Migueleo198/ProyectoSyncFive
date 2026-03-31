import EmergenciaApi from '../api_f/EmergenciaApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { mostrarError, mostrarExito, formatearFechaHora } from '../helpers/utils.js';
import { validarTelefono, validarIdBombero } from '../helpers/validacion.js';

let emergencias  = [];
let sesionActual = null;

// =============================================================================
// CARGA DINÁMICA DE LEAFLET
// =============================================================================
function cargarLeaflet() {
  return new Promise((resolve) => {
    if (window.L) { resolve(); return; }

    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script   = document.createElement('script');
    script.src     = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload  = resolve;
    document.head.appendChild(script);
  });
}

// =============================================================================
// ARRANQUE
// =============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  sesionActual = await authGuard('emergencias');
  if (!sesionActual) return;

  // Leaflet y detección de ciudad en paralelo para no perder tiempo
  await Promise.all([
    cargarLeaflet(),
    detectarCiudadBase()
  ]);

  if (document.getElementById('contenedor-emergencias')) {
    cargarEmergenciasActivas();
    bindEventos();
  }
});

// =============================================================================
// GEOCODIFICACIÓN  (Nominatim – sin API key, respeta 1 req/s)
// =============================================================================

// Fallback mientras el navegador resuelve la ubicación (o si la deniega)
let CIUDAD_BASE = 'España';

// ── Detecta la ciudad automáticamente por geolocalización del navegador ───────
async function detectarCiudadBase() {
  return new Promise((resolve) => {

    if (!navigator.geolocation) {
      console.warn('[Geocoder] Geolocalización no soportada por el navegador');
      resolve();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const url  = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`;
          const res  = await fetch(url, { headers: { 'User-Agent': 'EmergenciasApp/1.0' } });
          const data = await res.json();

          const ciudad = data.address?.city
                      ?? data.address?.town
                      ?? data.address?.village
                      ?? data.address?.county
                      ?? null;

          const pais = data.address?.country ?? 'España';

          if (ciudad) {
            CIUDAD_BASE = `${ciudad}, ${pais}`;
            console.info(`[Geocoder] Ciudad base detectada: ${CIUDAD_BASE}`);
          } else {
            CIUDAD_BASE = pais;
            console.warn('[Geocoder] No se pudo determinar ciudad, usando país como base');
          }
        } catch {
          console.warn('[Geocoder] Error en reverse geocoding, usando fallback');
        }
        resolve();
      },
      (err) => {
        // Usuario denegó permiso o timeout → se queda 'España' como fallback
        console.warn(`[Geocoder] Geolocalización denegada (${err.message}), usando fallback`);
        resolve();
      },
      { timeout: 5000, maximumAge: 60_000 } // cachea posición 1 min, no pide permiso cada vez
    );
  });
}

const geocodeCache = {};
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Normaliza abreviaturas comunes en direcciones españolas ──────────────────
function normalizarDireccion(dir) {
  if (!dir) return dir;
  return dir
    .replace(/\bC\.\s*/gi,      'Calle ')
    .replace(/\bC\/\s*/gi,      'Calle ')
    .replace(/\bAvda?\.\s*/gi,  'Avenida ')
    .replace(/\bAv\.\s*/gi,     'Avenida ')
    .replace(/\bPza?\.\s*/gi,   'Plaza ')
    .replace(/\bPl\.\s*/gi,     'Plaza ')
    .replace(/\bCtra?\.\s*/gi,  'Carretera ')
    .replace(/\bUrb\.\s*/gi,    'Urbanización ')
    .replace(/\bPaseo\b/gi,     'Paseo')
    .replace(/\bPº\s*/gi,       'Paseo ')
    .replace(/\bBda?\.\s*/gi,   'Barriada ')
    .replace(/\bPol\.\s*/gi,    'Polígono ')
    .replace(/\bR\.\s*/gi,      'Ronda ')
    .replace(/\s{2,}/g,         ' ')
    .trim();
}

// ── Petición individual a Nominatim ─────────────────────────────────────────
async function fetchNominatim(query) {
  try {
    const url  = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&accept-language=es`;
    const res  = await fetch(url, { headers: { 'User-Agent': 'EmergenciasApp/1.0' } });
    const data = await res.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

// ── Geocodificación con fallback en cascada ──────────────────────────────────
async function geocodificar(direccion) {
  if (!direccion) return null;
  if (geocodeCache[direccion] !== undefined) return geocodeCache[direccion];

  const normalizada = normalizarDireccion(direccion);

  // Intentos de más específico a más genérico
  const intentos = [
    `${normalizada}, ${CIUDAD_BASE}`,  // 1º normalizada + ciudad detectada
    `${direccion}, ${CIUDAD_BASE}`,    // 2º original + ciudad (por si normalización empeora)
    normalizada,                       // 3º solo normalizada sin ciudad
    direccion,                         // 4º tal cual viene de BD
  ];

  for (let i = 0; i < intentos.length; i++) {
    if (i > 0) await sleep(1100); // respetar rate-limit entre intentos
    const coords = await fetchNominatim(intentos[i]);
    if (coords) {
      geocodeCache[direccion] = coords;
      console.info(`[Geocoder] Encontrado en intento ${i + 1}: "${intentos[i]}"`);
      return coords;
    }
  }

  console.warn(`[Geocoder] No se pudo geolocalizar: "${direccion}"`);
  geocodeCache[direccion] = null; // evitar reintentos fallidos en la misma sesión
  return null;
}

// =============================================================================
// CARGAR EMERGENCIAS ACTIVAS
// =============================================================================
async function cargarEmergenciasActivas() {
  const contenedor = document.getElementById('contenedor-emergencias');
  if (!contenedor) return;
  contenedor.innerHTML = '';

  try {
    const response = await EmergenciaApi.getAll();
    emergencias    = response.data;

    const activas = emergencias.filter(e => e.estado === 'ACTIVA');

    if (activas.length === 0) {
      contenedor.innerHTML = `
        <div class="alert alert-info">
          No hay emergencias activas actualmente.
        </div>`;
      return;
    }

    // Creamos las cards y cargamos los mapas respetando el rate-limit de Nominatim
    for (let i = 0; i < activas.length; i++) {
      const card = crearCard(activas[i]);
      contenedor.appendChild(card);

      if (i > 0) await sleep(1100);
      await inicializarMapa(activas[i]);
    }

  } catch (error) {
    mostrarError(error.message || 'Error cargando emergencias activas');
  }
}

// =============================================================================
// INICIALIZAR MAPA para una emergencia concreta
// =============================================================================
async function inicializarMapa(e) {
  const divMapa = document.getElementById(`mapa-${e.id_emergencia}`);
  if (!divMapa) return;

  const coords = await geocodificar(e.direccion);

  if (!coords) {
    // Nominatim no pudo geocodificar → fallback a Google Maps embed (sin API key)
    // Google Maps es más tolerante con direcciones ambiguas
    divMapa.innerHTML = `
      <iframe
        src="https://maps.google.com/maps?q=${encodeURIComponent(e.direccion + ', ' + CIUDAD_BASE)}&output=embed&hl=es"
        width="100%" height="100%"
        style="border:0; border-radius:inherit;"
        allowfullscreen
        loading="lazy">
      </iframe>`;
    return;
  }

  divMapa.dataset.lat = coords.lat;
  divMapa.dataset.lng = coords.lng;

  const map = L.map(divMapa, { zoomControl: true, scrollWheelZoom: false })
               .setView([coords.lat, coords.lng], 16);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map);

  // Marcador rojo personalizado
  const iconoRojo = L.divIcon({
    className: '',
    html: `<div style="
      width:32px; height:32px; background:#dc3545; border-radius:50% 50% 50% 0;
      transform:rotate(-45deg); border:3px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,.4);">
    </div>`,
    iconSize:   [32, 32],
    iconAnchor: [16, 32],
    popupAnchor:[0, -34]
  });

  L.marker([coords.lat, coords.lng], { icon: iconoRojo })
   .addTo(map)
   .bindPopup(`<strong>${e.nombre_tipo}</strong><br>${e.direccion}`)
   .openPopup();

  // Actualizar botón "Cómo llegar" con coordenadas reales
  const btnLlegar = document.getElementById(`btn-llegar-${e.id_emergencia}`);
  if (btnLlegar) {
    btnLlegar.href = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
  }
}

// =============================================================================
// CREAR CARD
// =============================================================================
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

  // href provisional con texto; se actualiza cuando Nominatim responde
  const urlLlegarProvisional = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(e.direccion ?? '')}`;

  card.innerHTML = `
    <div class="card-body">
      <div class="row">

        <!-- ── MAPA ── -->
        <div class="col-md-5 mb-3 mb-md-0">
          <div
            id="mapa-${e.id_emergencia}"
            class="border rounded"
            style="height:220px; background:#e9ecef;">
            <div class="d-flex align-items-center justify-content-center h-100 text-muted small">
              <div class="spinner-border spinner-border-sm me-2" role="status"></div>
              Cargando mapa…
            </div>
          </div>

          <a
            id="btn-llegar-${e.id_emergencia}"
            href="${urlLlegarProvisional}"
            target="_blank"
            class="btn btn-success btn-sm w-100 mt-2">
            <i class="bi bi-geo-alt-fill"></i> Cómo llegar
          </a>
        </div>

        <!-- ── INFO ── -->
        <div class="col-md-7">
          <div class="d-flex justify-content-between align-items-start">
            <h4 class="text-danger">${e.nombre_tipo}</h4>
            <span class="badge bg-danger">ACTIVA</span>
          </div>

          <p><strong>ID Emergencia:</strong> ${e.id_emergencia}</p>
          <p><strong>Fecha:</strong> ${formatearFechaHora(e.fecha)}</p>
          <p><strong>Dirección:</strong> ${e.direccion ?? ''}</p>
          <p><strong>Solicitante:</strong> ${e.nombre_solicitante ?? 'No informado'}</p>

          <div class="d-flex flex-column gap-2 mt-3" style="max-width:200px;">
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

// =============================================================================
// EVENTOS
// =============================================================================
function bindEventos() {

  document.addEventListener('click', function (e) {

    // ── Modal VER detalle ──────────────────────────────────────────────────
    const btnVer = e.target.closest('.btn-ver');
    if (btnVer) {
      const id         = btnVer.dataset.id;
      const emergencia = emergencias.find(em => em.id_emergencia == id);
      if (!emergencia) return;

      const modalBody = document.getElementById('modalVerEmergenciaBody');
      modalBody.innerHTML = '';

      const campos = [
        ['ID Emergencia',        emergencia.id_emergencia],
        ['Fecha',                formatearFechaHora(emergencia.fecha)],
        ['Estado',               emergencia.estado],
        ['Dirección',            emergencia.direccion],
        ['Tipo',                 emergencia.nombre_tipo],
        ['ID Bombero',           emergencia.id_bombero],
        ['Nombre Solicitante',   emergencia.nombre_solicitante],
        ['Teléfono Solicitante', emergencia.tlf_solicitante ?? 'No informado'],
        ['Descripción',          emergencia.descripcion ?? '']
      ];

      campos.forEach(([nombre, valor]) => {
        const p = document.createElement('p');
        p.innerHTML = `<strong>${nombre}:</strong> ${valor ?? ''}`;
        modalBody.appendChild(p);
      });

      // Mini-mapa dentro del modal (reutiliza caché, no hace nueva petición)
      const divMapaMini = document.createElement('div');
      divMapaMini.id    = `mapa-modal-${id}`;
      divMapaMini.style.cssText = 'height:200px; border-radius:8px; margin-top:12px;';
      modalBody.appendChild(divMapaMini);

      // Leaflet necesita que el contenedor sea visible para calcular dimensiones
      const modal = document.getElementById('modalVerEmergencia');
      modal.addEventListener('shown.bs.modal', async function handler() {
        modal.removeEventListener('shown.bs.modal', handler);

        const coords = await geocodificar(emergencia.direccion);
        if (!coords) {
          // Fallback a Google Maps embed si Nominatim no resuelve
          divMapaMini.innerHTML = `
            <iframe
              src="https://maps.google.com/maps?q=${encodeURIComponent(emergencia.direccion + ', ' + CIUDAD_BASE)}&output=embed&hl=es"
              width="100%" height="100%"
              style="border:0; border-radius:8px;"
              allowfullscreen
              loading="lazy">
            </iframe>`;
          return;
        }

        const mapModal = L.map(divMapaMini).setView([coords.lat, coords.lng], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 19
        }).addTo(mapModal);
        L.marker([coords.lat, coords.lng]).addTo(mapModal);
      });
    }

    // ── Modal CERRAR ───────────────────────────────────────────────────────
    const btnCerrar = e.target.closest('.btn-cerrar');
    if (btnCerrar) {
      document.getElementById('cerrarEmergenciaId').value = btnCerrar.dataset.id;
    }
  });

  // ── Confirmar cierre ───────────────────────────────────────────────────────
  if (!sesionActual?.puedeEscribir) return;

  const btnConfirmar = document.getElementById('btnConfirmarCerrarEmergencia');
  if (!btnConfirmar) return;

  btnConfirmar.addEventListener('click', async function () {
    const id = document.getElementById('cerrarEmergenciaId').value;
    if (!id) return;

    try {
      const response   = await EmergenciaApi.getById(id);
      const emergencia = response.data;

      if (emergencia.tlf_solicitante && !validarTelefono(emergencia.tlf_solicitante)) {
        mostrarError('El teléfono del solicitante registrado no es válido');
        return;
      }
      if (emergencia.id_bombero && !validarIdBombero(emergencia.id_bombero)) {
        mostrarError('El ID del bombero registrado no es válido');
        return;
      }

      const data = {
        fecha:              emergencia.fecha,
        descripcion:        emergencia.descripcion,
        direccion:          emergencia.direccion,
        estado:             'CERRADA',
        codigo_tipo:        emergencia.codigo_tipo,
        id_bombero:         emergencia.id_bombero,
        nombre_solicitante: emergencia.nombre_solicitante,
        tlf_solicitante:    emergencia.tlf_solicitante
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

// =============================================================================
// CONTADOR EN HEADER
// =============================================================================
export async function mostrarEmergenciasHeader() {
  try {
    const response = await EmergenciaApi.getAll();
    emergencias    = response.data;
    const count    = emergencias.filter(e => e.estado === 'ACTIVA').length;
    const el       = document.getElementById('header-emergencias-count');
    const icono    = document.querySelector('.bi-exclamation-triangle-fill');
    if (!el) return;

    if (count > 0) {
      el.textContent   = count;
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