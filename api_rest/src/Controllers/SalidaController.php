<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Validation\ValidationException;
use Throwable;

use Services\SalidaService;


class SalidaController
{
    private SalidaService $service;

    public function __construct()
    {
        $this->service = new SalidaService();
    }

    
    /**
     * GET /salidas
     */
    public function index(Request $req, Response $res): void
    {
        try {
            $salidas = $this->service->getAllSalidas();
            $res->status(200)->json($salidas);
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * GET /salidas/id
     */
    public function show(Request $req, Response $res, string $id): void
    {
        try {
            $salida = $this->service->getSalidaById((int)$id);
            $res->status(200)->json($salida);
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * POST /salidas
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $result = $this->service->createSalida($req->json());

            $res->status(201)->json(
                ['id' => $result['id']],
                "Salida creada correctamente"
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
     * PUT /salidas/{id}
     */
    public function update(Request $req, Response $res, string $id): void
    {
        try {
            $result = $this->service->updateSalida((int)$id, $req->json());

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
     * DELETE /salidas/{id}
     */
    public function delete(Request $req, Response $res, string $id): void
    {
        try {
            $id = (int) $id;

            $service = new \Services\SalidaService();
            $service->deleteSalida($id);

            $res->status(200)->json([], "Salida eliminada correctamente");

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }


//+++++++++++++++++++ Persona en salida ++++++++++++++++++++++

    /**
     * GET /salidas/personas
     */
    public function getPersona(Request $req, Response $res): void
    {
        try {
            $salidas = $this->service->getAllPersonas();
            $res->status(200)->json($salidas);
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * POST /salidas/personas
     */
    public function setPersona(Request $req, Response $res): void
    {
        try {
            $result = $this->service->setPersonaSalida($req->json());
            $res->status(201)->json(
                ['id' => $result['id']],
                "Persona asignada a la salida correctamente"
            );
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $res->errorJson(app_debug() ? $e->getMessage() : "Error interno del servidor",500);
            return;
        }
    }     

    /**
     * DELETE /salidas/personas/{n_funcionario}
     */
    public function deletePersona(Request $req, Response $res, string $n_funcionario): void
    {
        try {
            $n_funcionario = (int) $n_funcionario;  
            $service = new \Services\SalidaService();
            $service->deletePersonaSalida($n_funcionario);

            $res->status(200)->json([], "Persona eliminada de la salida correctamente");
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
}
