<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Validation\ValidationException;
use Throwable;
use Services\AlmacenService;

class AlmacenController
{
    private AlmacenService $service;

    public function __construct()
    {
        $this->service = new AlmacenService();
    }

    // GET /almacenes
    public function all(Request $req, Response $res): void
    {
        try {
            $almacenes = $this->service->getAllAlmacenes();
            $res->status(200)->json($almacenes, "Listado de almacenes obtenido correctamente");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), (int) ($e->getCode()) ?: 500);
        }
    }

    // GET /instalaciones/{id_instalacion}/almacenes
    public function index(Request $req, Response $res, string $id_instalacion): void
    {
        try {
            $almacenes = $this->service->getAlmacenesByInstalacion((int) $id_instalacion);
            $res->status(200)->json($almacenes);
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), (int) ($e->getCode()) ?: 500);
        }
    }

    // POST /instalaciones/{id_instalacion}/almacenes
    public function store(Request $req, Response $res, string $id_instalacion): void
    {
        try {
            $result = $this->service->createAlmacen($req->json(), (int) $id_instalacion);
            $res->status(201)->json($result, "Almacén creado correctamente");
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), (int) ($e->getCode()) ?: 500);
        }
    }

    // PUT /instalaciones/{id_instalacion}/almacenes/{id_almacen}
    public function update(Request $req, Response $res, string $id_instalacion, string $id_almacen): void
    {
        try {
            $result = $this->service->updateAlmacen((int) $id_almacen, (int) $id_instalacion, $req->json());

            if ($result['status'] === 'no_changes') {
                $res->status(200)->json([], $result['message']);
                return;
            }
            $res->status(200)->json([], $result['message']);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = (int) $e->getCode();
            $res->errorJson($e->getMessage(), ($code >= 400 && $code < 600) ? $code : 500);
        }
    }

    // DELETE /instalaciones/{id_instalacion}/almacenes/{id_almacen}
    public function delete(Request $req, Response $res, string $id_instalacion, string $id_almacen): void
    {
        try {
            $this->service->deleteAlmacen((int) $id_almacen, (int) $id_instalacion);
            $res->status(200)->json([], "Almacén eliminado correctamente");
        } catch (Throwable $e) {
            $code = (int) $e->getCode();
            $res->errorJson($e->getMessage(), ($code >= 400 && $code < 600) ? $code : 500);
        }
    }

    // GET /instalaciones/{id_instalacion}/almacenes/{id_almacen}/materiales
    public function getMaterial(Request $req, Response $res, string $id_instalacion, string $id_almacen): void
    {
        try {
            $materiales = $this->service->getMaterialesEnAlmacen((int) $id_almacen, (int) $id_instalacion);
            $res->status(200)->json($materiales);
        } catch (Throwable $e) {
            $code = (int) $e->getCode();
            $res->errorJson($e->getMessage(), ($code >= 400 && $code < 600) ? $code : 500);
        }
    }

    // POST /instalaciones/{id_instalacion}/almacenes/{id_almacen}/materiales
    public function setMaterial(Request $req, Response $res, string $id_instalacion, string $id_almacen): void
    {
        try {
            $result = $this->service->setMaterialToAlmacen((int) $id_almacen, (int) $id_instalacion, $req->json());
            $res->status(201)->json($result, "Material añadido correctamente al almacén");
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = (int) $e->getCode();
            $res->errorJson($e->getMessage(), ($code >= 400 && $code < 600) ? $code : 500);
        }
    }

    // PUT /instalaciones/{id_instalacion}/almacenes/{id_almacen}/materiales/{id_material}
    public function updateMaterial(Request $req, Response $res, string $id_instalacion, string $id_almacen, string $id_material): void
    {
        try {
            $result = $this->service->updateMaterialInAlmacen((int) $id_almacen, (int) $id_instalacion, (int) $id_material, $req->json());

            if ($result['status'] === 'no_changes') {
                $res->status(200)->json([], $result['message']);
                return;
            }
            $res->status(200)->json([], $result['message']);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = (int) $e->getCode();
            $res->errorJson($e->getMessage(), ($code >= 400 && $code < 600) ? $code : 500);
        }
    }

    // DELETE /instalaciones/{id_instalacion}/almacenes/{id_almacen}/materiales/{id_material}
    public function deleteMaterial(Request $req, Response $res, string $id_instalacion, string $id_almacen, string $id_material): void
    {
        try {
            $this->service->deleteMaterialFromAlmacen((int) $id_almacen, (int) $id_instalacion, (int) $id_material);
            $res->status(200)->json([], "Material eliminado correctamente del almacén");
        } catch (Throwable $e) {
            $code = (int) $e->getCode();
            $res->errorJson($e->getMessage(), ($code >= 400 && $code < 600) ? $code : 500);
        }
    }
}