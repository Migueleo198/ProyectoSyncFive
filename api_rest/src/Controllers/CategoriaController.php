<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Validation\ValidationException;
use Throwable;

use Services\CategoriaService;


class CategoriaController
{
    private CategoriaService $service;

    public function __construct()
    {
        $this->service = new CategoriaService();
    }

    
    /**
     * GET /categorias
     */
    public function index(Request $req, Response $res): void
    {
        try {
            $categorias = $this->service->getAllCategorias();
            $res->status(200)->json($categorias);
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * POST /categorias 
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $result = $this->service->createCategoria($req->json());

            $res->status(201)->json(
                ['id' => $result['id']],
                "Categoría creada correctamente"
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
     * DELETE /categorias/{id}
     */
    public function delete(Request $req, Response $res, string $id): void
    {
        try {
            $id = (int) $id;

            $service = new \Services\CategoriaService();
            $service->deleteCategoria($id);

            $res->status(200)->json([], "Categoría eliminada correctamente");

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

}