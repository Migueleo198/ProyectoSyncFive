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

    // GET, /mantenimientos
    public function all(): array
    {
        return $this->db
            ->query("
                SELECT m.*, p.nombre as bombero_nombre, p.apellidos as bombero_apellidos
                FROM Mantenimiento m
                LEFT JOIN Persona p ON m.id_bombero = p.id_bombero
                ORDER BY m.cod_mantenimiento ASC
            ")
            ->fetchAll();
    }

    // POST, /mantenimientos
    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Mantenimiento ( estado, f_inicio, f_fin, descripcion)
            VALUES ( :estado, :f_inicio, :f_fin, :descripcion)
        ")
        ->bind(":estado", $data['estado'])
        ->bind(":f_inicio", $data['f_inicio'])
        ->bind(":f_fin", $data['f_fin'] ?? null)           // Puede ser NULL
        ->bind(":descripcion", $data['descripcion'] ?? null) // Puede ser NULL
        ->execute();

        return (int) $this->db->lastId();
    }

    // GET individual (no estaba, la necesita el Service)
    public function find(int $id): ?array
    {
        $result = $this->db
            ->query("
                SELECT m.*, p.nombre as bombero_nombre, p.apellidos as bombero_apellidos
                FROM Mantenimiento m
                LEFT JOIN Persona p ON m.id_bombero = p.id_bombero
                WHERE m.cod_mantenimiento = :id
            ")
            ->bind(":id", $id)
            ->fetch();

        return $result ?: null;
    }

    // PUT, /mantenimientos/{cod_mantenimiento}'
    public function update(int $id, array $data): int
    {
        $this->db->query("
            UPDATE Mantenimiento SET
                id_bombero = :id_bombero,
                estado = :estado,
                f_inicio = :f_inicio,
                f_fin = :f_fin,
                descripcion = :descripcion
            WHERE cod_mantenimiento = :id
        ")
        ->bind(":id", $id)
        ->bind(":id_bombero", $data['id_bombero'] ?? null)
        ->bind(":estado", $data['estado'])
        ->bind(":f_inicio", $data['f_inicio'])
        ->bind(":f_fin", $data['f_fin'] ?? null)
        ->bind(":descripcion", $data['descripcion'] ?? null)
        ->execute();

        $result = $this->db->query("SELECT ROW_COUNT() AS affected")->fetch();
        return (int) ($result['affected'] ?? 0);
    }

    // PATCH, /mantenimientos/{cod_mantenimiento}'
    public function patch(int $id, array $data): int
    {
        // Construir dinámicamente la consulta SET
        $fields = [];
        foreach ($data as $key => $value) {
            $fields[] = "$key = :$key";
        }
        $setClause = implode(", ", $fields);

        $query = "UPDATE Mantenimiento SET $setClause WHERE cod_mantenimiento = :id";
        $stmt = $this->db->query($query)->bind(":id", $id);

        foreach ($data as $key => $value) {
            $stmt->bind(":$key", $value);
        }

        $stmt->execute();
        return (int) $this->db->rowCount();
    }

    // DELETE, /mantenimientos/{cod_mantenimiento}'
    public function delete(int $id): int
    {
        $this->db->query("DELETE FROM Mantenimiento WHERE cod_mantenimiento = :id")
                 ->bind(":id", $id)
                 ->execute();
        
        $result = $this->db->query("SELECT ROW_COUNT() AS affected")->fetch();
        return (int) ($result['affected'] ?? 0);
        
    }
}