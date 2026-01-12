<?php

    // Ruta de la aplicacion
    define('RUTA_APP', dirname(dirname(__FILE__)));

    // Ruta url, Ejemplo: http://localhost/daw2_mvc
    define('RUTA_URL', '/mvc_completo-24_25');

    define('NOMBRE_SITIO', 'CRUD MVC - DAW2 Alcañiz 2024-2025');


    // Configuracion de la Base de Datos
    define('DB_HOST', 'localhost');
    define('DB_USUARIO', 'root');
    define('DB_PASSWORD', '');
    define('DB_NOMBRE', 'crud_mvc');

    // Configuracion Tamaño de pagina en la paginacion
    define('TAM_PAGINA', 3);

    // Duracion de la sesion
    define('TMP_SESION', 365 * 24 * 60 * 60);   // un año
