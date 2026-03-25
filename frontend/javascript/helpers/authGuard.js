/**
 * authGuard.js
 *
 * Guard de autenticación y autorización para el frontend.
 *
 * USO en cada controlador:
 *
 *   import { authGuard } from '../helpers/authGuard.js';
 *
 *   document.addEventListener('DOMContentLoaded', async () => {
 *     const sesion = await authGuard('emergencias');
 *     if (!sesion) return; // redirigido automáticamente
 *
 *     // sesion.usuario  → datos del usuario logueado
 *     // sesion.rol      → número de rol (1-5)
 *     // sesion.puedeEscribir → boolean
 *     // sesion.puedeEliminar → boolean
 *
 *     cargarEmergencias(sesion.puedeEscribir);
 *   });
 */

import { PERMISOS }      from '/frontend/config/permissions.js';
import { API_BASE_PATH } from '/frontend/config/apiConfig.js';

const LOGIN_URL    = '/login';
const ERROR403_URL = '/frontend/errores/err403.html';
const API_ME_URL   = `${API_BASE_PATH}/auth/me`;

/**
 * Ejecuta el guard completo.
 *
 * @param {string} clavePagina - Clave en PERMISOS (ej: 'emergencias')
 * @returns {Promise<{usuario: object, rol: number, puedeEscribir: boolean, puedeEliminar: boolean} | null>}
 */
export async function authGuard(clavePagina) {
  // ── 1. Verificar sesión activa ──────────────────────────────
  let usuario;
  try {
    const response = await fetch(API_ME_URL, { credentials: 'include' });

    if (response.status === 401 || response.status === 403) {
      redirigir(LOGIN_URL);
      return null;
    }
    if (!response.ok) {
      redirigir(LOGIN_URL);
      return null;
    }

    const data = await response.json();
    usuario = data.data?.user ?? data.data ?? data;

    // Refrescar sessionStorage con datos reales del servidor,
    // sobreescribiendo cualquier manipulación del cliente
    sessionStorage.setItem('user', JSON.stringify(usuario));

  } catch (_e) {
    // Sin conexión o error de red → al login
    redirigir(LOGIN_URL);
    return null;
  }

  // ── 2. Verificar permisos para esta página ──────────────────
  const permisos = PERMISOS[clavePagina];

  if (!permisos) {
    // La página no está registrada en permissions.js → bloquear por seguridad
    console.warn(`[authGuard] La clave '${clavePagina}' no existe en permissions.js`);
    redirigir(ERROR403_URL);
    return null;
  }

  const rolUsuario = Number(usuario.id_rol ?? usuario.rol ?? 0);

  if (!permisos.rolesLectura.includes(rolUsuario)) {
    redirigir(ERROR403_URL);
    return null;
  }

  // ── 3. Determinar si puede escribir ────────────────────────
  const puedeEscribir = permisos.rolesEscritura.includes(rolUsuario);
  const rolesEliminar = permisos.rolesEliminar ?? permisos.rolesEscritura;
  const puedeEliminar = rolesEliminar.includes(rolUsuario);

  // ── 4. Adaptar UI si es solo lectura ───────────────────────
  if (!puedeEscribir) {
    aplicarModoLectura();
  }

  return { usuario, rol: rolUsuario, puedeEscribir, puedeEliminar };
}

// ────────────────────────────────────────────────────────────────
// MODO LECTURA: oculta formularios de inserción y botones de acción
// ────────────────────────────────────────────────────────────────

/**
 * Oculta todos los elementos de escritura de la página.
 * Se llama inmediatamente (antes de que la tabla se rellene con JS),
 * e inyecta CSS para que los botones de editar/eliminar no aparezcan
 * aunque se rendericen dinámicamente después.
 */
function aplicarModoLectura() {
  // Inyectar reglas CSS que bloquean los botones antes de que existan en el DOM
  const style = document.createElement('style');
  style.id = 'auth-readonly-styles';
  style.textContent = `
    /* Ocultar botones de acción de escritura en tablas */
    .btn-editar,
    .btn-eliminar,
    .btn-editar-vehiculos { display: none !important; }

    /* Ocultar formularios de inserción */
    .contenedorInsertar { display: none !important; }

    /* Centrar el botón ver si era el único visible */
    .btn-ver { margin: 0 auto; }
  `;
  document.head.appendChild(style);

  // También ocultar elementos ya presentes en el DOM en este momento
  document.querySelectorAll('.contenedorInsertar').forEach(el => {
    el.style.display = 'none';
  });
}

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

function redirigir(url) {
  // Evitar bucles de redirección si ya estamos en la página destino
  if (!window.location.pathname.endsWith(url.split('/').pop())) {
    window.location.href = url;
  }
}
