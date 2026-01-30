<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class IncidenciaModel
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
                SELECT i.*, 
                       m.nombre as material_nombre,
                       p.nombre as bombero_nombre, 
                       p.apellidos as bombero_apellidos,
                       v.nombre as vehiculo_nombre
                FROM Incidencia i
                LEFT JOIN Material m ON i.id_material = m.id_material
                LEFT JOIN Persona p ON i.id_bombero = p.id_bombero
                LEFT JOIN Vehiculo v ON i.matricula = v.matricula
                ORDER BY i.id_incidencia DESC
            ")
            ->fetchAll();
    }

    public function find(int $id_incidencia): ?array
    {
        $result = $this->db
            ->query("
                SELECT i.*, 
                       m.nombre as material_nombre,
                       p.nombre as bombero_nombre, 
                       p.apellidos as bombero_apellidos,
                       v.nombre as vehiculo_nombre
                FROM Incidencia i
                LEFT JOIN Material m ON i.id_material = m.id_material
                LEFT JOIN Persona p ON i.id_bombero = p.id_bombero
                LEFT JOIN Vehiculo v ON i.matricula = v.matricula
                WHERE i.id_incidencia = :id
            ")
            ->bind(":id", $id_incidencia)
            ->fetch();

        return $result ?: null;
    }

    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Incidencia (id_material, id_bombero, matricula, fecha, asunto, estado, tipo)
            VALUES (:id_material, :id_bombero, :matricula, :fecha, :asunto, :estado, :tipo)
        ")
        ->bind(":id_material", $data['id_material'] ?? null)
        ->bind(":id_bombero", $data['id_bombero'] ?? null)
        ->bind(":matricula", $data['matricula'] ?? null)
        ->bind(":fecha", $data['fecha'])
        ->bind(":asunto", $data['asunto'])
        ->bind(":estado", $data['estado'])
        ->bind(":tipo", $data['tipo'] ?? null)
        ->execute();

        return (int) $this->db->lastId();
    }

    public function update(int $id_incidencia, array $data): int
    {
        $this->db->query("
            UPDATE Incidencia SET
                id_material = :id_material,
                id_bombero = :id_bombero,
                matricula = :matricula,
                fecha = :fecha,
                asunto = :asunto,
                estado = :estado,
                tipo = :tipo
            WHERE id_incidencia = :id
        ")
        ->bind(":id", $id_incidencia)
        ->bind(":id_material", $data['id_material'] ?? null)
        ->bind(":id_bombero", $data['id_bombero'] ?? null)
        ->bind(":matricula", $data['matricula'] ?? null)
        ->bind(":fecha", $data['fecha'])
        ->bind(":asunto", $data['asunto'])
        ->bind(":estado", $data['estado'])
        ->bind(":tipo", $data['tipo'] ?? null)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function updateEstado(int $id_incidencia, string $estado): int
    {
        $this->db->query("
            UPDATE Incidencia SET
                estado = :estado
            WHERE id_incidencia = :id
        ")
        ->bind(":id", $id_incidencia)
        ->bind(":estado", $estado)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function delete(int $id_incidencia): int
    {
        $this->db->query("DELETE FROM Incidencia WHERE id_incidencia = :id")
                 ->bind(":id", $id_incidencia)
                 ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }
}