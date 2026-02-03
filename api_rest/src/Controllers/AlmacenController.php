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
     * POST /Almacenes
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

            $res->errorJson(app_debug() ? $e->getMessage() : "Error interno del servidor",500);
            return;
        }
    }


    /**
     * PUT /Almacenes/{id_instalacion}/{id_almacen}
     */
    public function update(Request $req, Response $res, string $id_instalacion, string $id_almacen): void    {
        try {
            $result = $this->service->updateAlmacen((int)$id_almacen, $req->json());

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
     * DELETE, /instalaciones/{id_instalacion}/almacenes/{id_almacen}
     */
    public function delete(Request $req, Response $res, string $id_instalacion, string $id_almacen): void
    {
        try {
            $id_instalacion = (int) $id_instalacion;
            $id_almacen = (int) $id_almacen;

            $service = new \Services\AlmacenService();
            $service->deleteAlmacen($id_almacen, $id_instalacion);

            $res->status(200)->json([], "Almacén eliminado correctamente");

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
}
?>