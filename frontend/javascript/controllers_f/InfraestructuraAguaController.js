import InfraestructuraAguaApi from '../api_f/InfraestructuraAguaApi.js';
import { mostrarError, mostrarExito } from '../helpers/utils.js';

// ─── Estado ────────────────────────────────────────────────────────────────
let todasLasInfraestructuras = [];

// ─── Init ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  cargarInfraestructuras();
  bindFiltros();
  bindCrear();
});


// ============================================================
// MAPA
// ============================================================

let mapa = null;
let marcadores = [];

function renderMapa(lista, vehiculos = []) {
  if (!mapa) {
    mapa = L.map('mapaInfraestructuras').setView([41.65, -0.87], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapa);
  }

  marcadores.forEach(m => mapa.removeLayer(m));
  marcadores = [];

  const coordsVistas = new Set();

  // — Infraestructuras —
  lista.forEach(item => {
    if (!item.latitud || !item.longitud) return;
    const clave = `${item.latitud},${item.longitud}`;
    if (coordsVistas.has(clave)) return;
    coordsVistas.add(clave);

    const emojiInfra = item.tipo === 'HIDRANTE' ? '💧' : '🌿';

    const iconoInfra = L.divIcon({
      html: `<span style="font-size:22px">${emojiInfra}</span>`,
      className: '',
    iconSize: [30, 30],
    iconAnchor: [18, 18],
    });

    const popup = `
      <strong>${emojiInfra} ${item.codigo}</strong><br>
      ${item.denominacion ?? '—'}<br>
      ${item.municipio} (${item.provincia})<br>
      Estado: <strong>${item.estado}</strong>
    `;

    marcadores.push(
      L.marker([item.latitud, item.longitud], { icon: iconoInfra })
        .bindPopup(popup)
        .addTo(mapa)
    );
  });

  // — Vehículos —
  const iconoVehiculo = L.divIcon({
    html: '<span style="font-size:22px">🚒</span>',
    className: '',
    iconSize: [30, 30],
    iconAnchor: [18, 18],
  });

  vehiculos.forEach(v => {
    if (!v.ult_latitud || !v.ult_longitud) return;
    const disponible = v.disponibilidad ? '✅ Disponible' : '🔴 No disponible';
    const popup = `
      <strong>🚒 ${v.nombre}</strong><br>
      Matrícula: <strong>${v.matricula}</strong><br>
      ${v.marca} ${v.modelo}<br>
      Tipo: ${v.tipo}<br>
      ${disponible}
    `;
    marcadores.push(
      L.marker([v.ult_latitud, v.ult_longitud], { icon: iconoVehiculo })
        .bindPopup(popup)
        .addTo(mapa)
    );
  });
}
  

// ============================================================
// CARGA Y RENDER DE TABLA
// ============================================================

async function cargarInfraestructuras(filtros = {}) {
  try {
    const [respInfra, respVehiculos] = await Promise.all([
      InfraestructuraAguaApi.getAll(filtros),
      InfraestructuraAguaApi.getVehiculos(),
    ]);

    todasLasInfraestructuras = respInfra.data;
    renderTabla(todasLasInfraestructuras);
    actualizarContadores(todasLasInfraestructuras);
    renderMapa(todasLasInfraestructuras, respVehiculos.data);
  } catch (e) {
    mostrarError(e.message || 'Error cargando datos');
  }
}

