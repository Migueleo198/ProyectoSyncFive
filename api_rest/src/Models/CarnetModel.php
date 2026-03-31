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
            ->query("
                SELECT
                    c.id_carnet,
                    c.id_grupo,
                    c.nombre,
                    c.duracion_meses,
                    g.nombre AS grupo
                FROM Carnet c
                INNER JOIN Grupo g ON g.id_grupo = c.id_grupo
                ORDER BY c.id_carnet ASC
            ")
            ->fetchAll();
    }

    /**
     * Crear un carnet
     */
    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Carnet (
                id_grupo,
                nombre,
                duracion_meses
            ) VALUES (
                :id_grupo,
                :nombre,
                :duracion_meses
            )
        ")
        ->bind(':id_grupo', $data['id_grupo'])
        ->bind(':nombre', $data['nombre'])
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
                id_grupo = :id_grupo,
                duracion_meses = :duracion_meses
            WHERE id_carnet = :id_carnet
        ")
        ->bind(':id_carnet', $id_carnet)
        ->bind(':nombre', $data['nombre'] ?? null)
        ->bind(':id_grupo', $data['id_grupo'] ?? null)
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
     * Alias de findById para compatibilidad con el service
     */
    public function find(string|int $id_carnet): array|false
    {
        return $this->findById((int)$id_carnet);
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
                    c.nombre AS carnet_nombre,
                    g.nombre AS grupo,
                    pc.f_obtencion,
                    pc.f_vencimiento
                FROM Carnet_Persona pc
                INNER JOIN Carnet c
                    ON c.id_carnet = pc.id_carnet
                LEFT JOIN Grupo g
                    ON g.id_grupo = c.id_grupo
                INNER JOIN Persona p 
                    ON p.id_bombero = pc.id_bombero
                WHERE pc.ID_Carnet = :id_carnet
                ORDER BY p.id_bombero ASC
            ")
            ->bind(':id_carnet', $id_carnet)
            ->fetchAll();
    }
/**
 * Obtener carnet por ID
 */
public function findById(int $id_carnet): array|false
{
    return $this->db
        ->query("
            SELECT
                c.id_carnet,
                c.id_grupo,
                c.nombre,
                c.duracion_meses,
                g.nombre AS grupo
            FROM Carnet c
            INNER JOIN Grupo g ON g.id_grupo = c.id_grupo
            WHERE c.id_carnet = :id_carnet
        ")
        ->bind(':id_carnet', $id_carnet)
        ->fetch();
}
  /**
   * Asignar un carnet a una persona con fecha de obtención y vencimiento
   */
    public function assign(
        string $id_bombero,
        string $id_carnet,
        string $f_obtencion,
        string $f_vencimiento
    ): bool {
        $this->db->query("
            INSERT INTO Carnet_Persona (
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
