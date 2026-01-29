<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class MotivoModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    /* =======================
       CRUD DE MOTIVO
       ======================= */

    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Motivo ORDER BY ID_Motivo ASC")
            ->fetchAll();
    }

    public function find(string $id_motivo): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Motivo WHERE ID_Motivo = :id")
            ->bind(':id', $id_motivo)
            ->fetch();

        return $result ?: null;
    }

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

    /* =======================
       RELACIÓN PERMISO ↔ MOTIVO
       ======================= */

    /**
     * Asignar un motivo a un permiso
     */
    public function assignToPermiso(
        string $id_permiso,
        string $id_motivo,
        string $fecha
    ): bool {
        $this->db->query("
            INSERT INTO Permiso_Motivo (
                id_permiso,
                id_motivo,
                fecha
            ) VALUES (
                :id_permiso,
                :id_motivo,
                :fecha
            )
        ")
        ->bind(':id_permiso', $id_permiso)
        ->bind(':id_motivo', $id_motivo)
        ->bind(':fecha', $fecha)
        ->execute();

        return $this->db->rowCount() > 0;
    }

    /**
     * Obtener motivos asociados a un permiso
     */
    public function getMotivosByPermiso(string $id_permiso): array
    {
        return $this->db
            ->query("
                SELECT 
                    m.*,
                    pm.fecha
                FROM Permiso_Motivo pm
                INNER JOIN Motivo m
                    ON m.ID_Motivo = pm.id_motivo
                WHERE pm.id_permiso = :id_permiso
                ORDER BY m.ID_Motivo ASC
            ")
            ->bind(':id_permiso', $id_permiso)
            ->fetchAll();
    }

    /**
     * Quitar un motivo de un permiso
     */
    public function unassignFromPermiso(string $id_permiso, string $id_motivo): int
    {
        $this->db
            ->query("
                DELETE FROM Permiso_Motivo
                WHERE id_permiso = :id_permiso
                AND id_motivo = :id_motivo
            ")
            ->bind(':id_permiso', $id_permiso)
            ->bind(':id_motivo', $id_motivo)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }
}