function renderTabla(lista) {
  const tbody = document.querySelector('#tablaInfraestructuras tbody');
  tbody.innerHTML = '';

  if (lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted py-4">
          No se encontraron resultados
        </td>
      </tr>`;
    return;
  }

  lista.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${item.codigo}</td>
      <td>
        <span class="badge ${item.tipo === 'HIDRANTE' ? 'bg-primary' : 'bg-purple'}">
          ${item.tipo === 'HIDRANTE' ? '💧 Hidrante' : '🌿 Boca de riego'}
        </span>
      </td>
      <td>${item.codigo}</td>
      <td class="d-none d-md-table-cell">${item.denominacion ?? '—'}</td>
      <td>${item.municipio}</td>
      <td class="d-none d-lg-table-cell">${item.provincia}</td>
      <td>
        <span class="badge ${estadoBadge(item.estado)}">
          ${item.estado}
        </span>
      </td>
      <td class="d-flex justify-content-around">
        <button type="button"
                class="btn p-0 btn-ver"
                data-bs-toggle="modal"
                data-bs-target="#modalVer"
                data-codigo="${item.codigo}">
          <i class="bi bi-eye"></i>
        </button>
        <button type="button"
                class="btn p-0 btn-editar"
                data-bs-toggle="modal"
                data-bs-target="#modalEditar"
                data-codigo="${item.codigo}">
          <i class="bi bi-pencil"></i>
        </button>
        <button type="button"
          class="btn p-0 btn-eliminar"
          data-id="${item.codigo}"
          data-codigo="${item.codigo}">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function estadoBadge(estado) {
  switch (estado) {
    case 'ACTIVO':        return 'bg-success';
    case 'AVERIA':        return 'bg-warning text-dark';
    case 'FUERA_SERVICIO':return 'bg-secondary';
    case 'RETIRADO':      return 'bg-danger';
    default:              return 'bg-secondary';
  }
}

function actualizarContadores(lista) {
  const total    = lista.length;
  const hidrant  = lista.filter(i => i.tipo === 'HIDRANTE').length;
  const bocas    = lista.filter(i => i.tipo === 'BOCA_RIEGO').length;
  const activos  = lista.filter(i => i.estado === 'ACTIVO').length;

  const set = (codigo, val) => { const el = document.getElementById(codigo); if (el) el.textContent = val; };
  set('cntTotal',    total);
  set('cntHidrante', hidrant);
  set('cntBoca',     bocas);
  set('cntActivos',  activos);
}


// ============================================================
// FILTROS
// ============================================================

function bindFiltros() {
  const btnFiltrar = document.getElementById('btnFiltrar');
  const btnLimpiar = document.getElementById('btnLimpiar');

  if (btnFiltrar) {
    btnFiltrar.addEventListener('click', () => {
      const filtros = leerFiltros();
      cargarInfraestructuras(filtros);
    });
  }

  if (btnLimpiar) {
    btnLimpiar.addEventListener('click', () => {
      ['filtroTipo', 'filtroProvincia', 'filtroMunicipio', 'filtroEstado'].forEach(codigo => {
        const el = document.getElementById(codigo);
        if (el) el.value = '';
      });
      cargarInfraestructuras();
    });
  }

  // Filtro en tiempo real en el campo municipio (búsqueda local sin petición)
  const filtroMun = document.getElementById('filtroMunicipio');
  if (filtroMun) {
    filtroMun.addEventListener('input', () => {
      const texto = filtroMun.value.toLowerCase().trim();
      if (texto.length === 0) {
        renderTabla(todasLasInfraestructuras);
        return;
      }
      const filtradas = todasLasInfraestructuras.filter(
        i => i.municipio.toLowerCase().includes(texto)
      );
      renderTabla(filtradas);
    });
  }
}

function leerFiltros() {
  return {
    tipo:      document.getElementById('filtroTipo')?.value      || '',
    provincia: document.getElementById('filtroProvincia')?.value || '',
    municipio: document.getElementById('filtroMunicipio')?.value || '',
    estado:    document.getElementById('filtroEstado')?.value    || '',
  };
}


// ============================================================
// MODAL VER
// ============================================================

document.addEventListener('click', async function (e) {
  const btn = e.target.closest('.btn-ver');
  if (!btn) return;

  const codigo   = btn.dataset.codigo;
  const item = todasLasInfraestructuras.find(i => i.codigo == codigo);
  if (!item) return;

  const body = document.getElementById('modalVerBody');
  body.innerHTML = `
    <table class="table table-sm table-bordered mb-0">
      <tr><th class="table-secondary">Código</th><td>${item.codigo}</td></tr>
      <tr><th class="table-secondary">Tipo</th>
          <td>
            <span class="badge ${item.tipo === 'HIDRANTE' ? 'bg-primary' : 'bg-purple'}">
              ${item.tipo === 'HIDRANTE' ? '💧 Hidrante' : '🌿 Boca de riego'}
            </span>
          </td>
      </tr>
      <tr><th class="table-secondary">Denominación</th><td>${item.denominacion ?? '—'}</td></tr>
      <tr><th class="table-secondary">Municipio</th><td>${item.municipio}</td></tr>
      <tr><th class="table-secondary">Provincia</th><td>${item.provincia}</td></tr>
      <tr><th class="table-secondary">Latitud</th><td>${item.latitud}</td></tr>
      <tr><th class="table-secondary">Longitud</th><td>${item.longitud}</td></tr>
      <tr><th class="table-secondary">Estado</th>
          <td><span class="badge ${estadoBadge(item.estado)}">${item.estado}</span></td>
      </tr>
    </table>
  `;
});


// ============================================================
// MODAL EDITAR
// ============================================================

document.addEventListener('click', async function (e) {
  const btn = e.target.closest('.btn-editar');
  if (!btn) return;

  const codigo   = btn.dataset.codigo;
  const item = todasLasInfraestructuras.find(i => i.codigo == codigo);
  if (!item) return;

  const form = document.getElementById('formEditar');
  form.innerHTML = `
    <div class="row mb-3">
      <div class="col-md-4">
        <label class="form-label">Código *</label>
        <input type="text" class="form-control" name="codigo" value="${item.codigo}" required>
      </div>
      <div class="col-md-4">
        <label class="form-label">Tipo *</label>
        <select class="form-select" name="tipo">
          <option value="HIDRANTE"   ${item.tipo === 'HIDRANTE'   ? 'selected' : ''}>💧 Hidrante</option>
          <option value="BOCA_RIEGO" ${item.tipo === 'BOCA_RIEGO' ? 'selected' : ''}>🌿 Boca de riego</option>
        </select>
      </div>
      <div class="col-md-4">
        <label class="form-label">Estado *</label>
        <select class="form-select" name="estado">
          <option value="ACTIVO"         ${item.estado === 'ACTIVO'         ? 'selected' : ''}>Activo</option>
          <option value="AVERIA"         ${item.estado === 'AVERIA'         ? 'selected' : ''}>Avería</option>
          <option value="FUERA_SERVICIO" ${item.estado === 'FUERA_SERVICIO' ? 'selected' : ''}>Fuera de servicio</option>
          <option value="RETIRADO"       ${item.estado === 'RETIRADO'       ? 'selected' : ''}>Retirado</option>
        </select>
      </div>
    </div>

    <div class="row mb-3">
      <div class="col-md-6">
        <label class="form-label">Municipio *</label>
        <input type="text" class="form-control" name="municipio" value="${item.municipio}" required>
      </div>
      <div class="col-md-6">
        <label class="form-label">Provincia *</label>
        <select class="form-select" name="provincia">
          <option value="TERUEL"   ${item.provincia === 'TERUEL'   ? 'selected' : ''}>Teruel</option>
          <option value="ZARAGOZA" ${item.provincia === 'ZARAGOZA' ? 'selected' : ''}>Zaragoza</option>
          <option value="HUESCA"   ${item.provincia === 'HUESCA'   ? 'selected' : ''}>Huesca</option>
        </select>
      </div>
    </div>

    <div class="row mb-3">
      <div class="col-md-6">
        <label class="form-label">Denominación</label>
        <input type="text" class="form-control" name="denominacion" value="${item.denominacion ?? ''}">
      </div>
      <div class="col-md-3">
        <label class="form-label">Latitud *</label>
        <input type="number" step="0.000001" class="form-control" name="latitud" value="${item.latitud}" required>
      </div>
      <div class="col-md-3">
        <label class="form-label">Longitud *</label>
        <input type="number" step="0.000001" class="form-control" name="longitud" value="${item.longitud}" required>
      </div>
    </div>

    <div class="text-center">
      <button type="button" id="btnGuardarCambios" class="btn btn-primary">
        Guardar cambios
      </button>
    </div>
  `;

  document.getElementById('btnGuardarCambios').addEventListener('click', async () => {
    const data = {};
    ['codigo', 'tipo', 'estado', 'municipio', 'provincia', 'denominacion', 'latitud', 'longitud']
      .forEach(campo => {
        const el = form.querySelector(`[name="${campo}"]`);
        if (el) data[campo] = el.value;
      });

    try {
      await InfraestructuraAguaApi.update(item.codigo, data);
      mostrarExito('Infraestructura actualizada correctamente');
      await cargarInfraestructuras();

      const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditar'));
      modal.hide();
    } catch (err) {
      mostrarError(err.message || 'Error al actualizar');
    }
  });
});


// ============================================================
// ELIMINAR
// ============================================================

document.addEventListener('click', async function (e) {
  const btn = e.target.closest('.btn-eliminar');
  if (!btn) return;

  const codigo = btn.dataset.codigo;

  if (!confirm(`¿Eliminar la infraestructura "${codigo}"?`)) return;

  try {
    await InfraestructuraAguaApi.delete(codigo);
    mostrarExito('Infraestructura eliminada correctamente');
    await cargarInfraestructuras();
  } catch (err) {
    mostrarError(err.message || 'Error al eliminar');
  }
});


// ============================================================
// CREAR
// ============================================================

function bindCrear() {
  const form = document.getElementById('formCrear');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f    = new FormData(form);
    const data = {
      codigo:       f.get('codigo'),
      tipo:         f.get('tipo'),
      denominacion: f.get('denominacion') || null,
      municipio:    f.get('municipio'),
      provincia:    f.get('provincia'),
      latitud:      f.get('latitud'),
      longitud:     f.get('longitud'),
      estado:       f.get('estado') || 'ACTIVO',
    };

    try {
      await InfraestructuraAguaApi.create(data);
      mostrarExito('Infraestructura creada correctamente');
      form.reset();
      await cargarInfraestructuras();

      const modal = bootstrap.Modal.getInstance(document.getElementById('modalCrear'));
      if (modal) modal.hide();
    } catch (err) {
      mostrarError(err.message || 'Error al crear infraestructura');
    }
  });
}