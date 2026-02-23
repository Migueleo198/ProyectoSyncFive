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
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
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
            $status = $e->getCode() === 404 ? 404 : 500;
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

            $res->errorJson(app_debug() ? $e->getMessage() : "Error interno del servidor",500);
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
     * DELETE /materiales/{id}
     */
    
    public function delete(Request $req, Response $res, string $id): void
    {
        try {
            $id = (int) $id;

            $service = new \Services\MaterialService();
            $service->deleteMaterial($id);

            $res->status(200)->json([], "Material eliminado correctamente");

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
    /**
     * GET /materiales/completo
     * Devuelve todos los materiales con sus asignaciones (como el SQL que muestras)
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
                    c.nombre AS categoria,
                    'Sin asignar' AS tipo,
                    NULL AS elemento,
                    NULL AS identificador,
                    NULL AS unidades,
                    NULL AS numero_serie
                FROM Material m
                LEFT JOIN Categoria c ON m.id_categoria = c.id_categoria
                LEFT JOIN Vehiculo_Carga_Material vcm ON m.id_material = vcm.id_material
                LEFT JOIN Persona_Material pm ON m.id_material = pm.id_material
                LEFT JOIN Almacen_material am ON m.id_material = am.id_material
                WHERE vcm.id_material IS NULL 
                AND pm.id_material IS NULL 
                AND am.id_material IS NULL

                UNION ALL

                -- ASIGNACIONES A VEHÍCULOS
                SELECT 
                    m.id_material,
                    m.nombre,
                    m.descripcion,
                    m.estado,
                    c.nombre AS categoria,
                    'Vehículo' AS tipo,
                    v.nombre AS elemento,
                    vcm.matricula AS identificador,
                    vcm.unidades,
                    vcm.nserie AS numero_serie
                FROM Material m
                LEFT JOIN Categoria c ON m.id_categoria = c.id_categoria
                LEFT JOIN Vehiculo_Carga_Material vcm ON m.id_material = vcm.id_material
                LEFT JOIN Vehiculo v ON vcm.matricula = v.matricula
                WHERE vcm.id_material IS NOT NULL

                UNION ALL

                -- ASIGNACIONES A PERSONAS
                SELECT 
                    m.id_material,
                    m.nombre,
                    m.descripcion,
                    m.estado,
                    c.nombre AS categoria,
                    'Persona' AS tipo,
                    CONCAT(p.nombre, ' ', p.apellidos) AS elemento,
                    p.id_bombero AS identificador,
                    NULL AS unidades,
                    pm.nserie AS numero_serie
                FROM Material m
                LEFT JOIN Categoria c ON m.id_categoria = c.id_categoria
                LEFT JOIN Persona_Material pm ON m.id_material = pm.id_material
                LEFT JOIN Persona p ON pm.id_bombero = p.id_bombero
                WHERE pm.id_material IS NOT NULL

                UNION ALL

                -- ASIGNACIONES A ALMACENES
                SELECT 
                    m.id_material,
                    m.nombre,
                    m.descripcion,
                    m.estado,
                    c.nombre AS categoria,
                    'Almacén' AS tipo,
                    CONCAT(a.nombre, ' (', i.nombre, ')') AS elemento,
                    a.id_almacen AS identificador,
                    am.unidades,
                    am.n_serie AS numero_serie
                FROM Material m
                LEFT JOIN Categoria c ON m.id_categoria = c.id_categoria
                LEFT JOIN Almacen_material am ON m.id_material = am.id_material
                LEFT JOIN Almacen a ON am.id_almacen = a.id_almacen
                LEFT JOIN Instalacion i ON am.id_instalacion = i.id_instalacion
                WHERE am.id_material IS NOT NULL

                ORDER BY id_material, 
                    CASE tipo
                        WHEN 'Sin asignar' THEN 0
                        WHEN 'Vehículo' THEN 1
                        WHEN 'Persona' THEN 2
                        WHEN 'Almacén' THEN 3
                    END
            ";
            
            $db = new \Core\DB();
            $resultados = $db->query($sql)->fetchAll();
            
            $res->status(200)->json($resultados);
            
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }
}