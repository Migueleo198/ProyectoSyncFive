<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class FormacionModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Formacion ORDER BY id_formacion ASC")
            ->fetchAll();
    }

    public function find(int $id): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Formacion WHERE id_formacion = :id")
            ->bind(":id", $id)
            ->fetch();

        return $result ?: null;
    }

    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Formacion (nombre, descripcion)
            VALUES (:nombre, :descripcion)
        ")
        ->bind(":nombre",  $data['nombre'])
        ->bind(":descripcion", $data['descripcion'])
        ->execute();

        return (int) $this->db->lastId();
    }

    public function update(int $id, array $data): int
    {
        $this->db->query("
            UPDATE Formacion SET
                nombre = :nombre,
                descripcion = :descripcion
            WHERE id_formacion = :id
        ")
        ->bind(":id", $id)
        ->bind(":nombre",   $data['nombre'])
        ->bind(":descripcion", $data['descripcion'])
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function delete(int $id): int
    {
        $this->db->query("DELETE FROM Formacion WHERE id_formacion = :id")
                 ->bind(":id", $id)
                 ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }
}
