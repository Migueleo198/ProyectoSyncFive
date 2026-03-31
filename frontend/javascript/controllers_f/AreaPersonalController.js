import AreaPersonalApi from '../api_f/AreaPersonalApi.js';
import { authGuard } from '../helpers/authGuard.js';
import { actualizarAvatarHeader } from './AuthController.js';
import { mostrarError, mostrarExito, formatearFecha } from '../helpers/utils.js';
import { validarEmail, validarTelefono } from '../helpers/validacion.js';

// ================================
// ESTADO LOCAL
// ================================
let statsData = null;
let idBomberoActual = null;

// ================================
// INICIALIZACIÓN
// ================================
document.addEventListener('DOMContentLoaded', async () => {
    const sesion = await authGuard('areaPersonal');
    if (!sesion) return;

    // Obtener el id del usuario logueado desde sessionStorage (igual que el original)
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user || !user.id_bombero) {
        mostrarError('No se pudo identificar al usuario. Por favor, inicia sesión de nuevo.');
        return;
    }

    idBomberoActual = user.id_bombero;
    cargarAreaPersonal(idBomberoActual);
    bindFotoPerfil();
    bindFormDatosPersonales();
    bindCerrarSesion();
    bindFiltroEstadisticas();
});

// ================================
// CARGA PRINCIPAL
// ================================
async function cargarAreaPersonal(id_bombero) {
    mostrarSkeleton(true);
    try {
        const res = await AreaPersonalApi.getStats(id_bombero);
        statsData = res.data;
        renderTodo(statsData);
    } catch (e) {
        mostrarError(e.message || 'Error cargando datos del área personal');
    } finally {
        mostrarSkeleton(false);
    }
}

// ================================
// RENDER COMPLETO
// ================================
async function renderTodo(data) {
    await renderPerfil(data.persona);
    renderEstadisticas(data);
    renderMeritos(data.meritos);
    renderProximasGuardias(data.guardias.proximas);
    renderFormacionesPendientes(data.formacion.pendientes);
    renderCarnets(data.carnets);
    renderPermisosBienestar(data.permisos.resumen);
    renderDatosPersonales(data.persona);
}

// ================================
// PERFIL
// ================================
async function renderPerfil(persona) {
    if (!persona) return;
    const img = document.getElementById('profilePic');
    if (img) {
        if (persona.foto_perfil) {
            if (img.dataset.objectUrl) URL.revokeObjectURL(img.dataset.objectUrl);
            const objectUrl = await AreaPersonalApi.getFotoPerfil(persona.foto_perfil);
            if (objectUrl) {
                img.src = objectUrl;
                img.dataset.objectUrl = objectUrl;
            } else {
                img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(persona.nombre + '+' + persona.apellidos)}&background=dc3545&color=fff&size=150`;
            }
        } else {
            img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(persona.nombre + '+' + persona.apellidos)}&background=dc3545&color=fff&size=150`;
        }
    }
    setText('perfil-nombre',       `${persona.nombre} ${persona.apellidos}`);
    setText('perfil-rol',          persona.rol_nombre || '—');
    setText('perfil-id',           persona.id_bombero);
    setText('perfil-nfuncionario', persona.n_funcionario);
    setText('perfil-ingreso',      formatearFecha(persona.f_ingreso_diputacion));
    setText('perfil-anios',        `${persona.anios_servicio ?? 0} años de servicio`);
}

// ================================
// ESTADÍSTICAS
// ================================
function renderEstadisticas(data) {
    const em = data.emergencias || {};
    const fo = data.formacion?.resumen || {};
    const gu = data.guardias?.resumen || {};
    const ca = data.carnets?.resumen || {};
    const tu = data.turnos_refuerzo || {};

    setNum('stat-emergencias',     em.total_emergencias);
    setNum('stat-horas-formacion', fo.horas_formacion_total);
    setNum('stat-guardias',        gu.total_guardias);
    setNum('stat-carnets',         ca.vigentes);
    setNum('stat-horas-refuerzo',  tu.horas_refuerzo_total);
    setNum('stat-meritos',         (data.meritos || []).length);

    setNum('stat-incendios',       em.incendios);
    setNum('stat-rescates',        em.rescates);
    setNum('stat-mmpp',            em.materias_peligrosas);
    setNum('stat-otros-em',        em.otros);

    setText('stat-avg-respuesta',  em.avg_respuesta_min != null  ? `${em.avg_respuesta_min} min` : '—');
    setText('stat-avg-resolucion', em.avg_resolucion_min != null ? `${em.avg_resolucion_min} min` : '—');
    setText('stat-pct-exitosas',   em.pct_exitosas != null       ? `${em.pct_exitosas}%` : '—');

    setNum('stat-em-anio',         em.emergencias_anio);
    setNum('stat-em-mes',          em.emergencias_mes);
    setNum('stat-guardias-anio',   gu.guardias_anio);
    setNum('stat-horas-guardia',   gu.horas_guardia_total ? Math.round(gu.horas_guardia_total) : 0);
    setNum('stat-horas-form-anio', fo.horas_formacion_anio);
    setNum('stat-horas-ref-anio',  tu.horas_refuerzo_anio);
}

