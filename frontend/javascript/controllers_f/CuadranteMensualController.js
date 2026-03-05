import PersonaApi from '../api_f/PersonaApi.js';
import GuardiaApi from '../api_f/GuardiaApi.js';
import PermisoApi from '../api_f/PermisoApi.js';
import EmergenciaApi from '../api_f/EmergenciaApi.js';

// CONSTANTES
const MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// VARIABLES GLOBALES - Inicializar con el mes actual
let hoy = new Date();
let year = hoy.getFullYear();
let month = hoy.getMonth(); // Mes actual (0-11)
let personas = [];
let guardias = [];
let permisos = [];
let emergencias = [];

// INIT
document.addEventListener('DOMContentLoaded', async () => {
    actualizarTituloMes();
    configurarBotones();
    await cargarDatosIniciales();
    renderCuadrante();
});

// ACTUALIZAR TÍTULO DEL MES
function actualizarTituloMes() {
    document.getElementById("monthYear").textContent = `${MONTH_NAMES[month]} ${year}`;
}

// CONFIGURAR BOTONES DE NAVEGACIÓN
function configurarBotones() {
    document.getElementById('btnPrevYear')?.addEventListener('click', () => {
        year--;
        actualizarTituloMes();
        renderCuadrante();
    });
    
    document.getElementById('btnPrevMonth')?.addEventListener('click', () => {
        month--;
        if (month < 0) {
            month = 11;
            year--;
        }
        actualizarTituloMes();
        renderCuadrante();
    });
    
    document.getElementById('btnNextMonth')?.addEventListener('click', () => {
        month++;
        if (month > 11) {
            month = 0;
            year++;
        }
        actualizarTituloMes();
        renderCuadrante();
    });
    
    document.getElementById('btnNextYear')?.addEventListener('click', () => {
        year++;
        actualizarTituloMes();
        renderCuadrante();
    });
}

