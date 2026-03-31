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

    /** GET /mantenimientos */
    public function index(Request $req, Response $res): void
    {
        try {
            $res->status(200)->json($this->service->getAllMantenimientos());
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), (int)($e->getCode()) ?: 500);
        }
    }

    /** GET /mantenimientos/{cod_mantenimiento} */
    public function show(Request $req, Response $res, string $cod_mantenimiento): void
    {
        try {
            $result = $this->service->getMantenimientoById((int) $cod_mantenimiento);
            $res->status(200)->json($result);
        } catch (Throwable $e) {
            $code = (int) $e->getCode();
            $res->errorJson($e->getMessage(), ($code >= 400 && $code < 600) ? $code : 500);
        }
    }

    /** POST /mantenimientos */
    public function store(Request $req, Response $res): void
    {
        try {
            $result = $this->service->createMantenimiento($req->json());
            $res->status(201)->json($result, "Mantenimiento creado correctamente");
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validacion");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), (int)($e->getCode()) ?: 500);
        }
    }

    /** PUT /mantenimientos/{cod_mantenimiento} */
    public function update(Request $req, Response $res, string $cod_mantenimiento): void
    {
        try {
            $result = $this->service->updateMantenimiento((int) $cod_mantenimiento, $req->json());
            $res->status(200)->json($result, "Mantenimiento actualizado correctamente");
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validacion");
        } catch (Throwable $e) {
            $code = (int)$e->getCode();
            $res->errorJson($e->getMessage(), ($code >= 400 && $code < 600) ? $code : 500);
        }
    }

    /** PATCH /mantenimientos/{cod_mantenimiento} */
    public function patch(Request $req, Response $res, string $cod_mantenimiento): void
    {
        try {
            $result = $this->service->patchMantenimiento((int) $cod_mantenimiento, $req->json());
            $res->status(200)->json($result, "Mantenimiento actualizado correctamente");
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validacion");
        } catch (Throwable $e) {
            $code = (int)$e->getCode();
            $res->errorJson($e->getMessage(), ($code >= 400 && $code < 600) ? $code : 500);
        }
    }

    /** DELETE /mantenimientos/{cod_mantenimiento} */
    public function delete(Request $req, Response $res, string $cod_mantenimiento): void
    {
        try {
            $this->service->deleteMantenimiento((int) $cod_mantenimiento);
            $res->status(200)->json([], "Mantenimiento eliminado correctamente");
        } catch (Throwable $e) {
            $code = (int)$e->getCode();
            $res->errorJson($e->getMessage(), ($code >= 400 && $code < 600) ? $code : 500);
        }
    }

    /** POST /mantenimientos/{cod_mantenimiento}/vehiculos/{matricula} */
    public function addVehiculo(Request $req, Response $res, string $cod_mantenimiento, string $matricula): void
    {
        try {
            $this->service->addVehiculo((int) $cod_mantenimiento, $matricula);
            $res->status(200)->json([], "Vehiculo asignado correctamente");
        } catch (Throwable $e) {
            $code = (int)$e->getCode();
            $res->errorJson($e->getMessage(), ($code >= 400 && $code < 600) ? $code : 500);
        }
    }

    /** DELETE /mantenimientos/{cod_mantenimiento}/vehiculos/{matricula} */
    public function removeVehiculo(Request $req, Response $res, string $cod_mantenimiento, string $matricula): void
    {
        try {
            $this->service->removeVehiculo((int) $cod_mantenimiento, $matricula);
            $res->status(200)->json([], "Vehiculo eliminado correctamente");
        } catch (Throwable $e) {
            $code = (int)$e->getCode();
            $res->errorJson($e->getMessage(), ($code >= 400 && $code < 600) ? $code : 500);
        }
    }

    /** POST /mantenimientos/{cod_mantenimiento}/materiales/{id_material} */
    public function addMaterial(Request $req, Response $res, string $cod_mantenimiento, string $id_material): void
    {
        try {
            $this->service->addMaterial((int) $cod_mantenimiento, (int) $id_material);
            $res->status(200)->json([], "Material asignado correctamente");
        } catch (Throwable $e) {
            $code = (int)$e->getCode();
            $res->errorJson($e->getMessage(), ($code >= 400 && $code < 600) ? $code : 500);
        }
    }

    /** DELETE /mantenimientos/{cod_mantenimiento}/materiales/{id_material} */
    public function removeMaterial(Request $req, Response $res, string $cod_mantenimiento, string $id_material): void
    {
        try {
            $this->service->removeMaterial((int) $cod_mantenimiento, (int) $id_material);
            $res->status(200)->json([], "Material eliminado correctamente");
        } catch (Throwable $e) {
            $code = (int)$e->getCode();
            $res->errorJson($e->getMessage(), ($code >= 400 && $code < 600) ? $code : 500);
        }
    }
}