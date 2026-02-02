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
    public function create(array $data): string|false
    {
        $this->db->query("
            INSERT INTO guardia (
                id_guardia,
                fecha,
                h_inicio,
                h_fin,
                notas
            ) VALUES (
                :id_guardia,
                :fecha,
                :h_inicio,
                :h_fin,
                :notas
            )
        ")
        ->bind(':id_guardia', $data['id_guardia'])
        ->bind(':fecha', $data['fecha'])
        ->bind(':h_inicio', $data['h_inicio'])
        ->bind(':h_fin', $data['h_fin'])
        ->bind(':notas', $data['notas'] ?? null)
        ->execute();

        return $data['id_guardia'];
    }

    /**
     * Actualizar carnet (PATCH)
     */
    public function update(string $id_guardia, array $data): int
    {
        $this->db->query("
            UPDATE guardia SET
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
    public function delete(string $id_guardia): int
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
     * Asignar un guardia a una persona con fecha de obtención y vencimiento
     */
    public function assignToPerson(
        string $n_funcionario,
        string $id_guardia,
        string $cargo,
    ): bool {
        $this->db->query("
            INSERT INTO Persona_Carnet (
                n_funcionario,
                id_guardia,
                cargo
            ) VALUES (
                :n_funcionario,
                :id_guardia,
                :cargo
            )
        ")
        ->bind(':n_funcionario', $n_funcionario)
        ->bind(':id_guardia', $id_guardia)
        ->bind(':cargo', $cargo)
        ->execute();

        return $this->db->rowCount() > 0;
    }

    /**
     * Obtener todas las personas que tienen un guardia (con fechas)
     */
    public function getPersonsByGuardia(string $id_guardia): array
    {
        return $this->db
            ->query("
                SELECT 
                    p.*,
                    pc.f_obtencion,
                    pc.f_vencimiento
                FROM Persona_Guardia pc
                INNER JOIN Persona p 
                    ON p.n_funcionario = pc.n_funcionario
                WHERE pc.id_guardia = :id_guardia
                ORDER BY p.n_funcionario ASC
            ")
            ->bind(':id_guardia', $id_guardia)
            ->fetchAll();
    }

    /**
     * Eliminar la asignación de un guardia a una persona
     */
    public function unassignFromPerson(string $n_funcionario, string $id_guardia): int
    {
        $this->db
            ->query("
                DELETE FROM Persona_Guardia
                WHERE n_funcionario = :n_funcionario
                AND id_guardia = :id_guardia
            ")
            ->bind(':n_funcionario', $n_funcionario)
            ->bind(':id_guardia', $id_guardia)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }
}
?>
