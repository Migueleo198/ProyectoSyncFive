<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class MantenimientoModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    public function all(): array
    {
        return $this->db->query("
            SELECT
                m.cod_mantenimiento,
                m.id_bombero,
                CONCAT(p.nombre, ' ', p.apellidos) AS nombre_bombero,
                m.estado,
                m.f_inicio,
                m.f_fin,
                m.descripcion,
                CASE
                    WHEN EXISTS (SELECT 1 FROM Mantenimiento_Vehiculo mv WHERE mv.cod_mantenimiento = m.cod_mantenimiento) THEN 'Vehiculo'
                    WHEN EXISTS (SELECT 1 FROM Mantenimiento_Material mm WHERE mm.cod_mantenimiento = m.cod_mantenimiento) THEN 'Material'
                    ELSE NULL
                END AS tipo,
                CASE
                    WHEN EXISTS (SELECT 1 FROM Mantenimiento_Vehiculo mv WHERE mv.cod_mantenimiento = m.cod_mantenimiento)
                        THEN (SELECT mv2.matricula FROM Mantenimiento_Vehiculo mv2 WHERE mv2.cod_mantenimiento = m.cod_mantenimiento LIMIT 1)
                    WHEN EXISTS (SELECT 1 FROM Mantenimiento_Material mm WHERE mm.cod_mantenimiento = m.cod_mantenimiento)
                        THEN (SELECT mat.nombre FROM Mantenimiento_Material mm2 INNER JOIN Material mat ON mm2.cod_material = mat.id_material WHERE mm2.cod_mantenimiento = m.cod_mantenimiento LIMIT 1)
                    ELSE NULL
                END AS recurso
            FROM Mantenimiento m
            LEFT JOIN Persona p ON m.id_bombero = p.id_bombero
            ORDER BY m.cod_mantenimiento DESC
        ")->fetchAll();
    }

    public function find(int $id): ?array
    {
        $result = $this->db->query("
            SELECT
                m.cod_mantenimiento,
                m.id_bombero,
                CONCAT(p.nombre, ' ', p.apellidos) AS nombre_bombero,
                m.estado,
                m.f_inicio,
                m.f_fin,
                m.descripcion,
                CASE
                    WHEN EXISTS (SELECT 1 FROM Mantenimiento_Vehiculo mv WHERE mv.cod_mantenimiento = m.cod_mantenimiento) THEN 'Vehiculo'
                    WHEN EXISTS (SELECT 1 FROM Mantenimiento_Material mm WHERE mm.cod_mantenimiento = m.cod_mantenimiento) THEN 'Material'
                    ELSE NULL
                END AS tipo,
                CASE
                    WHEN EXISTS (SELECT 1 FROM Mantenimiento_Vehiculo mv WHERE mv.cod_mantenimiento = m.cod_mantenimiento)
                        THEN (SELECT mv2.matricula FROM Mantenimiento_Vehiculo mv2 WHERE mv2.cod_mantenimiento = m.cod_mantenimiento LIMIT 1)
                    WHEN EXISTS (SELECT 1 FROM Mantenimiento_Material mm WHERE mm.cod_mantenimiento = m.cod_mantenimiento)
                        THEN (SELECT mat.nombre FROM Mantenimiento_Material mm2 INNER JOIN Material mat ON mm2.cod_material = mat.id_material WHERE mm2.cod_mantenimiento = m.cod_mantenimiento LIMIT 1)
                    ELSE NULL
                END AS recurso
            FROM Mantenimiento m
            LEFT JOIN Persona p ON m.id_bombero = p.id_bombero
            WHERE m.cod_mantenimiento = :id
        ")
        ->bind(":id", $id)
        ->fetch();

        return $result ?: null;
    }

    public function create(array $data): int
    {
        $this->db->query("
            INSERT INTO Mantenimiento (id_bombero, estado, f_inicio, f_fin, descripcion)
            VALUES (:id_bombero, :estado, :f_inicio, :f_fin, :descripcion)
        ")
        ->bind(":id_bombero",  $data['id_bombero'])
        ->bind(":estado",      $data['estado'])
        ->bind(":f_inicio",    $data['f_inicio'])
        ->bind(":f_fin",       $data['f_fin'] ?? null)
        ->bind(":descripcion", $data['descripcion'] ?? null)
        ->execute();

        return (int) $this->db->lastId();
    }

    public function createWithRelation(array $data): int
    {
        $this->db->beginTransaction();

        try {
            $id = $this->create($data);

            if (($data['tipo_recurso'] ?? null) === 'vehiculo') {
                $this->db->query("
                    INSERT INTO Mantenimiento_Vehiculo (cod_mantenimiento, matricula)
                    VALUES (:cod, :matricula)
                ")
                ->bind(':cod', $id)
                ->bind(':matricula', $data['matricula'])
                ->execute();
            }

            if (($data['tipo_recurso'] ?? null) === 'material') {
                $this->db->query("
                    INSERT INTO Mantenimiento_Material (cod_mantenimiento, cod_material)
                    VALUES (:cod, :id_material)
                ")
                ->bind(':cod', $id)
                ->bind(':id_material', $data['id_material'])
                ->execute();
            }

            $this->db->commit();

            return $id;
        } catch (\Throwable $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    public function update(int $id, array $data): int
    {
        $this->db->query("
            UPDATE Mantenimiento SET
                id_bombero  = :id_bombero,
                estado      = :estado,
                f_inicio    = :f_inicio,
                f_fin       = :f_fin,
                descripcion = :descripcion
            WHERE cod_mantenimiento = :id
        ")
        ->bind(":id",          $id)
        ->bind(":id_bombero",  $data['id_bombero'])
        ->bind(":estado",      $data['estado'])
        ->bind(":f_inicio",    $data['f_inicio'])
        ->bind(":f_fin",       $data['f_fin'] ?? null)
        ->bind(":descripcion", $data['descripcion'] ?? null)
        ->execute();

        return (int) $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function delete(int $id): void
    {
        $this->db->query("DELETE FROM Mantenimiento WHERE cod_mantenimiento = :id")
            ->bind(":id", $id)
            ->execute();
    }

    public function deleteRelaciones(int $id): void
    {
        $this->db->query("DELETE FROM Mantenimiento_Vehiculo WHERE cod_mantenimiento = :id")
            ->bind(":id", $id)->execute();
        $this->db->query("DELETE FROM Mantenimiento_Material WHERE cod_mantenimiento = :id")
            ->bind(":id", $id)->execute();
        $this->db->query("DELETE FROM Mantenimiento_Persona WHERE cod_mantenimiento = :id")
            ->bind(":id", $id)->execute();
    }

    public function countVehiculos(int $cod): int
    {
        $result = $this->db->query("SELECT COUNT(*) AS total FROM Mantenimiento_Vehiculo WHERE cod_mantenimiento = :cod")
            ->bind(':cod', $cod)
            ->fetch();

        return (int) ($result['total'] ?? 0);
    }

    public function countMateriales(int $cod): int
    {
        $result = $this->db->query("SELECT COUNT(*) AS total FROM Mantenimiento_Material WHERE cod_mantenimiento = :cod")
            ->bind(':cod', $cod)
            ->fetch();

        return (int) ($result['total'] ?? 0);
    }

    // VEHICULOS
    public function addVehiculo(int $cod, string $matricula): void
    {
        $this->db->query("
            INSERT IGNORE INTO Mantenimiento_Vehiculo (cod_mantenimiento, matricula)
            VALUES (:cod, :matricula)
        ")
        ->bind(":cod", $cod)
        ->bind(":matricula", $matricula)
        ->execute();
    }

    public function hasVehiculo(int $cod, string $matricula): bool
    {
        $result = $this->db->query("
            SELECT 1
            FROM Mantenimiento_Vehiculo
            WHERE cod_mantenimiento = :cod AND matricula = :matricula
            LIMIT 1
        ")
        ->bind(':cod', $cod)
        ->bind(':matricula', $matricula)
        ->fetch();

        return $result !== false;
    }

    public function removeVehiculo(int $cod, string $matricula): void
    {
        $this->db->query("
            DELETE FROM Mantenimiento_Vehiculo
            WHERE cod_mantenimiento = :cod AND matricula = :matricula
        ")
        ->bind(":cod", $cod)
        ->bind(":matricula", $matricula)
        ->execute();
    }

    // MATERIALES
    public function addMaterial(int $cod, int $id_material): void
    {
        $this->db->query("
            INSERT IGNORE INTO Mantenimiento_Material (cod_mantenimiento, cod_material)
            VALUES (:cod, :id_material)
        ")
        ->bind(":cod", $cod)
        ->bind(":id_material", $id_material)
        ->execute();
    }

    public function hasMaterial(int $cod, int $id_material): bool
    {
        $result = $this->db->query("
            SELECT 1
            FROM Mantenimiento_Material
            WHERE cod_mantenimiento = :cod AND cod_material = :id_material
            LIMIT 1
        ")
        ->bind(':cod', $cod)
        ->bind(':id_material', $id_material)
        ->fetch();

        return $result !== false;
    }

    public function removeMaterial(int $cod, int $id_material): void
    {
        $this->db->query("
            DELETE FROM Mantenimiento_Material
            WHERE cod_mantenimiento = :cod AND cod_material = :id_material
        ")
        ->bind(":cod", $cod)
        ->bind(":id_material", $id_material)
        ->execute();
    }
}