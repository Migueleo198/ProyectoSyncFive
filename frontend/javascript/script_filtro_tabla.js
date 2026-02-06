document.addEventListener('DOMContentLoaded', () => {

    // Filtro
    document.querySelectorAll('.filtro').forEach(input => {
        input.addEventListener('input', filtrarTabla);
    });

    function filtrarTabla() {
        const filtros = document.querySelectorAll('.filtro');
        const filas = document.querySelectorAll('#tabla tbody tr');

        filas.forEach(fila => {
            let visible = true;

            filtros.forEach(filtro => {
                const col = filtro.dataset.col;
                const valor = filtro.value.toLowerCase();
                const textoCelda = fila.children[col].textContent.toLowerCase();

                if (valor && !textoCelda.includes(valor)) {
                    visible = false;
                }
            });

            fila.style.display = visible ? '' : 'none';
        });
    }

    // Modal VER dinámico
    const modalVer = document.getElementById('modalVer');

    modalVer.addEventListener('show.bs.modal', function (event) {
        const button = event.relatedTarget;
        const row = button.closest('tr');
        const cells = row.querySelectorAll('td');
        const headerCells = document.querySelectorAll('#tabla thead tr th');

        const modalBody = document.getElementById('modalVerBody');
        modalBody.innerHTML = ''; // Limpiar contenido previo

        cells.forEach((cell, index) => {
            // Omitimos la columna de acciones si tiene botones
            if (cell.querySelector('button')) return;

            // Tomamos el nombre de la columna desde el encabezado
            const headerText = headerCells[index].textContent.trim();
            const cellText = cell.textContent.trim();

            const p = document.createElement('p');
            p.innerHTML = `<strong>${headerText}:</strong> ${cellText}`;
            modalBody.appendChild(p);
        });
    });

});