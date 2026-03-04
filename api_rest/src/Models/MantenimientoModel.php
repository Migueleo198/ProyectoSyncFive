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

    // ─── MANTENIMIENTO PRINCIPAL ──────────────────────────────────────────────

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
                    WHEN EXISTS (SELECT 1 FROM Mantenimiento_Vehiculo  mv WHERE mv.cod_mantenimiento = m.cod_mantenimiento) THEN 'Vehiculo'
                    WHEN EXISTS (SELECT 1 FROM Mantenimiento_Material  mm WHERE mm.cod_mantenimiento = m.cod_mantenimiento) THEN 'Material'
                    ELSE NULL
                END AS tipo
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
                    WHEN EXISTS (SELECT 1 FROM Mantenimiento_Vehiculo  mv WHERE mv.cod_mantenimiento = m.cod_mantenimiento) THEN 'Vehiculo'
                    WHEN EXISTS (SELECT 1 FROM Mantenimiento_Material  mm WHERE mm.cod_mantenimiento = m.cod_mantenimiento) THEN 'Material'
                    ELSE NULL
                END AS tipo
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

    public function delete(int $id): int
    {
        $this->db->query("DELETE FROM Mantenimiento WHERE cod_mantenimiento = :id")
            ->bind(":id", $id)
            ->execute();

        return (int) $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
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


    // ─── VEHÍCULOS ────────────────────────────────────────────────────────────

    public function getVehiculos(int $cod): array
    {
        return $this->db->query("
            SELECT v.matricula, v.nombre, v.tipo
            FROM Mantenimiento_Vehiculo mv
            INNER JOIN Vehiculo v ON mv.matricula = v.matricula
            WHERE mv.cod_mantenimiento = :cod
        ")
        ->bind(":cod", $cod)
        ->fetchAll();
    }

    public function addVehiculo(int $cod, string $matricula): int
    {
        $this->db->query("
            INSERT IGNORE INTO Mantenimiento_Vehiculo (cod_mantenimiento, matricula)
            VALUES (:cod, :matricula)
        ")
        ->bind(":cod",      $cod)
        ->bind(":matricula", $matricula)
        ->execute();

        return (int) $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function removeVehiculo(int $cod, string $matricula): int
    {
        $this->db->query("
            DELETE FROM Mantenimiento_Vehiculo
            WHERE cod_mantenimiento = :cod AND matricula = :matricula
        ")
        ->bind(":cod",      $cod)
        ->bind(":matricula", $matricula)
        ->execute();

        return (int) $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }


    // ─── MATERIALES ───────────────────────────────────────────────────────────

    public function getMateriales(int $cod): array
    {
        return $this->db->query("
            SELECT mat.id_material, mat.nombre, mat.estado
            FROM Mantenimiento_Material mm
            INNER JOIN Material mat ON mm.cod_material = mat.id_material
            WHERE mm.cod_mantenimiento = :cod
        ")
        ->bind(":cod", $cod)
        ->fetchAll();
    }

    public function addMaterial(int $cod, int $cod_material): int
    {
        $this->db->query("
            INSERT IGNORE INTO Mantenimiento_Material (cod_mantenimiento, cod_material)
            VALUES (:cod, :cod_material)
        ")
        ->bind(":cod",          $cod)
        ->bind(":cod_material", $cod_material)
        ->execute();

        return (int) $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function removeMaterial(int $cod, int $cod_material): int
    {
        $this->db->query("
            DELETE FROM Mantenimiento_Material
            WHERE cod_mantenimiento = :cod AND cod_material = :cod_material
        ")
        ->bind(":cod",          $cod)
        ->bind(":cod_material", $cod_material)
        ->execute();

        return (int) $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }


    // ─── PERSONAS (responsables) ──────────────────────────────────────────────

    public function getPersonas(int $cod): array
    {
        return $this->db->query("
            SELECT p.id_bombero, p.nombre, p.apellidos, p.n_funcionario
            FROM Mantenimiento_Persona mp
            INNER JOIN Persona p ON mp.id_bombero = p.id_bombero
            WHERE mp.cod_mantenimiento = :cod
        ")
        ->bind(":cod", $cod)
        ->fetchAll();
    }

    public function addPersona(int $cod, string $id_bombero): int
    {
        $this->db->query("
            INSERT IGNORE INTO Mantenimiento_Persona (cod_mantenimiento, id_bombero)
            VALUES (:cod, :id_bombero)
        ")
        ->bind(":cod",        $cod)
        ->bind(":id_bombero", $id_bombero)
        ->execute();

        return (int) $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function removePersona(int $cod, string $id_bombero): int
    {
        $this->db->query("
            DELETE FROM Mantenimiento_Persona
            WHERE cod_mantenimiento = :cod AND id_bombero = :id_bombero
        ")
        ->bind(":cod",        $cod)
        ->bind(":id_bombero", $id_bombero)
        ->execute();

        return (int) $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }
}