<?php

    // Ruta de la aplicacion
    define('RUTA_APP', dirname(dirname(__FILE__)));

    // Ruta url, Ejemplo: http://localhost/daw2_mvc
    define('RUTA_URL', '/');

    define('NOMBRE_SITIO', 'SyncFive');


    // Configuracion de la Base de Datos
    define('DB_HOST', '192.168.13.108:3306');
    define('DB_USUARIO', 'root');
    define('DB_PASSWORD', '1234');
    define('DB_NOMBRE', 'SyncFive');

    // Configuracion Tamaño de pagina en la paginacion
    define('TAM_PAGINA', 3);

    // Duracion de la sesion
    define('TMP_SESION', 365 * 24 * 60 * 60);   // un año
