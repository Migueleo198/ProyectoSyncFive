<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Services\InstalacionService;
use Validation\ValidationException;
use Throwable;

class InstalacionController
{
    private InstalacionService $service;

    public function __construct()
    {
        $this->service = new InstalacionService();
    }

    /**
     * GET /Instalaciones
     */
    public function index(Request $req, Response $res): void
    {
        try {
            $Instalaciones = $this->service->getAllInstalaciones();
            $res->status(200)->json($Instalaciones,
            "Listado de Instalaciones obtenido correctamente");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), 500);
        }
    }

    /**
     * GET /Instalaciones/{id_instalacion}
     */
    public function show(Request $req, Response $res, string $id_instalacion): void
    {
        try {
            // Ahora id_instalacion es estrictamente string
            $Instalacion = $this->service->getInstalacionById($id_instalacion);
            $res->status(200)->json($Instalacion, "Instalacion encontrada");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * POST /Instalaciones
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $data = $req->json();

            $result = $this->service->createInstalacion($data);
////////////////////////////////////////////////////////////////////
            $res->status(201)->json(
                [
                    'id_instalacion'    => $result['id_instalacion']
                ],
                "Instalacion creada correctamente"
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
     * PATCH /Instalaciones/{id_instalacion}
     */
    public function update(Request $req, Response $res, string $id_instalacion): void
    {
        try {
            $data = $req->json();

            // Ya no se convierte a entero
            $result = $this->service->updateInstalacion($id_instalacion, $data);

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
     * DELETE /Instalaciones/{id_instalacion}
     */
    public function delete(Request $req, Response $res, string $id_instalacion): void
    {
        try {
            // Ya no se convierte a entero
            $service = new \Services\InstalacionService();
            $service->deleteInstalacion($id_instalacion);

            $res->status(200)->json([], "Instalacion eliminada correctamente");

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
}
?>
