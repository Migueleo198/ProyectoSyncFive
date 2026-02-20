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
document.addEventListener("DOMContentLoaded", async () => {
    cargarHTML("header-placeholder", "header.html");
    cargarHTML("sidebar-placeholder", "sidebar.html");
    cargarHTML("footer-placeholder", "footer.html");
});
