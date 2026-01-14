// Función para cargar HTML en un contenedor
    async function cargarHTML(id, url) {
        const res = await fetch(url);
        const html = await res.text();
        document.getElementById(id).innerHTML = html;
    }
    document.addEventListener("DOMContentLoaded", () => {
        cargarHTML("header-placeholder", "../html/header.html");
        cargarHTML("footer-placeholder", "../html/footer.html");
    });