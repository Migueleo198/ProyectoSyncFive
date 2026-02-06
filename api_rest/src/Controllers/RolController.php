<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Services\RolService;
use Validation\ValidationException;
use Throwable;

class RolController
{
    private RolService $service;

    public function __construct()
    {
        $this->service = new RolService();
    }

    // ===========================
    // Roles
    // ===========================

    /**
     * GET /roles
     */
    public function index(Request $req, Response $res): void
    {
        try {
            $roles = $this->service->getAllRoles();
            $res->status(200)->json($roles, "Listado de roles obtenido correctamente");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), 500);
        }
    }

    /**
     * POST /roles
     */
    public function store(Request $req, Response $res): void
    {
        try {
            // Obtiene el cuerpo de la petición en formato JSON y llama a service
            $result = $this->service->createRoles($req->json());
            
            // Devuelve 201, el id de la aviso y un mensaje genérico
            $res->status(201)->json(
                ['id' => $result['id']],
                "Rol creado correctamente"
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
     * PUT /roles/{id}
     */
    public function update(Request $req, Response $res, int $id): void
    {
        try {
            // Convierte el id a entero, obtiene el cuerpo de la petición en formato JSON y envia datos al servicio
            $result = $this->service->updateRol($id, $req->json());
            // Si no se actualiza nada devuelve 200
            if ($result['status'] === 'no_changes') {
                $res->status(200)->json([], $result['message']);
                return;
            }

            // Éxito
            $res->status(200)->json([], $result['message']);
        }
        catch (ValidationException $e) {
            // Gestiona errores de validación
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        }
        catch (Throwable $e) {
            // Gestiona errores genéricos del servidor
            $code = $e->getCode() > 0 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    
    /**
     * DELETE /roles/{id}
     */
    public function delete(Request $req, Response $res, int $id): void
    {
        try {
            // Convierte el id a entero
            $id = (int) $id;

            // Llama al servicio para eliminar la rol
            $service = new \Services\RolService();
            $service->deleteRol($id);

            // Éxito
            $res->status(200)->json([], "Rol eliminado correctamente");

        } catch (ValidationException $e) {
            // Gestiona errores de validación
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            // Gestiona errores generales del servidor
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
    /**
     * GET /roles/{ID_Rol}/personas
     */
    public function persons(Request $req, Response $res, int $ID_Rol): void
    {
        try {
            $persons = $this->service->getPersonsByRol($ID_Rol);

            $res->status(200)->json(
                $persons,
                "Personas asociadas al rol obtenidas correctamente"
            );

        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

      /**
     * POST /roles/asignar
     */
    public function assign(Request $req, Response $res): void
    {
        try {
            $data = $req->json();

            $result = $this->service->assignRolToPerson($data);

            $res->status(201)->json([], $result['message']);

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");

        } catch (Throwable $e) {
            $code = $e->getCode() > 0 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
}
?>
