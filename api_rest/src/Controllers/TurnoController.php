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
     * GET /Refuerzo
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
     * GET /Refuerzo/{id_refuerzo}
     */
    public function show(Request $req, Response $res, string $id_refuerzo): void
    {
        try {
            // Ahora id_refuerzo es estrictamente string
            $refuerzo = $this->service->getRefuerzoById($id_refuerzo);
            $res->status(200)->json($refuerzo, "Refuerzo encontrado");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * POST /Refuerzo
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $data = $req->json();

            // Ahora puede incluir id_refuerzo (string)
            $result = $this->service->registerUser($data);

            $res->status(201)->json(
                [
                    'id_refuerzo'    => $result['id_refuerzo'],    
                    'f_inicio' => $result['f_inicio'],
                    'f_fin' => $result['f_fin'],
                    'horas' => $result['horas']
                ],
                "Refuerzo creado correctamente"
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
     * PATCH /Refuerzo/{id_refuerzo}
     */
    public function update(Request $req, Response $res, string $id_refuerzo): void
    {
        try {
            $data = $req->json();

            // Ya no se convierte a entero
            $result = $this->service->updateRefuerzo($id_refuerzo, $data);

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
     * DELETE /Refuerzo/{id_refuerzo}
     */
    public function delete(Request $req, Response $res, string $id_refuerzo): void
    {
        try {
            // Ya no se convierte a entero
            $service = new \Services\RefuerzoService();
            $service->deleteRefuerzo($id_refuerzo);

            $res->status(200)->json([], "Refuerzo eliminado correctamente");

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
    /**
 * POST /Refuerzo/assign
 */
public function assign(Request $req, Response $res): void
{
    try {
        $data = $req->json();
        $result = $this->service->assignRefuerzoToPerson($data);
        $res->status(200)->json($result, $result['message']);
    } catch (ValidationException $e) {
        $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
    } catch (Throwable $e) {
        $code = $e->getCode() >= 400 ? $e->getCode() : 500;
        $res->errorJson($e->getMessage(), $code);
    }
}

/**
 * DELETE /Refuerzo/unassign
 */
public function unassign(Request $req, Response $res): void
{
    try {
        $data = $req->json();
        $result = $this->service->unassignRefuerzoFromPerson($data['n_funcionario'], $data['ID_Refuerzo']);
        $res->status(200)->json($result, $result['message']);
    } catch (ValidationException $e) {
        $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
    } catch (Throwable $e) {
        $code = $e->getCode() >= 400 ? $e->getCode() : 500;
        $res->errorJson($e->getMessage(), $code);
    }
}
}



?>
