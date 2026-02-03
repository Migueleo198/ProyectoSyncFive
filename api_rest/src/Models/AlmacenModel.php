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

        // CORRECCIÓN: Usar ROW_COUNT() en lugar de rowCount()
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
        // Eliminar el almacén
        $this->db->query("DELETE FROM Almacen WHERE id_almacen = :id_almacen")
                 ->bind(":id_almacen", $id_almacen)
                 ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
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

    // MÉTODO NUEVO para AlmacenService
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
    // GET /almacenes/{id_almacen}/material
    public function getMaterialesEnAlmacen(int $id_almacen): array
    {
        return $this->db
            ->query("
                SELECT m.* 
                FROM Material m
                INNER JOIN Almacen_material am ON m.id_material = am.id_material
                WHERE am.id_almacen = :id_almacen
                ORDER BY m.id_material ASC
            ")
            ->bind(":id_almacen", $id_almacen)
            ->fetchAll();
    }

    // POST /almacenes/{id_almacen}/material
    public function asociarMaterialAlmacen(int $id_almacen, int $id_material, int $unidades): bool
    {
        $this->db->query("
            INSERT INTO Almacen_material (id_almacen, id_material, unidades)
            VALUES (:id_almacen, :id_material, :unidades)
        ")
        ->bind(":id_almacen", $id_almacen)
        ->bind(":id_material", $id_material)
        ->bind(":unidades", $unidades)
        ->execute();

        // CORRECCIÓN: Usar ROW_COUNT() en lugar de rowCount()
        $result = $this->db->query("SELECT ROW_COUNT() AS affected")->fetch();
        return $result['affected'] > 0;
    }
    // PUT /almacenes/{id_almacen}/material/{id_material}
    public function actualizarUnidadesMaterialEnAlmacen(int $id_almacen, int $id_material, int $unidades): int
    {
        $this->db->query("
            UPDATE Almacen_material 
            SET unidades = :unidades 
            WHERE id_almacen = :id_almacen 
            AND id_material = :id_material
        ")
        ->bind(":unidades", $unidades)
        ->bind(":id_almacen", $id_almacen)
        ->bind(":id_material", $id_material)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }
    // DELETE /almacenes/{id_almacen}/material/{id_material}
    public function desasociarMaterialDeAlmacen(int $id_almacen, int $id_material): int
    {
        $this->db->query("
            DELETE FROM Almacen_material 
            WHERE id_almacen = :id_almacen 
            AND id_material = :id_material
        ")
        ->bind(":id_almacen", $id_almacen)
        ->bind(":id_material", $id_material)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

}
?>