// CARGAR DATOS INICIALES
async function cargarDatosIniciales() {
    try {
        const [personasRes, guardiasRes, permisosRes, emergenciasRes] = await Promise.allSettled([
            PersonaApi.getAll(),
            GuardiaApi.getAll(),
            PermisoApi.getAll(),
            EmergenciaApi.getAll()
        ]);

        if (personasRes.status === 'fulfilled') {
            personas = personasRes.value.data || personasRes.value || [];
        }
        
        if (guardiasRes.status === 'fulfilled') {
            guardias = guardiasRes.value.data || guardiasRes.value || [];
        }
        
        if (permisosRes.status === 'fulfilled') {
            permisos = permisosRes.value.data || permisosRes.value || [];
        }
        
        if (emergenciasRes.status === 'fulfilled') {
            emergencias = emergenciasRes.value.data || emergenciasRes.value || [];
        }
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

// RENDER CUADRANTE
function renderCuadrante() {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    renderDiasSemana(daysInMonth);
    renderFilasBomberos(daysInMonth);
}

// RENDER DÍAS DE LA SEMANA
function renderDiasSemana(daysInMonth) {
    const daysHeader = document.getElementById('daysHeader');
    if (!daysHeader) return;
    
    // Limpiar cabecera excepto primera columna
    while (daysHeader.children.length > 1) {
        daysHeader.removeChild(daysHeader.lastChild);
    }
    
    // Añadir días del mes
    for (let day = 1; day <= daysInMonth; day++) {
        const th = document.createElement('th');
        th.textContent = day;
        daysHeader.appendChild(th);
    }
}

// RENDER FILAS DE BOMBEROS
function renderFilasBomberos(daysInMonth) {
    const tbody = document.getElementById('calendarBody');
    if (!tbody) return;
    
    // Limpiar tbody
    tbody.innerHTML = '';
    
    // Filtrar solo bomberos activos
    const bomberosActivos = personas.filter(p => p.activo === 1 || p.activo === true);
    
    // Ordenar bomberos por ID
    bomberosActivos.sort((a, b) => {
        const idA = a.id_bombero || '';
        const idB = b.id_bombero || '';
        return idA.localeCompare(idB);
    });
    
    // Añadir fila para cada bombero
    bomberosActivos.forEach(persona => {
        const tr = document.createElement('tr');
        
        // Columna nombre
        const tdNombre = document.createElement('td');
        tdNombre.className = 'fw-bold';
        tdNombre.textContent = persona.id_bombero || '?';
        tr.appendChild(tdNombre);
        
        // Columnas de días
        for (let day = 1; day <= daysInMonth; day++) {
            const fecha = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const td = document.createElement('td');
            
            const horas = obtenerHorasTrabajo(persona.id_bombero, fecha);
            if (horas > 0) {
                td.textContent = horas + 'h';
                td.style.backgroundColor = '#d4edda';
                td.style.color = '#155724';
            }
            
            tr.appendChild(td);
        }
        
        tbody.appendChild(tr);
    });
    
    // Añadir fila vacía
    const trVacio = document.createElement('tr');
    const tdVacio = document.createElement('td');
    tdVacio.innerHTML = '&nbsp;';
    trVacio.appendChild(tdVacio);
    for (let day = 1; day <= daysInMonth; day++) {
        trVacio.appendChild(document.createElement('td'));
    }
    tbody.appendChild(trVacio);
    
    // Añadir fila de totales
    renderFilaTotales(daysInMonth, bomberosActivos);
}

// OBTENER HORAS DE TRABAJO
function obtenerHorasTrabajo(idBombero, fecha) {
    // Buscar guardia directa
    const guardia = guardias.find(g => {
        return g.fecha === fecha && g.id_bombero == idBombero;
    });
    
    if (guardia) {
        if (guardia.h_inicio && guardia.h_fin) {
            return calcularHoras(guardia.h_inicio, guardia.h_fin);
        }
        return 8;
    }
    
    // Buscar en guardias con array de bomberos
    const guardiaConBomberos = guardias.find(g => {
        if (g.fecha === fecha && g.bomberos && Array.isArray(g.bomberos)) {
            return g.bomberos.includes(idBombero);
        }
        return false;
    });
    
    if (guardiaConBomberos) {
        return 8;
    }
    
    // Buscar emergencia
    const emergencia = emergencias.find(e => {
        const fechaEmergencia = e.fecha ? e.fecha.substring(0, 10) : null;
        return fechaEmergencia === fecha && e.id_bombero == idBombero;
    });
    
    if (emergencia) {
        if (emergencia.f_salida && emergencia.f_regreso) {
            return calcularHorasEmergencia(emergencia.f_salida, emergencia.f_regreso);
        }
        return 4;
    }
    
    return 0;
}

// CALCULAR HORAS DE GUARDIA
function calcularHoras(inicio, fin) {
    if (!inicio || !fin) return 0;
    
    try {
        const [hi, mi] = inicio.split(':').map(Number);
        const [hf, mf] = fin.split(':').map(Number);
        
        let minutos = (hf * 60 + mf) - (hi * 60 + mi);
        if (minutos < 0) minutos += 24 * 60;
        
        return Math.round(minutos / 60);
    } catch (e) {
        return 8;
    }
}

// CALCULAR HORAS DE EMERGENCIA
function calcularHorasEmergencia(salida, regreso) {
    if (!salida || !regreso) return 0;
    
    try {
        const fSalida = new Date(salida);
        const fRegreso = new Date(regreso);
        
        if (isNaN(fSalida) || isNaN(fRegreso)) return 4;
        
        const diffMs = fRegreso - fSalida;
        return Math.round(diffMs / (1000 * 60 * 60));
    } catch (e) {
        return 4;
    }
}

// RENDER FILA DE TOTALES
function renderFilaTotales(daysInMonth, bomberosActivos) {
    const tbody = document.getElementById('calendarBody');
    
    const trTotales = document.createElement('tr');
    trTotales.className = 'table-secondary fw-bold';
    
    const tdLabel = document.createElement('td');
    tdLabel.textContent = 'total guardia';
    trTotales.appendChild(tdLabel);
    
    // Calcular personas que trabajan cada día
    for (let day = 1; day <= daysInMonth; day++) {
        const fecha = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        let personasTrabajando = 0;
        
        bomberosActivos.forEach(persona => {
            const horas = obtenerHorasTrabajo(persona.id_bombero, fecha);
            if (horas > 0) personasTrabajando++;
        });
        
        const td = document.createElement('td');
        td.textContent = personasTrabajando || '';
        trTotales.appendChild(td);
    }
    
    tbody.appendChild(trTotales);
}