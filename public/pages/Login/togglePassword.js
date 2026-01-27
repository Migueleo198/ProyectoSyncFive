function togglePassword() {
  const pass = document.getElementById("password");
  pass.type = pass.type === "password" ? "text" : "password";
}

const TOGGLE_PASS_INPUT = document.querySelector('#showPassword');
TOGGLE_PASS_INPUT.addEventListener('click', togglePassword);


const USER_EXAMPLE = 'root';
const USER_PASS_EXAMPLE = 'root';


const INPUT_USER = document.querySelector('#user');
const INPUT_PASS = document.querySelector('#password');


const LOGIN_FORM = document.querySelector('form');
LOGIN_FORM.addEventListener('submit', checkLogin);

function checkLogin(event) {
  event.preventDefault();

  const FORM_DATA = new FormData(LOGIN_FORM);
  const user = FORM_DATA.get('user');
  const pass = FORM_DATA.get('password');

  if (user === USER_EXAMPLE && pass === USER_PASS_EXAMPLE) {
    window.location.href = '/pages/home.html';
}
 else {
    alert('Usuario o contraseña incorrectos');
  }
}


