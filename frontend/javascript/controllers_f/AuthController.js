import AuthApi from '../api_f/AuthApi.js';

document.addEventListener('DOMContentLoaded', () => {
  bindLogin();
});

// ================================
// LOGIN
// ================================
function bindLogin() {
  const form = document.querySelector('form');
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
// ERROR
// ================================
function mostrarError(msg) {
  alert(msg);
}
