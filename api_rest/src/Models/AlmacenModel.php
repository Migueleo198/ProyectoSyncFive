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

    // ========== ALMACÉN ==========

    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Almacen ORDER BY id_instalacion ASC, id_almacen ASC")
            ->fetchAll();
    }

    public function find(int $id_almacen, int $id_instalacion): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Almacen WHERE id_almacen = :id_almacen AND id_instalacion = :id_instalacion")
            ->bind(":id_almacen", $id_almacen)
            ->bind(":id_instalacion", $id_instalacion)
            ->fetch();

        return $result ?: null;
    }

    public function findById(int $id_almacen): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Almacen WHERE id_almacen = :id_almacen LIMIT 1")
            ->bind(":id_almacen", $id_almacen)
            ->fetch();

        return $result ?: null;
    }

    public function findByInstalacion(int $id_instalacion): array
    {
        return $this->db
            ->query("SELECT * FROM Almacen WHERE id_instalacion = :id_instalacion ORDER BY id_almacen ASC")
            ->bind(":id_instalacion", $id_instalacion)
            ->fetchAll();
    }

    public function create(array $data, int $id_instalacion): int|false
    {
        $this->db->query("
            INSERT INTO Almacen (id_almacen, id_instalacion, planta, nombre)
            VALUES (siguiente_id_almacen(:id_instalacion), :id_instalacion, :planta, :nombre)
        ")
        ->bind(":id_instalacion", $id_instalacion)
        ->bind(":planta", $data['planta'])
        ->bind(":nombre", $data['nombre'])
        ->execute();

        $result = $this->db
            ->query("SELECT MAX(id_almacen) AS id_almacen FROM Almacen WHERE id_instalacion = :id_instalacion")
            ->bind(":id_instalacion", $id_instalacion)
            ->fetch();

        return $result ? (int) $result['id_almacen'] : false;
    }

    public function update(int $id_almacen, int $id_instalacion, array $data): int
    {
        $this->db->query("
            UPDATE Almacen SET planta = :planta, nombre = :nombre
            WHERE id_almacen = :id_almacen AND id_instalacion = :id_instalacion
        ")
        ->bind(":id_almacen", $id_almacen)
        ->bind(":id_instalacion", $id_instalacion)
        ->bind(":planta", $data['planta'])
        ->bind(":nombre", $data['nombre'])
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function delete(int $id_almacen, int $id_instalacion): int
    {
        if (!$this->find($id_almacen, $id_instalacion)) return 0;

        $this->db->query("DELETE FROM Almacen WHERE id_almacen = :id_almacen AND id_instalacion = :id_instalacion")
            ->bind(":id_almacen", $id_almacen)
            ->bind(":id_instalacion", $id_instalacion)
            ->execute();

        $result = $this->db->query("SELECT ROW_COUNT() AS affected")->fetch();
        return $result['affected'] > 0 ? 1 : -1;
    }

    public function almacenPerteneceAInstalacion(int $id_almacen, int $id_instalacion): bool
    {
        $result = $this->db
            ->query("SELECT 1 FROM Almacen WHERE id_almacen = :id_almacen AND id_instalacion = :id_instalacion")
            ->bind(":id_almacen", $id_almacen)
            ->bind(":id_instalacion", $id_instalacion)
            ->fetch();

        return $result !== null;
    }

    public function getInstalacionesDeAlmacen(int $id_almacen): array
    {
        return $this->db
            ->query("SELECT id_instalacion FROM Almacen WHERE id_almacen = :id_almacen")
            ->bind(":id_almacen", $id_almacen)
            ->fetchAll();
    }

    // ========== MATERIAL POR UNIDADES ==========

    public function getMaterialUnidades(int $id_almacen, int $id_instalacion, int $id_material): ?array
    {
        $result = $this->db
            ->query("
                SELECT u.*, m.nombre AS material_nombre, i.nombre AS instalacion_nombre
                FROM Almacen_Material_Unidades u
                INNER JOIN Material m ON u.id_material = m.id_material
                INNER JOIN Instalacion i ON u.id_instalacion = i.id_instalacion
                WHERE u.id_almacen = :id_almacen AND u.id_instalacion = :id_instalacion AND u.id_material = :id_material
            ")
            ->bind(":id_almacen", $id_almacen)
            ->bind(":id_instalacion", $id_instalacion)
            ->bind(":id_material", $id_material)
            ->fetch();

        return $result ?: null;
    }

    public function addMaterialUnidades(int $id_almacen, int $id_instalacion, int $id_material, int $unidades): int
    {
        $this->db->query("
            INSERT INTO Almacen_Material_Unidades (id_almacen, id_instalacion, id_material, unidades)
            VALUES (:id_almacen, :id_instalacion, :id_material, :unidades)
        ")
        ->bind(":id_almacen", $id_almacen)
        ->bind(":id_instalacion", $id_instalacion)
        ->bind(":id_material", $id_material)
        ->bind(":unidades", $unidades)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function updateMaterialUnidades(int $id_almacen, int $id_instalacion, int $id_material, int $unidades): int
    {
        $this->db->query("
            UPDATE Almacen_Material_Unidades SET unidades = :unidades
            WHERE id_almacen = :id_almacen AND id_instalacion = :id_instalacion AND id_material = :id_material
        ")
        ->bind(":unidades", $unidades)
        ->bind(":id_almacen", $id_almacen)
        ->bind(":id_instalacion", $id_instalacion)
        ->bind(":id_material", $id_material)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function deleteMaterialUnidades(int $id_almacen, int $id_instalacion, int $id_material): int
    {
        $this->db->query("
            DELETE FROM Almacen_Material_Unidades
            WHERE id_almacen = :id_almacen AND id_instalacion = :id_instalacion AND id_material = :id_material
        ")
        ->bind(":id_almacen", $id_almacen)
        ->bind(":id_instalacion", $id_instalacion)
        ->bind(":id_material", $id_material)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    // ========== MATERIAL POR SERIE ==========

    public function existeNserieEnAlmacen(int $id_almacen, int $id_material, string $n_serie): bool
    {
        $result = $this->db
            ->query("
                SELECT 1 FROM Almacen_Material_Serie 
                WHERE id_almacen = :id_almacen 
                AND id_material = :id_material
                AND n_serie = :n_serie
            ")
            ->bind(":id_almacen", $id_almacen)
            ->bind(":id_material", $id_material)
            ->bind(":n_serie", $n_serie)
            ->fetch();

        return $result !== null;
    }

    public function addMaterialSerie(int $id_almacen, int $id_instalacion, int $id_material, string $n_serie): int
    {
        $this->db->query("
            INSERT INTO Almacen_Material_Serie (id_almacen, id_instalacion, id_material, n_serie)
            VALUES (:id_almacen, :id_instalacion, :id_material, :n_serie)
        ")
        ->bind(":id_almacen", $id_almacen)
        ->bind(":id_instalacion", $id_instalacion)
        ->bind(":id_material", $id_material)
        ->bind(":n_serie", $n_serie)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function deleteMaterialSerie(int $id_almacen, int $id_instalacion, int $id_material): int
    {
        $this->db->query("
            DELETE FROM Almacen_Material_Serie
            WHERE id_almacen = :id_almacen AND id_instalacion = :id_instalacion AND id_material = :id_material
        ")
        ->bind(":id_almacen", $id_almacen)
        ->bind(":id_instalacion", $id_instalacion)
        ->bind(":id_material", $id_material)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    // ========== LISTADO UNIFICADO ==========

    public function getMaterialesEnAlmacen(int $id_almacen): array
    {
        $porUnidades = $this->db
            ->query("
                SELECT u.id_almacen, u.id_instalacion, u.id_material,
                       u.unidades, NULL AS n_serie, 'unidades' AS modo,
                       m.nombre AS material_nombre, m.descripcion AS material_descripcion,
                       m.id_categoria, m.estado, i.nombre AS instalacion_nombre
                FROM Almacen_Material_Unidades u
                INNER JOIN Material m ON u.id_material = m.id_material
                INNER JOIN Instalacion i ON u.id_instalacion = i.id_instalacion
                WHERE u.id_almacen = :id_almacen
            ")
            ->bind(":id_almacen", $id_almacen)
            ->fetchAll();

        $porSerie = $this->db
            ->query("
                SELECT s.id_almacen, s.id_instalacion, s.id_material,
                       NULL AS unidades, s.n_serie, 'serie' AS modo,
                       m.nombre AS material_nombre, m.descripcion AS material_descripcion,
                       m.id_categoria, m.estado, i.nombre AS instalacion_nombre
                FROM Almacen_Material_Serie s
                INNER JOIN Material m ON s.id_material = m.id_material
                INNER JOIN Instalacion i ON s.id_instalacion = i.id_instalacion
                WHERE s.id_almacen = :id_almacen
            ")
            ->bind(":id_almacen", $id_almacen)
            ->fetchAll();

        return array_merge($porUnidades, $porSerie);
    }
}
?>