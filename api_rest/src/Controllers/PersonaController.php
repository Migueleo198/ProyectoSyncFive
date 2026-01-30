<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Services\PersonaService;
use Validation\ValidationException;
use Throwable;

class PersonaController
{
    private PersonaService $service;

    public function __construct()
    {
        $this->service = new PersonaService();
    }

    /**
     * GET /personas
     */
    public function index(Request $req, Response $res): void
    {
        try {
            $personas = $this->service->getAllPersonas();
            $res->status(200)->json($personas, "Listado de personas obtenido correctamente");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), 500);
        }
    }

    /**
     * GET /personas/{n_funcionario}
     */
    public function show(Request $req, Response $res, string $n_funcionario): void
    {
        try {
            // Ahora n_funcionario es estrictamente string
            $persona = $this->service->getPersonaById($n_funcionario);
            $res->status(200)->json($persona, "Persona encontrada");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * POST /personas
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $data = $req->json();

            // Ahora puede incluir ID_bombero (string)
            $result = $this->service->registerUser($data);

            $res->status(201)->json(
                [
                    'ID_bombero'    => $result['id_bombero'],    
                    'n_funcionario' => $result['n_funcionario'],
                    'token_activacion' => $result['token_activacion']
                ],
                "Persona creada correctamente"
            );

        } catch (ValidationException $e) {
            $res->status(422)->json(
                ['errors' => $e->errors],
                "Errores de validación"
            );
        } catch (Throwable $e) {
            $res->errorJson(app_debug() ? $e->getMessage() : "Error interno del servidor", 500);
        }
    }

    /**
     * PATCH /auth/activar-cuenta?token=...
     */
    public function activateAccount(Request $req, Response $res): void
    {
        try {
            $token = $req->getParam('token'); // Obtenemos el token de la query string

            if (!$token) {
                $res->status(422)->json(['token' => 'Token requerido'], "Token no proporcionado");
                return;
            }

            $this->service->activateAccount($token);

            $res->status(200)->json([], "Cuenta activada correctamente");
        } catch (\Validation\ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (\Throwable $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
            $res->errorJson(app_debug() ? $e->getMessage() : "Error interno del servidor", $code);
        }
    }


    /**
     * PATCH /personas/{n_funcionario}
     */
    public function update(Request $req, Response $res, string $n_funcionario): void
    {
        try {
            $data = $req->json();

            // Ya no se convierte a entero
            $result = $this->service->updatePersona($n_funcionario, $data);

            if ($result['status'] === 'no_changes') {
                $res->status(200)->json([], $result['message']);
                return;
            }

            $res->status(200)->json([], $result['message']);

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() > 0 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * DELETE /personas/{n_funcionario}
     */
    public function delete(Request $req, Response $res, string $n_funcionario): void
    {
        try {
            // Ya no se convierte a entero
            $service = new \Services\PersonaService();
            $service->deletePersona($n_funcionario);

            $res->status(200)->json([], "Persona eliminada correctamente");

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
}
?>
