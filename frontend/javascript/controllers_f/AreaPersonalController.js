/**
 * AreaPersonalController.js
 * Controlador frontend para la vista Área Personal.
 * Carga todos los datos desde el endpoint /personas/{id}/stats
 * y los inyecta en la vista.
 */

import AreaPersonalApi from '../api_f/AreaPersonalApi.js';
import { mostrarError, mostrarExito, formatearFecha } from '../helpers/utils.js';

// ── Estado local ──────────────────────────────────────────────────────────────
let statsData = null;
let idBomberoActual = null;

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Obtener el id del usuario logueado desde la sesión / localStorage
    // Se asume que al hacer login se guarda en sessionStorage como 'user'
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

// ── Carga principal ───────────────────────────────────────────────────────────
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

// ── Render completo ───────────────────────────────────────────────────────────
function renderTodo(data) {
    renderPerfil(data.persona);
    renderEstadisticas(data);
    renderMeritos(data.meritos);
    renderProximasGuardias(data.guardias.proximas);
    renderFormacionesPendientes(data.formacion.pendientes);
    renderCarnets(data.carnets);
    renderPermisosBienestar(data.permisos.resumen);
    renderDatosPersonales(data.persona);
}

// ── PERFIL ────────────────────────────────────────────────────────────────────
function renderPerfil(persona) {
    if (!persona) return;

    // Foto de perfil
    const img = document.getElementById('profilePic');
    if (img) {
        img.src = persona.foto_perfil
            ? `/storage/fotos/${persona.foto_perfil}`
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(persona.nombre + '+' + persona.apellidos)}&background=dc3545&color=fff&size=150`;
    }

    // Nombre, rol, ID, antigüedad
    setText('perfil-nombre',      `${persona.nombre} ${persona.apellidos}`);
    setText('perfil-rol',         persona.rol_nombre || '—');
    setText('perfil-id',          persona.id_bombero);
    setText('perfil-nfuncionario',persona.n_funcionario);
    setText('perfil-ingreso',     formatearFecha(persona.f_ingreso_diputacion));
    setText('perfil-anios',       `${persona.anios_servicio ?? 0} años de servicio`);
}

// ── ESTADÍSTICAS ──────────────────────────────────────────────────────────────
function renderEstadisticas(data) {
    const em = data.emergencias || {};
    const fo = data.formacion?.resumen || {};
    const gu = data.guardias?.resumen || {};
    const ca = data.carnets?.resumen || {};
    const tu = data.turnos_refuerzo || {};

    // Tarjetas rápidas
    setNum('stat-emergencias',       em.total_emergencias);
    setNum('stat-horas-formacion',   fo.horas_formacion_total);
    setNum('stat-guardias',          gu.total_guardias);
    setNum('stat-carnets',           ca.vigentes);
    setNum('stat-horas-refuerzo',    tu.horas_refuerzo_total);
    setNum('stat-meritos',           (data.meritos || []).length);

    // Emergencias por tipo
    setNum('stat-incendios',         em.incendios);
    setNum('stat-rescates',          em.rescates);
    setNum('stat-mmpp',              em.materias_peligrosas);
    setNum('stat-otros-em',          em.otros);

    // Indicadores de productividad
    setText('stat-avg-respuesta',    em.avg_respuesta_min != null ? `${em.avg_respuesta_min} min` : '—');
    setText('stat-avg-resolucion',   em.avg_resolucion_min != null ? `${em.avg_resolucion_min} min` : '—');
    setText('stat-pct-exitosas',     em.pct_exitosas != null ? `${em.pct_exitosas}%` : '—');

    // Emergencias periodo
    setNum('stat-em-anio',           em.emergencias_anio);
    setNum('stat-em-mes',            em.emergencias_mes);
    setNum('stat-guardias-anio',     gu.guardias_anio);
    setNum('stat-horas-guardia',     gu.horas_guardia_total ? Math.round(gu.horas_guardia_total) : 0);
    setNum('stat-horas-form-anio',   fo.horas_formacion_anio);
    setNum('stat-horas-ref-anio',    tu.horas_refuerzo_anio);
}

// ── MÉRITOS / LOGROS ──────────────────────────────────────────────────────────
const MERIT_ICONS = {
    'Cruz':      'bi-shield-fill-check',
    'Medalla':   'bi-award-fill',
    'Felicit':   'bi-star-fill',
    '10 años':   'bi-calendar2-check-fill',
    '20 años':   'bi-calendar2-heart-fill',
    'Rescate':   'bi-heart-pulse-fill',
};
const MERIT_COLORS = ['text-warning','text-primary','text-success','text-danger','text-info','text-secondary'];

function renderMeritos(meritos) {
    const container = document.getElementById('logros-container');
    if (!container) return;
    container.innerHTML = '';

    // Logros desbloqueados
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

    // Logros bloqueados (relleno visual)
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

// ── PRÓXIMAS GUARDIAS ─────────────────────────────────────────────────────────
function renderProximasGuardias(guardias) {
    const ul = document.getElementById('lista-proximas-guardias');
    if (!ul) return;
    ul.innerHTML = '';

    if (!guardias || guardias.length === 0) {
        ul.innerHTML = '<li class="list-group-item text-muted px-0">Sin guardias próximas asignadas</li>';
        return;
    }

    guardias.forEach(g => {
        ul.innerHTML += `
            <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                <div>
                    <strong>${formatearFecha(g.fecha)}</strong>
                    <br>
                    <small class="text-muted">${g.h_inicio?.substring(0,5)} – ${g.h_fin?.substring(0,5)} · ${g.cargo || ''}</small>
                </div>
                <span class="badge bg-info">Confirmada</span>
            </li>`;
    });
}

// ── FORMACIONES PENDIENTES ────────────────────────────────────────────────────
function renderFormacionesPendientes(formaciones) {
    const ul = document.getElementById('lista-formaciones-pendientes');
    if (!ul) return;
    ul.innerHTML = '';

    if (!formaciones || formaciones.length === 0) {
        ul.innerHTML = '<li class="list-group-item text-muted px-0">Sin formaciones pendientes</li>';
        return;
    }

    formaciones.forEach(f => {
        ul.innerHTML += `
            <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                <div>
                    <strong>${f.nombre}</strong>
                    <br>
                    <small class="text-muted">${formatearFecha(f.f_inicio)} · ${f.horas}h</small>
                </div>
                <span class="badge bg-primary">Inscrito</span>
            </li>`;
    });
}

// ── CARNETS ───────────────────────────────────────────────────────────────────
function renderCarnets(carnets) {
    setNum('stat-carnets-vigentes',  carnets?.resumen?.vigentes);
    setNum('stat-carnets-caducados', carnets?.resumen?.caducados);
    setNum('stat-carnets-vencer',    carnets?.resumen?.proximos_vencer);

    const tbody = document.getElementById('tabla-carnets');
    if (!tbody) return;
    tbody.innerHTML = '';

    (carnets?.detalle || []).forEach(c => {
        const vencido = c.vigente == 0;
        tbody.innerHTML += `
            <tr class="${vencido ? 'table-danger' : ''}">
                <td>${c.nombre}</td>
                <td><span class="badge bg-secondary">${c.categoria}</span></td>
                <td>${formatearFecha(c.f_obtencion)}</td>
                <td>${formatearFecha(c.f_vencimiento)}</td>
                <td>
                    <span class="badge ${vencido ? 'bg-danger' : 'bg-success'}">
                        ${vencido ? 'Caducado' : 'Vigente'}
                    </span>
                </td>
            </tr>`;
    });
}

// ── BIENESTAR / PERMISOS ──────────────────────────────────────────────────────
function renderPermisosBienestar(resumen) {
    if (!resumen) return;
    setNum('bienestar-asuntos-propios',   resumen.dias_asuntos_propios);
    setNum('bienestar-enfermedad',        resumen.dias_enfermedad);
    setNum('bienestar-accidente-laboral', resumen.dias_accidente_laboral);
    setNum('bienestar-fallecimiento-1',   resumen.dias_fallecimiento_1);
    setNum('bienestar-fallecimiento-2',   resumen.dias_fallecimiento_2);
    setNum('bienestar-total-permisos',    resumen.total_permisos);
    setNum('bienestar-aceptados',         resumen.aceptados);
    setNum('bienestar-denegados',         resumen.denegados);
}

// ── DATOS PERSONALES ──────────────────────────────────────────────────────────
function renderDatosPersonales(p) {
    if (!p) return;
    setVal('dp-n-funcionario',      p.n_funcionario);
    setVal('dp-nombre',             p.nombre);
    setVal('dp-apellidos',          p.apellidos);
    setVal('dp-nombre-usuario',     p.nombre_usuario);
    setVal('dp-correo',             p.correo);
    setVal('dp-dni',                p.dni);
    setVal('dp-f-nacimiento',       p.f_nacimiento);
    setVal('dp-f-ingreso',          p.f_ingreso_diputacion);
    setVal('dp-telefono',           p.telefono);
    setVal('dp-telefono-emergencia',p.telefono_emergencia);
    setVal('dp-talla-superior',     p.talla_superior);
    setVal('dp-talla-inferior',     p.talla_inferior);
    setVal('dp-talla-calzado',      p.talla_calzado);
    setVal('dp-domicilio',          p.domicilio);
    setVal('dp-localidad',          p.localidad);
}

// ── FORMULARIO DATOS PERSONALES ───────────────────────────────────────────────
function bindFormDatosPersonales() {
    const form = document.getElementById('formAreaPersonal');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!idBomberoActual) return;

        const data = {};
        const campos = [
            'correo','telefono','telefono_emergencia',
            'talla_superior','talla_inferior','talla_calzado',
            'domicilio','localidad','nombre_usuario'
        ];

        campos.forEach(campo => {
            const el = document.getElementById(`dp-${campo.replace(/_/g,'-')}`);
            if (el && !el.readOnly && el.value !== '') {
                data[campo] = campo === 'talla_calzado' ? Number(el.value) || el.value : el.value;
            }
        });

        try {
            await AreaPersonalApi.updateDatosPersonales(idBomberoActual, data);
            mostrarExito('Datos personales actualizados correctamente');
        } catch (err) {
            mostrarError(err.message || 'Error al guardar los cambios');
        }
    });

    // Botón cancelar: recarga los datos originales
    const btnCancelar = document.getElementById('btn-cancelar-datos');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            if (statsData?.persona) renderDatosPersonales(statsData.persona);
        });
    }
}

// ── FOTO DE PERFIL ────────────────────────────────────────────────────────────
function bindFotoPerfil() {
    const fileInput = document.getElementById('fileInput');
    if (!fileInput) return;

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Preview inmediato
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = document.getElementById('profilePic');
            if (img) img.src = ev.target.result;
        };
        reader.readAsDataURL(file);

        // Subir al servidor
        if (!idBomberoActual) return;
        try {
            await AreaPersonalApi.uploadFotoPerfil(idBomberoActual, file);
            mostrarExito('Foto de perfil actualizada');
        } catch (err) {
            mostrarError(err.message || 'Error al subir la foto');
        }
    });
}

// ── CERRAR SESIÓN ─────────────────────────────────────────────────────────────
function bindCerrarSesion() {
    document.querySelectorAll('.logout-link').forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                // Llamada al backend de logout si existe
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            } catch (_) { /* ignorar errores de red */ }
            sessionStorage.clear();
            localStorage.clear();
            window.location.href = '/frontend/pages/Login/login.html';
        });
    });
}

// ── FILTRO DE ESTADÍSTICAS (selector año/mes) ─────────────────────────────────
function bindFiltroEstadisticas() {
    // Ejemplo: si se añade un selector de periodo, aquí se enlazaría
    // Por ahora, los filtros anuales ya vienen calculados en el backend
}

// ── SKELETON LOADING ──────────────────────────────────────────────────────────
function mostrarSkeleton(show) {
    document.querySelectorAll('.skeleton-placeholder').forEach(el => {
        el.style.display = show ? 'block' : 'none';
    });
    document.querySelectorAll('.content-area').forEach(el => {
        el.style.opacity = show ? '0' : '1';
        el.style.transition = 'opacity 0.3s ease';
    });
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? '—';
}

function setNum(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value != null ? Number(value).toLocaleString('es-ES') : '0';
}

function setVal(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value ?? '';
}