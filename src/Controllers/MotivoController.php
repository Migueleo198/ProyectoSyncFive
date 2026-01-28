<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Services\MotivoService;
use Validation\ValidationException;
use Throwable;

class MotivoController
{
    private MotivoService $service;

    public function __construct()
    {
        $this->service = new MotivoService();
    }

    /**
     * GET /motivos
     */
    public function index(Request $req, Response $res): void
    {
        try {
            $motivos = $this->service->getAllMotivos();
            $res->status(200)->json($motivos, "Listado de motivos obtenido correctamente");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), 500);
        }
    }

    /**
     * GET /motivos/{ID_Motivo}
     */
    public function show(Request $req, Response $res, string $ID_Motivo): void
    {
        try {
            $motivo = $this->service->getMotivoById($ID_Motivo);
            $res->status(200)->json($motivo, "Motivo encontrado correctamente");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * POST /motivos
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $result = $this->service->createMotivo($req->json());

            // El servicio devuelve ['n_motivo' => ...]
            $res->status(201)->json(
                ['ID_Motivo' => $result['n_motivo']],
                "Motivo creado correctamente"
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
     * PATCH /motivos/{ID_Motivo}
     */
    public function update(Request $req, Response $res, string $ID_Motivo): void
    {
        try {
            $result = $this->service->updateMotivo($ID_Motivo, $req->json());

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
     * DELETE /motivos/{ID_Motivo}
     */
    public function delete(Request $req, Response $res, string $ID_Motivo): void
    {
        try {
            // YA NO SE CONVIERTE A INT → ID ahora es STRING
            $this->service->deleteMotivo($ID_Motivo);
            $res->status(200)->json([], "Motivo eliminado correctamente");

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
