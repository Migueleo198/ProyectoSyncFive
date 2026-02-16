import AvisoApi from '../api_f/AvisoApi.js';

let avisos = []; // variable global para almacenar avisos

document.addEventListener('DOMContentLoaded', () => {
    cargarAvisos();
    bindCrearAviso();
});

// ================================
// CARGAR AVISOS
// ================================
async function cargarAvisos() {
  try {
    const response = await AvisoApi.getAll();
    avisos = response.data; // guardamos globalmente
    renderTablaAvisos(avisos);
  } catch (e) {
    mostrarError(e.message || 'Error cargando avisos');
  }
}

// ================================
// RENDER TABLA
// ================================
function renderTablaAvisos(avisos) {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';

  avisos.forEach(a => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td class="d-none d-md-table-cell">${a.id_aviso}</td>
      <td>${a.asunto ?? ''}</td>
      <td>${a.mensaje ?? ''}</td>
      <td class="d-none d-md-table-cell">${a.fecha ?? ''}</td>
      <td class="d-none d-md-table-cell">${a.remitente ?? ''}</td>
      <td class="d-flex justify-content-around">
        <button type="button" class="btn p-0 btn-ver"
                data-bs-toggle="modal"
                data-bs-target="#modalVer"
                data-id="${a.id_aviso}">
            <i class="bi bi-eye"></i>
        </button>

        <button type="button" class="btn p-0 btn-eliminar"
                data-bs-toggle="modal"
                data-bs-target="#modalEliminar"
                data-id="${a.id_aviso}">
            <i class="bi bi-trash3"></i>
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// ================================
// CREAR / INSERTAR AVISO
// ================================
function bindCrearAviso() {
  const form = document.getElementById('formInsertar');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = new FormData(form);

    const asunto = f.get('asunto');
    const mensaje = f.get('mensaje');

    const selectDest = document.getElementById('insertDestinatarios');

    const destinatarios = Array.from(selectDest.selectedOptions)
      .map(opt => opt.value);

    try {
      
      // Crear aviso (SIN remitente)
      const response = await AvisoApi.create({
        asunto,
        mensaje,
        fecha: new Date().toISOString()
      });

      const idAviso = response.data.id;

      // Asignar destinatarios
      for (const idBombero of destinatarios) {
        await AvisoApi.setDestinatario(idAviso, idBombero);
      }

      await cargarAvisos();
      form.reset();

      alert('Aviso creado correctamente');
    } catch (err) {
      mostrarError(err.message || 'Error creando aviso');
    }
  });
}

    
// ================================
// CAMPOS DE LA TABLA      estos arrays se usan para mostrar los campos en el modal ver (arriba como lo quieres ver, abajo como están en la base de datos, el orden debe coincidir)  
// ================================
  const nombresCampos = [
    'ID',
    'Asunto',
    'Mensaje',
    'Fecha',
    'Remitente'
  ];

  const camposBd = [      //tambien se usan para el modal editar, para recoger los datos de los inputs y enviarlos al backend, por eso deben coincidir con los name de los inputs del formulario editar
    'id_aviso',
    'asunto',
    'mensaje',
    'fecha',
    'remitente'
  ];

// ================================
// MODAL VER
// ================================
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-ver');
  if (!btn) return;

  const id = btn.dataset.id;

  // Buscar el aviso correspondiente
  const avisos = aviso.find(em => em.id_aviso == id);
  if (!avisos) return;

  const modalBody = document.getElementById('modalVerBody');

  // Limpiar contenido previo
  while (modalBody.firstChild) {
    modalBody.removeChild(modalBody.firstChild);
  }

  nombresCampos.forEach((nombre, index) => {
    const p = document.createElement('p');

    const strong = document.createElement('strong');
    strong.textContent = nombre + ': ';

    const value = document.createTextNode(
      aviso[camposBd[index]] ?? ''
    );

    p.appendChild(strong);
    p.appendChild(value);
    modalBody.appendChild(p);
  });
});

// ================================
// MODAL ELIMINAR (AÑADIR SI SE REQUIERE)   
// ================================
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-eliminar');
  if (!btn) return;

  const id = btn.dataset.id;

  const btnConfirm = document.getElementById('btnConfirmarEliminar');
  btnConfirm.dataset.id = id;
});

document.getElementById('btnConfirmarEliminar')
  .addEventListener('click', async function () {

    const id = this.dataset.id;
    if (!id) return;

    try {
      await AvisoApi.delete(id);
      await cargarAvisos();

      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById('modalEliminar')
      );
      modal.hide();

    } catch (error) {
      console.error('Error al eliminar aviso:', error);
    }
});


// ================================
// ERRORES
// ================================
function mostrarError(msg) {
  alert(msg);
}
