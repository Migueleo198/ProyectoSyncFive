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
     * GET /ediciones
     */
    public function index(Request $req, Response $res): void
    {
        try {
            $ediciones = $this->service->getAllEdiciones();
            $res->status(200)->json($ediciones);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
            return;
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }

    /**
     * GET /ediciones/{id_edicion}
     */
    public function show(Request $req, Response $res, string $id_formacion, string $id_edicion): void
    {
        try {
            $edicion = $this->service->getEdicionesById((int) $id_formacion, (int) $id_edicion);
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
     * POST /ediciones/{id_formacion}
     */
    public function store(Request $req, Response $res, string $id_formacion): void
    {
        try {
            $result = $this->service->createEdicion($req->json(), (int) $id_formacion);

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
     * PUT /ediciones/{id_formacion}/{id_edicion}
     */
    public function update(Request $req, Response $res,string $id_formacion, string $id_edicion): void
    {
        try {
            $result = $this->service->updateEdicion((int)$id_formacion, (int)$id_edicion, $req->json());

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
     * DELETE /ediciones/{id_formacion}/{id_edicion}
     */
    public function delete(Request $req, Response $res, string $id_formacion, string $id_edicion): void
    {
        try {
            $id_edicion = (int) $id_edicion;
            $id_formacion = (int) $id_formacion;

            $service = new \Services\EdicionService();
            $service->deleteEdicion($id_formacion, $id_edicion);

            $res->status(200)->json([], "Edición eliminada correctamente");

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * GET /ediciones/{id_formacion}/{id_edicion}/personas     
     */
    public function getPersonas(Request $req, Response $res, string $id_formacion, string $id_edicion): void
    {
        try {
            $personas = $this->service->getPersonasEdicion((int) $id_formacion, (int) $id_edicion);
            $res->status(200)->json($personas);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * POST /ediciones/{id_formacion}/{id_edicion}/personas     
     */
    public function setPersonas(Request $req, Response $res, string $id_formacion, string $id_edicion): void
    {
        try {
            $result = $this->service->setPersona($req->json(), (int) $id_formacion, (int) $id_edicion);

            $res->status(201)->json(
                ['id' => $result['id']],
                "Persona asignada a edición correctamente"
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
     * DELETE /ediciones/{id_formacion}/{id_edicion}/personas/{id_bombero}
     */
    public function deletePersonas(Request $req, Response $res, string $id_formacion, string $id_edicion, string $id_bombero): void
    {
        try {
            $id_bombero = (string) $id_bombero;  
            $service = new \Services\EdicionService();
            $service->deletePersona((int) $id_formacion, (int) $id_edicion, $id_bombero);
            $res->status(200)->json([], "Persona eliminada correctamente");
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
}