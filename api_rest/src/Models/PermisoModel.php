<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class PermisoModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    /**
     * Obtener todos los permisos
     */
    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Permiso ORDER BY ID_Permiso ASC")
            ->fetchAll();
    }

    /**
     * Buscar permiso por ID_Permiso
     */
    public function find(string $id_permiso): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Permiso WHERE ID_Permiso = :id")
            ->bind(':id', $id_permiso)
            ->fetch();

        return $result ?: null;
    }

    /**
     * Crear un permiso
     */
    public function create(array $data): string|false
    {
        $this->db->query("
            INSERT INTO permiso (
                id_permiso,
                fecha,
                h_inicio,
                h_fin,
                descripcion,
                estado
            ) VALUES (
                :id_permiso,
                :fecha,
                :h_inicio,
                :h_fin,
                :descripcion,
                :estado
            )
        ")
        ->bind(':id_permiso', $data['id_permiso'])
        ->bind(':fecha', $data['fecha'])
        ->bind(':h_inicio', $data['h_inicio'])
        ->bind(':h_fin', $data['h_fin'])
        ->bind(':descripcion', $data['descripcion'] ?? null)
        ->bind(':estado', $data['estado'] ?? null)
        ->execute();

        return $data['id_permiso'];
    }

    /**
     * Actualizar permiso (PATCH)
     */
    public function update(string $id_permiso, array $data): int
    {
        $this->db->query("
            UPDATE permiso SET
                fecha = :fecha,
                h_inicio = :h_inicio,
                h_fin = :h_fin,
                descripcion = :descripcion,
                estado = :estado
            WHERE ID_Permiso = :id_permiso
        ")
        ->bind(':id_permiso', $id_permiso)
        ->bind(':fecha', $data['fecha'])
        ->bind(':h_inicio', $data['h_inicio'])
        ->bind(':h_fin', $data['h_fin'])
        ->bind(':descripcion', $data['descripcion'] ?? null)
        ->bind(':estado', $data['estado'] ?? null)
        ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    /**
     * Eliminar permiso
     */
    public function delete(string $id_permiso): int
    {
        $this->db
            ->query("DELETE FROM permiso WHERE id_permiso = :id_permiso")
            ->bind(':id_permiso', $id_permiso)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    /**
     * Asignar un permiso a una persona con fecha de obtención y vencimiento
     */
    public function assignToPerson(
        string $n_funcionario,
        string $id_permiso,
        string $cargo,
    ): bool {
        $this->db->query("
            INSERT INTO Persona_Carnet (
                n_funcionario,
                id_permiso,
                cargo
            ) VALUES (
                :n_funcionario,
                :id_permiso,
                :cargo
            )
        ")
        ->bind(':n_funcionario', $n_funcionario)
        ->bind(':id_permiso', $id_permiso)
        ->bind(':cargo', $cargo)
        ->execute();

        return $this->db->rowCount() > 0;
    }

    /**
     * Obtener todas las personas que tienen un permiso (con fechas)
     */
    public function getPersonsByPermiso(string $id_permiso): array
    {
        return $this->db
            ->query("
                SELECT 
                    p.*,
                    pc.f_obtencion,
                    pc.f_vencimiento
                FROM Persona_Permiso pc
                INNER JOIN Persona p 
                    ON p.n_funcionario = pc.n_funcionario
                WHERE pc.id_permiso = :id_permiso
                ORDER BY p.n_funcionario ASC
            ")
            ->bind(':id_permiso', $id_permiso)
            ->fetchAll();
    }

    /**
     * Eliminar la asignación de un permiso a una persona
     */
    public function unassignFromPerson(string $n_funcionario, string $id_permiso): int
    {
        $this->db
            ->query("
                DELETE FROM Persona_Permiso
                WHERE n_funcionario = :n_funcionario
                AND id_permiso = :id_permiso
            ")
            ->bind(':n_funcionario', $n_funcionario)
            ->bind(':id_permiso', $id_permiso)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }
}
?>
