<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class RefuerzoModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    /**
     * Obtener todos los refuerzos
     */
    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Turno_refuerzo ORDER BY id_turno_refuerzo ASC")
            ->fetchAll();
    }

    /**
     * Buscar refuerzo por id_turno_refuerzo
     */
    public function find(string $id_turno_refuerzo): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Turno_refuerzo WHERE id_turno_refuerzo = :id")
            ->bind(':id', $id_turno_refuerzo)
            ->fetch();

        return $result ?: null;
    }

    /**
     * Crear un refuerzo
     */
    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Turno_refuerzo (
                f_inicio,
                f_fin,
                horas
            ) VALUES (
                :f_inicio,
                :f_fin,
                :horas
            )
        ")
        ->bind(':f_inicio', $data['f_inicio'])
        ->bind(':f_fin', $data['f_fin'])
        ->bind(':horas', $data['horas'] ?? null)
        ->execute();

        return (int) $this->db->lastId();
    }

    /**
     * Actualizar refuerzo (PATCH)
     */
    public function update(string $id_turno_refuerzo, array $data): int
    {
        $this->db->query("
            UPDATE Turno_refuerzo SET
                f_inicio = :f_inicio,
                f_fin = :f_fin,
                horas = :horas
            WHERE id_turno_refuerzo = :id_turno_refuerzo
        ")
        ->bind(':id_turno_refuerzo', $id_turno_refuerzo)
        ->bind(':f_inicio', $data['f_inicio'])
        ->bind(':f_fin', $data['f_fin'])
        ->bind(':horas', $data['horas'] ?? null)
        ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    /**
     * Eliminar refuerzo
     */
    public function delete(string $id_turno_refuerzo): int
    {
        $this->db
            ->query("DELETE FROM Turno_refuerzo WHERE id_turno_refuerzo = :id_turno_refuerzo")
            ->bind(':id_turno_refuerzo', $id_turno_refuerzo)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    /**
     * Asignar un refuerzo a una persona con  de obtención y vencimiento
    */
    public function assignToPerson(string $id_bombero, string $id_turno): bool
    {
        $this->db->query("
            INSERT INTO Persona_Turno (
                id_bombero,
                id_turno
            ) VALUES (
                :id_bombero,
                :id_turno
            )
        ")
        ->bind(':id_bombero', $id_bombero)
        ->bind(':id_turno', $id_turno)
        ->execute();

        $affected = $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];

        return $affected > 0;
    }

    /**
     * Obtener todas las personas que tienen un refuerzo
     */
    public function getPersonsByRefuerzo(string $id_turno_refuerzo): array
    {
        return $this->db
            ->query("
                SELECT 
                    pc.id_turno,
                    p.id_bombero,
                    p.n_funcionario,
                    p.nombre,
                    p.apellidos
                FROM Persona_Turno pc
                INNER JOIN Persona p 
                    ON p.id_bombero = pc.id_bombero
                WHERE pc.id_turno = :id_turno
                ORDER BY p.apellidos ASC, p.nombre ASC
            ")
            ->bind(':id_turno', $id_turno_refuerzo)
            ->fetchAll();
    }

    /**
     * Eliminar la asignación de un refuerzo a una persona
     */
    public function unassignFromPerson(string $id_bombero, string $id_turno_refuerzo): int
    {
        $this->db
            ->query("
                DELETE FROM Persona_Turno
                WHERE id_bombero = :id_bombero
                AND id_turno = :id_turno_refuerzo
            ")
            ->bind(':id_bombero', $id_bombero)
            ->bind(':id_turno_refuerzo', $id_turno_refuerzo)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    /**
     * Obtener las personas asignadas a turnos de refuerzo activos en una fecha
     */
    public function getTurnoRefuerzoByFecha(string $fecha): array
    {
        return $this->db
            ->query("
                SELECT
                    tr.id_turno_refuerzo,
                    tr.f_inicio,
                    tr.f_fin,
                    p.id_bombero,
                    p.n_funcionario,
                    p.nombre,
                    p.apellidos
                FROM Turno_refuerzo tr
                INNER JOIN Persona_Turno pt
                    ON pt.id_turno = tr.id_turno_refuerzo
                INNER JOIN Persona p
                    ON p.id_bombero = pt.id_bombero
                WHERE DATE(:fecha) BETWEEN DATE(tr.f_inicio) AND DATE(tr.f_fin)
                ORDER BY p.apellidos ASC, p.nombre ASC
            ")
            ->bind(':fecha', $fecha)
            ->fetchAll();
    }


}
?>
