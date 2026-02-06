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
    //++++++++++++++++++++++++++++++ Incidencia ++++++++++++++++++++++++++++++
    // GET, /incidencias
    public function index(Request $req, Response $res): void
    {
        try {
            $incidencias = $this->service->getAllIncidencias();
            $res->status(200)->json($incidencias);
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }
    // POST, /incidencias
    public function store(Request $req, Response $res): void
    {
        try {
            $input = $req->json();
            $incidencia = $this->service->createincidencia($input);
            $res->status(201)->json($incidencia);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }
    // PUT, /incidencias/{cod_incidencia}'
    public function update(Request $req, Response $res, string $id): void
    {
        try {
            $input = $req->json();
            $incidencia = $this->service->updateincidencia((int) $id, $input);
            $res->status(200)->json($incidencia);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }
    // PATCH, /incidencias/{cod_incidencia}'
    public function patch(Request $req, Response $res, string $id): void
    {
        try {
            $input = $req->json();
            $incidencia = $this->service->patchincidencia((int) $id, $input);
            $res->status(200)->json($incidencia);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }
    // DELETE, /incidencias/{cod_incidencia}'
    public function delete(Request $req, Response $res, string $id): void
    {
        try {
            $this->service->deleteincidencia((int) $id);
            $res->status(204)->json(['message' => "incidencia eliminado correctamente"]);
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }

}