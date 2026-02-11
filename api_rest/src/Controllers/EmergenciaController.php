<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Validation\ValidationException;
use Throwable;

use Services\EmergenciaService;


class EmergenciaController
{
    private EmergenciaService $service;

    public function __construct()
    {
        $this->service = new EmergenciaService();
    }

    
    /**
     * GET /emergencias
     */
    public function index(Request $req, Response $res): void
    {
        try {
            $emergencias = $this->service->getAllEmergencias();
            $res->status(200)->json($emergencias);
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }


    /**
     * GET /emergencias/{id}
     */
    public function show(Request $req, Response $res, string $id): void
    {
        try {
            $emergencia = $this->service->getEmergenciaById((int) $id);
            $res->status(200)->json($emergencia);

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
            return;
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }


    /**
     * POST /emergencias
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $result = $this->service->createEmergencia($req->json());

            $res->status(201)->json(
                ['id' => $result['id']],
                "Emergencia creada correctamente"
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
     * PUT /emergencias/{id}
     */
    public function update(Request $req, Response $res, string $id): void
    {
        try {
            $result = $this->service->updateEmergencia((int)$id, $req->json());

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



    //+++++++++++++++++++ Vehiculo en emergencia ++++++++++++++++++++++
/**
    * GET /emergencias/vehiculos
     */
    public function getVehiculo(Request $req, Response $res): void
    {
        try {
            $emergencias = $this->service->getAllVehiculos();
            $res->status(200)->json($emergencias);
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * POST /emergencias/{id}/vehiculos
     */
    public function setVehiculo(Request $req, Response $res, string $id): void
    {
        try {
            $result = $this->service->setVehiculoEmergencia((int)$id, $req->json());

            $res->status(201)->json(
                ['id' => $result['id']],
                "Vehículo asignado correctamente"
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

    public function deleteVehiculo(Request $req, Response $res, int $id, string $matricula): void
    {
        try {
            $id = (int) $id;

            $service = new \Services\EmergenciaService();
            $service->deleteVehiculoEmergencia($id, $matricula);

            $res->status(200)->json([], "Vehículo eliminado correctamente");

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }


//++++++++++++++++++++ Personal en vehiculo ++++++++++++++++++++++
    
    /**
     * GET /emergencias/{id_emergencia}/vehiculos/{matricula}/personas
     */

    public function getPersonal(Request $req, Response $res, int $id_emergencia, string $matricula): void
    {
        try {
            $personal = $this->service->getPersonalVehiculo($id_emergencia, $matricula);
            $res->status(200)->json($personal);

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
            return;
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }

    /**
     * POST /emergencias/{id_emergencia}/vehiculos/{matricula}/personas
     */
    public function setPersonal(Request $req, Response $res, int $id_emergencia, string $matricula): void
    {
        try {
            $result = $this->service->setPersonalVehiculo($id_emergencia, $matricula, $req->json());            

            $res->status(201)->json(
                ['id' => $result['id']],
                "Personal asignado correctamente"
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
     * DELETE /emergencias/{id_emergencia}/vehiculos/{matricula}/personas/{id_bombero}
     */
    public function deletePersonal(Request $req, Response $res, int $id_emergencia, string $matricula, string $id_bombero): void
    {
        try {
            $id_bombero = (string) $id_bombero;  
            $service = new \Services\EmergenciaService();
            $service->deletePersonalVehiculo($id_emergencia, $matricula, $id_bombero);
            $res->status(200)->json([], "Personal eliminado correctamente");
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
}