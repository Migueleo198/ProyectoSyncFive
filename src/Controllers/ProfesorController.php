<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Validation\ValidationException;
use Throwable;

use Services\ProfesorService;


class ProfesorController
{
    private ProfesorService $service;

    public function __construct()
    {
        $this->service = new ProfesorService();
    }

    
    /**
     * GET /profesores
     */
    public function index(Request $req, Response $res): void
    {
        try {
            $profesores = $this->service->getAllProfesores();
            $res->status(200)->json($profesores);
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }


    /**
     * GET /profesores/{id}
     */
    public function show(Request $req, Response $res, string $id): void
    {
        try {
            $profesor = $this->service->getProfesorById((int) $id);
            $res->status(200)->json($profesor);

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
            return;
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }


    /**
     * POST /profesores
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $result = $this->service->createProfesor($req->json());

            $res->status(201)->json(
                ['id' => $result['id']],
                "Profesor creado correctamente"
            );

        } catch (ValidationException $e) {

            $res->status(422)->json(
                ['errors' => $e->errors],
                "Errores de validación"
            );
            return;

        } catch (Throwable $e) {

            $res->errorJson(app_debug() ? $e->getMessage() : "Error interno del servidor",500);
            return;
        }
    }


    /**
     * PUT /profesores/{id}
     */
    public function update(Request $req, Response $res, string $id): void
    {
        try {
            $result = $this->service->updateProfesor((int)$id, $req->json());

            if ($result['status'] === 'no_changes') {
                $res->status(200)->json([], $result['message']);
                return;
            }

            $res->status(200)->json([], $result['message']);
        }
        catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        }
        catch (Throwable $e) {
            $code = $e->getCode() > 0 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }


    /**
     * PATCH /profesores/{id}/email
     */
    public function updateEmail(Request $req, Response $res, string $id): void
    {
        try {
            $result = $this->service->updateEmailProfesor((int)$id, $req->json());

            if ($result['status'] === 'no_changes') {
                $res->status(200)->json([], $result['message']);
                return;
            }

            $res->status(200)->json([], $result['message']);
        }
        catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        }
        catch (Throwable $e) {
            $code = $e->getCode() > 0 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }


    /**
     * DELETE /profesores/{id}
     */
    public function destroy(Request $req, Response $res, string $id): void
    {
        try {
            $id = (int) $id;

            $service = new \Services\ProfesorService();
            $service->deleteProfesor($id);

            $res->status(200)->json([], "Profesor eliminado correctamente");

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
}
