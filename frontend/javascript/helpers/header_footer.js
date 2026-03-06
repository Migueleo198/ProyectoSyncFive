// Recibimos el nombre de usuario y logouts
import { mostrarNombreUsuario, bindLogoutButtons } from '../controllers_f/AuthController.js';
import { mostrarEmergenciasHeader } from '../controllers_f/EmergenciasActivasController.js';
import ApiClient from '../api_f/ApiClient.js';

// Carga HTML en un contenedor usando getPath de config.js
async function cargarHTML(id, fileName) {
    const container = document.getElementById(id);
    if (!container) return;

    try {
        const url = getPath("includes", fileName);
        const res = await fetch(url);
        
        if (!res.ok) throw new Error(`Error al cargar ${url}: ${res.status}`);

        container.innerHTML = await res.text();

        // Redimensiona imágenes con atributos data-resize
        container.querySelectorAll("img[data-resize]").forEach(img => {
            img.style.height = img.dataset.height || "auto";
            img.style.width = img.dataset.width || "auto";
        });

        // EJECUTAR LÓGICA POST-CARGA
        if (fileName === 'header.html') {
            mostrarNombreUsuario();
            mostrarEmergenciasHeader();
            cargarFotoHeader();
        }
        
        if (fileName === 'sidebar.html') {
            bindLogoutButtons();
        }

    } catch (err) {
        console.error(err);
        container.innerHTML = `<div class="alert alert-danger">Error al cargar ${fileName}</div>`;
    }
}

/**
 * Carga la foto de perfil del usuario logueado en el header.
 * Si no tiene foto usa el icono por defecto (no hace nada).
 */
async function cargarFotoHeader() {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (!user?.foto_perfil) return;

    try {
        // Reutilizamos el mismo endpoint protegido que usa el área personal
        const { API_BASE_PATH } = await import('../../config/apiConfig.js');
        const response = await fetch(`${API_BASE_PATH}/storage/fotos/${user.foto_perfil}`, {
            credentials: 'include'
        });
        if (!response.ok) return;

        const blob      = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        // Sustituir el icono por la foto en el header
        const iconEl = document.querySelector('#header-placeholder .header-user .bi-person-circle');
        if (iconEl) {
            const img = document.createElement('img');
            img.src = objectUrl;
            img.alt = 'Foto de perfil';
            img.className = 'header-profile-pic';
            iconEl.replaceWith(img);
        }
    } catch (_) {
        // Si falla silenciosamente, el icono por defecto permanece
    }
}

// Ejecutar al cargar el DOM
async function initLayout() {
    await cargarHTML("header-placeholder", "header.html");
    await cargarHTML("sidebar-placeholder", "sidebar.html");
    await cargarHTML("footer-placeholder", "footer.html");
}

// Funciona tanto si el DOM ya está listo como si todavía no
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLayout);
} else {
    // DOMContentLoaded ya se disparó (script cargado dinámicamente)
    initLayout();
}