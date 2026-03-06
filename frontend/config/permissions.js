/**
 * permissions.js
 * 
 * Configuración centralizada de permisos por página.
 * 
 * Roles del sistema:
 *   1 = Básico (solo lectura)
 *   2 = Operativo
 *   3 = Suboficial
 *   4 = Oficial / Gestor
 *   5 = Administrador
 * 
 * Cada entrada define:
 *   - rolesLectura:   roles que pueden acceder y VER la página
 *   - rolesEscritura: roles que pueden INSERT / EDIT / DELETE
 *                     (deben ser subconjunto de rolesLectura)
 */

export const PERMISOS = {

  // ── OPERACIONES ──────────────────────────────────────────────
  emergencias: {
    rolesLectura:   [1, 2, 3, 4, 5],
    rolesEscritura: [3, 4, 5],
  },
  tiposEmergencia: {
    rolesLectura:   [1, 2, 3, 4, 5],
    rolesEscritura: [3, 4, 5],
  },
  avisos: {
    rolesLectura:   [1, 2, 3, 4, 5],
    rolesEscritura: [2, 3, 4, 5],
  },

  // ── PERSONAL ─────────────────────────────────────────────────
  personas: {
    rolesLectura:   [1, 2, 3, 4, 5],
    rolesEscritura: [4, 5],
  },
  alineacion:{
    rolesLectura:   [2, 3, 4, 5],
    rolesEscritura: [2, 3, 4, 5]
  },
  guardias: {
    rolesLectura:   [1, 2, 3, 4, 5],
    rolesEscritura: [4, 5],
  },
  turnoRefuerzos: {
    rolesLectura:   [1, 2, 3, 4, 5],
    rolesEscritura: [3, 4, 5],
  },
  formaciones: {
    rolesLectura:   [1, 2, 3, 4, 5],
    rolesEscritura: [4, 5],
  },
  ediciones: {
    rolesLectura:   [1, 2, 3, 4, 5],
    rolesEscritura: [4, 5], 
  },
  carnets: {
    rolesLectura:   [1, 2, 3, 4, 5],
    rolesEscritura: [4, 5],
  },
  permisos: {
    rolesLectura:   [1, 2, 3, 4, 5],
    rolesEscritura: [1, 2, 3, 4, 5], // cualquiera puede solicitar
  },
  motivos: {
    rolesLectura:   [1, 2, 3, 4, 5],
    rolesEscritura: [4, 5],
  },

  // ── RECURSOS ─────────────────────────────────────────────────
  vehiculos: {
    rolesLectura:   [1, 2, 3, 4, 5],
    rolesEscritura: [4, 5],
  },
  salidas: {
    rolesLectura:   [1, 2, 3, 4, 5],
    rolesEscritura: [4, 5],
  },
  materiales: {
    rolesLectura:   [1, 2, 3, 4, 5],
    rolesEscritura: [4, 5],
  },
  mantenimiento: {
    rolesLectura:   [1, 2, 3, 4, 5],
    rolesEscritura: [4, 5],
  },
  incidencias: {
    rolesLectura:   [1, 2, 3, 4, 5],
    rolesEscritura: [4, 5],
  },
  categorias: {
    rolesLectura:   [1, 2, 3, 4, 5],
    rolesEscritura: [4, 5],
  },
  almacenes: {
    rolesLectura:   [1, 2, 3, 4, 5],
    rolesEscritura: [4, 5],
  },
  instalaciones: {
    rolesLectura:   [1, 2, 3, 4, 5],
    rolesEscritura: [4, 5],
  },

  // ── GESTIÓN ──────────────────────────────────────────────────
  usuarios: {
    rolesLectura:   [4, 5],
    rolesEscritura: [5],
  },
  roles: {
    rolesLectura:   [4, 5],
    rolesEscritura: [5],
  },
};