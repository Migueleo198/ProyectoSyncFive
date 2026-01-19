// Función para cargar HTML en un contenedor
    async function cargarHTML(id, url) {
        const res = await fetch(url);
        const html = await res.text();
        document.getElementById(id).innerHTML = html;
    }
    document.addEventListener("DOMContentLoaded", () => {
        cargarHTML("header-placeholder", "../../includes/footer.html");
        cargarHTML("footer-placeholder", "../../includes/footer.html");
    });