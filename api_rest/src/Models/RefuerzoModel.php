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
            ->query("SELECT * FROM Refuerzo ORDER BY ID_Refuerzo ASC")
            ->fetchAll();
    }

    /**
     * Buscar refuerzo por ID_Refuerzo
     */
    public function find(string $id_refuerzo): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Refuerzo WHERE ID_Refuerzo = :id")
            ->bind(':id', $id_refuerzo)
            ->fetch();

        return $result ?: null;
    }

    /**
     * Crear un refuerzo
     */
    public function create(array $data): string|false
    {
        $this->db->query("
            INSERT INTO refuerzo (
                id_refuerzo,
                fecha,
                h_inicio,
                h_fin,
                notas
            ) VALUES (
                :id_refuerzo,
                :fecha,
                :h_inicio,
                :h_fin,
                :notas
            )
        ")
        ->bind(':id_refuerzo', $data['id_refuerzo'])
        ->bind(':fecha', $data['fecha'])
        ->bind(':h_inicio', $data['h_inicio'])
        ->bind(':h_fin', $data['h_fin'])
        ->bind(':notas', $data['notas'] ?? null)
        ->execute();

        return $data['id_refuerzo'];
    }

    /**
     * Actualizar refuerzo (PATCH)
     */
    public function update(string $id_refuerzo, array $data): int
    {
        $this->db->query("
            UPDATE refuerzo SET
                fecha = :fecha,
                h_inicio = :h_inicio,
                h_fin = :h_fin,
                notas = :notas
            WHERE ID_Refuerzo = :id_refuerzo
        ")
        ->bind(':id_refuerzo', $id_refuerzo)
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
     * Eliminar refuerzo
     */
    public function delete(string $id_refuerzo): int
    {
        $this->db
            ->query("DELETE FROM refuerzo WHERE id_refuerzo = :id_refuerzo")
            ->bind(':id_refuerzo', $id_refuerzo)
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
            INSERT INTO Persona_Carnet (
                n_funcionario,
                id_refuerzo,
                cargo
            ) VALUES (
                :n_funcionario,
                :id_refuerzo,
                :cargo
            )
        ")
        ->bind(':n_funcionario', $n_funcionario)
        ->bind(':id_refuerzo', $id_refuerzo)
        ->bind(':cargo', $cargo)
        ->execute();

        return $this->db->rowCount() > 0;
    }

    /**
     * Obtener todas las personas que tienen un refuerzo (con fechas)
     */
    public function getPersonsByRefuerzo(string $id_refuerzo): array
    {
        return $this->db
            ->query("
                SELECT 
                    p.*,
                    pc.f_obtencion,
                    pc.f_vencimiento
                FROM Persona_Refuerzo pc
                INNER JOIN Persona p 
                    ON p.n_funcionario = pc.n_funcionario
                WHERE pc.id_refuerzo = :id_refuerzo
                ORDER BY p.n_funcionario ASC
            ")
            ->bind(':id_refuerzo', $id_refuerzo)
            ->fetchAll();
    }

    /**
     * Eliminar la asignación de un refuerzo a una persona
     */
    public function unassignFromPerson(string $n_funcionario, string $id_refuerzo): int
    {
        $this->db
            ->query("
                DELETE FROM Persona_Refuerzo
                WHERE n_funcionario = :n_funcionario
                AND id_refuerzo = :id_refuerzo
            ")
            ->bind(':n_funcionario', $n_funcionario)
            ->bind(':id_refuerzo', $id_refuerzo)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }
}
?>
