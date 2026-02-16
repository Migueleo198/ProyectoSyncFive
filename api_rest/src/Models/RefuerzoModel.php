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
    public function create(array $data): string|false
    {
        $this->db->query("
            INSERT INTO Turno_refuerzo (
                id_turno_refuerzo,
                h_inicio,
                h_fin,
                horas
            ) VALUES (
                :id_turno_refuerzo,
                :fecha,
                :h_inicio,
                :h_fin,
                :horas
            )
        ")
        ->bind(':id_turno_refuerzo', $data['id_turno_refuerzo'])
        ->bind(':h_inicio', $data['h_inicio'])
        ->bind(':h_fin', $data['h_fin'])
        ->bind(':horas', $data['horas'] ?? null)
        ->execute();

        return $data['id_turno_refuerzo'];
    }

    /**
     * Actualizar refuerzo (PATCH)
     */
    public function update(string $id_turno_refuerzo, array $data): int
    {
        $this->db->query("
            UPDATE Turno_refuerzo SET
                h_inicio = :h_inicio,
                h_fin = :h_fin,
                horas = :horas
            WHERE id_turno_refuerzo = :id_turno_refuerzo
        ")
        ->bind(':id_turno_refuerzo', $id_turno_refuerzo)
        ->bind(':h_inicio', $data['h_inicio'])
        ->bind(':h_fin', $data['h_fin'])
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
     * Asignar un refuerzo a una persona con fecha de obtención y vencimiento
     */
    public function assignToPerson(
        string $n_funcionario,
        string $id_refuerzo,
        string $cargo,
    ): bool {
        $this->db->query("
            INSERT INTO Persona_Turno (
                n_funcionario,
                id_turno_refuerzo,
                cargo
            ) VALUES (
                :n_funcionario,
                :id_turno_refuerzo,
                :cargo
            )
        ")
        ->bind(':n_funcionario', $n_funcionario)
        ->bind(':id_turno_refuerzo', $id_turno_refuerzo)
        ->bind(':cargo', $cargo)
        ->execute();

        return $this->db->rowCount() > 0;
    }

    /**
     * Obtener todas las personas que tienen un refuerzo (con fechas)
     */
    public function getPersonsByRefuerzo(string $id_turno_refuerzo): array
    {
        return $this->db
            ->query("
                SELECT 
                    p.*,
                    pc.f_obtencion,
                    pc.f_vencimiento
                FROM Persona_Turno pc
                INNER JOIN Persona p 
                    ON p.n_funcionario = pc.n_funcionario
                WHERE pc.id_turno_refuerzo = :id_turno_refuerzo
                ORDER BY p.n_funcionario ASC
            ")
            ->bind(':id_turno_refuerzo', $id_turno_refuerzo)
            ->fetchAll();
    }

    /**
     * Eliminar la asignación de un refuerzo a una persona
     */
    public function unassignFromPerson(string $n_funcionario, string $id_turno_refuerzo): int
    {
        $this->db
            ->query("
                DELETE FROM Persona_Turno
                WHERE n_funcionario = :n_funcionario
                AND id_turno_refuerzo = :id_turno_refuerzo
            ")
            ->bind(':n_funcionario', $n_funcionario)
            ->bind(':id_turno_refuerzo', $id_turno_refuerzo)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }
}
?>
