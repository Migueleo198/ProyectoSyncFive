<?php
declare(strict_types=1);

/**
 * config/config.php
 * Configuración global del proyecto.
 */

// ----------------------------------------------------
// PATHS DEL PROYECTO
// ----------------------------------------------------
define('BASE_DIR', dirname(__DIR__));
define('APP_DIR', BASE_DIR . '/src');
define('CONFIG_DIR', BASE_DIR . '/config');
define('STORAGE_DIR', BASE_DIR . '/storage');


// ----------------------------------------------------
// ENTORNO
// ----------------------------------------------------
define('APP_ENV', 'development');               // Cambiar entre 'development' y 'production' en servidor real
define('APP_DEBUG', APP_ENV !== 'production');
date_default_timezone_set('Europe/Madrid');

/**
 * CONFIGURACIÓN BASE_PATH - LEE CON ATENCIÓN
 * 
 * Esta constante define el directorio base de tu aplicación en el servidor web.
 * 
 * EJEMPLOS PRÁCTICOS:
 * 
 * CASO 1: Aplicación en RAÍZ del dominio
 *   URL: https://midominio.com/
 *   BASE_PATH: ''
 * 
 * CASO 2: Aplicación en SUBDIRECTORIO  
 *   URL: https://midominio.com/mi-app/
 *   BASE_PATH: '/mi-app'
 */
define('BASE_PATH', '/api_mantenimiento_informatico');


// ----------------------------------------------------
// DATABASE
// ----------------------------------------------------
define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'mantenimiento_informatico');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');


// ----------------------------------------------------
// SESIONES / TIEMPOS
// ----------------------------------------------------
define('TMP_SESION', 60 * 60 * 24 * 365); // 1 año


// ----------------------------------------------------
// CORS
// ----------------------------------------------------
define('CONFIG_CORS', '*');    // Cambiar por dominio real  // CORS CONFIGURACIÓN ACTUAL (DEMASIADO PERMISIVA): Permite acceso desde CUALQUIER dominio


// ----------------------------------------------------
// CONFIG GLOBAL
// ----------------------------------------------------
$GLOBALS['config'] = [
    'jwt' => [
        'default_exp_minutes' => 60 * 24 * 365,     // El token expirara en: 1 año
    ],
    'rate_limit' => [               // limitamos a 100 peticiones en un minuto.
        'max_requests' => 100,
        'window_seconds' => 60,
    ],
    'default_error_format' => 'json',   // html|json
];


// ----------------------------------------------------
// HELPERS
// ----------------------------------------------------
function app_env(): string { return APP_ENV; }
function app_debug(): bool { return APP_DEBUG; }

// ----------------------------------------------------
// EMAIL / SMTP
// ----------------------------------------------------
$GLOBALS['config']['email'] = [
    'host'       => 'smtp.tuservidor.com',
    'username'   => 'tu_correo@dominio.com',
    'password'   => 'tu_contraseña',
    'port'       => 587,
    'encryption' => 'tls', // tls o ssl
    'from_email' => 'no-reply@miapp.com',
    'from_name'  => 'MiApp'
];
