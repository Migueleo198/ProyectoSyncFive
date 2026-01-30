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
     * GET /instalaciones
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
     * GET /instalaciones/{id_instalacion}
     */
    public function show(Request $req, Response $res, string $id): void
    {
        try {
            $instalacion = $this->service->getInstalacionById((int) $id);
            $res->status(200)->json($instalacion);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }

    /**
     * POST /instalaciones
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $result = $this->service->createInstalacion($req->json());

            $res->status(201)->json(
                ['id_instalacion' => $result['id_instalacion']],
                "Instalación creada correctamente"
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
     * PUT /instalaciones/{id_instalacion}
     */
    public function update(Request $req, Response $res, string $id): void
    {
        try {
            $result = $this->service->updateInstalacion((int) $id, $req->json());

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
     * DELETE /instalaciones/{id_instalacion}
     */
    public function delete(Request $req, Response $res, string $id): void
    {
        try {
            $this->service->deleteInstalacion((int) $id);
            $res->status(200)->json([], "Instalación eliminada correctamente");
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * GET /instalaciones/{id_instalacion}/vehiculos
     */
    public function getVehiculos(Request $req, Response $res, string $id_instalacion): void
    {
        try {
            $vehiculos = $this->service->getVehiculosDeInstalacion((int) $id_instalacion);
            $res->status(200)->json($vehiculos);
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }
}