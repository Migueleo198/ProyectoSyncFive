import InfraestructuraAguaApi from '../api_f/InfraestructuraAguaApi.js';
import { mostrarError, mostrarExito } from '../helpers/utils.js';
import { validarCheck } from '../helpers/validacion.js';
import { PaginationHelper, showTableLoading } from '../helpers/PaginationHelper.js';

// ================================
// CONSTANTES
// Según DDL Infraestructuras_Agua:
//   codigo       VARCHAR(10)  PK
//   tipo         ENUM('HIDRANTE','BOCA_RIEGO') NOT NULL
//   municipio    VARCHAR(100) NOT NULL
//   provincia    ENUM('HUESCA','ZARAGOZA','TERUEL') NOT NULL
//   latitud      DECIMAL(9,6) NOT NULL  — rango válido: -90 a 90
//   longitud     DECIMAL(9,6) NOT NULL  — rango válido: -180 a 180
//   estado       ENUM('ACTIVO','AVERIA','SECO','FUERA_SERVICIO','RETIRADO') NOT NULL
//   denominacion VARCHAR(150) nullable
// ================================
const TIPOS_VALIDOS     = ['HIDRANTE', 'BOCA_RIEGO'];
const PROVINCIAS_VALIDAS = ['HUESCA', 'ZARAGOZA', 'TERUEL'];
const ESTADOS_VALIDOS   = ['ACTIVO', 'AVERIA', 'SECO', 'FUERA_SERVICIO', 'RETIRADO'];

// ─── Estado ────────────────────────────────────────────────────────────────
let todasLasInfraestructuras = [];
const pagination = new PaginationHelper(15);
pagination.setLoadingCallback((isLoading) => {
    if (isLoading) {
        showTableLoading('#tablaInfraestructuras tbody', 8);
    }
});

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

    const emojiInfra = item.tipo === 'HIDRANTE' ? '💧' : '🚰';

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

    // Manejar diferentes formatos de respuesta
    todasLasInfraestructuras = respInfra?.data || respInfra || [];
    const vehiculos = respVehiculos?.data || respVehiculos || [];
    
    pagination.setData(todasLasInfraestructuras, () => renderTabla(todasLasInfraestructuras));
    pagination.render('pagination-infraestructura');
    renderTabla(todasLasInfraestructuras);
    actualizarContadores(todasLasInfraestructuras, vehiculos);    
    renderMapa(todasLasInfraestructuras, vehiculos);
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

  const itemsPagina = pagination.getPageItems(lista);

  itemsPagina.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${item.codigo}</td>
      <td>
        <span class="badge ${item.tipo === 'HIDRANTE' ? 'bg-primary' : 'bg-primary bg-opacity-50'}">
          ${item.tipo === 'HIDRANTE' ? '💧 Hidrante' : '🚰 Boca de riego'}
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
      <td class="celda-acciones">
        <div class="acciones-tabla">
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
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function estadoBadge(estado) {
  switch (estado) {
    case 'ACTIVO':         return 'bg-success';
    case 'AVERIA':         return 'bg-warning text-dark';
    case 'SECO':           return 'bg-info text-dark';
    case 'FUERA_SERVICIO': return 'bg-secondary';
    case 'RETIRADO':       return 'bg-danger';
    default:               return 'bg-secondary';
  }
}

