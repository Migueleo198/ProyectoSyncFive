<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Validation\ValidationException;
use Throwable;
use Services\MaterialService;


class MaterialController
{
    private MaterialService $service;

    public function __construct()
    {
        $this->service = new MaterialService();
    }


    /**
     * GET /materiales
     */
    public function index(Request $req, Response $res): void
    {
        try {
            $materiales = $this->service->getAllMateriales();
            $res->status(200)->json($materiales);
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), (int)($e->getCode()) ?: 500);
        }
    }


    /**
     * GET /materiales/{id}
     */
    public function show(Request $req, Response $res, string $id): void
    {
        try {
            $material = $this->service->getMaterialById((int) $id);
            $res->status(200)->json($material);

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
            return;
        } catch (Throwable $e) {
            $status = (int)$e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }


    /**
     * POST /materiales
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $result = $this->service->createMaterial($req->json());

            $res->status(201)->json(
                ['id' => $result['id']],
                "Material creado correctamente"
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
     * PUT /materiales/{id}
     */
    public function update(Request $req, Response $res, string $id): void
    {
        try {
            $result = $this->service->updateMaterial((int)$id, $req->json());

            if ($result['status'] === 'no_changes') {
                $res->status(200)->json([], $result['message']);
                return;
            }

            $res->status(200)->json([], $result['message']);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = (int)$e->getCode();
            $res->errorJson($e->getMessage(), $code > 0 ? $code : 500);
        }
    }


    /**
     * DELETE /materiales/{id}
     */
    public function delete(Request $req, Response $res, string $id): void
    {
        try {
            $this->service->deleteMaterial((int) $id);
            $res->status(200)->json([], "Material eliminado correctamente");

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = (int)$e->getCode();
            $res->errorJson($e->getMessage(), ($code >= 400 && $code < 600) ? $code : 500);
        }
    }


    /**
     * GET /materiales/completo
     * Devuelve todos los materiales con sus asignaciones.
     * Actualizado para el nuevo esquema con tablas separadas por unidades/serie.
     */
    public function completo(Request $req, Response $res): void
    {
        try {
            $sql = "
                -- MATERIALES SIN ASIGNACIONES
                SELECT 
                    m.id_material,
                    m.nombre,
                    m.descripcion,
                    m.estado,
                    c.nombre        AS categoria,
                    'Sin asignar'   AS tipo,
                    NULL            AS elemento,
                    NULL            AS identificador,
                    NULL            AS unidades,
                    NULL            AS numero_serie,
                    NULL            AS n_funcionario,
                    NULL            AS nombre_instalacion,
                    NULL            AS id_almacen,
                    NULL            AS planta
                FROM Material m
                LEFT JOIN Categoria c ON m.id_categoria = c.id_categoria
                WHERE m.id_material NOT IN (
                    SELECT id_material FROM Vehiculo_Carga_Unidades
                    UNION
                    SELECT id_material FROM Vehiculo_Carga_Serie
                    UNION
                    SELECT id_material FROM Persona_Material
                    UNION
                    SELECT id_material FROM Almacen_Material_Unidades
                    UNION
                    SELECT id_material FROM Almacen_Material_Serie
                )

                UNION ALL

                -- ASIGNACIONES A VEHÍCULOS (por unidades)
                SELECT 
                    m.id_material,
                    m.nombre,
                    m.descripcion,
                    m.estado,
                    c.nombre        AS categoria,
                    'Vehículo'      AS tipo,
                    v.nombre        AS elemento,
                    vcu.matricula   AS identificador,
                    vcu.unidades,
                    NULL            AS numero_serie,
                    NULL            AS n_funcionario,
                    NULL            AS nombre_instalacion,
                    NULL            AS id_almacen,
                    NULL            AS planta
                FROM Material m
                LEFT JOIN Categoria c ON m.id_categoria = c.id_categoria
                INNER JOIN Vehiculo_Carga_Unidades vcu ON m.id_material = vcu.id_material
                INNER JOIN Vehiculo v ON vcu.matricula = v.matricula

                UNION ALL

                -- ASIGNACIONES A VEHÍCULOS (por número de serie)
                SELECT 
                    m.id_material,
                    m.nombre,
                    m.descripcion,
                    m.estado,
                    c.nombre        AS categoria,
                    'Vehículo'      AS tipo,
                    v.nombre        AS elemento,
                    vcs.matricula   AS identificador,
                    NULL            AS unidades,
                    vcs.nserie      AS numero_serie,
                    NULL            AS n_funcionario,
                    NULL            AS nombre_instalacion,
                    NULL            AS id_almacen,
                    NULL            AS planta
                FROM Material m
                LEFT JOIN Categoria c ON m.id_categoria = c.id_categoria
                INNER JOIN Vehiculo_Carga_Serie vcs ON m.id_material = vcs.id_material
                INNER JOIN Vehiculo v ON vcs.matricula = v.matricula

                UNION ALL

                -- ASIGNACIONES A PERSONAS
                SELECT 
                    m.id_material,
                    m.nombre,
                    m.descripcion,
                    m.estado,
                    c.nombre                            AS categoria,
                    'Persona'                           AS tipo,
                    CONCAT(p.nombre, ' ', p.apellidos)  AS elemento,
                    p.id_bombero                        AS identificador,
                    NULL                                AS unidades,
                    pm.nserie                           AS numero_serie,
                    p.n_funcionario,
                    NULL                                AS nombre_instalacion,
                    NULL                                AS id_almacen,
                    NULL                                AS planta
                FROM Material m
                LEFT JOIN Categoria c ON m.id_categoria = c.id_categoria
                INNER JOIN Persona_Material pm ON m.id_material = pm.id_material
                INNER JOIN Persona p ON pm.id_bombero = p.id_bombero

                UNION ALL

                -- ASIGNACIONES A ALMACENES (por unidades)
                SELECT 
                    m.id_material,
                    m.nombre,
                    m.descripcion,
                    m.estado,
                    c.nombre                            AS categoria,
                    'Almacén'                           AS tipo,
                    CONCAT(a.nombre, ' (', i.nombre, ')') AS elemento,
                    amu.id_almacen                      AS identificador,
                    amu.unidades,
                    NULL                                AS numero_serie,
                    NULL                                AS n_funcionario,
                    i.nombre                            AS nombre_instalacion,
                    amu.id_almacen,
                    a.planta
                FROM Material m
                LEFT JOIN Categoria c ON m.id_categoria = c.id_categoria
                INNER JOIN Almacen_Material_Unidades amu ON m.id_material = amu.id_material
                INNER JOIN Almacen a ON amu.id_almacen = a.id_almacen AND amu.id_instalacion = a.id_instalacion
                INNER JOIN Instalacion i ON amu.id_instalacion = i.id_instalacion

                UNION ALL

                -- ASIGNACIONES A ALMACENES (por número de serie)
                SELECT 
                    m.id_material,
                    m.nombre,
                    m.descripcion,
                    m.estado,
                    c.nombre                            AS categoria,
                    'Almacén'                           AS tipo,
                    CONCAT(a.nombre, ' (', i.nombre, ')') AS elemento,
                    ams.id_almacen                      AS identificador,
                    NULL                                AS unidades,
                    ams.n_serie                         AS numero_serie,
                    NULL                                AS n_funcionario,
                    i.nombre                            AS nombre_instalacion,
                    ams.id_almacen,
                    a.planta
                FROM Material m
                LEFT JOIN Categoria c ON m.id_categoria = c.id_categoria
                INNER JOIN Almacen_Material_Serie ams ON m.id_material = ams.id_material
                INNER JOIN Almacen a ON ams.id_almacen = a.id_almacen AND ams.id_instalacion = a.id_instalacion
                INNER JOIN Instalacion i ON ams.id_instalacion = i.id_instalacion

                ORDER BY id_material,
                    CASE tipo
                        WHEN 'Sin asignar' THEN 0
                        WHEN 'Vehículo'    THEN 1
                        WHEN 'Persona'     THEN 2
                        WHEN 'Almacén'     THEN 3
                    END
            ";

            $db = new \Core\DB();
            $resultados = $db->query($sql)->fetchAll();

            $res->status(200)->json($resultados);

        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), (int)($e->getCode()) ?: 500);
        }
    }
}