<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class EdicionModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }
    public function all(): array
    {
        return $this->db
            ->query("
                SELECT 
                    e.*, 
                    f.nombre AS nombre_formacion
                FROM Edicion e
                INNER JOIN Formacion f 
                    ON e.id_formacion = f.id_formacion
                ORDER BY e.id_edicion ASC
            ")
            ->fetchAll();
    }
    public function find(int $id_formacion,int $id_edicion): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Edicion WHERE id_edicion = :id_edicion AND id_formacion= :id_formacion")
            ->bind(":id_edicion", $id_edicion)
            ->bind(":id_formacion", $id_formacion)
            ->fetchAll();

        return $result ?: null;
    }

    public function create(array $data, int $id_formacion): bool
    {
        $stmt = $this->db->query("
            INSERT INTO Edicion (id_formacion, f_inicio, f_fin, horas)
            VALUES (:id_formacion, :f_inicio, :f_fin, :horas)
        ");

        $stmt->bind(":id_formacion", $id_formacion);
        $stmt->bind(":f_inicio", $data['f_inicio']);
        $stmt->bind(":f_fin", $data['f_fin']);
        $stmt->bind(":horas", $data['horas']);

        return $stmt->execute();
    }

    public function update(int $id_formacion, int $id_edicion, array $data): int
    {
        $this->db->query("
            UPDATE Edicion SET
                f_inicio = :f_inicio,
                f_fin = :f_fin,
                horas = :horas
            WHERE id_edicion = :id_edicion AND id_formacion = :id_formacion
        ")
        ->bind(":id_edicion", $id_edicion)
        ->bind(":id_formacion", $id_formacion)
        ->bind(":f_inicio", $data['f_inicio'])
        ->bind(":f_fin", $data['f_fin'])
        ->bind(":horas", $data['horas'])
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function delete(int $id_formacion, int $id_edicion): int
    {
        $this->db->query("DELETE FROM Edicion WHERE id_edicion = :id_edicion AND id_formacion = :id_formacion")
                 ->bind(":id_edicion", $id_edicion)
                 ->bind(":id_formacion", $id_formacion)
                 ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function getPersonasEdicion(int $id_formacion, int $id_edicion): array
    {
        return $this->db
            ->query("
                SELECT p.* FROM Persona_Edicion pe
                JOIN Persona p ON pe.id_bombero = p.id_bombero
                JOIN Edicion i ON pe.id_edicion = i.id_edicion
                WHERE i.id_edicion = :id_edicion AND i.id_formacion = :id_formacion
            ")
            ->bind(":id_edicion", $id_edicion)
            ->bind(":id_formacion", $id_formacion)
            ->fetchAll();
    }

    public function addPersonal(int $id_formacion, int $id_edicion, array $data): int|false
    {
        $this->db->query("
            INSERT INTO Persona_Edicion
            (id_bombero, id_edicion, id_formacion)
            VALUES
            (:id_bombero, :id_edicion, :id_formacion)
        ")
        ->bind(":id_bombero", $data['id_bombero'])
        ->bind(":id_edicion", $id_edicion)
        ->bind(":id_formacion", $id_formacion)
        ->execute();

        return 1;
    }

    public function deletePersonal(int $id_formacion, int $id_edicion, string $id_bombero): int
    {
        $this->db->query("
            DELETE FROM Persona_Edicion
            WHERE id_formacion = :id_formacion
              AND id_edicion = :id_edicion
              AND id_bombero = :id_bombero
        ")
        ->bind(":id_formacion", $id_formacion)
        ->bind(":id_edicion", $id_edicion)
        ->bind(":id_bombero", $id_bombero)
        ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }
}
