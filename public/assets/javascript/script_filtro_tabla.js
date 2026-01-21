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

    // Modal VER
    const modalVer = document.getElementById('modalVer');

    modalVer.addEventListener('show.bs.modal', function (event) {
        const button = event.relatedTarget;
        const row = button.closest('tr');
        const cells = row.querySelectorAll('td');

        document.getElementById('verId').textContent     = cells[0].textContent.trim();
        document.getElementById('verNombre').textContent = cells[1].textContent.trim();
        document.getElementById('verGrupo').textContent  = cells[2].textContent.trim();
    });

});

