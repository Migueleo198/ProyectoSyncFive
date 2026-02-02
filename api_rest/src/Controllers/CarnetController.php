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

            $res->status(200)->json(
                $carnets,
                "Listado de carnets obtenido correctamente"
            );

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

            $res->status(200)->json($carnet, "Carnet encontrado");

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
            $data = $req->json();

            $result = $this->service->createCarnet($data);

            $res->status(201)->json(
                $result,
                "Carnet creado correctamente"
            );

        } catch (ValidationException $e) {
            $res->status(422)->json(
                ['errors' => $e->errors],
                "Errores de validación"
            );

        } catch (Throwable $e) {
            $res->errorJson(
                app_debug() ? $e->getMessage() : "Error interno del servidor",
                500
            );
        }
    }

    /**
     * PATCH /carnets/{ID_Carnet}
     */
    public function update(Request $req, Response $res, string $ID_Carnet): void
    {
        try {
            $data = $req->json();

            $result = $this->service->updateCarnet($ID_Carnet, $data);

            if ($result['status'] === 'no_changes') {
                $res->status(200)->json([], $result['message']);
                return;
            }

            $res->status(200)->json([], $result['message']);

        } catch (ValidationException $e) {
            $res->status(422)->json(
                ['errors' => $e->errors],
                "Errores de validación"
            );

        } catch (Throwable $e) {
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

    /**
     * GET /carnets/{ID_Carnet}/personas
     */
    public function persons(Request $req, Response $res, string $ID_Carnet): void
    {
        try {
            $persons = $this->service->getPersonsByCarnet($ID_Carnet);

            $res->status(200)->json(
                $persons,
                "Personas asociadas al carnet obtenidas correctamente"
            );

        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * POST /carnets/asignar
     */
    public function assign(Request $req, Response $res): void
    {
        try {
            $data = $req->json();

            $result = $this->service->assignCarnetToPerson($data);

            $res->status(201)->json([], $result['message']);

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");

        } catch (Throwable $e) {
            $code = $e->getCode() > 0 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * DELETE /carnets/{ID_Carnet}/personas/{n_funcionario}
     */
    public function unassign(
        Request $req,
        Response $res,
        string $ID_Carnet,
        string $n_funcionario
    ): void {
        try {
            $result = $this->service->unassignCarnetFromPerson(
                $n_funcionario,
                $ID_Carnet
            );

            $res->status(200)->json([], $result['message']);

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");

        } catch (Throwable $e) {
            $code = $e->getCode() > 0 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
}
?>
