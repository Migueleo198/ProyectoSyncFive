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

    /**
     * GET /Almacenes
     */
    public function index(Request $req, Response $res): void
    {
        try {
            $almacenes = $this->service->getAllAlmacenes();
            $res->status(200)->json($almacenes);
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * GET /Almacenes/{id}
     */
    public function show(Request $req, Response $res, string $id): void
    {
        try {
            $almacen = $this->service->getAlmacenById((int) $id);
            $res->status(200)->json($almacen);

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
            return;
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }

    /**
     * POST /instalaciones/{id_instalacion}/almacenes
     */
    public function store(Request $req, Response $res, string $id_instalacion): void
    {
        try {
            $result = $this->service->createAlmacen($req->json(), (int) $id_instalacion);

            $res->status(201)->json(
                ['id' => $result['id']],
                "Almacén creado correctamente"
            );

        } catch (ValidationException $e) {
            $res->status(422)->json(
                ['errors' => $e->errors],
                "Errores de validación"
            );
            return;

        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), 500);
            return;
        }
    }

    /**
     * PUT /instalaciones/{id_instalacion}/almacenes/{id_almacen}
     */
    public function update(Request $req, Response $res, string $id_instalacion, string $id_almacen): void
    {
        try {
            $result = $this->service->updateAlmacen((int)$id_almacen, $req->json());

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
     * DELETE /instalaciones/{id_instalacion}/almacenes/{id_almacen}
     */
    public function delete(Request $req, Response $res, string $id_instalacion, string $id_almacen): void
    {
        try {
            $id_instalacion = (int) $id_instalacion;
            $id_almacen = (int) $id_almacen;

            $this->service->deleteAlmacen($id_almacen, $id_instalacion);

            $res->status(200)->json([], "Almacén eliminado correctamente");

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * GET /almacenes/{id_almacen}/material
     */
    public function getMaterial(Request $req, Response $res, string $id_almacen): void
    {
        try {
            $materiales = $this->service->getMaterialesEnAlmacen((int) $id_almacen);
            $res->status(200)->json($materiales);
        } catch (Throwable $e) {
            $code = $e->getCode() ?: 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * POST /almacenes/{id_almacen}/material
     * Body: {id_instalacion, id_material, unidades, n_serie (opcional)}
     */
    public function setMaterial(Request $req, Response $res, string $id_almacen): void
    {
        try {
            $input = $req->json();
            $result = $this->service->setMaterialToAlmacen((int) $id_almacen, $input);
            
            $res->status(201)->json(
                $result,
                "Material añadido correctamente al almacén"
            );
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() ?: 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * PUT /almacenes/{id_almacen}/material/{id_material}
     * Body: {id_instalacion, unidades, n_serie (opcional)}
     */
    public function updateMaterial(Request $req, Response $res, string $id_almacen, string $id_material): void
    {
        try {
            $input = $req->json();
            $result = $this->service->updateMaterialInAlmacen(
                (int) $id_almacen, 
                (int) $id_material, 
                $input
            );

            if ($result['status'] === 'no_changes') {
                $res->status(200)->json([], $result['message']);
                return;
            }

            $res->status(200)->json([], $result['message']);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() ?: 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * DELETE /almacenes/{id_almacen}/material/{id_material}
     * Body: {id_instalacion}
     */
    public function deleteMaterial(Request $req, Response $res, string $id_almacen, string $id_material): void
    {
        try {
            $input = $req->json();
            $this->service->deleteMaterialFromAlmacen((int) $id_almacen, (int) $id_material, $input);
            
            $res->status(200)->json([], "Material eliminado correctamente del almacén");
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() ?: 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
}
?>