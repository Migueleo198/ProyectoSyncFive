<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Validation\ValidationException;
use Throwable;

use Services\MantenimientoService;

class MantenimientoController
{
    private MantenimientoService $service;

    public function __construct()
    {
        $this->service = new MantenimientoService();
    }

    /**
     * GET /mantenimientos
     */
    public function index(Request $req, Response $res): void
    {
        try {
            $mantenimientos = $this->service->getAllMantenimientos();
            $res->status(200)->json($mantenimientos);
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * POST /mantenimientos
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $result = $this->service->createMantenimiento($req->json());

            $res->status(201)->json(
                ['cod_mantenimiento' => $result['cod_mantenimiento']],
                "Mantenimiento creado correctamente"
            );
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * PUT /mantenimientos/{cod_mantenimiento}
     */
    public function update(Request $req, Response $res, string $cod): void
    {
        try {
            $result = $this->service->updateMantenimiento((int) $cod, $req->json());

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
     * PATCH /mantenimientos/{cod_mantenimiento}
     */
    public function patch(Request $req, Response $res, string $cod): void
    {
        try {
            $result = $this->service->patchMantenimiento((int) $cod, $req->json());

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
     * DELETE /mantenimientos/{cod_mantenimiento}
     */
    public function destroy(Request $req, Response $res, string $cod): void
    {
        try {
            $this->service->deleteMantenimiento((int) $cod);
            $res->status(200)->json([], "Mantenimiento eliminado correctamente");
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    // ========== RELACIONES ==========

    /**
     * GET /mantenimientos/{cod_mantenimiento}/personas
     */
    public function getPersonas(Request $req, Response $res, string $cod): void
    {
        try {
            $personas = $this->service->getPersonasEnMantenimiento((int) $cod);
            $res->status(200)->json($personas);
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * POST /mantenimientos/{cod_mantenimiento}/personas
     */
    public function addPersona(Request $req, Response $res, string $cod): void
    {
        try {
            $data = $req->json();
            
            if (!isset($data['id_bombero'])) {
                $res->status(400)->json([], "Se requiere el campo id_bombero");
                return;
            }

            $result = $this->service->addPersonaToMantenimiento((int) $cod, (int) $data['id_bombero']);
            $res->status(200)->json([], $result['message']);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * DELETE /mantenimientos/{cod_mantenimiento}/personas/{id_bombero}
     */
    public function removePersona(Request $req, Response $res, string $cod, string $id_bombero): void
    {
        try {
            $this->service->removePersonaFromMantenimiento((int) $cod, (int) $id_bombero);
            $res->status(200)->json([], "Bombero eliminado del mantenimiento correctamente");
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    // Métodos similares para vehículos y materiales...
}