// ================================
// MÉRITOS / LOGROS
// ================================
const MERIT_ICONS = {
    'Cruz':    'bi-shield-fill-check',
    'Medalla': 'bi-award-fill',
    'Felicit': 'bi-star-fill',
    '10 años': 'bi-calendar2-check-fill',
    '20 años': 'bi-calendar2-heart-fill',
    'Rescate': 'bi-heart-pulse-fill',
};
const MERIT_COLORS = ['text-warning','text-primary','text-success','text-danger','text-info','text-secondary'];

function renderMeritos(meritos) {
    const container = document.getElementById('logros-container');
    if (!container) return;
    container.innerHTML = '';
    (meritos || []).forEach((m, i) => {
        const iconKey = Object.keys(MERIT_ICONS).find(k => m.nombre.includes(k)) || 'Medalla';
        const icon    = MERIT_ICONS[iconKey] || 'bi-award-fill';
        const color   = MERIT_COLORS[i % MERIT_COLORS.length];
        container.innerHTML += `
            <div class="col-lg-3 col-md-4 col-sm-6">
                <div class="achievement-card card text-center border-0 shadow-sm">
                    <div class="card-body py-3">
                        <i class="bi ${icon} fs-1 ${color}"></i>
                        <h6 class="mt-2 mb-1 fw-semibold" style="font-size:.85rem">${m.nombre}</h6>
                        <small class="text-muted" style="font-size:.75rem">${m.descripcion.substring(0, 60)}…</small>
                    </div>
                </div>
            </div>`;
    });
    const bloqueados = Math.max(0, 4 - (meritos || []).length);
    for (let i = 0; i < bloqueados; i++) {
        container.innerHTML += `
            <div class="col-lg-3 col-md-4 col-sm-6">
                <div class="achievement-card card text-center border-secondary opacity-40">
                    <div class="card-body py-3">
                        <i class="bi bi-lock-fill fs-1 text-secondary"></i>
                        <h6 class="mt-2 mb-1" style="font-size:.85rem">???</h6>
                        <small class="text-muted" style="font-size:.75rem">Bloqueado</small>
                    </div>
                </div>
            </div>`;
    }
}

// ================================
// PRÓXIMAS GUARDIAS
// ================================
function renderProximasGuardias(guardias) {
    const ul = document.getElementById('lista-proximas-guardias');
    if (!ul) return;
    ul.innerHTML = '';
    if (!guardias || guardias.length === 0) { ul.innerHTML = '<li class="list-group-item text-muted px-0">Sin guardias próximas asignadas</li>'; return; }
    guardias.forEach(g => {
        ul.innerHTML += `
            <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                <div>
                    <strong>${formatearFecha(g.fecha)}</strong><br>
                    <small class="text-muted">${g.h_inicio?.substring(0,5)} – ${g.h_fin?.substring(0,5)} · ${g.cargo || ''}</small>
                </div>
                <span class="badge bg-info">Confirmada</span>
            </li>`;
    });
}

// ================================
// FORMACIONES PENDIENTES
// ================================
function renderFormacionesPendientes(formaciones) {
    const ul = document.getElementById('lista-formaciones-pendientes');
    if (!ul) return;
    ul.innerHTML = '';
    if (!formaciones || formaciones.length === 0) { ul.innerHTML = '<li class="list-group-item text-muted px-0">Sin formaciones pendientes</li>'; return; }
    formaciones.forEach(f => {
        ul.innerHTML += `
            <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                <div>
                    <strong>${f.nombre}</strong><br>
                    <small class="text-muted">${formatearFecha(f.f_inicio)} · ${f.horas}h</small>
                </div>
                <span class="badge bg-primary">Inscrito</span>
            </li>`;
    });
}

