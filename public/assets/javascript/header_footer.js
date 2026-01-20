// Función para cargar HTML en un contenedor
async function cargarHTML(id, url) {
    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Error al cargar ${url}: ${res.status}`);
        }
        const html = await res.text();
        document.getElementById(id).innerHTML = html;
    } catch (error) {
        console.error(error);
        document.getElementById(id).innerHTML = `<div class="alert alert-danger">Error al cargar ${url}</div>`;
    }
}

// Configuración dinámica de rutas
document.addEventListener("DOMContentLoaded", () => {
    // Usar basePath si está definida, si no usar rutas relativas
    const base = typeof basePath !== 'undefined' ? basePath : '../';
    
    cargarHTML("header-placeholder", base + "includes/header.html");
    cargarHTML("sidebar-placeholder", base + "includes/sidebar.html");
    cargarHTML("footer-placeholder", base + "includes/footer.html");
});