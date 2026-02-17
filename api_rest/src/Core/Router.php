<?php
declare(strict_types=1);

namespace Core;

use Exception;

class Router
{
    private array $routes = [];

    public function add(string $method, string $path, $handler): void
    {
        $method = strtoupper($method);
        $path = '/' . trim($path, '/');

        $this->routes[$method][$path] = [
            'action' => $handler,
            'protected' => false
        ];
    }


    public function get(string $path, $handler): void
    {
        $this->add('GET', $path, $handler);
    }

    public function post(string $path, $handler): void
    {
        $this->add('POST', $path, $handler);
    }

    public function put(string $path, $handler): void
    {
        $this->add('PUT', $path, $handler);
    }

    public function patch(string $path, $handler): void
    {
        $this->add('PATCH', $path, $handler);
    }

    public function delete(string $path, $handler): void
    {
        $this->add('DELETE', $path, $handler);
    }


    public function dispatch(string $method, string $uri): void
    {
        $method = strtoupper($method);
        $uri = '/' . trim($uri, '/');

        if (!isset($this->routes[$method])) {
            $this->sendNotFound("No routes defined for method $method");
        }

        foreach ($this->routes[$method] as $path => $routeInfo) {
            $pattern = preg_replace('#\{([^/]+)\}#', '([^/]+)', $path);
            $pattern = '#^' . $pattern . '$#';

            if (preg_match($pattern, $uri, $matches)) {
                array_shift($matches);

                $this->handle($routeInfo['action'], $matches, $routeInfo);
                return;
            }
        }
        $this->sendNotFound("Route not found for $method $uri");
    }


    private function handle($handler, array $params = [], array $routeInfo = []): void
    {
        $request = new \Core\Request();
        $response = new \Core\Response();


        // ===============================
        // 1) Rate limit
        // ===============================
        $rateLimiter = new \Middlewares\RateLimitMiddleware();
        if (!$rateLimiter->handle($request, $response)) {
            return;
        }

        // ===============================
        // 2) Cargar usuario SI EXISTE (NO obligatorio)
        // ===============================
        $user = null;

        if (isset($routeInfo['authType']) && $routeInfo['authType'] === 'token') {
            $user = \Middlewares\AuthMiddleware::verify($request);
        }

        if (!$user && \Core\Session::hasUser()) {
            $user = \Core\Session::getUser();
        }

        $request->setUser($user);


        // ===============================
        // 3) Middleware de autenticación: Si la ruta ES protegida
        // ===============================
        if (!empty($routeInfo['protected'])) {
            if (!$user) {
                throw new Exception("No autorizado", 401);
            }

            if (!empty($routeInfo['roles'])) {
                \Middlewares\RoleMiddleware::check($user, $routeInfo['roles']);
            }
        }


        // ===============================
        // 4) Ejecutar handler closure (función anónima)
        // ===============================
        if (is_callable($handler)) {
            $args = array_merge([$request, $response], $params);
            $result = call_user_func_array($handler, $args);

            return;
        }

        
        // ===============================
        // 4) Ejecutar handler del tipo 'App\\Controllers\\UserController@index'
        // ===============================
        if (strpos($handler, '@') !== false) {
            [$class, $method] = explode('@', $handler);

            if (!class_exists($class)) {
                throw new Exception("Controller not found: $class");
            }

            $controller = new $class();
            
            if (!method_exists($controller, $method)) {
                throw new Exception("Method $method not found in controller $class");
            }

            $args = array_merge([$request, $response], $params);
            $result = call_user_func_array([$controller, $method], $args);

            return;
        }

        throw new Exception("Invalid route handler format: $handler");
    }


    private function sendNotFound(string $msg): void
    {
        throw new \Exception($msg, 404);
    }


    public function protected(string $method, string $route, string $action, array $roles = []): void
    {
        $this->addProtectedRoute($method, $route, $action, $roles, 'token');
    }


    public function protectedSession(string $method, string $route, string $action, array $roles = []): void
    {
        $this->addProtectedRoute($method, $route, $action, $roles, 'session');
    }


    private function addProtectedRoute(string $method, string $route, string $action, array $roles, string $authType): void
    {
        $method = strtoupper($method);
        $route = '/' . trim($route, '/');

        $this->routes[$method][$route] = [
            'action' => $action,
            'protected' => true,
            'roles' => $roles,
            'authType' => $authType
        ];
    }

}

