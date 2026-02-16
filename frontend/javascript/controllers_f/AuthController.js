import AuthApi from '../api_f/AuthApi.js';

document.addEventListener('DOMContentLoaded', () => {
  // Solo se ejecuta si estamos en la página de login
  const loginForm = document.querySelector('form#loginForm');
  if (loginForm) {
      bindLogin();
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
// MOSTRAR NOMBRE DE USUARIO
// ================================
export function mostrarNombreUsuario() {
  const userData = sessionStorage.getItem('user');
  
  if (!userData) {
    // Si no hay usuario, redirigir al login
    if (!window.location.pathname.includes('login.html')) {
        window.location.href = '/frontend/pages/Login/login.html';
    }
    return;
  }

  const user = JSON.parse(userData);

  // Actualizar todos los spans de usuario en el header
  const userSpans = document.querySelectorAll('.header-user span');
  userSpans.forEach(span => {
    span.textContent = user.nombre_usuario || user.login || 'Usuario';
  });
}

// ================================
// BIND LOGOUT BUTTONS
// ================================
export function bindLogoutButtons() {
    // Seleccionar todos los enlaces/botones de logout
    const logoutLinks = document.querySelectorAll('.logout-link');
    
    logoutLinks.forEach(link => {
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

        // Limpiamos la sesión local
        sessionStorage.removeItem('user');

        // Redirigimos al login
        window.location.href = '/frontend/pages/Login/login.html';
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        
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
