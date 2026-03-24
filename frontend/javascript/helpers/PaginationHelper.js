/**
 * Sistema de paginación moderno para tablas
 */
export class PaginationHelper {
    constructor(itemsPerPage = 10) {
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 0;
        this.totalItems = 0;
        this.onPageChange = null;
        this.containerId = null;
        this.loadingCallback = null;
    }

    /**
     * Configura los datos y renderiza la primera página
     */
    setData(items, onPageChange) {
        // Mostrar loading antes de procesar
        if (this.loadingCallback) {
            this.loadingCallback(true);
        }
        
        this.totalItems = items.length;
        this.currentPage = 0;
        
        // Guardar el callback original para goToPage
        this.onPageChange = onPageChange;
        
        this.render();
        
        // Ejecutar el callback del usuario en el siguiente tick para que el loading sea visible
        setTimeout(() => {
            if (onPageChange) {
                onPageChange();
            }
            
            // Ocultar loading después de procesar
            if (this.loadingCallback) {
                this.loadingCallback(false);
            }
        }, 50); // Pequeño delay para que el spinner sea visible
        
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
        
        // Mostrar loading
        if (this.loadingCallback) {
            this.loadingCallback(true);
        }
        
        // Ejecutar callback con delay para que el loading sea visible
        setTimeout(() => {
            if (this.onPageChange) {
                this.onPageChange(page);
            }
            
            // Ocultar loading después del callback
            if (this.loadingCallback) {
                this.loadingCallback(false);
            }
        }, 50);
    }
    
    /**
     * Método para ocultar el loading (llamar después de renderizar la tabla)
     */
    hideLoading() {
        if (this.loadingCallback) {
            this.loadingCallback(false);
        }
    }

    /**
     * Establece el callback de loading
     */
    setLoadingCallback(callback) {
        this.loadingCallback = callback;
    }

    /**
     * Renderiza los controles de paginación
     */
    render(containerId) {
        if (containerId) {
            this.containerId = containerId;
        }
        
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // No renderizar si no hay datos
        if (this.totalItems <= 0) {
            container.innerHTML = '';
            return;
        }

        const totalPages = this.getTotalPages();

        // No renderizar si solo hay una página
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        const currentPage = this.currentPage;
        let navHtml = '';

        // Botón anterior
        if (currentPage === 0) {
            navHtml += '<li class="page-item disabled"><span class="page-link">«</span></li>';
        } else {
            navHtml += `<li class="page-item"><a class="page-link" href="javascript:void(0)" data-page="${currentPage - 1}">«</a></li>`;
        }

        // Números de página
        const pageNumbers = this.getPageNumbers(totalPages);
        
        pageNumbers.forEach(page => {
            if (page === '...') {
                navHtml += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            } else if (page === currentPage) {
                navHtml += `<li class="page-item active"><span class="page-link">${page + 1}</span></li>`;
            } else {
                navHtml += `<li class="page-item"><a class="page-link" href="javascript:void(0)" data-page="${page}">${page + 1}</a></li>`;
            }
        });

        // Botón siguiente
        if (currentPage === totalPages - 1) {
            navHtml += '<li class="page-item disabled"><span class="page-link">»</span></li>';
        } else {
            navHtml += `<li class="page-item"><a class="page-link" href="javascript:void(0)" data-page="${currentPage + 1}">»</a></li>`;
        }

        // Calcular rangos
        const startItem = Math.min(currentPage * this.itemsPerPage + 1, this.totalItems);
        const endItem = Math.min((currentPage + 1) * this.itemsPerPage, this.totalItems);

        // Generar HTML
        container.innerHTML = `
            <div class="pagination-info-custom">
                <i class="bi bi-collection"></i>
                <span>Mostrando <strong>${startItem}</strong> - <strong>${endItem}</strong> de <strong>${this.totalItems}</strong></span>
            </div>
            <ul class="pagination pagination-modern mb-0">
                ${navHtml}
            </ul>
        `;

        // Vincular eventos usando delegacion de eventos
        const self = this;
        container.onclick = function(e) {
            const link = e.target.closest('a[data-page]');
            if (link) {
                e.preventDefault();
                const page = parseInt(link.getAttribute('data-page'), 10);
                self.goToPage(page);
            }
        };
    }

    /**
     * Genera array de números de página con ellipsis
     */
    getPageNumbers(totalPages) {
        const current = this.currentPage;
        const delta = 2;

        const range = [];
        const rangeWithDots = [];

        for (let i = 0; i < totalPages; i++) {
            if (
                i === 0 ||
                i === totalPages - 1 ||
                (i >= current - delta && i <= current + delta)
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

/**
 * Helper para mostrar/ocultar indicador de carga en tablas
 */
export function showTableLoading(tbodyId, colspan = 1, show = true) {
    const tbody = document.querySelector(tbodyId);
    if (tbody) {
        if (show) {
            tbody.innerHTML = `
                <tr class="table-loading">
                    <td colspan="${colspan}" class="text-center py-4">
                        <div class="spinner-spinning" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        <span class="ms-2 loading-text">Cargando datos...</span>
                    </td>
                </tr>
            `;
        } else {
            // No hacemos nada aquí, el loading se reemplaza con los datos
        }
    }
}

/**
 * Oculta el indicador de carga
 */
export function hideTableLoading(tbodyId) {
    // El loading se oculta automáticamente cuando se renderizan los datos
    // Esta función está vacía pero se mantiene por compatibilidad
}