// Script del filtro
    document.querySelectorAll('.filtro').forEach(input => {
    input.addEventListener('input', () => {
        const col = input.dataset.col;
        const valor = input.value.toLowerCase();
        const filas = document.querySelectorAll('#tabla tbody tr');

        filas.forEach(fila => {
        const celda = fila.children[col].textContent.toLowerCase();
        fila.style.display = celda.includes(valor) ? '' : 'none';
        });
    });
    });
