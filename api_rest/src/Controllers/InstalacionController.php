<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Validation\ValidationException;
use Throwable;

use Services\InstalacionService;


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
            $instalaciones = $this->service->getAllInstalaciones();
            $res->status(200)->json($instalaciones);
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }


    /**
     * GET /Instalaciones/{id}
     */
    public function show(Request $req, Response $res, string $id): void
    {
        try {
            $instalacion = $this->service->getInstalacionById((int) $id);
            $res->status(200)->json($instalacion);

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
            return;
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }


    /**
     * POST /Instalaciones
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $result = $this->service->createInstalacion($req->json());

            $res->status(201)->json(
                ['id' => $result['id']],
                "Instalación creada correctamente"
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
     * PUT /Instalaciones/{id}
     */
    public function update(Request $req, Response $res, string $id): void
    {
        try {
            $result = $this->service->updateInstalacion((int)$id, $req->json());

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
     * DELETE /Instalaciones/{id}
     */
    public function delete(Request $req, Response $res, string $id): void
    {
        try {
            $id = (int) $id;

            $service = new \Services\InstalacionService();
            $service->deleteInstalacion($id);

            $res->status(200)->json([], "Instalación eliminada correctamente");

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
}
