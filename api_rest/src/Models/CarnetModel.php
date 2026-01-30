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
            ->query("SELECT * FROM Carnet ORDER BY id_carnet ASC")
            ->fetchAll();
    }

    /**
     * Crear un carnet
     */
    public function create(array $data): string|false
    {
        $this->db->query("
            INSERT INTO Carnet (
                id_carnet,
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
        ->bind(':id_carnet', $data['id_carnet'])
        ->bind(':nombre', $data['nombre'])
        ->bind(':tipo', $data['tipo'])
        ->bind(':duracion', $data['duracion'])
        ->execute();

        return $data['id_carnet'];
    }


    /**
     * Eliminar carnet
     */
    public function delete(string $id_carnet): int
    {
        $this->db
            ->query("DELETE FROM Carnet WHERE id_carnet = :id_carnet")
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
        string $id_bombero,
        string $id_carnet,
        string $f_obtencion,
        string $f_vencimiento
    ): bool {
        $this->db->query("
            INSERT INTO Persona_Carnet (
                id_bombero,
                id_carnet,
                f_obtencion,
                f_vencimiento
            ) VALUES (
                :id_bombero,
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
    public function getCarnetsByPerson(string $id_bombero): array
    {
        return $this->db
            ->query("
                SELECT 
                    c.*,
                    pc.f_obtencion,
                    pc.f_vencimiento
                FROM Persona_Carnet pc
                INNER JOIN Carnet c 
                    ON c.id_carnet = pc.id_carnet
                WHERE pc.id_bombero = :id_bombero
                ORDER BY c.id_carnet ASC
            ")
            ->bind(':id_bombero', $id_bombero)
            ->fetchAll();
    }

    /**
     * Eliminar la asignación de un carnet a una persona
     */
    public function unassignFromPerson(string $id_bombero, string $id_carnet): int
    {
        $this->db
            ->query("
                DELETE FROM Persona_Carnet
                WHERE id_bombero = :id_bombero
                AND id_carnet = :id_carnet
            ")
            ->bind(':id_bombero', $id_bombero)
            ->bind(':id_carnet', $id_carnet)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }
}
?>
