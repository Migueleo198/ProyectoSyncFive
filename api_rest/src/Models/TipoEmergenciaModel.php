<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class TipoEmergenciaModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Tipo_emergencia ORDER BY codigo_tipo ASC")
            ->fetchAll();
    }

    public function find(int $id): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Tipo_emergencia WHERE codigo_tipo = :id")
            ->bind(":id", $id)
            ->fetch();

        return $result ?: null;
    }

    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Tipo_emergencia (nombre, grupo)
            VALUES (:nombre, :grupo)
        ")
        ->bind(":nombre",  $data['nombre'])
        ->bind(":grupo", $data['grupo'] ?? null)
        ->execute();

        return (int) $this->db->lastId();
    }

    public function update(int $id, array $data): int
    {
        $this->db->query("
            UPDATE Tipo_emergencia SET
                nombre = :nombre,
                grupo = :grupo
            WHERE codigo_tipo = :id
        ")
        ->bind(":id", $id)
        ->bind(":nombre",   $data['nombre'])
        ->bind(":grupo", $data['grupo'] ?? null)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function delete(int $id): int
    {
        $this->db->query("DELETE FROM Tipo_emergencia WHERE codigo_tipo = :id")
                 ->bind(":id", $id)
                 ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }
}
