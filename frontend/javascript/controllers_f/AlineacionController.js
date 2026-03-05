import GuardiaApi from '/frontend/javascript/api_f/GuardiaApi.js';
import { mostrarError, mostrarExito } from '../helpers/utils.js';

let guardiaActual = null;
let personasEnGuardia = [];

document.addEventListener('DOMContentLoaded', () => {
    const inputFecha = document.getElementById('fechaGuardia');
    inputFecha.value = getFechaHoy();
    cargarGuardiaPorFecha(inputFecha.value);
    cargarTurnoRefuerzo(inputFecha.value);
    inputFecha.addEventListener('change', e => 
        cargarTurnoRefuerzo(e.target.value) &&
        cargarGuardiaPorFecha(e.target.value));
    document.getElementById('btnInsertar').addEventListener('click', guardarAlineacion);
    document.getElementById('btnLimpiar').addEventListener('click', limpiarFormulario);
    document.getElementById('gridAlineacion').addEventListener('change', () => sincronizarSelectsYLista());
});

async function cargarGuardiaPorFecha(fecha) {
    resetearVista();
    try {
        const respuesta = await GuardiaApi.getByDate(fecha);
        const datos = respuesta.data;
        if (!datos || datos.length === 0) {
            mostrarError('No hay guardia registrada para esta fecha.');
            guardiaActual = null;
            personasEnGuardia = [];
            sincronizarSelectsYLista();
            return;
        }
        guardiaActual = { id_guardia: datos[0].id_guardia, fecha: datos[0].fecha };
        personasEnGuardia = datos.map(r => ({
            id_bombero: String(r.id_bombero),
            nombre:     r.nombre,
            apellidos:  r.apellidos,
            cargo:      r.cargo ?? null,
        }));

        // Rellenar notas desde la guardia
        document.getElementById('notasGuardia').value = datos[0].notas ?? '';

        const selects = document.querySelectorAll('#gridAlineacion select[data-cargo]');
        selects.forEach(select => {
            while (select.options.length > 1) select.remove(1);
            personasEnGuardia.forEach(p => {
                select.add(new Option(`${p.nombre} ${p.apellidos}`, p.id_bombero));
            });
        });
        selects.forEach(select => {
            const asignada = personasEnGuardia.find(p => p.cargo === select.dataset.cargo);
            select.value = asignada ? asignada.id_bombero : '';
        });
        sincronizarSelectsYLista();
    } catch (err) {
        mostrarError('Error al cargar la guardia.');
    }
}

function sincronizarSelectsYLista() {
    const selects = [...document.querySelectorAll('#gridAlineacion select[data-cargo]')];
    const seleccionados = new Map();
    selects.forEach(select => { if (select.value) seleccionados.set(select.value, select); });
    selects.forEach(select => {
        const valorActual = select.value;
        while (select.options.length > 1) select.remove(1);
        personasEnGuardia.forEach(p => {
            const ocupadoPorOtro = seleccionados.has(p.id_bombero) && seleccionados.get(p.id_bombero) !== select;
            if (!ocupadoPorOtro) select.add(new Option(`${p.nombre} ${p.apellidos}`, p.id_bombero));
        });
        select.value = valorActual;
    });
    const sinAsignar = personasEnGuardia.filter(p => !seleccionados.has(p.id_bombero));
    actualizarListaSinCargo(sinAsignar);
}

function actualizarListaSinCargo(personas) {
    const contenedor  = document.getElementById('listaSinCargo');
    const placeholder = document.getElementById('sinCargoPlaceholder');
    contenedor.querySelectorAll('.card-bombero').forEach(el => el.remove());
    if (personas.length === 0) {
        placeholder.textContent = guardiaActual
            ? 'Todos los bomberos tienen cargo asignado.'
            : 'Selecciona una fecha para cargar la guardia.';
        placeholder.classList.remove('d-none');
        return;
    }
    placeholder.classList.add('d-none');
    personas.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card-bombero d-flex align-items-center gap-2 px-3 py-2 border rounded bg-white';
        card.style.cssText = 'min-height: 48px;';
        card.innerHTML = `
            <div class="rounded-circle bg-secondary d-flex align-items-center justify-content-center flex-shrink-0"
                 style="width:32px; height:32px;">
                <span class="text-white fw-bold" style="font-size:0.7rem; line-height:1;">
                    ${iniciales(p.nombre, p.apellidos)}
                </span>
            </div>
            <div class="overflow-hidden">
                <div class="fw-semibold text-dark small text-truncate">${p.nombre} ${p.apellidos}</div>
                <div class="text-muted" style="font-size:0.7rem;">Sin cargo asignado</div>
            </div>
        `;
        contenedor.appendChild(card);
    });
}

