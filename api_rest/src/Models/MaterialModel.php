<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class MaterialModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Material ORDER BY id_material ASC")
            ->fetchAll();
    }

    public function find(int $id): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Material WHERE id_material = :id")
            ->bind(":id", $id)
            ->fetch();

        return $result ?: null;
    }

    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Material (id_categoria, nombre, descripcion, estado)
            VALUES (:id_categoria, :nombre, :descripcion, :estado)
        ")
        ->bind(":id_categoria", $data['id_categoria'])
        ->bind(":nombre",  $data['nombre'])
        ->bind(":descripcion", $data['descripcion'])
        ->bind(":estado", $data['estado'])
        ->execute();

        return (int) $this->db->lastId();
    }

    public function update(int $id, array $data): int
    {
        $this->db->query("
            UPDATE Material SET
                id_categoria = :id_categoria,
                nombre = :nombre,
                descripcion = :descripcion,
                estado = :estado
            WHERE id_material = :id
        ")
        ->bind(":id", $id)
        ->bind(":id_categoria", $data['id_categoria'])
        ->bind(":nombre",   $data['nombre'])
        ->bind(":descripcion", $data['descripcion'])
        ->bind(":estado", $data['estado'])
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function delete(int $id): int
    {
        $this->db->query("DELETE FROM Material WHERE id_material = :id")
                 ->bind(":id", $id)
                 ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }
}
