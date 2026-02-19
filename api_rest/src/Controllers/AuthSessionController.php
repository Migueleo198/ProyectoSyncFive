<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Core\Session;
use Services\AuthSessionService;
use Validation\ValidationException;
use Throwable;

class AuthSessionController
{
    private AuthSessionService $service;

    public function __construct()
    {
        $this->service = new AuthSessionService();
    }

    /**
     * POST /auth/login
     */
    public function login(Request $req, Response $res): void
    {
        try {
            $data = $req->json();

            $user = $this->service->login(
                $data['login'] ?? '',
                $data['password'] ?? ''
            );

            Session::createUserSession($user);

            $res->status(200)->json(
                ['user' => $user],
                "Usuario autenticado correctamente"
            );

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * POST /auth/logout
     */
    public function logout(Request $req, Response $res): void
    {
        Session::destroy();
        $res->status(200)->json([], "Sesión cerrada correctamente");
    }

    /**
     * PATCH /auth/recuperar-contrasena
     */
    public function recoverPassword(Request $req, Response $res): void
    {
        try {
            $data = $req->json();

            $this->service->recoverPassword($data['correo'] ?? '');

            $res->status(200)->json([], "Si el correo existe, se ha enviado un enlace");

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * PATCH /auth/cambiar-contrasena
     */
    public function changePassword(Request $req, Response $res): void
    {
        try {
            $data = $req->json();

            $this->service->changePassword(
                $data['token'] ?? '',
                $data['password'] ?? ''
            );

            $res->status(200)->json([], "Contraseña cambiada correctamente");

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * GET /auth/me
     */
    public function me(Request $req, Response $res): void
    {
        $user = Session::getUser();

        if (!$user) {
            $res->errorJson("No autenticado", 401);
            return;
        }

        $res->status(200)->json(['user' => $user], "Usuario autenticado");
    }
}