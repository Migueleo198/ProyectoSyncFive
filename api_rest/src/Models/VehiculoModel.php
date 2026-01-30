<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class VehiculoModel
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
                SELECT v.*, i.nombre as instalacion_nombre 
                FROM Vehiculo v
                LEFT JOIN Instalacion i ON v.id_instalacion = i.id_instalacion
                ORDER BY v.matricula ASC
            ")
            ->fetchAll();
    }

    public function find(string $matricula): ?array
    {
        $result = $this->db
            ->query("
                SELECT v.*, i.nombre as instalacion_nombre 
                FROM Vehiculo v
                LEFT JOIN Instalacion i ON v.id_instalacion = i.id_instalacion
                WHERE v.matricula = :matricula
            ")
            ->bind(":matricula", $matricula)
            ->fetch();

        return $result ?: null;
    }

    public function create(array $data): bool
    {
        $this->db->query("
            INSERT INTO Vehiculo (matricula, nombre, id_instalacion, marca, modelo, tipo, disponibilidad)
            VALUES (:matricula, :nombre, :id_instalacion, :marca, :modelo, :tipo, :disponibilidad)
        ")
        ->bind(":matricula", $data['matricula'])
        ->bind(":nombre", $data['nombre'])
        ->bind(":id_instalacion", $data['id_instalacion'] ?? null)
        ->bind(":marca", $data['marca'])
        ->bind(":modelo", $data['modelo'])
        ->bind(":tipo", $data['tipo'])
        ->bind(":disponibilidad", $data['disponibilidad'])
        ->execute();

        return $this->db->rowCount() > 0;
    }

    public function update(string $matricula, array $data): int
    {
        $this->db->query("
            UPDATE Vehiculo SET
                nombre = :nombre,
                id_instalacion = :id_instalacion,
                marca = :marca,
                modelo = :modelo,
                tipo = :tipo,
                disponibilidad = :disponibilidad,
                ult_latitud = :ult_latitud,
                ult_longitud = :ult_longitud
            WHERE matricula = :matricula
        ")
        ->bind(":matricula", $matricula)
        ->bind(":nombre", $data['nombre'])
        ->bind(":id_instalacion", $data['id_instalacion'] ?? null)
        ->bind(":marca", $data['marca'])
        ->bind(":modelo", $data['modelo'])
        ->bind(":tipo", $data['tipo'])
        ->bind(":disponibilidad", $data['disponibilidad'])
        ->bind(":ult_latitud", $data['ult_latitud'] ?? null)
        ->bind(":ult_longitud", $data['ult_longitud'] ?? null)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function delete(string $matricula): int
    {
        $this->db->query("DELETE FROM Vehiculo WHERE matricula = :matricula")
                 ->bind(":matricula", $matricula)
                 ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function updateUbicacion(string $matricula, float $latitud, float $longitud): int
    {
        $this->db->query("
            UPDATE Vehiculo SET
                ult_latitud = :latitud,
                ult_longitud = :longitud
            WHERE matricula = :matricula
        ")
        ->bind(":matricula", $matricula)
        ->bind(":latitud", $latitud)
        ->bind(":longitud", $longitud)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    // ========== MATERIAL EN VEHÍCULO ==========

    public function getMaterialEnVehiculo(string $matricula): array
    {
        return $this->db
            ->query("
                SELECT vcm.*, m.nombre as material_nombre, m.descripcion
                FROM Vehiculo_Carga_Material vcm
                INNER JOIN Material m ON vcm.id_material = m.id_material
                WHERE vcm.matricula = :matricula
                ORDER BY vcm.id_material ASC
            ")
            ->bind(":matricula", $matricula)
            ->fetchAll();
    }

    public function findMaterialEnVehiculo(string $matricula, int $id_material): ?array
    {
        $result = $this->db
            ->query("
                SELECT vcm.* 
                FROM Vehiculo_Carga_Material vcm
                WHERE vcm.matricula = :matricula 
                AND vcm.id_material = :id_material
            ")
            ->bind(":matricula", $matricula)
            ->bind(":id_material", $id_material)
            ->fetch();

        return $result ?: null;
    }

    public function addMaterial(array $data): bool
    {
        $this->db->query("
            INSERT INTO Vehiculo_Carga_Material (id_material, matricula, nserie, unidades)
            VALUES (:id_material, :matricula, :nserie, :unidades)
        ")
        ->bind(":id_material", $data['id_material'])
        ->bind(":matricula", $data['matricula'])
        ->bind(":nserie", $data['nserie'] ?? null)
        ->bind(":unidades", $data['unidades'])
        ->execute();

        return $this->db->rowCount() > 0;
    }

    public function updateMaterial(string $matricula, int $id_material, array $data): int
    {
        $this->db->query("
            UPDATE Vehiculo_Carga_Material SET
                nserie = :nserie,
                unidades = :unidades
            WHERE matricula = :matricula 
            AND id_material = :id_material
        ")
        ->bind(":matricula", $matricula)
        ->bind(":id_material", $id_material)
        ->bind(":nserie", $data['nserie'] ?? null)
        ->bind(":unidades", $data['unidades'])
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function deleteMaterial(string $matricula, int $id_material): int
    {
        $this->db->query("
            DELETE FROM Vehiculo_Carga_Material 
            WHERE matricula = :matricula 
            AND id_material = :id_material
        ")
        ->bind(":matricula", $matricula)
        ->bind(":id_material", $id_material)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    // ========== INSTALACIÓN DEL VEHÍCULO ==========

    public function setInstalacion(string $matricula, int $id_instalacion): int
    {
        $this->db->query("
            UPDATE Vehiculo SET
                id_instalacion = :id_instalacion
            WHERE matricula = :matricula
        ")
        ->bind(":matricula", $matricula)
        ->bind(":id_instalacion", $id_instalacion)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function removeInstalacion(string $matricula): int
    {
        $this->db->query("
            UPDATE Vehiculo SET
                id_instalacion = NULL
            WHERE matricula = :matricula
        ")
        ->bind(":matricula", $matricula)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }
}