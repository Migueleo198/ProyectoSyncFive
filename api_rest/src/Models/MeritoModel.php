<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class MeritoModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    /**
     * Obtener todos los meritos
     */
    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Merito ORDER BY id_merito ASC")
            ->fetchAll();
    }

    /**
     * Crear un merito
     */
    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Merito (
                nombre,
                descripcion
            ) VALUES (
                :nombre,
                :descripcion
            )
        ")
        ->bind(':nombre', $data['nombre'])
        ->bind(':descripcion', $data['descripcion'])
        ->execute();

        return (int) $this->db->lastId();
    }


    /**
     * Eliminar carnet
     */
    public function delete(int $id_carnet): int
    {
        $this->db
            ->query("DELETE FROM Merito WHERE id_merito = :id_merito")
            ->bind(':id_merito', $id_carnet)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }
    /**
     * Buscar merito por ID
     */
    public function find(int $id_merito): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Merito WHERE id_merito = :id_merito")
            ->bind(':id_merito', $id_merito)
            ->fetch();

        return $result ?: null;
    }

    /**
     * Asignar mérito a persona
     */
    public function assignToPerson(string $id_bombero, int $id_merito): bool
    {
        $this->db->query("
            INSERT INTO Persona_Tiene_Merito (
                id_bombero,
                id_merito
            ) VALUES (
                :id_bombero,
                :id_merito
            )
        ")
        ->bind(':id_bombero', $id_bombero)
        ->bind(':id_merito', $id_merito)
        ->execute();

        $affected = $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];

        return $affected > 0;
    }

    public function unassignFromPerson(string $id_bombero, int $id_merito): int
    {
        $this->db
            ->query("
                DELETE FROM Persona_Tiene_Merito
                WHERE id_bombero = :id_bombero
                AND id_merito = :id_merito
            ")
            ->bind(':id_bombero', $id_bombero)
            ->bind(':id_merito', $id_merito)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }
    public function getPersonsByMerito(int $id_merito): array
    {
        return $this->db
            ->query("
                SELECT p.id_bombero, p.n_funcionario, p.nombre, p.apellidos
                FROM Persona_Tiene_Merito ptm
                INNER JOIN Persona p ON p.id_bombero = ptm.id_bombero
                WHERE ptm.id_merito = :id_merito
                ORDER BY p.apellidos ASC
            ")
            ->bind(':id_merito', $id_merito)
            ->fetchAll();
    }
    }
?>