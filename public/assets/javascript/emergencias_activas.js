
document.addEventListener("DOMContentLoaded", () => {

    /* ============================
       VER DETALLE EMERGENCIA
    ============================ */
    document.querySelectorAll(".btn-ver-emergencia").forEach(btn => {
        btn.addEventListener("click", () => {

            const data = btn.dataset;

            const body = `
                <p><strong>ID Emergencia:</strong> ${data.id}</p>
                <p><strong>Tipo:</strong> ${data.tipo}</p>
                <p><strong>Dirección:</strong> ${data.direccion}</p>
                <p><strong>Hora activación:</strong> ${data.hora}</p>
                <p><strong>Equipos asignados:</strong> ${data.equipos}</p>
                <p><strong>Vehículos asignados:</strong> ${data.vehiculos}</p>
            `;

            document.getElementById("modalVerEmergenciaBody").innerHTML = body;

            const modal = new bootstrap.Modal(
                document.getElementById("modalVerEmergencia")
            );
            modal.show();
        });
    });

    /* ============================
       CERRAR EMERGENCIA
    ============================ */
    document.querySelectorAll(".btn-cerrar-emergencia").forEach(btn => {
        btn.addEventListener("click", () => {

            const emergenciaId = btn.dataset.id;
            document.getElementById("cerrarEmergenciaId").value = emergenciaId;

            const modal = new bootstrap.Modal(
                document.getElementById("modalCerrarEmergencia")
            );
            modal.show();
        });
    });

    /* ============================
       CONFIRMAR CIERRE
    ============================ */
    document
        .getElementById("btnConfirmarCerrarEmergencia")
        .addEventListener("click", () => {

            const id = document.getElementById("cerrarEmergenciaId").value;

            // AQUÍ iría tu fetch / AJAX al backend
            console.log("Cerrando emergencia:", id);

            // Simulación visual (opcional)
            alert(`Emergencia ${id} cerrada`);

            bootstrap.Modal
                .getInstance(document.getElementById("modalCerrarEmergencia"))
                .hide();
        });
    });

