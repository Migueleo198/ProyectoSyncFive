<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Validation\ValidationException;
use Throwable;

use Services\MapaService;

class MapaController
{
    private MapaService $service;


    public function __construct()
    {
$this->service = new MapaService();
    }


    /**
     * GET /mapas
     * Parámetros opcionales: tipo, provincia, municipio, estado
     */
public function index(Request $req, Response $res): void
{
    try {
        $filtros = [
            'tipo'      => $_GET['tipo']      ?? null,
            'provincia' => $_GET['provincia'] ?? null,
            'municipio' => $_GET['municipio'] ?? null,
            'estado'    => $_GET['estado']    ?? null,
        ];
        $infraestructuras = $this->service->getAllInfraestructuras($filtros);
        $res->status(200)->json($infraestructuras);
    } catch (Throwable $e) {
        $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
    }
}


    /**
     * GET /mapa/{codigo}
     */
    public function show(Request $req, Response $res, string $codigo): void
    {
        try {
            $infraestructura = $this->service->getInfraestructuraById((int) $codigo);
            $res->status(200)->json($infraestructura);

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
            return;
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }


    /**
     * POST /mapa
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $result = $this->service->createInfraestructura($req->json());

            $res->status(201)->json(
                ['codigo' => $result['codigo']],
                "Infraestructura de agua creada correctamente"
            );

        } catch (ValidationException $e) {
            $res->status(422)->json(
                ['errors' => $e->errors],
                "Errores de validación"
            );
            return;

        } catch (Throwable $e) {
            $res->errorJson(app_debug() ? $e->getMessage() : "Error interno del servidor", 500);
            return;
        }
    }


    /**
     * PUT /mapa/{id}
     */
    public function update(Request $req, Response $res, string $codigo): void
    {
        try {

            $result = $this->service->updateInfraestructura($codigo, $req->json());

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
     * DELETE /mapa/{codigo}
     */
    public function destroy(Request $req, Response $res, string $codigo): void
    {
        try {
            $this->service->deleteInfraestructura($codigo);
            $res->status(200)->json([], "Infraestructura eliminada correctamente");

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
}