// Recibimos el nombre de usuario y logouts
import { mostrarNombreUsuario, bindLogoutButtons, getHeaderAvatarSrc, getStoredSessionUser } from '../controllers_f/AuthController.js';
import { mostrarEmergenciasHeader } from '../controllers_f/EmergenciasActivasController.js';

const LAYOUT_CACHE_KEYS = {
    header: 'layout-cache:header.html'
};

function obtenerLayoutCacheado(cacheKey) {
    try {
        return sessionStorage.getItem(cacheKey);
    } catch (_) {
        return null;
    }
}

function guardarLayoutCacheado(cacheKey, html) {
    try {
        sessionStorage.setItem(cacheKey, html);
    } catch (_) {
        // Ignoramos errores de quota o acceso al storage.
    }
}

function prepararHeaderHTML(html) {
    const user = getStoredSessionUser();
    if (!user) return html;

    const template = document.createElement('template');
    template.innerHTML = html.trim();

    const userNameEl = template.content.querySelector('#header-user-name');
    if (userNameEl) {
        userNameEl.textContent = user.nombre_usuario || user.login || 'Usuario';
    }

    const avatarImgEl = template.content.querySelector('#header-user-avatar');
    const avatarFallbackEl = template.content.querySelector('#header-user-avatar-fallback');
    const avatarSrc = getHeaderAvatarSrc(user.foto_perfil);

    if (!avatarImgEl || !avatarFallbackEl) {
        return template.innerHTML;
    }

    if (!avatarSrc) {
        avatarImgEl.classList.add('d-none');
        avatarFallbackEl.classList.remove('d-none');
        return template.innerHTML;
    }

    avatarImgEl.src = avatarSrc;
    avatarImgEl.decoding = 'async';
    avatarImgEl.classList.remove('d-none');
    avatarFallbackEl.classList.add('d-none');

    return template.innerHTML;
}

function renderizarHeaderCacheado() {
    const container = document.getElementById('header-placeholder');
    if (!container) return false;

    const cachedHtml = obtenerLayoutCacheado(LAYOUT_CACHE_KEYS.header);
    if (!cachedHtml) return false;

    container.innerHTML = prepararHeaderHTML(cachedHtml);
    mostrarNombreUsuario();
    mostrarEmergenciasHeader();
    return true;
}

// Carga HTML en un contenedor usando getPath de config.js
async function cargarHTML(id, fileName) {
    const container = document.getElementById(id);
    if (!container) return;

    try {
        const url = getPath("includes", fileName);
        const res = await fetch(url);
        
        if (!res.ok) throw new Error(`Error al cargar ${url}: ${res.status}`);

        let html = await res.text();

        if (fileName === 'header.html') {
            guardarLayoutCacheado(LAYOUT_CACHE_KEYS.header, html);
            html = prepararHeaderHTML(html);
        }

        container.innerHTML = html;

        // Redimensiona imágenes con atributos data-resize
        container.querySelectorAll("img[data-resize]").forEach(img => {
            img.style.height = img.dataset.height || "auto";
            img.style.width = img.dataset.width || "auto";
        });

        // EJECUTAR LÓGICA POST-CARGA
        if (fileName === 'header.html') {
            mostrarNombreUsuario();
            mostrarEmergenciasHeader();
        }
        
        if (fileName === 'sidebar.html') {
            bindLogoutButtons();
        }

    } catch (err) {
        console.error(err);

        if (fileName === 'header.html' && container.innerHTML.trim()) {
            return;
        }

        container.innerHTML = `<div class="alert alert-danger">Error al cargar ${fileName}</div>`;
    }
}

// Ejecutar al cargar el DOM
async function initLayout() {
    renderizarHeaderCacheado();
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