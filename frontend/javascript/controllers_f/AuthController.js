import AuthApi from '../api_f/AuthApi.js';

document.addEventListener('DOMContentLoaded', () => {
    // ── Página login ──────────────────────────────────
    if (document.querySelector('form#loginForm')) {
        bindLogin();
        bindRecoverPassword();
    }

    // ── Página cambiar contraseña ─────────────────────
    if (document.querySelector('form#changePasswordForm')) {
        bindChangePassword();
    }

    // ── Página activar cuenta ─────────────────────────
    if (document.getElementById('activation-loading-state')) {
        bindActivateAccount();
    }
});

// ================================
// LOGIN
// ================================
function bindLogin() {
  const form = document.querySelector('form#loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const login = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
      const response = await AuthApi.login({
        login: login,
        password: password
      });

      const user = response.data.user;

      // Guardamos usuario en sessionStorage
      sessionStorage.setItem('user', JSON.stringify(user));

      // Redirigir a home
      window.location.href = '/frontend/pages/home.html';

    } catch (error) {
      mostrarError(error.message || 'Error al iniciar sesión');
    }
  });
}

// ================================
// RECUPERAR CONTRASEÑA
// ================================
function bindRecoverPassword() {
    const btn = document.getElementById('btnEnviarRecuperacion');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        const emailInput = document.getElementById('recoverEmail');
        const errorDiv   = document.getElementById('recover-error');

        // Limpiar error previo
        errorDiv.classList.add('d-none');
        errorDiv.textContent = '';

        // Validación básica cliente
        if (!emailInput.value.trim()) {
            errorDiv.textContent = 'Por favor, introduce tu correo electrónico.';
            errorDiv.classList.remove('d-none');
            return;
        }

        // Mostrar spinner
        setRecoverLoading(true);

        try {
            await AuthApi.recoverPassword({ correo: emailInput.value.trim() });

            // Mostrar estado de éxito (independientemente de si el correo existe)
            document.getElementById('recover-form-state').classList.add('d-none');
            document.getElementById('recover-success-state').classList.remove('d-none');
            document.getElementById('recover-footer').classList.add('d-none');

        } catch (error) {
            errorDiv.textContent = error.message || 'Error al enviar el correo. Inténtalo de nuevo.';
            errorDiv.classList.remove('d-none');
        } finally {
            setRecoverLoading(false);
        }
    });

    // Limpiar estado del modal al cerrarlo
    const modal = document.getElementById('modalRecuperarPassword');
    modal.addEventListener('hidden.bs.modal', () => {
        document.getElementById('recoverEmail').value = '';
        document.getElementById('recover-error').classList.add('d-none');
        document.getElementById('recover-form-state').classList.remove('d-none');
        document.getElementById('recover-success-state').classList.add('d-none');
        document.getElementById('recover-footer').classList.remove('d-none');
        setRecoverLoading(false);
    });
}

function setRecoverLoading(loading) {
    const btn     = document.getElementById('btnEnviarRecuperacion');
    const text    = document.getElementById('btnRecuperarText');
    const spinner = document.getElementById('btnRecuperarSpinner');

    btn.disabled = loading;
    text.classList.toggle('d-none', loading);
    spinner.classList.toggle('d-none', !loading);
}

