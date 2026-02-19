const ELEMENT_TBODY = document.querySelector('tbody');

const TR_LIST = ELEMENT_TBODY.querySelectorAll('tr');

TR_LIST.forEach((element, index) => {




    const TD_ACTIONS = document.createElement('td');
    TD_ACTIONS.classList.add('d-flex', 'justify-content-around');


    const BTN_SEE = document.createElement('button');
    BTN_SEE.type = 'button';
    BTN_SEE.classList.add('btn', 'p-0');
    BTN_SEE.setAttribute('data-bs-toggle', 'modal');
    BTN_SEE.setAttribute('data-bs-target', '#modalVer');

    const ICON_SEE = document.createElement('i');
    ICON_SEE.classList.add('bi', 'bi-eye');
    BTN_SEE.appendChild(ICON_SEE);


    const BTN_EDIT = document.createElement('button');
    BTN_EDIT.type = 'button';
    BTN_EDIT.classList.add('btn', 'p-0');
    BTN_EDIT.setAttribute('data-bs-toggle', 'modal');
    BTN_EDIT.setAttribute('data-bs-target', '#modalEditar');

    const ICON_EDIT = document.createElement('i');
    ICON_EDIT.classList.add('bi', 'bi-pencil');
    BTN_EDIT.appendChild(ICON_EDIT);


    const BTN_DEL = document.createElement('button');
    BTN_DEL.type = 'button';
    BTN_DEL.classList.add('btn', 'p-0');
    BTN_DEL.setAttribute('data-bs-toggle', 'modal');
    BTN_DEL.setAttribute('data-bs-target', '#modalEliminar');

    const ICON_DEL = document.createElement('i');
    ICON_DEL.classList.add('bi', 'bi-trash3');
    BTN_DEL.appendChild(ICON_DEL);

    TD_ACTIONS.appendChild(BTN_SEE);
    TD_ACTIONS.appendChild(BTN_EDIT);
    TD_ACTIONS.appendChild(BTN_DEL);




    element.appendChild(TD_ACTIONS);



});

document.addEventListener('DOMContentLoaded', filters);

function filters() {

    const filtros = document.querySelectorAll('.filtro');
    console.log(filtros);
    filtros.forEach(filtro => {
        filtro.addEventListener('input', filtrarTabla);
        filtro.addEventListener('change', filtrarTabla);
    });


}


function filtrarTabla() {
    console.log('filtrar funciona');

    const tabla = document
        .getElementById('tabla')
        .getElementsByTagName('tbody')[0];

    const filas = tabla.getElementsByTagName('tr');

    const idFiltro = document.getElementById('filtroIdentificador').value.toLowerCase();
    const grupoFiltro = document.getElementById('filtroGrupo').value;
    const fIniFiltro = document.getElementById('filtroFIni').value;
    const fFinFiltro = document.getElementById('filtroFFin').value;
    const estadoFiltro = document.getElementById('filtroEstado').value;

   
    const fIniFiltroDate = fIniFiltro ? new Date(fIniFiltro + 'T00:00:00') : null;
    const fFinFiltroDate = fFinFiltro ? new Date(fFinFiltro + 'T00:00:00') : null;

    for (let i = 0; i < filas.length; i++) {
        const celdas = filas[i].getElementsByTagName('td');

        const idValor = celdas[1].textContent.toLowerCase();
        const grupoValor = celdas[2].textContent;

        const fIniValorText = celdas[4].textContent.trim();
        const fFinValorText = celdas[5].textContent.trim();

        const fIniValorDate = new Date(fIniValorText + 'T00:00:00');
        const fFinValorDate = new Date(fFinValorText + 'T00:00:00');

        const estadoValor = celdas[6].textContent;

        let mostrar = true;

        if (idFiltro && !idValor.includes(idFiltro)) mostrar = false;
        if (grupoFiltro && grupoValor !== grupoFiltro) mostrar = false;

      
        if (fIniFiltroDate && fIniValorDate < fIniFiltroDate) mostrar = false;
        if (fFinFiltroDate && fFinValorDate > fFinFiltroDate) mostrar = false;

        if (estadoFiltro && estadoValor !== estadoFiltro) mostrar = false;

        filas[i].style.display = mostrar ? '' : 'none';
    }
}











