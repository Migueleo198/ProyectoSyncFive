<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Services\GuardiaService;
use Validation\ValidationException;
use Throwable;

class GuardiaController
{
    private GuardiaService $service;

    public function __construct()
    {
        $this->service = new GuardiaService();
    }

    /**
     * GET /Guardia
     */
    public function index(Request $req, Response $res): void
    {
        try {
            $guardias = $this->service->getAllGuardias();
            $res->status(200)->json($guardias, "Listado de guardias obtenido correctamente");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), 500);
        }
    }

    /**
     * GET /Guardia/{cod_guardia}
     */
    public function show(Request $req, Response $res, string $cod_guardia): void
    {
        try {
            // Ahora cod_guardia es estrictamente string
            $guardia = $this->service->getGuardiaById($cod_guardia);
            $res->status(200)->json($guardia, "Guardia encontrado");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * POST /Guardia
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $data = $req->json();

            $result = $this->service->createGuardia($data);

            $res->status(201)->json(
                [
                    'fecha' => $result['fecha'],
                    'h_inicio' => $result['h_inicio'],
                    'h_fin' => $result['h_fin'],
                    'notas' => $result['notas']
                ],
                "Guardia creado correctamente"
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
     * PATCH /Guardia/{id_guardia}
     */
    public function update(Request $req, Response $res, string $id_guardia): void
    {
    try {
        $result = $this->service->updateGuardia($id_guardia, $req->json());
        $res->status(200)->json([], $result['message']);
    } catch (ValidationException $e) {
        $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
    } catch (Throwable $e) {
        $code = $e->getCode() >= 400 ? $e->getCode() : 500;
        $res->errorJson($e->getMessage(), $code);
    }
    }

    /**
     * DELETE /Guardia/{id_guardia}
     */
    public function delete(Request $req, Response $res, int $id_guardia): void
    {
        try {
            $service = new \Services\GuardiaService();
            $service->deleteGuardia($id_guardia);

            $res->status(200)->json([], "Guardia eliminado correctamente");

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * GET /guardias/{id_guardia}/personas NO SE USA PERO POR SI HACE FALTA PRA DESPUES
     */
    public function persons(Request $req, Response $res, string $id_guardia): void
    {
        try {
            $persons = $this->service->getPersonsByGuardia((int)$id_guardia);

            $res->status(200)->json(
                $persons,
                "Personas asociadas al guardia obtenidas correctamente"
            );

        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    } 

    /**
     * POST /Guardia/assign
     */
    public function assign(Request $req, Response $res): void
    {
        try {
            $data = $req->json();
            $result = $this->service->assignGuardiaToPerson($data);
            $res->status(200)->json($result, $result['message']);
            
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

/**
 * DELETE /Guardia/unassign
 */
public function unassign(Request $req, Response $res): void
{
    try {
        $data = $req->json();
        $result = $this->service->unassignGuardiaFromPerson($data['n_funcionario'], $data['ID_Guardia']);
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