import PersonaApi from '../api_f/PersonaApi.js';
import PermisoApi from '../api_f/PermisoApi.js';
import ApiClient  from '../api_f/ApiClient.js';
import { authGuard } from '../helpers/authGuard.js';


const MONTH_NAMES = [
   "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
   "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];


const TIPOS = {
   guardia:          { label: 'Guardia',             bgClass: 'bg-success' },
   turno:            { label: 'Turno de refuerzo',   bgClass: 'bg-info'    },
   permiso_aceptado: { label: 'Permiso aceptado',    bgClass: 'bg-primary' },
   permiso_revision: { label: 'Permiso en revisión', bgClass: 'bg-warning' },
   permiso_denegado: { label: 'Permiso denegado',    bgClass: 'bg-danger'  },
};


let hoy               = new Date();
let year              = hoy.getFullYear();
let month             = hoy.getMonth();
let modoVista         = 'global';
let idBomberoActual   = null;
let personas          = [];
let guardias          = [];
let permisos          = [];
let refuerzos         = [];
let fechaFiltroActiva = null;


document.addEventListener('DOMContentLoaded', async () => {
   const sesion = await authGuard('cuadrantes');
   if (!sesion) return;

   construirControles();
   actualizarTituloMes();
   construirLeyenda();
   await cargarDatosIniciales();
   renderCuadrante();
});


async function cargarDatosIniciales() {
   try {
       detectarBomberoLogueado();
       await cargarPersonas();
       configurarBotones();
       configurarEventosVista();
       await cargarDatosCuadrante();
   } catch (e) {
       mostrarError('Error al cargar los datos iniciales');
   }
}


function detectarBomberoLogueado() {
   try {
       const sesion = JSON.parse(sessionStorage.getItem('user') || 'null');
       idBomberoActual = sesion?.id_bombero || null;
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
   select.innerHTML = '<option value="">Todos los bomberos</option>';
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
           <div class="btn-group ms-2" role="group">
               <input type="radio" class="btn-check" name="modoVista" id="modoGlobal" value="global" autocomplete="off" checked>
               <label class="btn btn-outline-primary" for="modoGlobal">Global</label>
               <input type="radio" class="btn-check" name="modoVista" id="modoIndividual" value="individual" autocomplete="off">
               <label class="btn btn-outline-primary" for="modoIndividual">Mi cuadrante</label>
           </div>
           <select class="form-select form-select-sm w-auto ms-2" id="selectBombero" style="display:block;min-width:200px">
               <option value="">Todos los bomberos</option>
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


function actualizarTituloMes() {
   const el = document.getElementById('monthYear');
   if (el) el.textContent = `${MONTH_NAMES[month]} ${year}`;
}


function configurarBotones() {
   document.getElementById('btnPrevYear')?.addEventListener('click', async () => {
       year--; fechaFiltroActiva = null;
       actualizarTituloMes(); await cargarDatosCuadrante(); renderCuadrante();
   });
   document.getElementById('btnPrevMonth')?.addEventListener('click', async () => {
       month--; if (month < 0) { month = 11; year--; }
       fechaFiltroActiva = null;
       actualizarTituloMes(); await cargarDatosCuadrante(); renderCuadrante();
   });
   document.getElementById('btnNextMonth')?.addEventListener('click', async () => {
       month++; if (month > 11) { month = 0; year++; }
       fechaFiltroActiva = null;
       actualizarTituloMes(); await cargarDatosCuadrante(); renderCuadrante();
   });
   document.getElementById('btnNextYear')?.addEventListener('click', async () => {
       year++; fechaFiltroActiva = null;
       actualizarTituloMes(); await cargarDatosCuadrante(); renderCuadrante();
   });
}


function configurarEventosVista() {
   document.querySelectorAll('input[name="modoVista"]').forEach(r => {
       r.addEventListener('change', async (e) => {
           modoVista = e.target.value;
           const sel = document.getElementById('selectBombero');
           if (sel) sel.style.display = modoVista === 'global' ? 'block' : 'none';
           fechaFiltroActiva = null;
           await cargarDatosCuadrante();
           renderCuadrante();
       });
   });

   document.getElementById('selectBombero')?.addEventListener('change', async () => {
       fechaFiltroActiva = null;
       await cargarDatosCuadrante();
       renderCuadrante();
   });
}


async function cargarDatosCuadrante() {
   const selectBombero   = document.getElementById('selectBombero');
   const idBomberoFiltro = modoVista === 'individual'
       ? idBomberoActual
       : (selectBombero?.value || null);

   if (idBomberoFiltro) {
       try {
           const res = await ApiClient.get(`/cuadrante/${idBomberoFiltro}/guardias`);
           guardias = res.data || res || [];
       } catch {
           mostrarError('Error cargando guardias');
           guardias = [];
       }

       try {
           const res = await PermisoApi.getAll();
           const todos = res.data || res || [];
           permisos = todos.filter(p => p.id_bombero == idBomberoFiltro);
       } catch {
           mostrarError('Error cargando permisos');
           permisos = [];
       }

       try {
           const res = await ApiClient.get(`/cuadrante/${idBomberoFiltro}/refuerzos`);
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
           permisos = res.data || res || [];
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


function renderCuadrante() {
   const daysInMonth = new Date(year, month + 1, 0).getDate();
   const tabla = document.querySelector('#calendario table');
   if (tabla) tabla.style.tableLayout = 'fixed';
   renderCabeceraDias(daysInMonth);
   renderFilasBomberos(daysInMonth);
}


function renderCabeceraDias(daysInMonth) {
   const daysHeader = document.getElementById('daysHeader');
   if (!daysHeader) return;

   const thNombre = daysHeader.querySelector('th:first-child');
   if (thNombre) { thNombre.style.minWidth = '100px'; thNombre.style.width = '100px'; }

   while (daysHeader.children.length > 1) daysHeader.removeChild(daysHeader.lastChild);

   for (let day = 1; day <= daysInMonth; day++) {
       const th = document.createElement('th');
       th.textContent = day;
       th.classList.add('text-center', 'p-1');
       th.style.minWidth = '42px';
       th.style.maxWidth = '42px';
       th.style.width    = '42px';
       if (esDiaDeHoy(day)) th.classList.add('bg-primary', 'text-white');
       daysHeader.appendChild(th);
   }
}


function renderFilasBomberos(daysInMonth) {
   const tbody = document.getElementById('calendarBody');
   if (!tbody) return;
   tbody.innerHTML = '';

   const bomberosActivos = getBomberosVisibles();
   const bomberosMostrar = aplicarFiltroBomberos(bomberosActivos);

   bomberosMostrar.forEach(persona => {
       tbody.appendChild(crearFilaBombero(persona, daysInMonth));
   });

   renderFilaTotales(daysInMonth, bomberosActivos);
}


function getBomberosVisibles() {
   const selectBombero   = document.getElementById('selectBombero');
   const idBomberoFiltro = modoVista === 'individual'
       ? idBomberoActual
       : (selectBombero?.value || null);

   const base = personas
       .filter(p => p.activo === 1 || p.activo === true)
       .sort((a, b) => (a.id_bombero || '').localeCompare(b.id_bombero || ''));

   if (idBomberoFiltro) return base.filter(p => p.id_bombero == idBomberoFiltro);
   return base;
}


function aplicarFiltroBomberos(bomberosActivos) {
   if (!fechaFiltroActiva) return bomberosActivos;
   return bomberosActivos.filter(p =>
       (tieneBomberoGuardiaEnFecha(p.id_bombero, fechaFiltroActiva) ||
        tieneBomberoRefuerzoEnFecha(p.id_bombero, fechaFiltroActiva)) &&
       !tieneBomberoPermisoAceptadoEnFecha(p.id_bombero, fechaFiltroActiva)
   );
}


function crearFilaBombero(persona, daysInMonth) {
   const tr = document.createElement('tr');

   const tdNombre = document.createElement('td');
   tdNombre.className      = 'fw-bold small';
   tdNombre.textContent    = persona.id_bombero || '?';
   tdNombre.style.minWidth = '100px';
   tdNombre.style.width    = '100px';
   tdNombre.title          = `${persona.nombre || ''} ${persona.apellidos || ''}`.trim();
   tr.appendChild(tdNombre);

   for (let day = 1; day <= daysInMonth; day++) {
       tr.appendChild(crearCeldaDia(persona.id_bombero, day));
   }
   return tr;
}


function crearCeldaDia(idBombero, day) {
   const fecha   = getFecha(day);
   const td      = document.createElement('td');
   const eventos = obtenerEventosDia(idBombero, fecha);

   td.style.minWidth  = '42px';
   td.style.maxWidth  = '42px';
   td.style.width     = '42px';
   td.style.overflow  = 'hidden';
   td.style.textAlign = 'center';

   if (eventos.length > 0) {
       td.className    = getClaseEvento(eventos);
       td.style.cursor = 'pointer';
       td.textContent  = getTextoEvento(eventos, idBombero, fecha);
       td.addEventListener('click', e => {
           e.stopPropagation();
           mostrarDetalleDia(idBombero, fecha);
       });
   } else if (esDiaDeHoy(day)) {
       td.classList.add('bg-primary', 'bg-opacity-10');
   }
   return td;
}


function obtenerEventosDia(idBombero, fecha) {
   const eventos = [];
   if (tieneBomberoGuardiaEnFecha(idBombero, fecha))  eventos.push('guardia');
   if (tieneBomberoRefuerzoEnFecha(idBombero, fecha)) eventos.push('turno');
   const permiso = getPermisoEnFecha(idBombero, fecha);
   if (permiso) {
       const estado = (permiso.estado || '').toUpperCase();
       if      (estado === 'ACEPTADO') eventos.push('permiso_aceptado');
       else if (estado === 'REVISION') eventos.push('permiso_revision');
       else                            eventos.push('permiso_denegado');
   }
   return eventos;
}


function tieneBomberoGuardiaEnFecha(idBombero, fecha) {
   return guardias.some(g =>
       (g.fecha || '').substring(0, 10) === fecha &&
       g.id_bombero == idBombero
   );
}


function tieneBomberoRefuerzoEnFecha(idBombero, fecha) {
   return refuerzos.some(r =>
       (r.f_inicio || '').substring(0, 10) === fecha &&
       r.id_bombero == idBombero
   );
}


function tieneBomberoPermisoAceptadoEnFecha(idBombero, fecha) {
   return permisos.some(p =>
       (p.fecha || '').substring(0, 10) === fecha &&
       p.id_bombero == idBombero &&
       (p.estado || '').toUpperCase() === 'ACEPTADO'
   );
}


function getPermisoEnFecha(idBombero, fecha) {
   return permisos.find(p =>
       (p.fecha || '').substring(0, 10) === fecha &&
       p.id_bombero == idBombero
   ) || null;
}


function getClaseEvento(eventos) {
   if (eventos.includes('permiso_revision')) return 'bg-warning text-dark text-center';
   if (eventos.includes('permiso_denegado')) return 'bg-danger text-white text-center';
   if (eventos.includes('permiso_aceptado')) return 'bg-primary text-white text-center';
   if (eventos.includes('guardia'))          return 'bg-success text-white text-center';
   if (eventos.includes('turno'))            return 'bg-info text-white text-center';
   return 'text-center';
}


function getTextoEvento(eventos, idBombero, fecha) {
   if (eventos.includes('permiso_aceptado')) return 'V';
   if (eventos.includes('permiso_denegado')) return eventos.includes('guardia') ? calcularHorasGuardia(idBombero, fecha) : 'X';
   if (eventos.includes('permiso_revision')) return eventos.includes('guardia') ? calcularHorasGuardia(idBombero, fecha) : '?';
   if (eventos.includes('guardia'))          return calcularHorasGuardia(idBombero, fecha);
   if (eventos.includes('turno'))            return 'R';
   return '';
}


function calcularHorasGuardia(idBombero, fecha) {
   let totalMinutos = 0;
   guardias.forEach(g => {
       if ((g.fecha || '').substring(0, 10) !== fecha) return;
       if (g.id_bombero != idBombero) return;
       if (!g.h_inicio || !g.h_fin) return;
       const [hI, mI] = g.h_inicio.split(':').map(Number);
       const [hF, mF] = g.h_fin.split(':').map(Number);
       let ini = hI * 60 + mI;
       let fin = hF * 60 + mF;
       if (fin <= ini) fin += 24 * 60;
       totalMinutos += fin - ini;
   });
   if (totalMinutos <= 0) return 'G';
   const h = Math.floor(totalMinutos / 60);
   const m = totalMinutos % 60;
   return m > 0 ? `${h}h${m}` : `${h}h`;
}


function renderFilaTotales(daysInMonth, bomberosActivos) {
   const tbody = document.getElementById('calendarBody');
   const tr    = document.createElement('tr');
   tr.className = 'table-secondary fw-bold';

   const tdLabel = document.createElement('td');
   tdLabel.style.minWidth = '100px';
   tdLabel.style.width    = '100px';
   tdLabel.textContent    = fechaFiltroActiva ? `filtro: ${fechaFiltroActiva} X` : 'en guardia';
   if (fechaFiltroActiva) {
       tdLabel.style.cursor = 'pointer';
       tdLabel.addEventListener('click', () => { fechaFiltroActiva = null; renderCuadrante(); });
   }
   tr.appendChild(tdLabel);

   for (let day = 1; day <= daysInMonth; day++) {
       tr.appendChild(crearCeldaTotal(day, bomberosActivos));
   }
   tbody.appendChild(tr);
}


function crearCeldaTotal(day, bomberosActivos) {
   const fecha = getFecha(day);
   const total = contarBomberosEnFecha(fecha, bomberosActivos);
   const td    = document.createElement('td');
   td.textContent    = total || '';
   td.className      = 'text-center';
   td.style.minWidth = '42px';
   td.style.maxWidth = '42px';
   td.style.width    = '42px';
   if (esDiaDeHoy(day)) td.classList.add('bg-primary', 'bg-opacity-10');
   if (total > 0) {
       td.style.cursor = 'pointer';
       if (fechaFiltroActiva === fecha) td.classList.add('bg-warning', 'text-dark');
       td.addEventListener('click', () => {
           fechaFiltroActiva = (fechaFiltroActiva === fecha) ? null : fecha;
           renderCuadrante();
       });
   }
   return td;
}


function contarBomberosEnFecha(fecha, bomberosActivos) {
   return bomberosActivos.filter(p =>
       (tieneBomberoGuardiaEnFecha(p.id_bombero, fecha) ||
        tieneBomberoRefuerzoEnFecha(p.id_bombero, fecha)) &&
       !tieneBomberoPermisoAceptadoEnFecha(p.id_bombero, fecha)
   ).length;
}


function mostrarDetalleDia(idBombero, fecha) {
   const bombero       = personas.find(p => p.id_bombero == idBombero);
   const nombreBombero = bombero ? `${bombero.nombre} ${bombero.apellidos || ''}`.trim() : idBombero;

   const guardiasDelDia  = guardias.filter(g  => (g.fecha    || '').substring(0, 10) === fecha && g.id_bombero == idBombero);
   const permisosDelDia  = permisos.filter(p  => (p.fecha    || '').substring(0, 10) === fecha && p.id_bombero == idBombero);
   const refuerzosDelDia = refuerzos.filter(r => (r.f_inicio || '').substring(0, 10) === fecha && r.id_bombero == idBombero);

   const toastContainer = document.getElementById('toastContainer') || crearToastContainer();
   const toastId        = 'toast-' + Date.now();

   toastContainer.insertAdjacentHTML('beforeend', `
       <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true"
            data-bs-autohide="true" data-bs-delay="8000">
           <div class="toast-header bg-primary text-white">
               <strong class="me-auto">${nombreBombero}</strong>
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


function generarContenidoDetalle(guardiasDelDia, permisosDelDia, refuerzosDelDia) {
   if (!guardiasDelDia.length && !permisosDelDia.length && !refuerzosDelDia.length) {
       return '<p class="text-muted mb-0">Sin eventos para este día</p>';
   }

   let html = '';

   guardiasDelDia.forEach(g => {
       html += `
           <div class="mb-2 pb-2 border-bottom">
               <span class="badge bg-success me-2">Guardia</span>
               <span>${g.h_inicio || '??:??'} - ${g.h_fin || '??:??'}</span>
               ${g.notas ? `<div class="text-muted small mt-1">${g.notas}</div>` : ''}
           </div>`;
   });

   refuerzosDelDia.forEach(r => {
       const hi = r.f_inicio ? r.f_inicio.substring(11, 16) : '??:??';
       const hf = r.f_fin    ? r.f_fin.substring(11, 16)    : '??:??';
       html += `
           <div class="mb-2 pb-2 border-bottom">
               <span class="badge bg-info me-2">Turno de refuerzo</span>
               <span>${hi} - ${hf}</span>
               ${r.horas ? `<small class="text-muted ms-2">(${r.horas}h)</small>` : ''}
           </div>`;
   });

   permisosDelDia.forEach(p => {
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


function getFecha(day) {
   return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}


function esDiaDeHoy(day) {
   return year === hoy.getFullYear() && month === hoy.getMonth() && day === hoy.getDate();
}


function mostrarError(msg) { mostrarAlerta(msg, 'danger');  }
function mostrarExito(msg) { mostrarAlerta(msg, 'success'); }


function mostrarAlerta(msg, tipo) {
   const container = document.getElementById('alert-container');
   if (!container) return;
   const alertId = 'alert-' + Date.now();
   container.insertAdjacentHTML('beforeend', `
       <div id="${alertId}" class="alert alert-${tipo} alert-dismissible fade show shadow" role="alert">
           <strong>${tipo === 'danger' ? 'Error:' : 'Exito:'}</strong> ${msg}
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
   renderCuadrante();
   mostrarExito('Cuadrante actualizado correctamente');
};


window.CuadranteMensualController = { cargarDatosIniciales, renderCuadrante };