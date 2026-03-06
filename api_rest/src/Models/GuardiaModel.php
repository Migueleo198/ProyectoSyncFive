<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class GuardiaModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    /**
     * Obtener todos los guardias
     */
    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Guardia ORDER BY ID_Guardia ASC")
            ->fetchAll();
    }

    /**
     * Buscar guardia por ID_Guardia
     */
    public function find(string $id_guardia): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Guardia WHERE ID_Guardia = :id")
            ->bind(':id', $id_guardia)
            ->fetch();

        return $result ?: null;
    }

    /**
     * Crear un guardia
     */
public function create(array $data): int|false
{
    $this->db->query("
        INSERT INTO Guardia (
            fecha,
            h_inicio,
            h_fin,
            notas
        ) VALUES (
            :fecha,
            :h_inicio,
            :h_fin,
            :notas
        )
    ")
    ->bind(':fecha', $data['fecha'])
    ->bind(':h_inicio', $data['h_inicio'])
    ->bind(':h_fin', $data['h_fin'])
    ->bind(':notas', $data['notas'] ?? null)
    ->execute();

        return (int) $this->db->lastId();
}

    /**
     * Actualizar Guardia (PATCH)
     */
    public function update(string $id_guardia, array $data): int
    {
        $this->db->query("
            UPDATE Guardia SET
                fecha = :fecha,
                h_inicio = :h_inicio,
                h_fin = :h_fin,
                notas = :notas
            WHERE ID_Guardia = :id_guardia
        ")
        ->bind(':id_guardia', $id_guardia)
        ->bind(':fecha', $data['fecha'])
        ->bind(':h_inicio', $data['h_inicio'])
        ->bind(':h_fin', $data['h_fin'])
        ->bind(':notas', $data['notas'] ?? null)
        ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    /**
     * Eliminar guardia
     */
    public function delete(int $id_guardia): int
    {
        $this->db
            ->query("DELETE FROM guardia WHERE id_guardia = :id_guardia")
            ->bind(':id_guardia', $id_guardia)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }


    /**
     * Obtener todas las personas que tienen un carnet (con fechas)
     */
    public function findById(int $id_guardia): array|false
    {
        return $this->db
            ->query("SELECT * FROM Guardia WHERE id_guardia = :id_guardia")
            ->bind(':id_guardia', $id_guardia)
            ->fetch();
    }
    /**
     * Asignar un guardia a una persona con un cargo específico 
     */
    public function assign(
        string $id_bombero,
        string $id_guardia,
        string $cargo
    ): bool 
    {
        $this->db->query("
            INSERT INTO Persona_Hace_Guardia (
                id_bombero,
                id_guardia,
                cargo
            ) VALUES (
                :id_bombero,
                :id_guardia,
                :cargo
            )
        ")
        ->bind(':id_bombero', $id_bombero)
        ->bind(':id_guardia', $id_guardia)
        ->bind(':cargo', $cargo)
        ->execute();

        $affected = $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];

        return $affected > 0;
    }


    /**
     * Obtener todas las personas que tienen una guardia
     */
    public function getPersonsByGuardia(int $id_guardia): array
    {
        return $this->db
            ->query("
                SELECT * from Persona_Hace_Guardia
                WHERE id_guardia = :id_guardia 
            ")
            ->bind(':id_guardia', $id_guardia)
            ->fetchAll();
    }

    /**
     * Eliminar la asignación de un guardia a una persona
     */
    public function unassignFromPerson(string $id_bombero, string $id_guardia): int
    {
        $this->db
            ->query("
                DELETE FROM Persona_Hace_Guardia
                WHERE id_bombero = :id_bombero
                AND id_guardia = :id_guardia
            ")
            ->bind(':id_bombero', $id_bombero)
            ->bind(':id_guardia', $id_guardia)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    /**
     * Obtener guardia en una fecha específica
     */
    public function findByDate(string $fecha): array
    {
        $result = $this->db
            ->query("SELECT g.*, p.nombre,p.apellidos, p.id_bombero, phg.cargo FROM Guardia g
            INNER JOIN Persona_Hace_Guardia phg ON g.id_guardia = phg.id_guardia
            INNER JOIN Persona p ON phg.id_bombero = p.id_bombero
            WHERE g.fecha = :fecha")
            ->bind(':fecha', $fecha)
            ->fetchAll();
        return $result ?: [];
    }

    /**
     * Actualizar el cargo de una persona en una guardia específica
     */
    public function updateCargo(string $id_bombero, string $id_guardia, string $cargo): int
    {
        $this->db->query("
            UPDATE Persona_Hace_Guardia 
            SET cargo = :cargo
            WHERE id_bombero = :id_bombero 
            AND id_guardia = :id_guardia
        ")
        ->bind(':cargo', $cargo)
        ->bind(':id_bombero', $id_bombero)
        ->bind(':id_guardia', $id_guardia)
        ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    /**
     * PATCH /Guardias/{id_guardia} - Actualizar notas de una guardia
     */ 
    public function updateNotas(string $id_guardia, string $notas): int
    {
        $this->db->query("
            UPDATE Guardia 
            SET notas = :notas
            WHERE id_guardia = :id_guardia
        ")
        ->bind(':notas', $notas)
        ->bind(':id_guardia', $id_guardia)
        ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }
}
