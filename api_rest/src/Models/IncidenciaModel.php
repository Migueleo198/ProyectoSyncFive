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

    // GET, /incidencias
    public function all(): array
    {
        return $this->db
            ->query("
                SELECT i.*, 
                       p.nombre as bombero_nombre, 
                       p.apellidos as bombero_apellidos,
                       m.nombre as material_nombre,
                       v.modelo as vehiculo_modelo
                FROM Incidencia i
                LEFT JOIN Persona p ON i.id_bombero = p.id_bombero
                LEFT JOIN Material m ON i.id_material = m.id_material
                LEFT JOIN Vehiculo v ON i.matricula = v.matricula
                ORDER BY i.id_incidencia ASC
            ")
            ->fetchAll();
    }
    public function find(int $id): ?array
    {
        $result = $this->db
            ->query("
                SELECT i.*, 
                       p.nombre as bombero_nombre, 
                       p.apellidos as bombero_apellidos,
                       m.nombre as material_nombre,
                       v.modelo as vehiculo_modelo
                FROM Incidencia i
                LEFT JOIN Persona p ON i.id_bombero = p.id_bombero
                LEFT JOIN Material m ON i.id_material = m.id_material
                LEFT JOIN Vehiculo v ON i.matricula = v.matricula
                WHERE i.id_incidencia = :id
            ")
            ->bind(":id", $id)
            ->fetch();

        return $result ?: null;
    }
    // POST, /incidencias
    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Incidencia (
                id_bombero, 
                id_material, 
                matricula, 
                fecha, 
                asunto, 
                estado, 
                tipo
            ) VALUES (
                :id_bombero, 
                :id_material, 
                :matricula, 
                :fecha, 
                :asunto, 
                :estado, 
                :tipo
            )
        ")
        ->bind(":id_bombero", $data['id_bombero'])
        ->bind(":id_material", $data['id_material'] ?? null)
        ->bind(":matricula", $data['matricula'] ?? null)
        ->bind(":fecha", $data['fecha'])
        ->bind(":asunto", $data['asunto'])
        ->bind(":estado", $data['estado'])
        ->bind(":tipo", $data['tipo'])
        ->execute();

        return (int) $this->db->lastId();
    }

    // PUT, /incidencias/{id_incidencia}'
    public function update(int $id, array $data): int
    {
        $this->db->query("
            UPDATE Incidencia SET
                id_bombero = :id_bombero,
                id_material = :id_material,
                matricula = :matricula,
                fecha = :fecha,
                asunto = :asunto,
                estado = :estado,
                tipo = :tipo
            WHERE id_incidencia = :id
        ")
        ->bind(":id", $id)
        ->bind(":id_bombero", $data['id_bombero'])
        ->bind(":id_material", $data['id_material'] ?? null)
        ->bind(":matricula", $data['matricula'] ?? null)
        ->bind(":fecha", $data['fecha'])
        ->bind(":asunto", $data['asunto'])
        ->bind(":estado", $data['estado'])
        ->bind(":tipo", $data['tipo'])
        ->execute();

        return $this->getAffectedRows();
    }

    // PATCH, /incidencias/{id_incidencia}'
    public function patch(int $id, array $data): int
    {
        // Construir dinámicamente la consulta SET
        $fields = [];
        foreach ($data as $key => $value) {
            $fields[] = "$key = :$key";
        }
        
        if (empty($fields)) {
            return 0;
        }
        
        $setClause = implode(", ", $fields);
        $query = "UPDATE Incidencia SET $setClause WHERE id_incidencia = :id";
        
        $stmt = $this->db->query($query)->bind(":id", $id);
        
        foreach ($data as $key => $value) {
            $stmt->bind(":$key", $value);
        }
        
        $stmt->execute();
        return $this->getAffectedRows();
    }

    // DELETE, /incidencias/{id_incidencia}'
    public function delete(int $id): int
    {
        $this->db->query("DELETE FROM Incidencia WHERE id_incidencia = :id")
                 ->bind(":id", $id)
                 ->execute();
        
        return $this->getAffectedRows();
    }

    // Método auxiliar para obtener el número de filas afectadas
    private function getAffectedRows(): int
    {
        $result = $this->db->query("SELECT ROW_COUNT() AS affected")->fetch();
        return (int) ($result['affected'] ?? 0);
    }
}