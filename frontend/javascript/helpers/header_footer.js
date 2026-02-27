// Recibimos el nombre de usuario y logouts
import { mostrarNombreUsuario, bindLogoutButtons } from '../controllers_f/AuthController.js';

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
        }
        
        if (fileName === 'sidebar.html') {
            bindLogoutButtons();
        }

    } catch (err) {
        console.error(err);
        container.innerHTML = `<div class="alert alert-danger">Error al cargar ${fileName}</div>`;
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