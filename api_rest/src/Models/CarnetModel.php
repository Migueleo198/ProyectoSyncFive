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
    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Carnet (
                nombre,
                categoria,
                duracion_meses
            ) VALUES (
                :nombre,
                :categoria,
                :duracion_meses
            )
        ")
        ->bind(':id_carnet', $data['ID_Carnet'])
        ->bind(':nombre', $data['nombre'])
        ->bind(':categoria', $data['categoria'])
        ->bind(':duracion_meses', $data['duracion_meses'])
        ->execute();

        return (int) $this->db->lastId();
    }

    /**
     * Actualizar carnet (PATCH)
     */
    public function update(string $id_carnet, array $data): int
    {
        $this->db->query("
            UPDATE Carnet SET
                nombre = :nombre,
                categoria = :categoria,
                duracion_meses = :duracion_meses
            WHERE ID_Carnet = :id_carnet
        ")
        ->bind(':id_carnet', $id_carnet)
        ->bind(':nombre', $data['nombre'] ?? null)
        ->bind(':categoria', $data['categoria'] ?? null)
        ->bind(':duracion_meses', $data['duracion_meses'] ?? null)
        ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    /**
     * Eliminar carnet
     */
    public function delete(int $id_carnet): int
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
                FROM Carnet_Persona pc
                INNER JOIN Persona p 
                    ON p.id_bombero = pc.id_bombero
                WHERE pc.ID_Carnet = :id_carnet
                ORDER BY p.id_bombero ASC
            ")
            ->bind(':id_carnet', $id_carnet)
            ->fetchAll();
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
            INSERT INTO Carnet_Persona (
                id_bombero,
                ID_Carnet,
                f_obtencion,
                f_vencimiento
            ) VALUES (
                :id_bombero,
                :id_carnet,
                :f_obtencion,
                :f_vencimiento
            )
        ")
        ->bind(':id_bombero', $id_bombero)
        ->bind(':id_carnet', $id_carnet)
        ->bind(':f_obtencion', $f_obtencion)
        ->bind(':f_vencimiento', $f_vencimiento)
        ->execute();

        // Obtener la cantidad de filas afectadas
        $affected = $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];

        return $affected > 0;
    }


    /**
     * Eliminar la asignación de un carnet a una persona
     */
    public function unassignFromPerson(string $id_bombero, string $id_carnet): int
    {
        $this->db
            ->query("
                DELETE FROM Carnet_Persona
                WHERE id_bombero = :id_bombero
                AND ID_Carnet = :id_carnet
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
