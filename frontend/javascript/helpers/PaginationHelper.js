/**
 * Sistema de paginación moderno para tablas
 */
export class PaginationHelper {
    constructor(itemsPerPage = 10) {
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 0;
        this.totalItems = 0;
        this.onPageChange = null; // Callback cuando cambia la página
    }

    /**
     * Configura los datos y renderiza la primera página
     */
    setData(items, onPageChange) {
        this.totalItems = items.length;
        this.currentPage = 0;
        this.onPageChange = onPageChange;
        this.render();
        return this.getPageItems(items);
    }

    /**
     * Obtiene los items de la página actual
     */
    getPageItems(items) {
        const start = this.currentPage * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        return items.slice(start, end);
    }

    /**
     * Calcula el número total de páginas
     */
    getTotalPages() {
        return Math.ceil(this.totalItems / this.itemsPerPage);
    }

    /**
     * Cambia a una página específica
     */
    goToPage(page) {
        const totalPages = this.getTotalPages();
        
        if (page < 0 || page >= totalPages) return;
        
        this.currentPage = page;
        this.render();
        
        if (this.onPageChange) {
            this.onPageChange(page);
        }
    }

    /**
     * Renderiza los controles de paginación
     */
    render(containerId = 'pagination-container') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const totalPages = this.getTotalPages();

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = `
            <nav aria-label="Paginación">
                <ul class="pagination justify-content-center mb-0">
        `;

        // Botón anterior
        if (this.currentPage === 0) {
            html += `
                <li class="page-item disabled">
                    <span class="page-link">«</span>
                </li>
            `;
        } else {
            html += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${this.currentPage - 1}">«</a>
                </li>
            `;
        }

        // Números de página (con ellipsis si hay muchas)
        const pageNumbers = this.getPageNumbers(totalPages);
        
        pageNumbers.forEach(page => {
            if (page === '...') {
                html += `
                    <li class="page-item disabled">
                        <span class="page-link">...</span>
                    </li>
                `;
            } else if (page === this.currentPage) {
                html += `
                    <li class="page-item active">
                        <span class="page-link">${page + 1}</span>
                    </li>
                `;
            } else {
                html += `
                    <li class="page-item">
                        <a class="page-link" href="#" data-page="${page}">${page + 1}</a>
                    </li>
                `;
            }
        });

        // Botón siguiente
        if (this.currentPage === totalPages - 1) {
            html += `
                <li class="page-item disabled">
                    <span class="page-link">»</span>
                </li>
            `;
        } else {
            html += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${this.currentPage + 1}">»</a>
                </li>
            `;
        }

        html += `
                </ul>
            </nav>
            <div class="text-center text-muted mt-2">
                <small>
                    Mostrando ${this.currentPage * this.itemsPerPage + 1} - 
                    ${Math.min((this.currentPage + 1) * this.itemsPerPage, this.totalItems)} 
                    de ${this.totalItems} registros
                </small>
            </div>
        `;

        container.innerHTML = html;

        // Bind eventos de clic
        container.querySelectorAll('a[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                this.goToPage(page);
            });
        });
    }

    /**
     * Genera array de números de página con ellipsis
     * Ejemplo: [0, 1, 2, '...', 8, 9, 10] para página actual = 1 y total = 11
     */
    getPageNumbers(totalPages) {
        const current = this.currentPage;
        const delta = 2; // Páginas a mostrar alrededor de la actual

        const range = [];
        const rangeWithDots = [];

        for (let i = 0; i < totalPages; i++) {
            if (
                i === 0 || // Primera página
                i === totalPages - 1 || // Última página
                (i >= current - delta && i <= current + delta) // Páginas cercanas a la actual
            ) {
                range.push(i);
            }
        }

        let prev;
        for (const i of range) {
            if (prev !== undefined && i - prev > 1) {
                rangeWithDots.push('...');
            }
            rangeWithDots.push(i);
            prev = i;
        }

        return rangeWithDots;
    }
}