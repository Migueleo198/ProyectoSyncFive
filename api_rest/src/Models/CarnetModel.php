<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class CarnetModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    /**
     * Obtener todos los carnets
     */
    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Carnet ORDER BY ID_Carnet ASC")
            ->fetchAll();
    }

    /**
     * Buscar carnet por ID_Carnet
     */
    public function find(string $id_carnet): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Carnet WHERE ID_Carnet = :id")
            ->bind(':id', $id_carnet)
            ->fetch();

        return $result ?: null;
    }

    /**
     * Crear un carnet
     */
    public function create(array $data): string|false
    {
        $this->db->query("
            INSERT INTO Carnet (
                ID_Carnet,
                nombre,
                tipo,
                duracion
            ) VALUES (
                :id_carnet,
                :nombre,
                :tipo,
                :duracion
            )
        ")
        ->bind(':id_carnet', $data['ID_Carnet'])
        ->bind(':nombre', $data['Nombre'])
        ->bind(':tipo', $data['Tipo'])
        ->bind(':duracion', $data['Duracion'])
        ->execute();

        return $data['ID_Carnet'];
    }

    /**
     * Actualizar carnet (PATCH)
     */
    public function update(string $id_carnet, array $data): int
    {
        $this->db->query("
            UPDATE Carnet SET
                nombre = :nombre,
                tipo = :tipo,
                duracion = :duracion
            WHERE ID_Carnet = :id_carnet
        ")
        ->bind(':id_carnet', $id_carnet)
        ->bind(':nombre', $data['Nombre'] ?? null)
        ->bind(':tipo', $data['Tipo'] ?? null)
        ->bind(':duracion', $data['Duracion'] ?? null)
        ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    /**
     * Eliminar carnet
     */
    public function delete(string $id_carnet): int
    {
        $this->db
            ->query("DELETE FROM Carnet WHERE ID_Carnet = :id_carnet")
            ->bind(':id_carnet', $id_carnet)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    /**
     * Asignar un carnet a una persona con fecha de obtención y vencimiento
     */
    public function assignToPerson(
        string $n_funcionario,
        string $id_carnet,
        string $f_obtencion,
        string $f_vencimiento
    ): bool {
        $this->db->query("
            INSERT INTO Persona_Carnet (
                n_funcionario,
                ID_Carnet,
                f_obtencion,
                f_vencimiento
            ) VALUES (
                :n_funcionario,
                :id_carnet,
                :f_obtencion,
                :f_vencimiento
            )
        ")
        ->bind(':n_funcionario', $n_funcionario)
        ->bind(':id_carnet', $id_carnet)
        ->bind(':f_obtencion', $f_obtencion)
        ->bind(':f_vencimiento', $f_vencimiento)
        ->execute();

        return $this->db->rowCount() > 0;
    }

    /**
     * Obtener todos los carnets asignados a una persona (con fechas)
     */
    public function getCarnetsByPerson(string $n_funcionario): array
    {
        return $this->db
            ->query("
                SELECT 
                    c.*,
                    pc.f_obtencion,
                    pc.f_vencimiento
                FROM Persona_Carnet pc
                INNER JOIN Carnet c 
                    ON c.ID_Carnet = pc.ID_Carnet
                WHERE pc.n_funcionario = :n_funcionario
                ORDER BY c.ID_Carnet ASC
            ")
            ->bind(':n_funcionario', $n_funcionario)
            ->fetchAll();
    }

    /**
     * Obtener todas las personas que tienen un carnet (con fechas)
     */
    public function getPersonsByCarnet(string $id_carnet): array
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
