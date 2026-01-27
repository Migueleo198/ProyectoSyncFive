<?php

declare(strict_types=1);

/**
 * Front Controller
 * public/index.php
 */


// ---------------------------
// CARGAR CONFIG Y AUTOLOAD DE COMPOSER
// ---------------------------
require_once __DIR__ . '/../config/config.php';      // Config global
require_once __DIR__ . '/../vendor/autoload.php';    // Composer: PHPMailer y otras dependencias

// ---------------------------
// INICIADOR DE LA APP
// ---------------------------
require_once __DIR__ . '/../App/iniciador.php';

// ---------------------------
// INSTANCIAR CORE
// ---------------------------
$iniciar = new Core;

// ---------------------------
// Cabeceras de seguridad y CORS
// ---------------------------
if (php_sapi_name() !== 'cli') {
    header_remove('X-Powered-By');                              // Elimina el header que revela que usas PHP
    @header_remove('Server');                                   // El @ suprime errores si no puede eliminar el header

    header('Access-Control-Allow-Origin: ' . CONFIG_CORS);
    if (CONFIG_CORS !== '*') {                 // Para permitir cookies en CORS (en sesiones desde otro dominio):
        header('Access-Control-Allow-Credentials: true');
    }
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');  // Métodos permitidos
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');    // Headers permitidos

    // Manejar preflight requests (consultas previas de CORS)
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);                                // Responde "No Content"
        exit;
    }
}


// ---------------------------
// Autoloader PSR-4
// ---------------------------
spl_autoload_register(function (string $class): bool {
    $class = ltrim($class, '\\');
    
    $path = APP_DIR . '/' . str_replace('\\', '/', $class) . '.php';
    
    if (file_exists($path)) {
        require $path;
        return true;
    }
    
    return false;
});


// ---------------------------
// Manejo de errores y excepciones  // CONVERTIR ERRORES EN EXCEPCIONES
// ---------------------------
set_error_handler(fn($severity, $message, $file, $line) => 
    throw new ErrorException($message, 0, $severity, $file, $line));

set_exception_handler(function ($ex) {
    http_response_code($ex->getCode() ?: 500);

    $message = $ex->getMessage();

    // Obtener formato de error desde config
    $format = $GLOBALS['config']['default_error_format'] ?? 'html';

    if ($format === 'json') {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'status' => 'error',
            'message' => $message,
            'exception' => get_class($ex),
            'trace' => app_env() === 'development' ? $ex->getTrace() : null
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    } else {                                            // Si estamos en vista HTML → mostramos plantilla error
        $path = APP_DIR . '/Views/errors/500.php';
        if (file_exists($path)) {
            include $path;
        } else {
            echo "<h1>Error interno del servidor</h1><p>{$message}</p>";
        }
    }

    // Log opcional
    if (!is_dir(STORAGE_DIR . '/logs')) {
        @mkdir(STORAGE_DIR . '/logs', 0775, true);
    }
    @file_put_contents(STORAGE_DIR . '/logs/app.log', date('c') . " - Exception: " . $ex->getMessage() . PHP_EOL, FILE_APPEND);

    exit;
});

// ---------------------------
// Normalizar método: (soporte X-HTTP-Method-Override). Necesario para simular DELETE, PUT ...
// ---------------------------
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';          // Obtener el método HTTP (GET, POST, etc.) de la request
if ($method === 'POST') {
    $hdr = $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] 
        ?? $_SERVER['HTTP_X_METHOD_OVERRIDE'] 
        ?? $_POST['_method'] 
        ?? null;
    if ($hdr) $method = strtoupper($hdr);
}


// ---------------------------
// Normalizar URI
// ---------------------------
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';

if (BASE_PATH !== '' && str_starts_with($uri, BASE_PATH)) {
    $uri = substr($uri, strlen(BASE_PATH));
}

$uri = '/' . trim($uri, '/');


// ---------------------------
// Instanciar Router y cargar rutas
// ---------------------------
$router = new \Core\Router();
require CONFIG_DIR . '/routes.php';

// ---------------------------
// Dispatch
// ---------------------------
$router->dispatch($method, $uri);
