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

    // ========== ALMACENES DE UNA INSTALACIÓN ==========

    /**
     * GET /instalaciones/{id_instalacion}/almacenes
     */
    public function index(Request $req, Response $res, string $id_instalacion): void
    {
        try {
            $almacenes = $this->service->getAlmacenesByInstalacion((int) $id_instalacion);
            $res->status(200)->json($almacenes);
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * POST /instalaciones/{id_instalacion}/almacenes
     */
    public function store(Request $req, Response $res, string $id_instalacion): void
    {
        try {
            $result = $this->service->createAlmacenEnInstalacion((int) $id_instalacion, $req->json());

            $res->status(201)->json(
                ['id_almacen' => $result['id_almacen']],
                "Almacén creado y asociado a la instalación correctamente"
            );
        } catch (ValidationException $e) {
            $res->status(422)->json(
                ['errors' => $e->errors],
                "Errores de validación"
            );
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * PUT /instalaciones/{id_instalacion}/almacenes/{id_almacen}
     */
    public function update(Request $req, Response $res, string $id_instalacion, string $id_almacen): void
    {
        try {
            $result = $this->service->updateAlmacenEnInstalacion(
                (int) $id_instalacion, 
                (int) $id_almacen, 
                $req->json()
            );

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
    public function destroy(Request $req, Response $res, string $id_instalacion, string $id_almacen): void
    {
        try {
            $this->service->deleteAlmacenDeInstalacion((int) $id_instalacion, (int) $id_almacen);
            $res->status(200)->json([], "Almacén eliminado de la instalación correctamente");
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    // ========== MATERIAL EN ALMACÉN ==========

    /**
     * GET /almacenes/{id_almacen}/material
     */
    public function getMaterial(Request $req, Response $res, string $id_almacen): void
    {
        try {
            $material = $this->service->getMaterialEnAlmacen((int) $id_almacen);
            $res->status(200)->json($material);
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * POST /almacenes/{id_almacen}/material
     */
    public function setMaterial(Request $req, Response $res, string $id_almacen): void
    {
        try {
            $result = $this->service->addMaterialToAlmacen((int) $id_almacen, $req->json());
            $res->status(201)->json([], $result['message']);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * PUT /almacenes/{id_almacen}/material/{id_material}
     */
    public function updateMaterial(Request $req, Response $res, string $id_almacen, string $id_material): void
    {
        try {
            $result = $this->service->updateMaterialInAlmacen((int) $id_almacen, (int) $id_material, $req->json());

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
     * DELETE /almacenes/{id_almacen}/material/{id_material}
     */
    public function deleteMaterial(Request $req, Response $res, string $id_almacen, string $id_material): void
    {
        try {
            // Necesitamos también el id_instalacion del cuerpo de la petición
            $data = $req->json();
            
            if (!isset($data['id_instalacion'])) {
                $res->status(400)->json([], "Se requiere el campo id_instalacion");
                return;
            }

            $this->service->deleteMaterialFromAlmacen(
                (int) $id_almacen, 
                (int) $id_material, 
                (int) $data['id_instalacion']
            );
            
            $res->status(200)->json([], "Material eliminado del almacén correctamente");
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
}