// ================================
// FORMATEO FECHA Y HORA
// ================================
export function formatearFechaHora(fechaISO) {
  if (!fechaISO) return '';
  const fecha = new Date(fechaISO);

  return fecha.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

// ================================
// FORMATEO SOLO FECHA (como usas en avisos)
// ================================
export function formatearFecha(fecha) {
  if (!fecha) return '—';
  try {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return fecha;
  }
}

// ================================
// TRUNCAR TEXTO
// ================================
export function truncar(texto, max) {
  if (!texto) return '';
  return texto.length > max
    ? texto.substring(0, max) + '…'
    : texto;
}

// ================================
// ALERTAS GENERALES
// ================================
export function mostrarAlerta(msg, tipo = 'info') {
  const container = document.getElementById('alert-container');
  if (!container) { 
    alert(msg); 
    return; 
  }

  const id  = `alert-${Date.now()}`;
  const div = document.createElement('div');
  div.id        = id;
  div.className = `alert alert-${tipo} alert-dismissible fade show shadow-sm`;
  div.role      = 'alert';
  div.innerHTML = `
    ${msg}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  container.appendChild(div);

  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) el.remove();
  }, 4000);
}

export function mostrarError(msg) {
  mostrarAlerta(msg, 'danger');
}

export function mostrarExito(msg) {
  mostrarAlerta(msg, 'success');
}