// ================================
// CARNETS
// ================================
function renderCarnets(carnets) {
    setNum('stat-carnets-vigentes',  carnets?.resumen?.vigentes);
    setNum('stat-carnets-caducados', carnets?.resumen?.caducados);
    setNum('stat-carnets-vencer',    carnets?.resumen?.proximos_vencer);
    const tbody = document.getElementById('tabla-carnets');
    if (!tbody) return;
    tbody.innerHTML = '';
    (carnets?.detalle || []).forEach(c => {
        const vencido = c.vigente == 0;
        const grupo = c.grupo ?? 'Sin grupo';
        tbody.innerHTML += `
            <tr class="${vencido ? 'table-danger' : ''}">
                <td>${c.nombre}</td>
                <td><span class="badge bg-secondary">${grupo}</span></td>
                <td>${formatearFecha(c.f_obtencion)}</td>
                <td>${formatearFecha(c.f_vencimiento)}</td>
                <td><span class="badge ${vencido ? 'bg-danger' : 'bg-success'}">${vencido ? 'Caducado' : 'Vigente'}</span></td>
            </tr>`;
    });
}

// ================================
// BIENESTAR / PERMISOS
// ================================
function renderPermisosBienestar(resumen) {
    if (!resumen) return;
    setNum('bienestar-asuntos-propios',   resumen.dias_asuntos_propios);
    setNum('bienestar-enfermedad',        resumen.dias_enfermedad);
    setNum('bienestar-accidente-laboral', resumen.dias_accidente_laboral);
    setNum('bienestar-fallecimiento',     resumen.dias_fallecimiento);
    setNum('bienestar-otros',             resumen.dias_otros);
    setNum('bienestar-total-dias',        resumen.total_dias);
    setNum('bienestar-aceptados',         resumen.aceptados);
    setNum('bienestar-denegados',         resumen.denegados);
}

// ================================
// DATOS PERSONALES
// ================================
function renderDatosPersonales(p) {
    if (!p) return;
    setVal('dp-n-funcionario',       p.n_funcionario);
    setVal('dp-nombre',              p.nombre);
    setVal('dp-apellidos',           p.apellidos);
    setVal('dp-nombre-usuario',      p.nombre_usuario);
    setVal('dp-correo',              p.correo);
    setVal('dp-dni',                 p.dni);
    setVal('dp-f-nacimiento',        p.f_nacimiento);
    setVal('dp-f-ingreso',           p.f_ingreso_diputacion);
    setVal('dp-telefono',            p.telefono);
    setVal('dp-telefono-emergencia', p.telefono_emergencia);
    setVal('dp-talla-superior',      p.talla_superior);
    setVal('dp-talla-inferior',      p.talla_inferior);
    setVal('dp-talla-calzado',       p.talla_calzado);
    setVal('dp-domicilio',           p.domicilio);
    setVal('dp-localidad',           p.localidad);
}

// ================================
// VALIDAR DATOS PERSONALES EDITABLES
// Según DDL Persona:
//   correo          VARCHAR(100) NOT NULL
//   telefono        VARCHAR(15)  NOT NULL
//   telefono_emergencia VARCHAR(15) (nullable)
//   nombre_usuario  VARCHAR(20)  UNIQUE NOT NULL
//   talla_superior  VARCHAR(10)  (nullable)
//   talla_inferior  VARCHAR(10)  (nullable)
//   talla_calzado   VARCHAR(10)  (nullable)
//   domicilio       VARCHAR(150) (nullable)
//   localidad       VARCHAR(100) (nullable, FK)
// ================================
function validarDatosPersonales(data) {
    if ('correo' in data) {
        if (!data.correo || !validarEmail(data.correo)) {
            mostrarError('El correo electrónico no es válido.');
            return false;
        }
        if (data.correo.length > 100) {
            mostrarError('El correo no puede superar los 100 caracteres.');
            return false;
        }
    }

    if ('telefono' in data) {
        if (!data.telefono || !validarTelefono(data.telefono)) {
            mostrarError('El teléfono no es válido (9 dígitos, empieza por 6, 7, 8 o 9).');
            return false;
        }
        if (data.telefono.length > 15) {
            mostrarError('El teléfono no puede superar los 15 caracteres.');
            return false;
        }
    }

    if ('telefono_emergencia' in data && data.telefono_emergencia) {
        if (!validarTelefono(data.telefono_emergencia)) {
            mostrarError('El teléfono de emergencia no es válido (9 dígitos, empieza por 6, 7, 8 o 9).');
            return false;
        }
        if (data.telefono_emergencia.length > 15) {
            mostrarError('El teléfono de emergencia no puede superar los 15 caracteres.');
            return false;
        }
    }

    if ('nombre_usuario' in data) {
        if (!data.nombre_usuario || data.nombre_usuario.trim() === '') {
            mostrarError('El nombre de usuario es obligatorio.');
            return false;
        }
        if (data.nombre_usuario.length > 20) {
            mostrarError('El nombre de usuario no puede superar los 20 caracteres.');
            return false;
        }
    }

    if ('talla_superior' in data && data.talla_superior && data.talla_superior.length > 10) {
        mostrarError('La talla superior no puede superar los 10 caracteres.');
        return false;
    }

    if ('talla_inferior' in data && data.talla_inferior && data.talla_inferior.length > 10) {
        mostrarError('La talla inferior no puede superar los 10 caracteres.');
        return false;
    }

    if ('talla_calzado' in data && data.talla_calzado && String(data.talla_calzado).length > 10) {
        mostrarError('La talla de calzado no puede superar los 10 caracteres.');
        return false;
    }

    if ('domicilio' in data && data.domicilio && data.domicilio.length > 150) {
        mostrarError('El domicilio no puede superar los 150 caracteres.');
        return false;
    }

    if ('localidad' in data && data.localidad && data.localidad.length > 100) {
        mostrarError('La localidad no puede superar los 100 caracteres.');
        return false;
    }

    return true;
}