function actualizarContadores(lista, vehiculos = []) {
  const total    = lista.length;
  const hidrant  = lista.filter(i => i.tipo === 'HIDRANTE').length;
  const bocas    = lista.filter(i => i.tipo === 'BOCA_RIEGO').length;
  const activos  = lista.filter(i => i.estado === 'ACTIVO').length;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('cntHidrante', hidrant);
  set('cntBoca',     bocas);
  set('cntVehiculo', vehiculos.length);
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
pagination.setData(todasLasInfraestructuras, () => {
      renderTabla(todasLasInfraestructuras);
    });
        pagination.render('pagination-infraestructura');
        renderTabla(todasLasInfraestructuras);
        return;
      }
      const filtrados = todasLasInfraestructuras.filter(i => i.municipio.toLowerCase().includes(texto));
      pagination.setData(filtrados, () => {
      renderTabla(filtrados);
    });
      pagination.render('pagination-infraestructura');
      renderTabla(filtrados);
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
// VALIDAR INFRAESTRUCTURA
// Según DDL Infraestructuras_Agua:
//   codigo       VARCHAR(10)  NOT NULL PK
//   tipo         ENUM('HIDRANTE','BOCA_RIEGO') NOT NULL
//   municipio    VARCHAR(100) NOT NULL
//   provincia    ENUM('HUESCA','ZARAGOZA','TERUEL') NOT NULL
//   latitud      DECIMAL(9,6) NOT NULL  rango [-90, 90]
//   longitud     DECIMAL(9,6) NOT NULL  rango [-180, 180]
//   estado       ENUM('ACTIVO','AVERIA','SECO','FUERA_SERVICIO','RETIRADO') NOT NULL
//   denominacion VARCHAR(150) nullable
// ============================================================
function validarInfraestructura(data) {
  if (!data.codigo || !data.codigo.trim()) {
    mostrarError('El código es obligatorio.');
    return false;
  }
  if (data.codigo.trim().length > 10) {
    mostrarError('El código no puede superar los 10 caracteres.');
    return false;
  }

  if (!validarCheck(data.tipo, TIPOS_VALIDOS)) {
    mostrarError('El tipo no es válido. Debe ser HIDRANTE o BOCA_RIEGO.');
    return false;
  }

  if (!data.municipio || !data.municipio.trim()) {
    mostrarError('El municipio es obligatorio.');
    return false;
  }
  if (data.municipio.trim().length > 100) {
    mostrarError('El municipio no puede superar los 100 caracteres.');
    return false;
  }

  if (!validarCheck(data.provincia, PROVINCIAS_VALIDAS)) {
    mostrarError('La provincia no es válida. Debe ser HUESCA, ZARAGOZA o TERUEL.');
    return false;
  }

  // Latitud: DECIMAL(9,6) NOT NULL — rango geográfico [-90, 90]
  const lat = parseFloat(data.latitud);
  if (isNaN(lat)) {
    mostrarError('La latitud es obligatoria y debe ser un número.');
    return false;
  }
  if (lat < -90 || lat > 90) {
    mostrarError('La latitud debe estar entre -90 y 90.');
    return false;
  }

  // Longitud: DECIMAL(9,6) NOT NULL — rango geográfico [-180, 180]
  const lon = parseFloat(data.longitud);
  if (isNaN(lon)) {
    mostrarError('La longitud es obligatoria y debe ser un número.');
    return false;
  }
  if (lon < -180 || lon > 180) {
    mostrarError('La longitud debe estar entre -180 y 180.');
    return false;
  }

  if (!validarCheck(data.estado, ESTADOS_VALIDOS)) {
    mostrarError('El estado no es válido. Opciones: ACTIVO, AVERIA, SECO, FUERA_SERVICIO, RETIRADO.');
    return false;
  }

  // denominacion VARCHAR(150) nullable
  if (data.denominacion && data.denominacion.length > 150) {
    mostrarError('La denominación no puede superar los 150 caracteres.');
    return false;
  }

  return true;
}


// ============================================================
// MODAL VER
// ============================================================

