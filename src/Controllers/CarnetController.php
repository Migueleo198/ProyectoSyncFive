<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Services\CarnetService;
use Validation\ValidationException;
use Throwable;

class CarnetController
{
    private CarnetService $service;

    public function __construct()
    {
        $this->service = new CarnetService();
    }

    /**
     * GET /carnets
     */
    public function index(Request $req, Response $res): void
    {
        try {
            $carnets = $this->service->getAllCarnets();
            $res->status(200)->json($carnets, "Listado de carnets obtenido correctamente");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), 500);
        }
    }

    /**
     * GET /carnets/{ID_Carnet}
     */
    public function show(Request $req, Response $res, string $ID_Carnet): void
    {
        try {
            $carnet = $this->service->getCarnetById($ID_Carnet);
            $res->status(200)->json($carnet, "Carnet encontrado correctamente");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * POST /carnets
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $result = $this->service->createCarnet($req->json());

            // El servicio devuelve ['n_carnet' => ...]
            $res->status(201)->json(
                ['ID_Carnet' => $result['n_carnet']],
                "Carnet creado correctamente"
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
     * PATCH /carnets/{ID_Carnet}
     */
    public function update(Request $req, Response $res, string $ID_Carnet): void
    {
        try {
            $result = $this->service->updateCarnet($ID_Carnet, $req->json());

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
     * DELETE /carnets/{ID_Carnet}
     */
    public function delete(Request $req, Response $res, string $ID_Carnet): void
    {
        try {
            // YA NO SE CONVIERTE A INT → ID ahora es STRING
            $this->service->deleteCarnet($ID_Carnet);

            $res->status(200)->json([], "Carnet eliminado correctamente");

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