// ================================
// FORMULARIO DATOS PERSONALES
// ================================
function bindFormDatosPersonales() {
    const form = document.getElementById('formAreaPersonal');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!idBomberoActual) return;

        const camposEditables = [
            'correo', 'telefono', 'telefono_emergencia',
            'talla_superior', 'talla_inferior', 'talla_calzado',
            'domicilio', 'localidad', 'nombre_usuario'
        ];
        const data = {};
        camposEditables.forEach(campo => {
            const el = document.getElementById(`dp-${campo.replace(/_/g, '-')}`);
            if (!el || el.readOnly) return;
            const val = el.value.trim();
            if (val === '') return;
            data[campo] = (campo === 'talla_calzado') ? Number(val) || val : val;
        });

        if (Object.keys(data).length === 0) {
            mostrarError('No hay cambios para guardar.');
            return;
        }

        // ── Validación de campos editables ──
        if (!validarDatosPersonales(data)) return;

        try {
            await AreaPersonalApi.updateDatosPersonales(idBomberoActual, data);
            mostrarExito('Datos personales actualizados correctamente');
        } catch (err) {
            mostrarError(err.message || 'Error al guardar los cambios');
        }
    });

    document.getElementById('btn-cancelar-datos')?.addEventListener('click', () => {
        if (statsData?.persona) renderDatosPersonales(statsData.persona);
    });
}

// ================================
// FOTO DE PERFIL
// ================================
async function bindFotoPerfil() {
    const fileInput = document.getElementById('fileInput');
    if (!fileInput) return;
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => { const img = document.getElementById('profilePic'); if (img) img.src = ev.target.result; };
        reader.readAsDataURL(file);
        if (!idBomberoActual) return;
        try {
            const result = await AreaPersonalApi.uploadFotoPerfil(idBomberoActual, file);
            if (statsData?.persona) {
                statsData.persona.foto_perfil = result.data.foto_perfil;
            }

            const user = JSON.parse(sessionStorage.getItem('user') || '{}');
            user.foto_perfil = result.data.foto_perfil;
            sessionStorage.setItem('user', JSON.stringify(user));
            actualizarAvatarHeader(result.data.foto_perfil);

            const objectUrl = await AreaPersonalApi.getFotoPerfil(result.data.foto_perfil);
            if (objectUrl) {
                const img = document.getElementById('profilePic');
                if (img) { if (img.dataset.objectUrl) URL.revokeObjectURL(img.dataset.objectUrl); img.src = objectUrl; img.dataset.objectUrl = objectUrl; }
            }
            mostrarExito('Foto de perfil actualizada');
        } catch (err) { mostrarError(err.message || 'Error al subir la foto'); }
    });
}

// ================================
// CERRAR SESIÓN
// ================================
function bindCerrarSesion() {
    document.querySelectorAll('.logout-link').forEach(btn => {
        btn.addEventListener('click', async () => {
            try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch (_) {}
            sessionStorage.clear();
            localStorage.clear();
            window.location.href = '/frontend/pages/Login/login.html';
        });
    });
}

// ================================
// FILTRO DE ESTADÍSTICAS
// ================================
function bindFiltroEstadisticas() {
    // Placeholder para futuros filtros de periodo
}

// ================================
// SKELETON LOADING
// ================================
function mostrarSkeleton(show) {
    document.querySelectorAll('.skeleton-placeholder').forEach(el => { el.style.display = show ? 'block' : 'none'; });
    document.querySelectorAll('.content-area').forEach(el => { el.style.opacity = show ? '0' : '1'; el.style.transition = 'opacity 0.3s ease'; });
}

// ================================
// HELPERS
// ================================
function setText(id, value) { const el = document.getElementById(id); if (el) el.textContent = value ?? '—'; }
function setNum(id, value)  { const el = document.getElementById(id); if (el) el.textContent = value != null ? Number(value).toLocaleString('es-ES') : '0'; }
function setVal(id, value)  { const el = document.getElementById(id); if (el) el.value = value ?? ''; }
