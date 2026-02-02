<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Validation\ValidationException;
use Throwable;

use Services\TipoEmergenciaService;


class TipoEmergenciaController
{
    private TipoEmergenciaService $service;

    public function __construct()
    {
        $this->service = new TipoEmergenciaService();
    }

    
    /**
     * GET /tipo_emergencias
     */
    public function index(Request $req, Response $res): void
    {
        try {
            $tipoEmergencias = $this->service->getAllTipoEmergencias();
            $res->status(200)->json($tipoEmergencias);
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }


    /**
     * GET /tipo_emergencias/{id}
     */
    public function show(Request $req, Response $res, string $id): void
    {
        try {
            $tipoEmergencia = $this->service->getTipoEmergenciaById((int) $id);
            $res->status(200)->json($tipoEmergencia);

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
            return;
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }


    /**
     * POST /tipo_emergencias
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $result = $this->service->createTipoEmergencia($req->json());

            $res->status(201)->json(
                ['id' => $result['id']],
                "Tipo de emergencia creado correctamente"
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
     * PUT /tipo_emergencias/{id}
     */
    public function update(Request $req, Response $res, string $id): void
    {
        try {
            $result = $this->service->updateTipoEmergencia((int)$id, $req->json());

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
     * DELETE /tipo_emergencias/{id}
     */
    public function delete(Request $req, Response $res, string $id): void
    {
        try {
            $id = (int) $id;

            $service = new \Services\TipoEmergenciaService();
            $service->deleteTipoEmergencia($id);

            $res->status(200)->json([], "Tipo de emergencia eliminado correctamente");

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

}