<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Validation\ValidationException;
use Throwable;

use Services\EdicionService;


class EdicionController
{
    private EdicionService $service;

    public function __construct()
    {
        $this->service = new EdicionService();
    }


    /**
     * GET /ediciones/{id_formacion}
     */
    public function show(Request $req, Response $res, string $id): void
    {
        try {
            $edicion = $this->service->getEdicionById((int) $id);
            $res->status(200)->json($edicion);

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
            return;
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }


    /**
     * POST /ediciones
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $result = $this->service->createEdicion($req->json());

            $res->status(201)->json(
                ['id' => $result['id']],
                "Edición creada correctamente"
            );

        } catch (ValidationException $e) {

            $res->status(422)->json(
                ['errors' => $e->errors],
                "Errores de validación"
            );
            return;

        } catch (Throwable $e) {

            $res->errorJson(app_debug() ? $e->getMessage() : "Error interno del servidor",500);
            return;
        }
    }


    /**
     * PUT /ediciones/{id_edicion}
     */
    public function update(Request $req, Response $res, string $id): void
    {
        try {
            $result = $this->service->updateEdicion((int)$id, $req->json());

            if ($result['status'] === 'no_changes') {
                $res->status(200)->json([], $result['message']);
                return;
            }

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
     * DELETE /ediciones/{id_edicion}
     */
    public function delete(Request $req, Response $res, string $id): void
    {
        try {
            $id = (int) $id;

            $service = new \Services\FormacionService();
            $service->deleteEdicion($id);

            $res->status(200)->json([], "Edición eliminada correctamente");

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * GET /ediciones/{id_edicion}/personas     
     */
    public function getPersonas(Request $req, Response $res, string $id): void
    {
        try {
            $personas = $this->service->getPersonasEdicion((int) $id);
            $res->status(200)->json($personas);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
}