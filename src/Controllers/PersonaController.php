<?php
declare(strict_types=1);

namespace Controllers;

// Peticion HTTP
use Core\Request;
// Respuesta HTTP
use Core\Response;
// Logica de negocio de las personas
use Services\PersonaService;
// Errores de validacion
use Validation\ValidationException;
// Errores genericos
use Throwable;


class PersonaController
{
    private PersonaService $service;

    // Constructor
    public function __construct()
    {
        $this->service = new PersonaService();
    }

    
    /**
     * GET /personas
     * Listado completo de personas
     */
    public function index(Request $req, Response $res): void
    {
        try {
            // Obtiene todas las personas
            $personas = $this->service->getAllPersonas();
            // Devuelve un 200 OK
            $res->status(200)->json($personas, "Listado de personas obtenido correctamente");
        } catch (Throwable $e) {
            // Devuelve error genérico
            $res->errorJson($e->getMessage(), 500);
        }
    }


    /**
     * GET /personas/{n_funcionario}
     */
    public function show(Request $req, Response $res, string $n_funcionario): void
    {
        try {
            // El servicio valida el numero de funcionario y consulta la BD.
            $persona = $this->service->getPersonaById((int)$n_funcionario);
            // Devuelve un 200 OK
            $res->status(200)->json($persona, "Persona encontrada");
        } catch (Throwable $e) {
            // Devuelve error 404 o genérico
            $code = ($e->getCode() >= 400) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }


    /**
     * POST /personas
     */
    public function store(Request $req, Response $res): void
    {
        try {
            // Obtiene el cuerpo de la petición en formato JSON y llama a service
            $result = $this->service->createPersona($req->json());

            // Devuelve 201, el numero de funcionario de la persona y un mensaje genérico
            $res->status(201)->json(
                ['n_funcionario' => $result['n_funcionario']],
                "Persona creada correctamente"
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
     * PATCH /personas/{n_funcionario}
     */
    public function update(Request $req, Response $res, string $n_funcionario): void
    {
        try {
            // Convierte el n_funcionario a entero, obtiene el cuerpo de la petición en formato JSON y envia datos al servicio
            $result = $this->service->updatePersona((int)$n_funcionario, $req->json());
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
     * DELETE /personas/{n_funcionario}
     */
    public function delete(Request $req, Response $res, string $n_funcionario): void
    {
        try {
            // Convierte el n_funcionario a entero
            $n_funcionario = (int) $n_funcionario;

            // Llama al servicio para eliminar la persona
            $service = new \Services\PersonaService();
            $service->deletePersona($n_funcionario);
            // Éxito
            $res->status(200)->json([], "Persona eliminada correctamente");

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
