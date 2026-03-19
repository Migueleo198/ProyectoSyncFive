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
     * GET /Refuerzo/{id_turno_refuerzo}
     */
    public function show(Request $req, Response $res, string $id_turno_refuerzo): void
    {
        try {
            // Ahora id_turno_refuerzo es estrictamente string
            $refuerzo = $this->service->getRefuerzoById($id_turno_refuerzo);
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
            $result = $this->service->createRefuerzo($data);

            $res->status(201)->json(
                [
                    'id_turno_refuerzo' => $result['id_turno_refuerzo'],
                    'f_inicio'          => $result['f_inicio'],
                    'f_fin'             => $result['f_fin'],
                    'horas'             => $result['horas']
                ],
                "Turno de refuerzo creado correctamente"
            );
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $res->errorJson(app_debug() ? $e->getMessage() : "Error interno del servidor", 500);
        }
    }



    /**
     * PATCH /Refuerzo/{id_turno_refuerzo}
     */
    public function update(Request $req, Response $res, string $id_turno_refuerzo): void
    {
        try {
            $data = $req->json();

            // Ya no se convierte a entero
            $result = $this->service->updateRefuerzo($id_turno_refuerzo, $data);

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
     * DELETE /Refuerzo/{id_turno_refuerzo}
     */
    public function delete(Request $req, Response $res, string $id_turno_refuerzo): void
    {
        try {
            // Ya no se convierte a entero
            $service = new \Services\RefuerzoService();
            $service->deleteRefuerzo($id_turno_refuerzo);

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
public function assign(Request $req, Response $res, string $id_bombero): void
{
    try {
        $data = $req->json();
        $data['id_bombero'] = $id_bombero; // tomar de la URL
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
        $result = $this->service->unassignRefuerzoFromPerson($data['id_bombero'], $data['id_turno_refuerzo']);
        $res->status(200)->json($result, $result['message']);
    } catch (ValidationException $e) {
        $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
    } catch (Throwable $e) {
        $code = $e->getCode() >= 400 ? $e->getCode() : 500;
        $res->errorJson($e->getMessage(), $code);
    }
}

    /**
     * GET /turno-refuerzo/fecha/{fecha}
     */
    public function getTurnoByFecha(Request $req, Response $res, string $fecha): void
    {
        try {
            $turno = $this->service->getTurnoRefuerzoByFecha($fecha);
            if (!$turno) {
                $res->status(200)->json([], "No hay turno de refuerzo registrado para esta fecha.");
                return; 
            }
            $res->status(200)->json($turno, "Turno de refuerzo obtenido correctamente");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);   
        }
    }    

}



?>
