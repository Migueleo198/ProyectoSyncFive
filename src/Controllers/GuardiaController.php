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
     * GET /guardias
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
     * GET /guardias/{ID_Guardia}
     */
    public function show(Request $req, Response $res, string $ID_Guardia): void
    {
        try {
            $guardia = $this->service->getGuardiaById($ID_Guardia);
            $res->status(200)->json($guardia, "Guardia encontrado correctamente");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * POST /guardias
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $result = $this->service->createGuardia($req->json());

            // El servicio devuelve ['ID_Guardia' => ...]
            $res->status(201)->json(
                ['ID_Guardia' => $result['ID_Guardia']],
                "Guardia creado correctamente"
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
     * PATCH /guardias/{ID_Guardia}
     */
    public function update(Request $req, Response $res, string $ID_Guardia): void
    {
        try {
            $result = $this->service->updateGuardia($ID_Guardia, $req->json());

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
     * DELETE /guardias/{ID_Guardia}
     */
    public function delete(Request $req, Response $res, string $ID_Guardia): void
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