function iniciales(nombre, apellidos) {
    const n = nombre?.charAt(0).toUpperCase() ?? '';
    const a = apellidos?.charAt(0).toUpperCase() ?? '';
    return `${n}${a}`;
}

async function guardarAlineacion() {
    if (!guardiaActual) { mostrarError('No hay guardia cargada para guardar.'); return; }

    const selects = document.querySelectorAll('#gridAlineacion select[data-cargo]');
    const operaciones = [];
    selects.forEach(select => {
        const cargo = select.dataset.cargo;
        if (select.value) {
            operaciones.push({ id_bombero: select.value, id_guardia: guardiaActual.id_guardia, cargo });
        } else {
            // Slot vacío: si alguien tenía este cargo en BD, borrárselo con null
            const teniaCargo = personasEnGuardia.find(p => p.cargo === cargo);
            if (teniaCargo) {
                operaciones.push({ id_bombero: teniaCargo.id_bombero, id_guardia: guardiaActual.id_guardia, cargo: null });
            }
        }
    });

    const btnGuardar = document.getElementById('btnInsertar');
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando…';

    try {
        // Guardar cargos
        for (const op of operaciones) {
            await GuardiaApi.updateCargo(op.id_bombero, op.id_guardia, op.cargo);
        }

        // Guardar notas
        const notas = document.getElementById('notasGuardia').value;
        await GuardiaApi.updateNotas(guardiaActual.id_guardia, notas);

        mostrarExito('Alineación guardada correctamente.');
        await cargarGuardiaPorFecha(document.getElementById('fechaGuardia').value);
    } catch (err) {
        mostrarError('Error al guardar la alineación.');
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.textContent = 'Guardar';
    } 
}

async function cargarTurnoRefuerzo(fecha) {
    const contenedor = document.getElementById('refuerzosDia'); // ← ID correcto
    contenedor.innerHTML = '';
    try {
        const respuesta = await GuardiaApi.getTurnoRefuerzoByFecha(fecha);
        const datos = respuesta.data;
        if (!datos || datos.length === 0) {
            contenedor.innerHTML = '<p class="text-muted small mb-0">Sin refuerzos para este día.</p>';
            return;
        }
        datos.forEach(turno => {                          // ← iterar todos
            const card = document.createElement('div');
            card.className = 'card-bombero d-flex align-items-center gap-2 px-3 py-2 border rounded bg-white';
            card.style.cssText = 'min-height: 48px;';
            card.innerHTML = `
                <div class="rounded-circle bg-secondary d-flex align-items-center justify-content-center flex-shrink-0"
                     style="width:32px; height:32px;">
                    <span class="text-white fw-bold" style="font-size:0.7rem; line-height:1;">
                        ${iniciales(turno.nombre, turno.apellidos)}
                    </span>
                </div>
                <div class="overflow-hidden">
                    <div class="fw-semibold text-dark small text-truncate">${turno.nombre} ${turno.apellidos}</div>
                    <div class="text-muted" style="font-size:0.7rem;">Turno refuerzo</div>
                </div>
            `;
            contenedor.appendChild(card);
        });
    } catch (err) {
    }
}

function getFechaHoy() { return new Date().toISOString().split('T')[0]; }

function resetearVista() {
    document.querySelectorAll('#gridAlineacion select[data-cargo]').forEach(select => {
        while (select.options.length > 1) select.remove(1);
        select.value = '';
    });
    document.getElementById('notasGuardia').value = '';
    actualizarListaSinCargo([]);
}

function limpiarFormulario() {
    document.querySelectorAll('#gridAlineacion select[data-cargo]').forEach(s => s.value = '');
    document.getElementById('notasGuardia').value = '';
    sincronizarSelectsYLista();
}