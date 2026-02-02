<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class AlmacenMaterialModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    public function findByAlmacen(int $id_almacen): array
    {
        return $this->db
            ->query("
                SELECT am.*, m.nombre as material_nombre, m.descripcion, c.nombre as categoria_nombre
                FROM Almacen_material am
                INNER JOIN Material m ON am.id_material = m.id_material
                INNER JOIN Categoria c ON m.id_categoria = c.id_categoria
                INNER JOIN Almacen_Instalacion ai ON am.id_almacen = ai.id_almacen AND am.id_instalacion = ai.id_instalacion
                WHERE am.id_almacen = :id_almacen
                ORDER BY am.id_material ASC
            ")
            ->bind(":id_almacen", $id_almacen)
            ->fetchAll();
    }

    public function findOne(int $id_almacen, int $id_instalacion, int $id_material): ?array
    {
        $result = $this->db
            ->query("
                SELECT am.*, m.nombre as material_nombre
                FROM Almacen_material am
                INNER JOIN Material m ON am.id_material = m.id_material
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

    public function create(int $id_almacen, int $id_instalacion, array $data): bool
    {
        $this->db->query("
            INSERT INTO Almacen_material (id_almacen, id_instalacion, id_material, n_serie, unidades)
            VALUES (:id_almacen, :id_instalacion, :id_material, :n_serie, :unidades)
        ")
        ->bind(":id_almacen", $id_almacen)
        ->bind(":id_instalacion", $id_instalacion)
        ->bind(":id_material", $data['id_material'])
        ->bind(":n_serie", $data['n_serie'] ?? null)
        ->bind(":unidades", $data['unidades'])
        ->execute();

        // CORRECCIÓN: Usar ROW_COUNT() en lugar de rowCount()
        $result = $this->db->query("SELECT ROW_COUNT() AS affected")->fetch();
        return $result['affected'] > 0;
    }

    public function update(int $id_almacen, int $id_instalacion, int $id_material, array $data): int
    {
        $this->db->query("
            UPDATE Almacen_material SET
                n_serie = :n_serie,
                unidades = :unidades
            WHERE id_almacen = :id_almacen 
            AND id_instalacion = :id_instalacion 
            AND id_material = :id_material
        ")
        ->bind(":id_almacen", $id_almacen)
        ->bind(":id_instalacion", $id_instalacion)
        ->bind(":id_material", $id_material)
        ->bind(":n_serie", $data['n_serie'] ?? null)
        ->bind(":unidades", $data['unidades'])
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function delete(int $id_almacen, int $id_instalacion, int $id_material): int
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

    public function existeMaterial(int $id_material): bool
    {
        $result = $this->db
            ->query("SELECT 1 FROM Material WHERE id_material = :id")
            ->bind(":id", $id_material)
            ->fetch();

        return $result !== null;
    }
}
?>