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

            // Ahora puede incluir id_guardia (string)
            $result = $this->service->registerGuardia($data);

            $res->status(201)->json(
                [
                    'id_guardia'    => $result['id_guardia'],    
                    'f_inicio' => $result['f_inicio'],
                    'f_fin' => $result['f_fin'],
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
            $data = $req->json();

            // Ya no se convierte a entero
            $result = $this->service->updateGuardia($id_guardia, $data);

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
     * DELETE /Guardia/{id_guardia}
     */
    public function delete(Request $req, Response $res, string $id_guardia): void
    {
        try {
            // Ya no se convierte a entero
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