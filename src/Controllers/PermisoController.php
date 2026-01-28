<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Services\PermisoService;
use Validation\ValidationException;
use Throwable;

class PermisoController
{
    private PermisoService $service;

    public function __construct()
    {
        $this->service = new PermisoService();
    }

    /**
     * GET /Permisos
     */
    public function index(Request $req, Response $res): void
    {
        try {
            $permisos = $this->service->getAllPermisos();
            $res->status(200)->json($permisos, "Listado de permisos obtenido correctamente");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), 500);
        }
    }

    /**
     * GET /Permisos/{ID_Permiso}
     */
    public function show(Request $req, Response $res, string $ID_Permiso): void
    {
        try {
            $permiso = $this->service->getPermisoById($ID_Permiso);
            $res->status(200)->json($permiso, "Permiso encontrado correctamente");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * POST /Permisos
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $result = $this->service->createPermiso($req->json());

            // El servicio devuelve ['ID_Permiso' => ...]
            $res->status(201)->json(
                ['ID_Permiso' => $result['ID_Permiso']],
                "Permiso creado correctamente"
            );

        } catch (ValidationException $e) {
            $res->status(422)->json(
                ['errors' => $e->errors],
                "Errores de validación"
            );
            return;

        } catch (Throwable $e) {
            $res->errorJson(
                app_debug() ? $e->getMessage() : "Error interno del servidor",
                500
            );
            return;
        }
    }

    /**
     * PATCH /Permisos/{ID_Permiso}
     */
    public function update(Request $req, Response $res, string $ID_Permiso): void
    {
        try {
            $result = $this->service->updatePermiso($ID_Permiso, $req->json());

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
     * DELETE /Permisos/{ID_Permiso}
     */
    public function delete(Request $req, Response $res, string $ID_Permiso): void
    {
        try {
            // YA NO SE CONVIERTE A INT → ID ahora es STRING
            $this->service->deletePermiso($ID_Permiso);
            $res->status(200)->json([], "Permiso eliminado correctamente");

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");

        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600)
                ? $e->getCode()
                : 500;

            $res->errorJson($e->getMessage(), $code);
        }
    }
}
