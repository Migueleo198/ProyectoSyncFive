import PersonaApi from '../api_f/PersonaApi.js';
import PermisoApi from '../api_f/PermisoApi.js';
import ApiClient  from '../api_f/ApiClient.js';
import { authGuard } from '../helpers/authGuard.js';


const MONTH_NAMES = [
   "Enero","Febrero","Marzo","Abril","Mayo","Junio",
   "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];


const TIPOS = {
   guardia:          { label: 'Guardia',             bgClass: 'bg-success' },
   refuerzo:         { label: 'Turno de refuerzo',   bgClass: 'bg-info'    },
   permiso_aceptado: { label: 'Permiso aceptado',    bgClass: 'bg-primary' },
   permiso_revision: { label: 'Permiso en revisión', bgClass: 'bg-warning' },
   permiso_denegado: { label: 'Permiso denegado',    bgClass: 'bg-danger'  },
};

// CORRECCIÓN: estados del DDL — 'ACTIVA' (no 'ABIERTA'), 'REVISION' (sin tilde)
const ESTADOS_PERMISO_VALIDOS = ['ACEPTADO', 'REVISION', 'DENEGADO'];

let year            = new Date().getFullYear();
let modoVista       = 'individual';
let idBomberoActual = null;
let personas        = [];
let guardias        = [];
let permisos        = [];
let refuerzos       = [];


document.addEventListener('DOMContentLoaded', async () => {
   const sesion = await authGuard('cuadrantes');
   if (!sesion) return;

   construirControles();
   construirLeyenda();
   await cargarDatosIniciales();
   renderCalendario();
});


async function cargarDatosIniciales() {
   try {
       detectarBomberoLogueado();
       await cargarPersonas();
       configurarEventosVista();
       configurarBotones();
       await cargarDatosCuadrante();
   } catch (e) {
       mostrarError('Error al cargar los datos iniciales');
   }
}


function detectarBomberoLogueado() {
   try {
       const usuario = JSON.parse(sessionStorage.getItem('user') || 'null');
       idBomberoActual = usuario?.id_bombero || null;
   } catch {
       idBomberoActual = null;
   }
}


async function cargarPersonas() {
   try {
       const res = await PersonaApi.getAll();
       personas = res.data || res || [];
       if (personas.length > 0) poblarSelectBomberos();
   } catch {
       personas = [];
   }
}


function poblarSelectBomberos() {
   const select = document.getElementById('selectBombero');
   if (!select) return;
   select.innerHTML = '<option value="">Seleccione un bombero...</option>';
   personas.forEach(p => {
       const o = document.createElement('option');
       o.value = p.id_bombero;
       o.textContent = `${p.nombre} ${p.apellidos || ''} (${p.id_bombero})`.trim();
       select.appendChild(o);
   });
}


function construirControles() {
   const placeholder = document.getElementById('year_elems_placeholder');
   if (!placeholder) return;

   placeholder.innerHTML = `
       <div class="d-flex align-items-center gap-2 flex-wrap">
           <div class="btn-group" role="group">
               <button class="btn btn-outline-secondary" id="btnPrevYear">
                   <i class="bi bi-chevron-left"></i>
               </button>
               <span id="currentYear" class="btn btn-outline-secondary disabled" style="min-width:80px">${year}</span>
               <button class="btn btn-outline-secondary" id="btnNextYear">
                   <i class="bi bi-chevron-right"></i>
               </button>
           </div>
           <div class="btn-group ms-2" role="group">
               <input type="radio" class="btn-check" name="modoVista" id="modoIndividual" value="individual" autocomplete="off" checked>
               <label class="btn btn-outline-primary" for="modoIndividual">Mi cuadrante</label>
               <input type="radio" class="btn-check" name="modoVista" id="modoGlobal" value="global" autocomplete="off">
               <label class="btn btn-outline-primary" for="modoGlobal">Global</label>
           </div>
           <select class="form-select form-select-sm w-auto" id="selectBombero" style="display:none;min-width:200px">
               <option value="">Seleccione un bombero...</option>
           </select>
       </div>
   `;
}


function construirLeyenda() {
   const box = document.querySelector('.leyenda-box');
   if (!box) return;
   box.innerHTML = `
       <div class="d-flex flex-wrap gap-3 align-items-center p-2 bg-light rounded">
           ${Object.values(TIPOS).map(t => `
               <div class="d-flex align-items-center gap-2">
                   <span class="d-inline-block rounded ${t.bgClass}" style="width:18px;height:18px;"></span>
                   <small class="text-dark">${t.label}</small>
               </div>
           `).join('')}
       </div>
   `;
}


function configurarBotones() {
   document.getElementById('btnPrevYear')?.addEventListener('click', () => cambiarAnio(-1));
   document.getElementById('btnNextYear')?.addEventListener('click', () => cambiarAnio(1));
}


function configurarEventosVista() {
   document.querySelectorAll('input[name="modoVista"]').forEach(r => {
       r.addEventListener('change', async (e) => {
           modoVista = e.target.value;
           const sel = document.getElementById('selectBombero');
           if (sel) sel.style.display = modoVista === 'global' ? 'block' : 'none';
           await cargarDatosCuadrante();
           renderCalendario();
       });
   });

   document.getElementById('selectBombero')?.addEventListener('change', async (e) => {
       await cargarDatosCuadrante(e.target.value || null);
       renderCalendario();
   });
}


async function cargarDatosCuadrante(idBomberoFiltro = null) {
   const idFiltro = idBomberoFiltro || (modoVista === 'individual' ? idBomberoActual : null);

   if (idFiltro) {
       try {
           const res = await ApiClient.get(`/cuadrante/${idFiltro}/guardias`);
           guardias = res.data || res || [];
       } catch {
           mostrarError('Error cargando guardias');
           guardias = [];
       }

       try {
           const res = await PermisoApi.getAll();
           const todos = res.data || res || [];
           // CORRECCIÓN: filtrar y normalizar estado antes de mapear
           permisos = todos
               .filter(p => p.id_bombero == idFiltro)
               .map(p => ({
                   ...p,
                   estado: normalizarEstadoPermiso(p.estado)
               }));
       } catch {
           mostrarError('Error cargando permisos');
           permisos = [];
       }

       try {
           const res = await ApiClient.get(`/cuadrante/${idFiltro}/refuerzos`);
           refuerzos = res.data || res || [];
       } catch {
           mostrarError('Error cargando refuerzos');
           refuerzos = [];
       }

   } else {
       try {
           const res = await ApiClient.get('/cuadrante/guardias');
           guardias = res.data || res || [];
       } catch {
           mostrarError('Error cargando guardias');
           guardias = [];
       }

       try {
           const res = await PermisoApi.getAll();
           const todos = res.data || res || [];
           // CORRECCIÓN: normalizar estados al cargar
           permisos = (todos).map(p => ({
               ...p,
               estado: normalizarEstadoPermiso(p.estado)
           }));
       } catch {
           mostrarError('Error cargando permisos');
           permisos = [];
       }

       try {
           const res = await ApiClient.get('/cuadrante/refuerzos');
           refuerzos = res.data || res || [];
       } catch {
           mostrarError('Error cargando refuerzos');
           refuerzos = [];
       }
   }
}

/**
 * CORRECCIÓN: normaliza el estado de un permiso al formato del DDL.
 * Elimina tildes y convierte a mayúsculas para comparar contra
 * ENUM('ACEPTADO','REVISION','DENEGADO').
 */
function normalizarEstadoPermiso(estado) {
   if (!estado) return '';
   const normalizado = String(estado)
       .toUpperCase()
       .normalize('NFD')
       .replace(/[\u0300-\u036f]/g, '');
   return ESTADOS_PERMISO_VALIDOS.includes(normalizado) ? normalizado : estado.toUpperCase();
}


function renderCalendario() {
   const container = document.getElementById('calendar');
   if (!container) return;

   const yearElement = document.getElementById('currentYear');
   if (yearElement) yearElement.textContent = year;

   const mapa = construirMapaDias();
   container.innerHTML = '';
   container.classList.add('row', 'g-4');

   for (let m = 0; m < 12; m++) {
       container.insertAdjacentHTML('beforeend', generarMes(m, year, mapa));
   }

   document.querySelectorAll('td[data-fecha]').forEach(td => {
       td.addEventListener('click', () => mostrarDetalleDia(td));
   });

   actualizarTablaDetalles();
}


function construirMapaDias() {
   const mapa = {};

   const add = (fecha, tipo) => {
       if (!fecha) return;
       const key = fecha.substring(0, 10);
       if (!mapa[key]) mapa[key] = new Set();
       mapa[key].add(tipo);
   };

   guardias.forEach(g => add(g.fecha, 'guardia'));
   permisos.forEach(p => {
       // CORRECCIÓN: comparar contra valores del DDL (ya normalizados)
       const tipo = p.estado === 'ACEPTADO' ? 'permiso_aceptado'
                  : p.estado === 'REVISION' ? 'permiso_revision'
                  : 'permiso_denegado';
       add(p.fecha, tipo);
   });
   refuerzos.forEach(r => add(r.f_inicio ? r.f_inicio.substring(0, 10) : null, 'refuerzo'));

   return mapa;
}


function generarMes(month, y, mapa) {
   const firstDay     = new Date(y, month, 1).getDay() || 7;
   const daysInMonth  = new Date(y, month + 1, 0).getDate();

   let html = `
       <div class="col-xl-4 col-md-6">
           <div class="card shadow-sm">
               <div class="card-header gris text-white text-center py-2">
                   <h6 class="mb-0">${MONTH_NAMES[month]} ${y}</h6>
               </div>
               <div class="card-body p-0">
                   <table class="table table-bordered text-center mb-0">
                       <thead>
                           <tr class="table-dark">
                               <th class="p-1">L</th><th class="p-1">M</th><th class="p-1">X</th>
                               <th class="p-1">J</th><th class="p-1">V</th>
                               <th class="p-1">S</th><th class="p-1">D</th>
                           </tr>
                       </thead>
                       <tbody>
   `;

   let day = 1;
   for (let row = 0; row < 6; row++) {
       html += '<tr>';
       for (let col = 1; col <= 7; col++) {
           if ((row === 0 && col < firstDay) || day > daysInMonth) {
               html += '<td class="p-2 bg-light"></td>';
           } else {
               const mm    = String(month + 1).padStart(2, '0');
               const dd    = String(day).padStart(2, '0');
               const key   = `${y}-${mm}-${dd}`;
               const tipos = new Set(mapa[key] || []);
               const clase = getClaseTipo(tipos);
               html += `<td data-fecha="${key}" class="p-2 ${clase} dia-celda" style="cursor:${tipos.size ? 'pointer' : 'default'}">${day}</td>`;
               day++;
           }
       }
       html += '</tr>';
       if (day > daysInMonth) break;
   }

   html += '</tbody></table></div></div></div>';
   return html;
}


function getClaseTipo(tipos) {
   if (tipos.has('guardia'))          return 'bg-success text-white';
   if (tipos.has('refuerzo'))         return 'bg-info text-white';
   if (tipos.has('permiso_aceptado')) return 'bg-primary text-white';
   if (tipos.has('permiso_revision')) return 'bg-warning';
   if (tipos.has('permiso_denegado')) return 'bg-danger text-white';
   return '';
}


function mostrarDetalleDia(td) {
   const fecha = td.dataset.fecha;
   if (!fecha) return;

   const guardiasDelDia  = guardias.filter(g  => (g.fecha    || '').substring(0, 10) === fecha);
   const permisosDelDia  = permisos.filter(p  => (p.fecha    || '').substring(0, 10) === fecha);
   const refuerzosDelDia = refuerzos.filter(r => (r.f_inicio || '').substring(0, 10) === fecha);

   const toastContainer = document.getElementById('toastContainer') || crearToastContainer();
   const toastId = 'toast-' + Date.now();

   toastContainer.insertAdjacentHTML('beforeend', `
       <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-autohide="true" data-bs-delay="8000">
           <div class="toast-header bg-primary text-white">
               <strong class="me-auto">Detalles del día</strong>
               <small>${fecha}</small>
               <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
           </div>
           <div class="toast-body">
               ${generarContenidoDetalle(guardiasDelDia, permisosDelDia, refuerzosDelDia)}
           </div>
       </div>
   `);

   const toastElement = document.getElementById(toastId);
   new bootstrap.Toast(toastElement).show();
   toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
}


function crearToastContainer() {
   const c = document.createElement('div');
   c.id           = 'toastContainer';
   c.className    = 'toast-container position-fixed bottom-0 end-0 p-3';
   c.style.zIndex = '2000';
   document.body.appendChild(c);
   return c;
}


function generarContenidoDetalle(guardiasD, permisosD, refuerzosD) {
   if (!guardiasD.length && !permisosD.length && !refuerzosD.length) {
       return '<p class="text-muted mb-0">Sin eventos para este día</p>';
   }

   let html = '';

   guardiasD.forEach(g => {
       html += `
           <div class="mb-2 pb-2 border-bottom">
               <span class="badge bg-success me-2">Guardia</span>
               <span>${g.h_inicio || '??:??'} - ${g.h_fin || '??:??'}</span>
               ${g.notas ? `<div class="text-muted small mt-1">${g.notas}</div>` : ''}
           </div>`;
   });

   refuerzosD.forEach(r => {
       const hi = r.f_inicio ? r.f_inicio.substring(11, 16) : '??:??';
       const hf = r.f_fin    ? r.f_fin.substring(11, 16)    : '??:??';
       html += `
           <div class="mb-2 pb-2 border-bottom">
               <span class="badge bg-info me-2">Turno de refuerzo</span>
               <span>${hi} - ${hf}</span>
               ${r.horas ? `<small class="text-muted ms-2">(${r.horas}h)</small>` : ''}
           </div>`;
   });

   permisosD.forEach(p => {
       // CORRECCIÓN: comparar contra valores del DDL (ya normalizados)
       const badge = p.estado === 'ACEPTADO' ? 'bg-primary'
                   : p.estado === 'REVISION'  ? 'bg-warning text-dark'
                   : 'bg-danger';
       html += `
           <div class="mb-2 pb-2 border-bottom">
               <span class="badge ${badge} me-2">Permiso</span>
               <span>${p.estado}</span>
               ${p.descripcion ? `<div class="text-muted small mt-1">${p.descripcion}</div>` : ''}
           </div>`;
   });

   return html;
}


function actualizarTablaDetalles() {
   const tbody = document.querySelector('.detalles-table tbody');
   if (!tbody) return;

   let horasGuardia = 0;
   guardias.forEach(g => {
       if (!g.h_inicio || !g.h_fin) return;
       const [hi, mi] = g.h_inicio.split(':').map(Number);
       const [hf, mf] = g.h_fin.split(':').map(Number);
       let diff = (hf * 60 + mf) - (hi * 60 + mi);
       if (diff < 0) diff += 24 * 60;
       horasGuardia += diff / 60;
   });

   const horasRefuerzo = refuerzos.reduce((acc, r) => acc + (Number(r.horas) || 0), 0);

   tbody.innerHTML = `
       <tr>
           <td class="text-center"><span class="badge bg-info">${guardias.length}</span></td>
           <td class="text-center"><span class="badge bg-success">${Math.round(horasGuardia)}h</span></td>
           <td class="text-center"><span class="badge bg-info">${refuerzos.length} (${horasRefuerzo}h)</span></td>
           <td class="text-center"><span class="badge bg-primary">${permisos.filter(p => p.estado === 'ACEPTADO').length}</span></td>
       </tr>
       <tr class="table-light">
           <td colspan="5" class="text-muted small px-3 py-2">
               Año ${year}
               ${modoVista === 'individual' && idBomberoActual ? ` · ID: ${idBomberoActual}` : ' · Vista global'}
           </td>
       </tr>
   `;
}


async function cambiarAnio(delta) {
   year += delta;
   const selectBombero   = document.getElementById('selectBombero');
   const idBomberoFiltro = modoVista === 'global' ? (selectBombero?.value || null) : idBomberoActual;
   await cargarDatosCuadrante(idBomberoFiltro);
   renderCalendario();
}


function mostrarError(msg) { mostrarAlerta(msg, 'danger');  }
function mostrarExito(msg) { mostrarAlerta(msg, 'success'); }


function mostrarAlerta(msg, tipo) {
   const container = document.getElementById('alert-container');
   if (!container) return;

   const alertId = 'alert-' + Date.now();
   container.insertAdjacentHTML('beforeend', `
       <div id="${alertId}" class="alert alert-${tipo} alert-dismissible fade show shadow" role="alert">
           <strong>${tipo === 'danger' ? 'Error:' : 'Éxito:'}</strong> ${msg}
           <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
       </div>
   `);

   setTimeout(() => {
       const a = document.getElementById(alertId);
       if (a) { a.classList.remove('show'); setTimeout(() => a.remove(), 150); }
   }, 5000);
}


window.refrescarCuadrante = async function () {
   await cargarDatosIniciales();
   renderCalendario();
   mostrarExito('Cuadrante actualizado correctamente');
};