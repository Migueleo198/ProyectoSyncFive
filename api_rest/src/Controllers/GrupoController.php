<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Services\GrupoService;
use Validation\ValidationException;
use Throwable;

class GrupoController
{
    private GrupoService $service;

    public function __construct()
    {
        $this->service = new GrupoService();
    }

    /**
     * GET /grupos
     */
    public function index(Request $req, Response $res): void
    {
        try {
            $grupos = $this->service->getAll();
            $res->status(200)->json($grupos, "Grupos obtenidos correctamente");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), 500);
        }
    }

    /**
     * GET /grupos/{id}
     */
    public function show(Request $req, Response $res, string $id): void
    {
        try {
            $grupo = $this->service->getById((int) $id);
            $res->status(200)->json($grupo, "OK");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * POST /grupos
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $result = $this->service->create($req->json());
            $res->status(201)->json($result, "Grupo creado correctamente");
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), 500);
        }
    }

    /**
     * PUT /grupos/{id}
     */
    public function update(Request $req, Response $res, string $id): void
    {
        try {
            $result = $this->service->update((int) $id, $req->json());
            $res->status(200)->json([], $result['message']);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * DELETE /grupos/{id}
     */
    public function delete(Request $req, Response $res, string $id): void
    {
        try {
            $result = $this->service->delete((int) $id);
            $res->status(200)->json([], $result['message']);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
}
