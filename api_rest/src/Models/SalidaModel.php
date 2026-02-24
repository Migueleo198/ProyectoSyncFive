<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class SalidaModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Salida ORDER BY id_registro ASC")
            ->fetchAll();
    }

    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Salida (matricula, id_bombero, f_salida, f_regreso, km_inicio, km_fin)
            VALUES (:matricula, :id_bombero, :f_salida, :f_regreso, :km_inicio, :km_fin)
        ")
        ->bind(":matricula", $data['matricula'])
        ->bind(":id_bombero", $data['id_bombero'])
        ->bind(":f_salida", $data['f_salida'])
        ->bind(":f_regreso", $data['f_regreso'])
        ->bind(":km_inicio", $data['km_inicio'])
        ->bind(":km_fin", $data['km_fin'])
        ->execute();

        return (int) $this->db->lastId();
    }
    
    public function find(int $id): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Salida WHERE id_registro = :id")
            ->bind(":id", $id)
            ->fetch();

        return $result ?: null;
    }

    public function update(int $id, array $data): int
    {
        $this->db->query("
            UPDATE Salida SET
                id_bombero = :id_bombero,
                matricula = :matricula,
                f_salida = :f_salida,
                f_regreso = :f_regreso,
                km_inicio = :km_inicio,
                km_fin = :km_fin
            WHERE id_registro = :id
        ")
        ->bind(":id", $id)
        ->bind(":id_bombero", $data['id_bombero'])
        ->bind(":matricula", $data['matricula'])
        ->bind(":f_salida", $data['f_salida'])
        ->bind(":f_regreso", $data['f_regreso'])
        ->bind(":km_inicio", $data['km_inicio'])
        ->bind(":km_fin", $data['km_fin'])
        ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    public function delete(int $id): int
    {
        $this->db->query("DELETE FROM Salida WHERE id_registro = :id")
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
            INSERT INTO Salida_Persona (id_registro, n_funcionario)
            VALUES (:id_registro, :n_funcionario)
        ")
        ->bind(":id_registro", $data['id_registro'])
        ->bind(":n_funcionario", $data['n_funcionario'])
        ->execute();

        return (int) $this->db->lastId();
    }   

    public function deletePersona(int $id_registro, int $n_funcionario): int
    {
        $this->db->query("
            DELETE FROM Salida_Persona
            WHERE id_registro = :id_registro AND n_funcionario = :n_funcionario
        ")
        ->bind(":id_registro", $id_registro)
        ->bind(":n_funcionario", $n_funcionario)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }
}
