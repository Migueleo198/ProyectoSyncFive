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
        ->query("SELECT * FROM Motivo ORDER BY cod_motivo ASC") 
        ->fetchAll();
    }

    public function find(string $cod_motivo): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Motivo WHERE cod_motivo = :cod_motivo")
            ->bind(':cod_motivo', $cod_motivo)
            ->fetch();

        return $result ?: null;
    }

public function create(array $data): int|false
{
    $this->db->query("
        INSERT INTO Motivo (nombre, dias)
        VALUES (:nombre, :dias)
    ")
    ->bind(':nombre', $data['nombre'])
    ->bind(':dias', $data['dias'])
    ->execute();

    return (int) $this->db->lastId();
}

    public function update(string $cod_motivo, array $data): int
    {
        $this->db->query("
            UPDATE Motivo SET
                nombre = :nombre,
                dias = :dias
            WHERE cod_motivo = :cod_motivo
        ")
        ->bind(':cod_motivo', $cod_motivo)
        ->bind(':nombre', $data['nombre'] ?? null)
        ->bind(':dias', $data['dias'] ?? null)
        ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    public function delete(string $cod_motivo): int
    {
        $this->db
            ->query("DELETE FROM Motivo WHERE cod_motivo = :cod_motivo")
            ->bind(':cod_motivo', $cod_motivo)
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
        string $cod_motivo,
        string $fecha
    ): bool {
        $this->db->query("
            INSERT INTO Permiso_Motivo (
                id_permiso,
                cod_motivo,
                fecha
            ) VALUES (
                :id_permiso,
                :cod_motivo,
                :fecha
            )
        ")
        ->bind(':id_permiso', $id_permiso)
        ->bind(':cod_motivo', $cod_motivo)
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
                    ON m.cod_motivo = pm.cod_motivo
                WHERE pm.id_permiso = :id_permiso
                ORDER BY m.cod_motivo ASC
            ")
            ->bind(':id_permiso', $id_permiso)
            ->fetchAll();
    }

    /**
     * Quitar un motivo de un permiso
     */
    public function unassignFromPermiso(string $id_permiso, string $cod_motivo): int
    {
        $this->db
            ->query("
                DELETE FROM Permiso_Motivo
                WHERE id_permiso = :id_permiso
                AND cod_motivo = :cod_motivo
            ")
            ->bind(':id_permiso', $id_permiso)
            ->bind(':cod_motivo', $cod_motivo)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }
}
