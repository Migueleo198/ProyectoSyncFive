<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Validation\ValidationException;
use Throwable;

use Services\IncidenciaService;


class IncidenciaController{

    private IncidenciaService $service;
    
    public function __construct()
    {
        $this->service = new IncidenciaService();
    }


     /**
     * GET /incidencias
     */
    public function index(Request $req, Response $res): void
    {
        try {
            $incidencias = $this->service->getAllIncidencias();
            $res->status(200)->json($incidencias);
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }


     /**
     * GET /incidencias/{id}
     */
    public function show(Request $req, Response $res, string $id): void
    {
        try {
            $incidencia = $this->service->getIncidenciaById((int) $id);
            $res->status(200)->json($incidencia);

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
            return;
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }


    /**
     * POST /incidencias
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $result = $this->service->createIncidencia($req->json());

            $res->status(201)->json(
                ['id' => $result['id']],
                "Incidencia creada correctamente"
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
     * PUT /incidencias/{id}
     */
    public function update(Request $req, Response $res, string $id): void
    {
        try {
            $result = $this->service->updateIncidencia((int)$id, $req->json());

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
     * PATCH /incidencias/{id}
     */
    public function updateDescripcion(Request $req, Response $res, string $id): void
    {
        try {
            $result = $this->service->updateDescripcionIncidencia((int)$id, $req->json());

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
     * DELETE /incidencias/{id}
     */
    public function destroy(Request $req, Response $res, string $id): void
    {
        try {
            $id = (int) $id;

            $service = new \Services\IncidenciaService();
            $service->deleteIncidencia($id);

            $res->status(200)->json([], "Incidencia eliminada correctamente");

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
}