document.addEventListener('click', async function (e) {
  const btn = e.target.closest('.btn-ver');
  if (!btn) return;

  const item = todasLasInfraestructuras.find(i => i.id == btn.dataset.id);
  if (!item) return;

  const body = document.getElementById('modalVerBody');
  body.innerHTML = `
    <table class="table table-sm table-bordered mb-0">
      <tr><th class="table-secondary">Código</th><td>${item.codigo}</td></tr>
      <tr><th class="table-secondary">Tipo</th>
          <td>
            <span class="badge ${item.tipo === 'HIDRANTE' ? 'bg-primary' : 'bg-purple'}">
              ${item.tipo === 'HIDRANTE' ? '💧 Hidrante' : '🚰 Boca de riego'}
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

  const item = todasLasInfraestructuras.find(i => i.id == btn.dataset.id);
  if (!item) return;

  const id   = btn.dataset.id;
  const form = document.getElementById('formEditar');
  form.innerHTML = `
    <div class="row mb-3">
      <div class="col-md-4">
        <label class="form-label">Código *</label>
        <input type="text" class="form-control" name="codigo" maxlength="10" value="${item.codigo}" required>
      </div>
      <div class="col-md-4">
        <label class="form-label">Tipo *</label>
        <select class="form-select" name="tipo">
          <option value="HIDRANTE"   ${item.tipo === 'HIDRANTE'   ? 'selected' : ''}>💧 Hidrante</option>
          <option value="BOCA_RIEGO" ${item.tipo === 'BOCA_RIEGO' ? 'selected' : ''}>🚰 Boca de riego</option>
        </select>
      </div>
      <div class="col-md-4">
        <label class="form-label">Estado *</label>
        <select class="form-select" name="estado">
          <option value="ACTIVO"         ${item.estado === 'ACTIVO'         ? 'selected' : ''}>Activo</option>
          <option value="AVERIA"         ${item.estado === 'AVERIA'         ? 'selected' : ''}>Avería</option>
          <option value="SECO"           ${item.estado === 'SECO'           ? 'selected' : ''}>Seco</option>
          <option value="FUERA_SERVICIO" ${item.estado === 'FUERA_SERVICIO' ? 'selected' : ''}>Fuera de servicio</option>
          <option value="RETIRADO"       ${item.estado === 'RETIRADO'       ? 'selected' : ''}>Retirado</option>
        </select>
      </div>
    </div>

    <div class="row mb-3">
      <div class="col-md-6">
        <label class="form-label">Municipio *</label>
        <input type="text" class="form-control" name="municipio" maxlength="100" value="${item.municipio}" required>
      </div>
      <div class="col-md-6">
        <label class="form-label">Provincia *</label>
        <select class="form-select" name="provincia">
          <option value="HUESCA"   ${item.provincia === 'HUESCA'   ? 'selected' : ''}>Huesca</option>
          <option value="ZARAGOZA" ${item.provincia === 'ZARAGOZA' ? 'selected' : ''}>Zaragoza</option>
          <option value="TERUEL"   ${item.provincia === 'TERUEL'   ? 'selected' : ''}>Teruel</option>
        </select>
      </div>
    </div>

    <div class="row mb-3">
      <div class="col-md-6">
        <label class="form-label">Denominación</label>
        <input type="text" class="form-control" name="denominacion" maxlength="150" value="${item.denominacion ?? ''}">
      </div>
      <div class="col-md-3">
        <label class="form-label">Latitud *</label>
        <input type="number" step="0.000001" min="-90" max="90" class="form-control" name="latitud" value="${item.latitud}" required>
      </div>
      <div class="col-md-3">
        <label class="form-label">Longitud *</label>
        <input type="number" step="0.000001" min="-180" max="180" class="form-control" name="longitud" value="${item.longitud}" required>
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
        if (el) data[campo] = el.value.trim !== undefined ? el.value.trim() : el.value;
      });

    // ── Validación ──
    if (!validarInfraestructura(data)) return;

    try {
      await InfraestructuraAguaApi.update(id, {
        ...data,
        latitud:      parseFloat(data.latitud),
        longitud:     parseFloat(data.longitud),
        denominacion: data.denominacion || null,
      });
      mostrarExito('Infraestructura actualizada correctamente');
      await cargarInfraestructuras();
      bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
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

    const f = new FormData(form);
    const data = {
      codigo:       f.get('codigo')?.trim(),
      tipo:         f.get('tipo'),
      denominacion: f.get('denominacion')?.trim() || null,
      municipio:    f.get('municipio')?.trim(),
      provincia:    f.get('provincia'),
      latitud:      f.get('latitud'),
      longitud:     f.get('longitud'),
      estado:       f.get('estado') || 'ACTIVO',
    };

    // ── Validación ──
    if (!validarInfraestructura(data)) return;

    try {
      await InfraestructuraAguaApi.create({
        ...data,
        latitud:  parseFloat(data.latitud),
        longitud: parseFloat(data.longitud),
      });
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
