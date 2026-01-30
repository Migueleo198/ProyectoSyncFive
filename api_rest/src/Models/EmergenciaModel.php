<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class EmergenciaModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    //================= EMERGENCIA =====================

    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Emergencia ORDER BY id_emergencia DESC")
            ->fetchAll();
    }

    public function find(int $id): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Emergencia WHERE id_emergencia = :id")
            ->bind(":id", $id)
            ->fetch();

        return $result ?: null;
    }

    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Emergencia
            (id_bombero, fecha, descripcion, estado, direccion, nombre_solicitante, tlf_solicitante, codigo_tipo)
            VALUES
            (:id_bombero, NOW(), :descripcion, :estado, :direccion, :nombre_solicitante, :tlf_solicitante, :codigo_tipo)
        ")
        ->bind(":id_bombero", $data['id_bombero'] ?? null)
        ->bind(":descripcion", $data['descripcion'])
        ->bind(":estado", $data['estado'])
        ->bind(":direccion", $data['direccion'])
        ->bind(":nombre_solicitante", $data['nombre_solicitante'] ?? null)
        ->bind(":tlf_solicitante", $data['tlfn_solicitante'] ?? null)
        ->bind(":codigo_tipo", $data['codigo_tipo'] ?? null)
        ->execute();

        return (int) $this->db->lastId();
    }

    public function update(int $id, array $data): int
    {
        $this->db->query("
            UPDATE Emergencia SET
                id_bombero = :id_bombero,
                descripcion = :descripcion,
                estado = :estado,
                direccion = :direccion,
                nombre_solicitante = :nombre_solicitante,
                tlf_solicitante = :tlf_solicitante,
                codigo_tipo = :codigo_tipo
            WHERE id_emergencia = :id
        ")
        ->bind(":id", $id)
        ->bind(":id_bombero", $data['id_bombero'] ?? null)
        ->bind(":descripcion", $data['descripcion'])
        ->bind(":estado", $data['estado'])
        ->bind(":direccion", $data['direccion'])
        ->bind(":nombre_solicitante", $data['nombre_solicitante'] ?? null)
        ->bind(":tlf_solicitante", $data['tlfn_solicitante'] ?? null)
        ->bind(":codigo_tipo", $data['codigo_tipo'] ?? null)
        ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

  
    //================= EMERGENCIA_VEHICULO =====================

    public function allVehiculos(): array
    {
        return $this->db
            ->query("SELECT * FROM Emergencia_Vehiculo")
            ->fetchAll();
    }

    public function addVehiculo(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Emergencia_Vehiculo
            (matricula, id_emergencia, f_salida, f_llegada, f_regreso)
            VALUES
            (:matricula, :id_emergencia, :f_salida, :f_llegada, :f_regreso)
        ")
        ->bind(":matricula", $data['matricula'])
        ->bind(":id_emergencia", $data['id_emergencia'])
        ->bind(":f_salida", $data['f_salida'])
        ->bind(":f_llegada", $data['f_llegada'] ?? null)
        ->bind(":f_regreso", $data['f_regreso'] ?? null)
        ->execute();

        return 1; // PK compuesta, no hay lastId real
    }

    public function deleteVehiculo(int $id): int
    {
        // id = id_emergencia
        $this->db->query("
            DELETE FROM Emergencia_Vehiculo WHERE id_emergencia = :id
        ")
        ->bind(":id", $id)
        ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    //================= EMERGENCIA_VEHICULO_PERSONA =====================

    public function getPersonal(string $matricula): array
    {
        return $this->db
            ->query("
                SELECT * 
                FROM Emergencia_Vehiculo_Persona
                WHERE matricula = :matricula
            ")
            ->bind(":matricula", $matricula)
            ->fetchAll();
    }

    public function addPersonal(string $matricula, array $data): int|false
    {
        $this->db->query("
            INSERT INTO Emergencia_Vehiculo_Persona
            (id_bombero, matricula, id_emergencia, cargo)
            VALUES
            (:id_bombero, :matricula, :id_emergencia, :cargo)
        ")
        ->bind(":id_bombero", $data['id_bombero'])
        ->bind(":matricula", $matricula)
        ->bind(":id_emergencia", $data['id_emergencia'])
        ->bind(":cargo", $data['cargo'] ?? null)
        ->execute();

        return 1;
    }

    public function deletePersonal(string $matricula, int $id_bombero): int
    {
        $this->db->query("
            DELETE FROM Emergencia_Vehiculo_Persona
            WHERE matricula = :matricula
              AND id_bombero = :id_bombero
        ")
        ->bind(":matricula", $matricula)
        ->bind(":id_bombero", $id_bombero)
        ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }
}