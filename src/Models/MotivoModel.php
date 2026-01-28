<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class motivoModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    /**
     * Obtener todos los motivos
     */
    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Motivo ORDER BY ID_Motivo ASC")
            ->fetchAll();
    }

    /**
     * Buscar motivo por ID_Motivo
     */
    public function find(string $id_motivo): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Motivo WHERE ID_Motivo = :id")
            ->bind(':id', $id_motivo)
            ->fetch();

        return $result ?: null;
    }

    /**
     * Crear un motivo
     */
    public function create(array $data): string|false
    {
        $this->db->query("
            INSERT INTO Motivo (
                ID_Motivo,
                nombre,
                dias
            ) VALUES (
                :id_motivo,
                :nombre,
                :dias
            )
        ")
        ->bind(':id_motivo', $data['ID_Motivo'])
        ->bind(':nombre', $data['Nombre'])
        ->bind(':dias', $data['Dias'])
        ->execute();

        return $data['ID_Motivo'];
    }

    /**
     * Actualizar motivo (PATCH)
     */
    public function update(string $id_motivo, array $data): int
    {
        $this->db->query("
            UPDATE Motivo SET
                nombre = :nombre,
                dias = :dias
            WHERE ID_Motivo = :id_motivo
        ")
        ->bind(':id_motivo', $id_motivo)
        ->bind(':nombre', $data['Nombre'] ?? null)
        ->bind(':dias', $data['Dias'] ?? null)
        ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    /**
     * Eliminar motivo
     */
    public function delete(string $id_motivo): int
    {
        $this->db
            ->query("DELETE FROM Motivo WHERE ID_Motivo = :id_motivo")
            ->bind(':id_motivo', $id_motivo)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    /**
     * Asignar un motivo a una persona con fecha de obtención y vencimiento
     */
    public function assignToPermiso(
        string $id_permiso,
        string $id_motivo,
        date $fecha,
    ): bool {
        $this->db->query("
            INSERT INTO Persona_Carnet (
                id_permiso,
                ID_Motivo,
                fecha,
                dias
            ) VALUES (
                :id_permiso,
                :id_motivo,
                :fecha,
                :dias
            )
        ")
        ->bind(':id_permiso', $id_permiso)
        ->bind(':id_motivo', $id_motivo)
        ->bind(':fecha', $fecha)
        ->bind(':dias', $dias)
        ->execute();

        return $this->db->rowCount() > 0;
    }

    /**
     * Obtener todas las personas que tienen un carnet (con fechas)
     */
    public function getPermisosByMotivos(string $id_carnet): array
    {
        return $this->db
            ->query("
                SELECT 
                    p.*,
                    pc.f_obtencion,
                    pc.f_vencimiento
                FROM Persona_Carnet pc
                INNER JOIN Persona p 
                    ON p.n_funcionario = pc.n_funcionario
                WHERE pc.ID_Carnet = :id_carnet
                ORDER BY p.n_funcionario ASC
            ")
            ->bind(':id_carnet', $id_carnet)
            ->fetchAll();
    }

    /**
     * Actualizar fechas de obtención y vencimiento de un carnet de una persona
     */
    public function updatePersonCarnetDates(
        string $n_funcionario,
        string $id_carnet,
        array $data
    ): int {
        $this->db->query("
            UPDATE Persona_Carnet SET
                f_obtencion = :f_obtencion,
                f_vencimiento = :f_vencimiento
            WHERE n_funcionario = :n_funcionario
            AND ID_Carnet = :id_carnet
        ")
        ->bind(':n_funcionario', $n_funcionario)
        ->bind(':id_carnet', $id_carnet)
        ->bind(':f_obtencion', $data['f_obtencion'] ?? null)
        ->bind(':f_vencimiento', $data['f_vencimiento'] ?? null)
        ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    /**
     * Eliminar la asignación de un carnet a una persona
     */
    public function unassignFromPerson(string $n_funcionario, string $id_carnet): int
    {
        $this->db
            ->query("
                DELETE FROM Persona_Carnet
                WHERE n_funcionario = :n_funcionario
                AND ID_Carnet = :id_carnet
            ")
            ->bind(':n_funcionario', $n_funcionario)
            ->bind(':id_carnet', $id_carnet)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }
}
?>
