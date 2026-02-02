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
    /**
     * Obtener todas las personas que tienen un rol específico
     */
    public function getPersonsByRol(string $id_rol): array
    {
        return $this->db
            ->query("
                SELECT p.*
                FROM Rol_Persona rp
                INNER JOIN Persona p ON p.id_bombero = rp.id_bombero
                WHERE rp.ID_Rol = :id_rol
                ORDER BY p.id_bombero ASC
            ")
            ->bind(':id_rol', $id_rol)
            ->fetchAll();
    }

  /**
     * Asignar un rol a una persona
     */
    public function assignToPerson(
        string $id_bombero,
        string $id_rol,
    ): bool {
        $this->db->query("
            INSERT INTO Rol_Persona (
                id_bombero,
                ID_Rol,
            ) VALUES (
                :id_bombero,
                :id_rol,
            )
        ")
        ->bind(':id_bombero', $id_bombero)
        ->bind(':id_rol', $id_rol)
        ->execute();

        // Obtener la cantidad de filas afectadas
        $affected = $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];

        return $affected > 0;
    }
}
