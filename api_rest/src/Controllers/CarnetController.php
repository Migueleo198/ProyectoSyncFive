<?php
declare(strict_types=1);

namespace Controllers;

// Peticion HTTP
use Core\Request;
// Respuesta HTTP
use Core\Response;
// Logica de negocio de los carnets
use Services\CarnetService;
// Errores de validacion
use Validation\ValidationException;
// Errores genericos
use Throwable;


class CarnetController
{
    private CarnetService $service;

    // Constructor
    public function __construct()
    {
        $this->service = new CarnetService();
    }

    
    /**
     * GET /carnets
     * Listado completo de carnets
     */
    public function index(Request $req, Response $res): void
    {
        try {
            // Obtiene todos los carnets
            $carnets = $this->service->getAllCarnets();
            // Devuelve un 200 OK
            $res->status(200)->json($carnets, "Listado de carnets obtenido correctamente");
        } catch (Throwable $e) {
            // Devuelve error genérico
            $res->errorJson($e->getMessage(), 500);
        }
    }

    /**
     * POST /carnets
     */
    public function store(Request $req, Response $res): void
    {
        try {
            // Obtiene el cuerpo de la petición en formato JSON y llama a service
            $result = $this->service->createCarnet($req->json());
            
            // Devuelve 201, el id del carnet y un mensaje genérico
            $res->status(201)->json(
                ['id' => $result['id']],
                "Carnet creado correctamente"
            );
        } catch (ValidationException $e) {
            // Gestiona errores de validación
            $res->status(422)->json(
                ['errors' => $e->errors],
                "Errores de validación"
            );
            return;

        } catch (Throwable $e) {
            // Gestiona errores genéricos del servidor
            $res->errorJson(app_debug() ? $e->getMessage() : "Error interno del servidor",500);
            return;

        }
    }

    /**
     * DELETE /carnets/{id}
     */
    public function destroy(Request $req, Response $res, string $id): void
    {
        try {
            // Convierte el id a entero
            $id = (int) $id;

            // Llama al servicio para eliminar el carnet
            $service = new \Services\CarnetService();
            $service->deleteCarnet($id);

            // Éxito
            $res->status(200)->json([], "Carnet eliminado correctamente");

        } catch (ValidationException $e) {
            // Gestiona errores de validación
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            // Gestiona errores generales del servidor
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
}