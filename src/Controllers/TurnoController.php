<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Services\RefuezoService;
use Validation\ValidationException;
use Throwable;

class RefuezoController
{
    private RefuezoService $service;

    public function __construct()
    {
        $this->service = new RefuezoService();
    }

    /**
     * GET /refuezos
     */
    public function index(Request $req, Response $res): void
    {
        try {
            $refuezos = $this->service->getAllRefuezos();
            $res->status(200)->json($refuezos, "Listado de refuezos obtenido correctamente");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), 500);
        }
    }

    /**
     * GET /refuezos/{ID_Refuezo}
     */
    public function show(Request $req, Response $res, string $ID_Refuezo): void
    {
        try {
            $refuezo = $this->service->getRefuezoById($ID_Refuezo);
            $res->status(200)->json($refuezo, "Refuezo encontrado correctamente");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * POST /refuezos
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $result = $this->service->createRefuezo($req->json());

            // El servicio devuelve ['ID_Refuezo' => ...]
            $res->status(201)->json(
                ['ID_Refuezo' => $result['ID_Refuezo']],
                "Refuezo creado correctamente"
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
     * PATCH /refuezos/{ID_Refuezo}
     */
    public function update(Request $req, Response $res, string $ID_Refuezo): void
    {
        try {
            $result = $this->service->updateRefuezo($ID_Refuezo, $req->json());

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
     * DELETE /refuezos/{ID_Refuezo}
     */
    public function delete(Request $req, Response $res, string $ID_Refuezo): void
    {
        try {
            // YA NO SE CONVIERTE A INT → ID ahora es STRING
            $this->service->deleteRefuezo($ID_Refuezo);
            $res->status(200)->json([], "Refuezo eliminado correctamente");

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