// ================================
// CAMBIAR CONTRASEÑA (desde email)
// ================================
function bindChangePassword() {
    // Leer el token de la URL: ?token=xxxx
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');

    // Si no hay token, mostrar error directamente
    if (!token) {
        document.getElementById('change-form-state').classList.add('d-none');
        document.getElementById('token-error-state').classList.remove('d-none');
        return;
    }

    const form = document.querySelector('form#changePasswordForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newPassword     = document.getElementById('newPassword').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();
        const errorDiv        = document.getElementById('change-error');

        // Limpiar error previo
        errorDiv.classList.add('d-none');
        errorDiv.textContent = '';

        // Validación cliente
        if (newPassword !== confirmPassword) {
            errorDiv.textContent = 'Las contraseñas no coinciden.';
            errorDiv.classList.remove('d-none');
            return;
        }

        if (newPassword.length < 6) {
            errorDiv.textContent = 'La contraseña debe tener al menos 6 caracteres.';
            errorDiv.classList.remove('d-none');
            return;
        }

        setChangeLoading(true);

        try {
            await AuthApi.changePassword({ token, password: newPassword });

            // Mostrar éxito
            document.getElementById('change-form-state').classList.add('d-none');
            document.getElementById('change-success-state').classList.remove('d-none');

        } catch (error) {
            const code = error.code || error.status || 0;

            if (code === 404 || code === 400) {
                document.getElementById('change-form-state').classList.add('d-none');
                document.getElementById('token-error-state').classList.remove('d-none');
            } else {
                errorDiv.textContent = error.message || 'Error al cambiar la contraseña.';
                errorDiv.classList.remove('d-none');
            }
        } finally {
            setChangeLoading(false);
        }
    });
}

function setChangeLoading(loading) {
    const btn     = document.getElementById('btnCambiar');
    const text    = document.getElementById('btnCambiarText');
    const spinner = document.getElementById('btnCambiarSpinner');

    btn.disabled = loading;
    text.classList.toggle('d-none', loading);
    spinner.classList.toggle('d-none', !loading);
}

// ================================
// ACTIVAR CUENTA
// ================================
async function bindActivateAccount() {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');

    // Sin token → error inmediato
    if (!token) {
        showActivationState('error', 'No se encontró ningún token de activación en el enlace.');
        return;
    }

    try {
        await AuthApi.activateAccount(token);
        showActivationState('success');

    } catch (error) {
        // ApiClient lanza el objeto JSON crudo, leemos lo que venga
        const code = error.code || error.status || 0;
        const msg  = (code === 404)
            ? 'El enlace de activación no existe o ya fue utilizado.'
            : (code === 400 || code === 410)
                ? 'El enlace de activación ha expirado. Contacta con un administrador.'
                : error.message || 'Error inesperado. Por favor, inténtalo de nuevo más tarde.';

        showActivationState('error', msg);
    }
}

function showActivationState(state, errorMsg = null) {
    // Ocultar todos los estados
    document.getElementById('activation-loading-state').classList.add('d-none');
    document.getElementById('activation-success-state').classList.add('d-none');
    document.getElementById('activation-error-state').classList.add('d-none');

    if (state === 'success') {
        document.getElementById('activation-success-state').classList.remove('d-none');
    } else {
        if (errorMsg) {
            document.getElementById('activation-error-msg').textContent = errorMsg;
        }
        document.getElementById('activation-error-state').classList.remove('d-none');
    }
}

// ================================
// MOSTRAR NOMBRE DE USUARIO
// ================================
export function mostrarNombreUsuario() {
  const userData = sessionStorage.getItem('user');
  
  if (!userData) {
    // Si no hay usuario, redirigir al login
    if (!window.location.pathname.includes('login.html') &&
        !window.location.pathname.includes('cambiarPassword.html') &&
        !window.location.pathname.includes('activarCuenta.html')) {
        window.location.href = '/frontend/pages/Login/login.html';
    }
    return;
  }

  const user = JSON.parse(userData);

  // Actualizar todos los spans de usuario en el header
  document.querySelectorAll('.header-user span').forEach(span => {
        span.textContent = user.nombre_usuario || user.login || 'Usuario';
  });
}

// ================================
// BIND LOGOUT BUTTONS
// ================================
export function bindLogoutButtons() {
  // Seleccionar todos los enlaces/botones de logout
  document.querySelectorAll('.logout-link').forEach(link => {
      link.addEventListener('click', async (e) => {
          e.preventDefault();
          await cerrarSesion();
      });
  });
}

// ================================
// CERRAR SESIÓN
// ================================
export async function cerrarSesion() {
    try {
        // Llamada al backend
        await AuthApi.logout();
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    } finally {
        // Aunque falle el backend, limpiamos la sesión local
        sessionStorage.removeItem('user');
        window.location.href = '/frontend/pages/Login/login.html';
    }
}

// ================================
// ERROR
// ================================
function mostrarError(msg) {
  alert(msg);
}
