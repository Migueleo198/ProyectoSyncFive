<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class RolModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    /**
     * Obtener todos los roles
     */
    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Rol ORDER BY id_rol ASC")
            ->fetchAll();
    }

    /**
     * Buscar rol por ID
     */
    public function find(int $id): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Rol WHERE id_rol = :id")
            ->bind(":id", $id)
            ->fetch();

        return $result ?: null;
    }

    /**
     * Crear rol
     */
    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Rol (nombre, descripcion)
            VALUES (:nombre, :descripcion)
        ")
        ->bind(":nombre", $data['nombre'])
        ->bind(":descripcion", $data['descripcion'] ?? null)
        ->execute();

        return (int) $this->db->lastId();
    }

    /**
     * Actualizar rol
     */
    public function update(int $id, array $data): int
    {
        $this->db->query("
            UPDATE Rol SET
                nombre      = :nombre,
                descripcion = :descripcion
            WHERE id_rol = :id
        ")
        ->bind(":id", $id)
        ->bind(":nombre", $data['nombre'])
        ->bind(":descripcion", $data['descripcion'] ?? null)
        ->execute();

        // Devuelve el número de filas afectadas
        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    /**
     * Eliminar rol
     */
    public function delete(int $id): int
    {
        $this->db
            ->query("DELETE FROM Rol WHERE id_rol = :id")
            ->bind(":id", $id)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }
}
