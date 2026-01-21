<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Core\Session;
use Validation\ValidationException;
use Throwable;

use Services\AuthSessionService;

class AuthSessionController
{
    private AuthSessionService $service;

    public function __construct()
    {
        $this->service = new AuthSessionService();
    }


    public function login(Request $req, Response $res): void
    {
        try {
            $data = $req->json();

            $user = $this->service->login($data['login'] ?? '', $data['password'] ?? '');

            Session::createUserSession($user);

            $res->status(200)->json([
                'user' => $user
            ], "Profesor logueado");
            
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }


    /**
     * Logout (GET /logout o POST /logout)
     */
    public function logout(Request $req, Response $res): void
    {
        Session::destroy();
        $res->status(200)->json([], "Sesión cerrada correctamente");

    }


    public function register(Request $req, Response $res): void
    {

    }

    /**
     * Activar usuario (GET /activate?token=...)
     */
    public function activate(Request $req, Response $res): void
    {

    }



    public function forgotPassword(Request $req, Response $res): void
    {

    }



    public function resetPassword(Request $req, Response $res): void
    {

    }
}
