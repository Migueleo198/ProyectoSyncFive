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
            ->query("SELECT * FROM Edicion ORDER BY id_edicion ASC")
            ->fetchAll();
    }

    public function find(int $id): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Edicion WHERE id_formacion = :id")
            ->bind(":id", $id)
            ->fetch();

        return $result ?: null;
    }

    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Edicion (id_formacion, f_inicio, f_fin, horas)
            VALUES (:id_formacion, :f_inicio, :f_fin, :horas)
        ")
        ->bind(":id_formacion", $data['id_formacion'])
        ->bind(":f_inicio", $data['f_inicio'])
        ->bind(":f_fin", $data['f_fin'])
        ->bind(":horas", $data['horas'])
        ->execute();

        return (int) $this->db->lastId();
    }

    public function update(int $id, array $data): int
    {
        $this->db->query("
            UPDATE Edicion SET
                id_formacion = :id_formacion,
                f_inicio = :f_inicio,
                f_fin = :f_fin,
                horas = :horas
            WHERE id_edicion = :id
        ")
        ->bind(":id", $id)
        ->bind(":id_formacion", $data['id_formacion'])
        ->bind(":f_inicio", $data['f_inicio'])
        ->bind(":f_fin", $data['f_fin'])
        ->bind(":horas", $data['horas'])
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function delete(int $id): int
    {
        $this->db->query("DELETE FROM Edicion WHERE id_edicion = :id")
                 ->bind(":id", $id)
                 ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function getPersonasEdicion(int $id_edicion): array
    {
        return $this->db
            ->query("
                SELECT p.* FROM Persona_Edicion pe
                JOIN Persona p ON pe.id_persona = p.id_persona
                JOIN Edicion i ON pe.id_edicion = i.id_edicion
                WHERE i.id_edicion = :id_edicion
            ")
            ->bind(":id_edicion", $id_edicion)
            ->fetchAll();
    }

}
