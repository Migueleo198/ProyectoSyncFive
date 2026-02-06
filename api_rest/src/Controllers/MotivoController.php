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
     * GET /Motivo
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
     * GET /Motivo/{cod_motivo}
     */
    public function show(Request $req, Response $res, string $cod_motivo): void
    {
        try {
            // Ahora cod_motivo es estrictamente string
            $motivo = $this->service->getMotivoById($cod_motivo);
            $res->status(200)->json($motivo, "Motivo encontrado");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * POST /Motivo
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $data = $req->json();

            // Ahora puede incluir cod_motivo (string)
            $result = $this->service->registerMotivo($data);

            $res->status(201)->json(
                [
                    'cod_motivo'    => $result['cod_motivo'],    
                    'nombre' => $result['nombre'],
                    'dias' => $result['dias']
                ],
                "Motivo creado correctamente"
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
     * PATCH /Motivo/{cod_motivo}
     */
    public function update(Request $req, Response $res, string $cod_motivo): void
    {
        try {
            $data = $req->json();

            // Ya no se convierte a entero
            $result = $this->service->updateMotivo($cod_motivo, $data);

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
     * DELETE /Motivo/{cod_motivo}
     */
    public function delete(Request $req, Response $res, string $cod_motivo): void
    {
        try {
            // Ya no se convierte a entero
            $service = new \Services\MotivoService();
            $service->deleteMotivo($cod_motivo);

            $res->status(200)->json([], "Motivo eliminado correctamente");

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
}
?>
