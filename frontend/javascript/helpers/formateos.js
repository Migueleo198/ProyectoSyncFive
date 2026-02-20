
const Formateos = {
    //++++++++++++++++ Formateo fecha +++++++++++++++++++
    formatearFechaHora(fechaISO) {
    if (!fechaISO) return '';

    const fecha = new Date(fechaISO);

    return fecha.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false   // formato 24h
    });
    }
}

export default Formateos;