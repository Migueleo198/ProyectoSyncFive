<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Services\RefuerzoService;
use Validation\ValidationException;
use Throwable;

class RefuerzoController
{
    private RefuerzoService $service;

    public function __construct()
    {
        $this->service = new RefuerzoService();
    }

    /**
     * GET /refuerzos
     */
    public function index(Request $req, Response $res): void
    {
        try {
            $refuerzos = $this->service->getAllRefuerzos();
            $res->status(200)->json($refuerzos, "Listado de refuerzos obtenido correctamente");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), 500);
        }
    }

    /**
     * GET /refuerzos/{ID_Refuerzo}
     */
    public function show(Request $req, Response $res, string $ID_Refuerzo): void
    {
        try {
            $refuerzo = $this->service->getRefuerzoById($ID_Refuerzo);
            $res->status(200)->json($refuerzo, "Refuerzo encontrado correctamente");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * POST /refuerzos
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $result = $this->service->createRefuerzo($req->json());

            // El servicio devuelve ['ID_Refuerzo' => ...]
            $res->status(201)->json(
                ['ID_Refuerzo' => $result['ID_Refuerzo']],
                "Refuerzo creado correctamente"
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
     * PATCH /refuerzos/{ID_Refuerzo}
     */
    public function update(Request $req, Response $res, string $ID_Refuerzo): void
    {
        try {
            $result = $this->service->updateRefuerzo($ID_Refuerzo, $req->json());

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
     * DELETE /refuerzos/{ID_Refuerzo}
     */
    public function delete(Request $req, Response $res, string $ID_Refuerzo): void
    {
        try {
            // YA NO SE CONVIERTE A INT → ID ahora es STRING
            $this->service->deleteRefuerzo($ID_Refuerzo);
            $res->status(200)->json([], "Refuerzo eliminado correctamente");

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
