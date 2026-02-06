<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Validation\ValidationException;
use Throwable;

use Services\MantenimientoService;

class MantenimientoController
{
    private MantenimientoService $service;

    public function __construct()
    {
        $this->service = new MantenimientoService();
    }
//++++++++++++++++++++++++++++++ MANTENIMIENTO ++++++++++++++++++++++++++++++
    // GET, /mantenimientos
    public function index(Request $req, Response $res): void
    {
        try {
            $mantenimientos = $this->service->getAllMantenimientos();
            $res->status(200)->json($mantenimientos);
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }
    // POST, /mantenimientos
    public function store(Request $req, Response $res): void
    {
        try {
            $input = $req->json();
            $mantenimiento = $this->service->createMantenimiento($input);
            $res->status(201)->json($mantenimiento);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }
    // PUT, /mantenimientos/{cod_mantenimiento}'
    public function update(Request $req, Response $res, string $id): void
    {
        try {
            $input = $req->json();
            $mantenimiento = $this->service->updateMantenimiento((int) $id, $input);
            $res->status(200)->json($mantenimiento);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }
    // PATCH, /mantenimientos/{cod_mantenimiento}'
    public function patch(Request $req, Response $res, string $id): void
    {
        try {
            $input = $req->json();
            $mantenimiento = $this->service->patchMantenimiento((int) $id, $input);
            $res->status(200)->json($mantenimiento);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }
    // DELETE, /mantenimientos/{cod_mantenimiento}'
    public function delete(Request $req, Response $res, string $id): void
    {
        try {
            $this->service->deleteMantenimiento((int) $id);
            $res->status(204)->json(['message' => "Mantenimiento eliminado correctamente"]);
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }

}