<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class GrupoModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    /**
     * Obtener todos los grupos
     */
    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Grupo ORDER BY nombre ASC")
            ->fetchAll();
    }

    /**
     * Buscar grupo por ID
     */
    public function find(int $id): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Grupo WHERE id_grupo = :id")
            ->bind(':id', $id)
            ->fetch();

        return $result ?: null;
    }

    /**
     * Crear grupo
     */
    public function create(array $data): int|false
    {
        $this->db->query("INSERT INTO Grupo (nombre, descripcion) VALUES (:nombre, :descripcion)")
            ->bind(':nombre', $data['nombre'])
            ->bind(':descripcion', $data['descripcion'] ?? null)
            ->execute();

        return (int) $this->db->lastId();
    }

    /**
     * Actualizar grupo
     */
    public function update(int $id, array $data): int
    {
        $this->db
            ->query("UPDATE Grupo SET nombre = :nombre, descripcion = :descripcion WHERE id_grupo = :id")
            ->bind(':nombre', $data['nombre'])
            ->bind(':descripcion', $data['descripcion'] ?? null)
            ->bind(':id', $id)
            ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    /**
     * Eliminar grupo
     */
    public function delete(int $id): int
    {
        $this->db->query("DELETE FROM Grupo WHERE id_grupo = :id")
            ->bind(':id', $id)
            ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }
}
