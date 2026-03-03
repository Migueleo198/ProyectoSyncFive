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
     * GET /Permiso
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
     * GET /Permiso/{cod_permiso}
     */
    public function show(Request $req, Response $res, string $cod_permiso): void
    {
        try {
            // Ahora cod_permiso es estrictamente string
            $permiso = $this->service->getPermisoById($cod_permiso);
            $res->status(200)->json($permiso, "Permiso encontrado");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * POST /Permiso
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $data = $req->json();

            // Ahora puede incluir id_permiso (string)
            $result = $this->service->registerPermiso($data);

            $res->status(201)->json(
                [
                    'id_permiso'    => $result['id_permiso'],    
                    'fecha' => $result['fecha'],
                    'estado' => $result['estado'],
                    'hora_inicio' => $result['hora_inicio'],
                    'hora_fin' => $result['hora_fin'],
                    'descripcion' => $result['descripcion']
                ],
                "Permiso creado correctamente"
            );

        } catch (ValidationException $e) {
            $res->status(422)->json(
                ['errors' => $e->errors],
                "Errores de validación"
            );
        } catch (Throwable $e) {
            $res->errorJson(app_debug() ? $e->getMessage() : "Error interno del servidor", 500);
        }
    }



    /**
     * PATCH /Permiso/{id_permiso}
     */
    public function update(Request $req, Response $res, string $id_permiso): void
    {
        try {
            $data = $req->json();

            // Ya no se convierte a entero
            $result = $this->service->updatePermiso($id_permiso, $data);

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
     * DELETE /Permiso/{id_permiso}
     */
    public function delete(Request $req, Response $res, string $id_permiso): void
    {
        try {
            // Ya no se convierte a entero
            $service = new \Services\PermisoService();
            $service->deletePermiso($id_permiso);

            $res->status(200)->json([], "Permiso eliminado correctamente");

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
}
?>
