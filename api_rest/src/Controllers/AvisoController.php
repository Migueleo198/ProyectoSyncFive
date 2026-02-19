<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Services\AvisoService;
use Validation\ValidationException;
use Throwable;

class AvisoController
{
    private AvisoService $service;

    public function __construct()
    {
        $this->service = new AvisoService();
    }

    // ===========================
    // Avisos
    // ===========================

    /**
     * GET /avisos
     */
    public function index(Request $req, Response $res): void
    {
        try {
            $avisos = $this->service->getAllAvisos();
            $res->status(200)->json($avisos, "Listado de avisos obtenido correctamente");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), 500);
        }
    }

    /**
     * GET /avisos/{id}
     */
    public function show(Request $req, Response $res, string $id): void
    {
        try {
            // El servicio valida el ID y consulta la BD.
            $aviso = $this->service->getAvisoById((int)$id);
            // Devuelve un 200 OK
            $res->status(200)->json($aviso, "Aviso encontrado correctamente");
        } catch (Throwable $e) {
            // Devuelve error 404 o genérico
            $code = ($e->getCode() >= 400) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * POST /avisos
     */
    public function store(Request $req, Response $res): void
    {
        try {
            // Obtiene el cuerpo de la petición en formato JSON y llama a service
            $result = $this->service->createAviso($req->json());
            
            // Devuelve 201, el id de la aviso y un mensaje genérico
            $res->status(201)->json(
                ['id' => $result['id']],
                "Aviso creado correctamente"
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
     * DELETE /avisos/{id}
     */
    public function delete(Request $req, Response $res, string $id): void
    {
        try {
            // Ya no se convierte a entero
            $service = new \Services\AvisoService();
            $service->deleteAviso((int)$id);

            $res->status(200)->json([], "Aviso eliminado correctamente");

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    // ===========================
    // Destinatarios
    // ===========================

    /**
     * GET /avisos/{id_aviso}/destinatarios
     */
    public function getDestinatario(Request $req, Response $res, string $id_aviso): void
    {
        try {
            $destinatarios = $this->service->getDestinatarios((int)$id_aviso);
            $res->status(200)->json($destinatarios, "Destinatarios obtenidos correctamente");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * POST /avisos/{id_aviso}/destinatarios
     */
    public function setDestinatario(Request $req, Response $res, string $id_aviso): void
    {
        try {
            $data = $req->json();
            if (!isset($data['id_bombero'])) {
                throw new ValidationException(['id_bombero' => ['El campo id_bombero es obligatorio']]);
            }

            $this->service->addDestinatario((int)$id_aviso, $data['id_bombero']);
            $res->status(201)->json([], "Destinatario agregado correctamente");
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * DELETE /avisos/{id_aviso}/destinatarios/{id_bombero}
     */
    public function deleteDestinatario(Request $req, Response $res, string $id_aviso, string $id_bombero): void
    {
        try {
            $this->service->removeDestinatario((int)$id_aviso, $id_bombero);
            $res->status(200)->json([], "Destinatario eliminado correctamente");
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    // ===========================
    // Remitente
    // ===========================

    /**
     * GET /avisos/{id_aviso}/remitente
     */
    public function getRemitente(Request $req, Response $res, string $id_aviso): void
    {
        try {
            $remitente = $this->service->getRemitente((int)$id_aviso);
            $res->status(200)->json($remitente, "Remitente obtenido correctamente");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * POST /avisos/{id_aviso}/remitente/{id_bombero}
     */
    public function setRemitente(Request $req, Response $res, string $id_aviso, string $id_bombero): void
    {
        try {
            $this->service->setRemitente((int)$id_aviso, $id_bombero);
            $res->status(201)->json([], "Remitente asignado correctamente");
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * DELETE /avisos/{id_aviso}/remitente/{id_bombero}
     */
    public function deleteRemitente(Request $req, Response $res, string $id_aviso, string $id_bombero): void
    {
        try {
            // Para eliminar remitente no usamos id_bombero, solo id_aviso
            $this->service->removeRemitente((int)$id_aviso);
            $res->status(200)->json([], "Remitente eliminado correctamente");
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
}
?>
