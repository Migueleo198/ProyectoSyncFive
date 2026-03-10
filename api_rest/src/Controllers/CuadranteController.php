<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Services\CuadranteService;
use Throwable;

class CuadranteController
{
    private CuadranteService $service;

    public function __construct()
    {
        $this->service = new CuadranteService();
    }

    /**
     * GET /cuadrante/{id_bombero}/guardias
     */
    public function guardias(Request $req, Response $res, string $id_bombero): void
    {
        try {
            $data = $this->service->getGuardiasByBombero($id_bombero);
            $res->status(200)->json($data, "Guardias obtenidas correctamente");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * GET /cuadrante/{id_bombero}/refuerzos
     */
    public function refuerzos(Request $req, Response $res, string $id_bombero): void
    {
        try {
            $data = $this->service->getRefuerzosByBombero($id_bombero);
            $res->status(200)->json($data, "Refuerzos obtenidos correctamente");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * GET /cuadrante/guardias
     */
    public function todasGuardias(Request $req, Response $res): void
    {
        try {
            $data = $this->service->getAllGuardias();
            $res->status(200)->json($data, "Guardias obtenidas correctamente");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), 500);
        }
    }

    /**
     * GET /cuadrante/refuerzos
     */
    public function todosRefuerzos(Request $req, Response $res): void
    {
        try {
            $data = $this->service->getAllRefuerzos();
            $res->status(200)->json($data, "Refuerzos obtenidos correctamente");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), 500);
        }
    }
}