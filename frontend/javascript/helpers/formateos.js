const Formateos = {
  // ++++++++++++++++ Formateo fecha +++++++++++++++++++
  formatearFechaHora(fechaISO) {
    if (!fechaISO) return '';
    const fecha = new Date(fechaISO);

    return fecha.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // formato 24h
    });
  },

  // // Formato compatible con datetime-local
  // formatearDateTimeLocal(dateString) {
  //   if (!dateString) return '';
  //   const date = new Date(dateString);
  //   const pad = n => String(n).padStart(2, '0');
  //   return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  // }
};

export default Formateos;