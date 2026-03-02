<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class AlmacenModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Almacen ORDER BY id_almacen ASC")
            ->fetchAll();
    }

    public function find(int $id): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Almacen WHERE id_almacen = :id")
            ->bind(":id", $id)
            ->fetch();

        return $result ?: null;
    }

    public function findByInstalacion(int $id_instalacion): array
    {
        return $this->db
            ->query("
                SELECT a.* 
                FROM Almacen a
                INNER JOIN Almacen_Instalacion ai ON a.id_almacen = ai.id_almacen
                WHERE ai.id_instalacion = :id_instalacion
                ORDER BY a.id_almacen ASC
            ")
            ->bind(":id_instalacion", $id_instalacion)
            ->fetchAll();
    }

    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Almacen (planta, nombre)
            VALUES (:planta, :nombre)
        ")
        ->bind(":planta", $data['planta'])
        ->bind(":nombre", $data['nombre'])
        ->execute();

        return (int) $this->db->lastId();
    }

    public function asociarConInstalacion(int $id_almacen, int $id_instalacion): bool
    {
        $this->db->query("
            INSERT INTO Almacen_Instalacion (id_almacen, id_instalacion)
            VALUES (:id_almacen, :id_instalacion)
        ")
        ->bind(":id_almacen", $id_almacen)
        ->bind(":id_instalacion", $id_instalacion)
        ->execute();

        $result = $this->db->query("SELECT ROW_COUNT() AS affected")->fetch();
        return $result['affected'] > 0;
    }

    public function update(int $id, array $data): int
    {
        $this->db->query("
            UPDATE Almacen SET
                planta = :planta,
                nombre = :nombre
            WHERE id_almacen = :id
        ")
        ->bind(":id", $id)
        ->bind(":planta", $data['planta'])
        ->bind(":nombre", $data['nombre'])
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function delete(int $id_almacen, int $id_instalacion): int
    {
        // Verificar si el almacén existe
        $almacen = $this->find($id_almacen);
        if (!$almacen) {
            return 0;
        }
        
        // Eliminar el almacén
        $this->db->query("DELETE FROM Almacen WHERE id_almacen = :id_almacen")
                ->bind(":id_almacen", $id_almacen)
                ->execute();
        
        $result = $this->db->query("SELECT ROW_COUNT() AS affected")->fetch();
        return $result['affected'] > 0 ? 1 : -1;
    }

    public function desasociarDeInstalacion(int $id_instalacion, int $id_almacen): int
    {
        $this->db->query("
            DELETE FROM Almacen_Instalacion 
            WHERE id_almacen = :id_almacen 
            AND id_instalacion = :id_instalacion
        ")
        ->bind(":id_almacen", $id_almacen)
        ->bind(":id_instalacion", $id_instalacion)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function existeAsociacion(int $id_instalacion, int $id_almacen): bool
    {
        $result = $this->db
            ->query("
                SELECT 1 
                FROM Almacen_Instalacion 
                WHERE id_almacen = :id_almacen 
                AND id_instalacion = :id_instalacion
            ")
            ->bind(":id_almacen", $id_almacen)
            ->bind(":id_instalacion", $id_instalacion)
            ->fetch();

        return $result !== null;
    }

    public function countInstalacionesAsociadas(int $id_almacen): int
    {
        $result = $this->db->query("
            SELECT COUNT(*) as count 
            FROM Almacen_Instalacion 
            WHERE id_almacen = :id_almacen
        ")
        ->bind(":id_almacen", $id_almacen)
        ->fetch();
        
        return (int) $result['count'];
    }

    // ========== MÉTODOS PARA MATERIAL EN ALMACÉN ==========

    public function getMaterialesEnAlmacen(int $id_almacen): array
    {
        return $this->db
            ->query("
                SELECT 
                    am.id_almacen,
                    am.id_instalacion,
                    am.id_material,
                    am.n_serie,
                    am.unidades,
                    m.nombre as material_nombre,
                    m.descripcion as material_descripcion,
                    m.id_categoria,
                    m.estado,
                    i.nombre as instalacion_nombre
                FROM Almacen_material am
                INNER JOIN Material m ON am.id_material = m.id_material
                INNER JOIN Almacen_Instalacion ai ON am.id_almacen = ai.id_almacen 
                    AND am.id_instalacion = ai.id_instalacion
                INNER JOIN Instalacion i ON ai.id_instalacion = i.id_instalacion
                WHERE am.id_almacen = :id_almacen
                ORDER BY m.nombre ASC
            ")
            ->bind(":id_almacen", $id_almacen)
            ->fetchAll();
    }

    public function getInstalacionesDeAlmacen(int $id_almacen): array
    {
        return $this->db
            ->query("
                SELECT ai.id_instalacion
                FROM Almacen_Instalacion ai
                WHERE ai.id_almacen = :id_almacen
            ")
            ->bind(":id_almacen", $id_almacen)
            ->fetchAll();
    }

    public function materialExisteEnAlmacen(int $id_almacen, int $id_material): bool
    {
        $result = $this->db
            ->query("
                SELECT 1 
                FROM Almacen_material 
                WHERE id_almacen = :id_almacen 
                AND id_material = :id_material
            ")
            ->bind(":id_almacen", $id_almacen)
            ->bind(":id_material", $id_material)
            ->fetch();

        return $result !== null;
    }

    public function addMaterialToAlmacen(int $id_almacen, int $id_instalacion, int $id_material, ?int $n_serie, int $unidades): int
    {
        $this->db->query("
            INSERT INTO Almacen_material (
                id_almacen, 
                id_instalacion, 
                id_material, 
                n_serie, 
                unidades
            ) VALUES (
                :id_almacen, 
                :id_instalacion, 
                :id_material, 
                :n_serie, 
                :unidades
            )
        ")
        ->bind(":id_almacen", $id_almacen)
        ->bind(":id_instalacion", $id_instalacion)
        ->bind(":id_material", $id_material)
        ->bind(":n_serie", $n_serie)
        ->bind(":unidades", $unidades)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function updateMaterialInAlmacen(int $id_almacen, int $id_instalacion, int $id_material, ?int $n_serie, int $unidades): int
    {
        $this->db->query("
            UPDATE Almacen_material 
            SET n_serie = :n_serie, 
                unidades = :unidades 
            WHERE id_almacen = :id_almacen 
                AND id_instalacion = :id_instalacion
                AND id_material = :id_material
        ")
        ->bind(":n_serie", $n_serie)
        ->bind(":unidades", $unidades)
        ->bind(":id_almacen", $id_almacen)
        ->bind(":id_instalacion", $id_instalacion)
        ->bind(":id_material", $id_material)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function deleteMaterialFromAlmacen(int $id_almacen, int $id_instalacion, int $id_material): int
    {
        $this->db->query("
            DELETE FROM Almacen_material 
            WHERE id_almacen = :id_almacen 
                AND id_instalacion = :id_instalacion
                AND id_material = :id_material
        ")
        ->bind(":id_almacen", $id_almacen)
        ->bind(":id_instalacion", $id_instalacion)
        ->bind(":id_material", $id_material)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function getMaterialEnAlmacen(int $id_almacen, int $id_instalacion, int $id_material): ?array
    {
        $result = $this->db
            ->query("
                SELECT 
                    am.*,
                    m.nombre as material_nombre,
                    m.descripcion as material_descripcion,
                    m.id_categoria,
                    m.estado,
                    i.nombre as instalacion_nombre
                FROM Almacen_material am
                INNER JOIN Material m ON am.id_material = m.id_material
                INNER JOIN Instalacion i ON am.id_instalacion = i.id_instalacion
                WHERE am.id_almacen = :id_almacen 
                    AND am.id_instalacion = :id_instalacion
                    AND am.id_material = :id_material
            ")
            ->bind(":id_almacen", $id_almacen)
            ->bind(":id_instalacion", $id_instalacion)
            ->bind(":id_material", $id_material)
            ->fetch();

        return $result ?: null;
    }

    public function almacenAsociadoAInstalacion(int $id_almacen, int $id_instalacion): bool
    {
        $result = $this->db
            ->query("
                SELECT 1 
                FROM Almacen_Instalacion 
                WHERE id_almacen = :id_almacen 
                AND id_instalacion = :id_instalacion
            ")
            ->bind(":id_almacen", $id_almacen)
            ->bind(":id_instalacion", $id_instalacion)
            ->fetch();

        return $result !== null;
    }

    public function existeNserieEnAlmacen(int $id_almacen, int $n_serie): bool
    {
        $result = $this->db
            ->query("
                SELECT 1 
                FROM Almacen_material 
                WHERE id_almacen = :id_almacen 
                AND n_serie = :n_serie
            ")
            ->bind(":id_almacen", $id_almacen)
            ->bind(":n_serie", $n_serie)
            ->fetch();

        return $result !== null;
    }
}
?>