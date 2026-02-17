<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class AvisoModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    // ===========================
    // Avisos
    // ===========================

    /**
     * Obtener todos los avisos
     */
    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Aviso ORDER BY id_aviso ASC")
            ->fetchAll();
    }

    /**
     * Buscar aviso por ID
     */
    public function find(int $id): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Aviso WHERE id_aviso = :id")
            ->bind(":id", $id)
            ->fetch();

        return $result ?: null;
    }

    /**
     * Crear aviso
     */
    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Aviso (
                asunto,
                mensaje,
                fecha,
                remitente
            ) VALUES (
                :asunto,
                :mensaje,
                :fecha,
                :remitente
            )
        ")
        ->bind(":asunto",    $data['asunto'])
        ->bind(":mensaje",   $data['mensaje'])
        ->bind(":fecha",     $data['fecha'])
        ->bind(":remitente", $data['remitente'] ?? null)
        ->execute();

        return (int) $this->db->lastId();
    }

    /**
     * Eliminar aviso
     */
    public function delete(int $id): int
    {
        $this->db
            ->query("DELETE FROM Aviso WHERE id_aviso = :id")
            ->bind(":id", $id)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    // ===========================
    // Destinatarios
    // ===========================

    public function getDestinatarios(int $id_aviso): array
    {
        return $this->db
            ->query("SELECT id_bombero FROM Persona_Recibe_Aviso WHERE id_aviso = :id_aviso")
            ->bind(":id_aviso", $id_aviso)
            ->fetchAll();
    }

    public function addDestinatario(int $id_aviso, string $id_bombero): void
    {
        $this->db->query("
            INSERT INTO Persona_Recibe_Aviso (id_aviso, id_bombero)
            VALUES (:id_aviso, :id_bombero)
        ")
        ->bind(":id_aviso", $id_aviso)
        ->bind(":id_bombero", $id_bombero)
        ->execute();
    }

    public function removeDestinatario(int $id_aviso, string $id_bombero): int
    {
        $this->db->query("
            DELETE FROM Persona_Recibe_Aviso
            WHERE id_aviso = :id_aviso AND id_bombero = :id_bombero
        ")
        ->bind(":id_aviso", $id_aviso)
        ->bind(":id_bombero", $id_bombero)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    // ===========================
    // Remitente
    // ===========================

    public function getRemitente(int $id_aviso): ?array
    {
        return $this->db
            ->query("SELECT remitente FROM Aviso WHERE id_aviso = :id_aviso")
            ->bind(":id_aviso", $id_aviso)
            ->fetch() ?: null;
    }

    public function setRemitente(int $id_aviso, string $id_bombero): void
    {
        $this->db->query("
            UPDATE Aviso
            SET remitente = :id_bombero
            WHERE id_aviso = :id_aviso
        ")
        ->bind(":id_aviso", $id_aviso)
        ->bind(":id_bombero", $id_bombero)
        ->execute();
    }

    public function removeRemitente(int $id_aviso): void
    {
        $this->db->query("
            UPDATE Aviso
            SET remitente = NULL
            WHERE id_aviso = :id_aviso
        ")
        ->bind(":id_aviso", $id_aviso)
        ->execute();
    }
}
?>