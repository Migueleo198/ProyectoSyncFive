<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class CategoriaModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Categoria ORDER BY id_categoria ASC")
            ->fetchAll();
    }

     public function find(int $id): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Categoria WHERE id_categoria = :id")
            ->bind(":id", $id)
            ->fetch();

        return $result ?: null;
    }

    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Categoria (nombre, inventariable)
            VALUES (:nombre, :inventariable)
        ")
        ->bind(":nombre", $data['nombre'])
        ->bind(":inventariable", $data['inventariable'])
        ->execute();

        return (int) $this->db->lastId();
    }


    public function delete(int $id): int
    {
        $this->db->query("DELETE FROM Categoria WHERE id_categoria = :id")
                 ->bind(":id", $id)
                 ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }
}
