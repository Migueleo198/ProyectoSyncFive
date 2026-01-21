
function formatoFecha(fecha){
    if (fecha) {
        let fechaFin = new Date(fecha)
        return fechaFin.toLocaleString()
    } else {
        return '-'
    }
}

function paginar(paginaActual,numPaginas,ruta,destino =''){
    let salida = ''

    salida += `
        <nav aria-label="...">
            <ul class="pagination justify-content-center">`
                if (paginaActual <= 0){
                    salida += ` 
                    <li class="page-item disabled">
                        <span class="page-link"><<</span>
                    </li>`
                } else {
                    salida += ` 
                    <li class="page-item">
                        <a class="page-link" href="${ruta}/${paginaActual-1}"><<</a>
                    </li>`
                }
                
                for(i=0; i < numPaginas;i++){
                    if(i == paginaActual){
                        salida += ` 
                        <li class="page-item active">
                            <span class="page-link">${i+1}</span>
                        </li>
                        `
                    } else {
                        salida += ` 
                        <li class="page-item">
                            <a class="page-link" href="${ruta}/${i}">${i+1}</a>
                        </li>
                        `
                    }
                }

                if (paginaActual+1 >= numPaginas){
                    salida += ` 
                    <li class="page-item disabled">
                        <span class="page-link">>></span>
                    </li>`
                } else {
                    salida += ` 
                    <li class="page-item">
                        <a class="page-link" href="${ruta}/${paginaActual+1}">>></a>
                    </li>
                    `
                }
            salida += `
            </ul>
        </nav>
    `
    if (destino == ''){
        document.write(salida)
    }
    else {
        document.getElementById(destino).innerHTML = salida
    }
}


function paginarApi(paginaActual,numPaginas,funcionApi,destino){
    let salida = ''

    salida += `
        <nav aria-label="...">
            <ul class="pagination justify-content-center">`
                if (paginaActual <= 0){
                    salida += ` 
                    <li class="page-item disabled">
                        <span class="page-link"><<</span>
                    </li>`
                } else {
                    salida += ` 
                    <li class="page-item">
                        <a class="page-link" href="javascript:${funcionApi}${paginaActual-1})"><<</a>
                    </li>`
                }
                
                for(i=0; i < numPaginas;i++){
                    if(i == paginaActual){
                        salida += ` 
                        <li class="page-item active">
                            <span class="page-link">${i+1}</span>
                        </li>
                        `
                    } else {
                        salida += ` 
                        <li class="page-item">
                            <a class="page-link" href="javascript:${funcionApi}${i})">${i+1}</a>
                        </li>
                        `
                    }
                }

                if (paginaActual+1 >= numPaginas){
                    salida += ` 
                    <li class="page-item disabled">
                        <span class="page-link">>></span>
                    </li>`
                } else {
                    salida += ` 
                    <li class="page-item">
                        <a class="page-link" href="javascript:${funcionApi}${paginaActual+1})">>></a>
                    </li>
                    `
                }
            salida += `
            </ul>
        </nav>
    `

    document.getElementById(destino).innerHTML = salida
}