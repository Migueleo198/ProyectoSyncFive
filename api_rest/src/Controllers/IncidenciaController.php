<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Validation\ValidationException;
use Throwable;

use Services\IncidenciaService;

class IncidenciaController
{
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
     * POST /incidencias
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $result = $this->service->createIncidencia($req->json());

            $res->status(201)->json(
                ['cod_incidencia' => $result['cod_incidencia']],
                "Incidencia creada correctamente"
            );
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * PUT /incidencias/{cod_incidencia}
     */
    public function update(Request $req, Response $res, string $cod): void
    {
        try {
            $result = $this->service->updateIncidencia((int) $cod, $req->json());

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
     * PATCH /incidencias/{cod_incidencia}
     */
    public function patch(Request $req, Response $res, string $cod): void
    {
        try {
            $result = $this->service->patchIncidencia((int) $cod, $req->json());

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
     * DELETE /incidencias/{cod_incidencia}
     */
    public function destroy(Request $req, Response $res, string $cod): void
    {
        try {
            $this->service->deleteIncidencia((int) $cod);
            $res->status(200)->json([], "Incidencia eliminada correctamente");
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
}