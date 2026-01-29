<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class ProfesorModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Salida ORDER BY id_salida ASC")
            ->fetchAll();
    }

    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Salida (matricula, f_recogida, f_entrega, km_inicio, km_fin)
            VALUES (:matricula, :f_recogida, :f_entrega, :km_inicio, :km_fin)
        ")
        ->bind(":matricula", $data['matricula'])
        ->bind(":f_recogida", $data['f_recogida'])
        ->bind(":f_entrega", $data['f_entrega'])
        ->bind(":km_inicio", $data['km_inicio'])
        ->bind(":km_fin", $data['km_fin'])
        ->execute();

        return (int) $this->db->lastId();
    }
    
    public function find(int $id): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Salida WHERE id_salida = :id")
            ->bind(":id", $id)
            ->fetch();

        return $result ?: null;
    }

    public function update(int $id, array $data): int
    {
        $this->db->query("
            UPDATE Salida SET
                matricula = :matricula,
                f_recogida = :f_recogida,
                f_entrega = :f_entrega,
                km_inicio = :km_inicio,
                km_fin = :km_fin,
                updated_at = NOW()
            WHERE id_salida = :id
        ")
        ->bind(":id", $id)
        ->bind(":matricula", $data['matricula'])
        ->bind(":f_recogida", $data['f_recogida'])
        ->bind(":f_entrega", $data['f_entrega'])
        ->bind(":km_inicio", $data['km_inicio'])
        ->bind(":km_fin", $data['km_fin'])
        ->execute();

        return (int) $this->db->lastId();
    }

    public function delete(int $id): int
    {
        $this->db->query("DELETE FROM Salida WHERE id_salida = :id")
                 ->bind(":id", $id)
                 ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }


//=================== Persona en salida ====================
    public function allPersonas(): array
    {
        return $this->db
            ->query("SELECT * FROM Salida_Persona ORDER BY n_funcionario ASC")
            ->fetchAll();
    }

    public function addPersona(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Salida_Persona (id_salida, n_funcionario)
            VALUES (:id_salida, :n_funcionario)
        ")
        ->bind(":id_salida", $data['id_salida'])
        ->bind(":n_funcionario", $data['n_funcionario'])
        ->execute();

        return (int) $this->db->lastId();
    }   

    public function deletePersona(int $id_salida, int $n_funcionario): int
    {
        $this->db->query("
            DELETE FROM Salida_Persona
            WHERE id_salida = :id_salida AND n_funcionario = :n_funcionario
        ")
        ->bind(":id_salida", $id_salida)
        ->bind(":n_funcionario", $n_funcionario)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }
}
