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
        return $this->db
            ->query("
                SELECT m.*, p.nombre as bombero_nombre, p.apellidos as bombero_apellidos
                FROM Mantenimiento m
                LEFT JOIN Persona p ON m.id_bombero = p.id_bombero
                ORDER BY m.cod_mantenimiento DESC
            ")
            ->fetchAll();
    }

    public function find(int $cod_mantenimiento): ?array
    {
        $result = $this->db
            ->query("
                SELECT m.*, p.nombre as bombero_nombre, p.apellidos as bombero_apellidos
                FROM Mantenimiento m
                LEFT JOIN Persona p ON m.id_bombero = p.id_bombero
                WHERE m.cod_mantenimiento = :cod
            ")
            ->bind(":cod", $cod_mantenimiento)
            ->fetch();

        return $result ?: null;
    }

    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Mantenimiento (id_bombero, estado, f_inicio, f_fin, descripcion)
            VALUES (:id_bombero, :estado, :f_inicio, :f_fin, :descripcion)
        ")
        ->bind(":id_bombero", $data['id_bombero'] ?? null)
        ->bind(":estado", $data['estado'])
        ->bind(":f_inicio", $data['f_inicio'])
        ->bind(":f_fin", $data['f_fin'] ?? null)
        ->bind(":descripcion", $data['descripcion'] ?? null)
        ->execute();

        return (int) $this->db->lastId();
    }

    public function update(int $cod_mantenimiento, array $data): int
    {
        $this->db->query("
            UPDATE Mantenimiento SET
                id_bombero = :id_bombero,
                estado = :estado,
                f_inicio = :f_inicio,
                f_fin = :f_fin,
                descripcion = :descripcion
            WHERE cod_mantenimiento = :cod
        ")
        ->bind(":cod", $cod_mantenimiento)
        ->bind(":id_bombero", $data['id_bombero'] ?? null)
        ->bind(":estado", $data['estado'])
        ->bind(":f_inicio", $data['f_inicio'])
        ->bind(":f_fin", $data['f_fin'] ?? null)
        ->bind(":descripcion", $data['descripcion'] ?? null)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function updateEstado(int $cod_mantenimiento, string $estado): int
    {
        $this->db->query("
            UPDATE Mantenimiento SET
                estado = :estado,
                f_fin = CASE WHEN :estado = 'REALIZADO' THEN COALESCE(f_fin, CURDATE()) ELSE f_fin END
            WHERE cod_mantenimiento = :cod
        ")
        ->bind(":cod", $cod_mantenimiento)
        ->bind(":estado", $estado)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function delete(int $cod_mantenimiento): int
    {
        // Primero eliminar las relaciones
        $this->db->query("DELETE FROM Mantenimiento_Persona WHERE cod_mantenimiento = :cod")
                 ->bind(":cod", $cod_mantenimiento)
                 ->execute();
        
        $this->db->query("DELETE FROM Mantenimiento_Vehiculo WHERE cod_mantenimiento = :cod")
                 ->bind(":cod", $cod_mantenimiento)
                 ->execute();
        
        $this->db->query("DELETE FROM Mantenimiento_Material WHERE cod_mantenimiento = :cod")
                 ->bind(":cod", $cod_mantenimiento)
                 ->execute();

        // Luego eliminar el mantenimiento
        $this->db->query("DELETE FROM Mantenimiento WHERE cod_mantenimiento = :cod")
                 ->bind(":cod", $cod_mantenimiento)
                 ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    // ========== RELACIONES ==========

    public function getPersonas(int $cod_mantenimiento): array
    {
        return $this->db
            ->query("
                SELECT p.* 
                FROM Persona p
                INNER JOIN Mantenimiento_Persona mp ON p.id_bombero = mp.id_bombero
                WHERE mp.cod_mantenimiento = :cod
                ORDER BY p.apellidos ASC
            ")
            ->bind(":cod", $cod_mantenimiento)
            ->fetchAll();
    }

    public function addPersona(int $cod_mantenimiento, int $id_bombero): bool
    {
        $this->db->query("
            INSERT INTO Mantenimiento_Persona (cod_mantenimiento, id_bombero)
            VALUES (:cod, :id_bombero)
            ON DUPLICATE KEY UPDATE id_bombero = id_bombero
        ")
        ->bind(":cod", $cod_mantenimiento)
        ->bind(":id_bombero", $id_bombero)
        ->execute();

        return $this->db->rowCount() > 0;
    }

    public function removePersona(int $cod_mantenimiento, int $id_bombero): int
    {
        $this->db->query("
            DELETE FROM Mantenimiento_Persona 
            WHERE cod_mantenimiento = :cod AND id_bombero = :id_bombero
        ")
        ->bind(":cod", $cod_mantenimiento)
        ->bind(":id_bombero", $id_bombero)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function getVehiculos(int $cod_mantenimiento): array
    {
        return $this->db
            ->query("
                SELECT v.* 
                FROM Vehiculo v
                INNER JOIN Mantenimiento_Vehiculo mv ON v.matricula = mv.matricula
                WHERE mv.cod_mantenimiento = :cod
                ORDER BY v.matricula ASC
            ")
            ->bind(":cod", $cod_mantenimiento)
            ->fetchAll();
    }

    public function addVehiculo(int $cod_mantenimiento, string $matricula): bool
    {
        $this->db->query("
            INSERT INTO Mantenimiento_Vehiculo (cod_mantenimiento, matricula)
            VALUES (:cod, :matricula)
            ON DUPLICATE KEY UPDATE matricula = matricula
        ")
        ->bind(":cod", $cod_mantenimiento)
        ->bind(":matricula", $matricula)
        ->execute();

        return $this->db->rowCount() > 0;
    }

    public function removeVehiculo(int $cod_mantenimiento, string $matricula): int
    {
        $this->db->query("
            DELETE FROM Mantenimiento_Vehiculo 
            WHERE cod_mantenimiento = :cod AND matricula = :matricula
        ")
        ->bind(":cod", $cod_mantenimiento)
        ->bind(":matricula", $matricula)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function getMateriales(int $cod_mantenimiento): array
    {
        return $this->db
            ->query("
                SELECT m.*, c.nombre as categoria_nombre
                FROM Material m
                INNER JOIN Mantenimiento_Material mm ON m.id_material = mm.cod_material
                INNER JOIN Categoria c ON m.id_categoria = c.id_categoria
                WHERE mm.cod_mantenimiento = :cod
                ORDER BY m.nombre ASC
            ")
            ->bind(":cod", $cod_mantenimiento)
            ->fetchAll();
    }

    public function addMaterial(int $cod_mantenimiento, int $id_material): bool
    {
        $this->db->query("
            INSERT INTO Mantenimiento_Material (cod_mantenimiento, cod_material)
            VALUES (:cod, :id_material)
            ON DUPLICATE KEY UPDATE cod_material = cod_material
        ")
        ->bind(":cod", $cod_mantenimiento)
        ->bind(":id_material", $id_material)
        ->execute();

        return $this->db->rowCount() > 0;
    }

    public function removeMaterial(int $cod_mantenimiento, int $id_material): int
    {
        $this->db->query("
            DELETE FROM Mantenimiento_Material 
            WHERE cod_mantenimiento = :cod AND cod_material = :id_material
        ")
        ->bind(":cod", $cod_mantenimiento)
        ->bind(":id_material", $id_material)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }
}