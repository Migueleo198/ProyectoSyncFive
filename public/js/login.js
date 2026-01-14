console.log('funciona'); 

const URL_USUARIOS = "/js/jsonEejemploUsuarios.json";

async function getUsuarios() {
    const RESPONSE = await fetch(URL_USUARIOS);

    if (!RESPONSE.ok) {
        throw new Error('Error al cargar los datos');
    }

    return await RESPONSE.json();
}

const TABLE = document.createElement('table');
TABLE.border = "1";

async function init() {
    const DATA = await getUsuarios();

    const USERS = DATA.users;
    
    USERS.forEach(user => {
        console.log(user);
        const TR = document.createElement('tr');

        const TD_USUARIO = document.createElement('td');
        TD_USUARIO.textContent = user.username;

        const TD_PASSWORD = document.createElement('td');
        TD_PASSWORD.textContent = user.email;

        TR.appendChild(TD_USUARIO);
        TR.appendChild(TD_PASSWORD);
        TABLE.appendChild(TR);
    });
}

document.body.appendChild(TABLE);
init();
