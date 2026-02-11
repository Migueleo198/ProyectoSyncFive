<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class MaterialModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Material ORDER BY id_material ASC")
            ->fetchAll();
    }

    public function find(int $id): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Material WHERE id_material = :id")
            ->bind(":id", $id)
            ->fetch();

        return $result ?: null;
    }

    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Material (id_categoria, nombre, descripcion, estado)
            VALUES (:id_categoria, :nombre, :descripcion, :estado)
        ")
        ->bind(":id_categoria", $data['id_categoria'])
        ->bind(":nombre",  $data['nombre'])
        ->bind(":descripcion", $data['descripcion'])
        ->bind(":estado", $data['estado'])
        ->execute();

        return (int) $this->db->lastId();
    }

    public function update(int $id, array $data): int
    {
        $this->db->query("
            UPDATE Material SET
                id_categoria = :id_categoria,
                nombre = :nombre,
                descripcion = :descripcion,
                estado = :estado
            WHERE id_material = :id
        ")
        ->bind(":id", $id)
        ->bind(":id_categoria", $data['id_categoria'])
        ->bind(":nombre",   $data['nombre'])
        ->bind(":descripcion", $data['descripcion'])
        ->bind(":estado", $data['estado'])
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function delete(int $id): int
    {
        $this->db->query("DELETE FROM Material WHERE id_material = :id")
                 ->bind(":id", $id)
                 ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    // MÉTODOS PARA VEHÍCULOS
    public function getByVehiculo(string $matricula): array
    {
        return $this->db
            ->query("
                SELECT m.*, vcm.unidades, vcm.nserie
                FROM Material m
                JOIN Vehiculo_Carga_Material vcm ON m.id_material = vcm.id_material
                WHERE vcm.matricula = :matricula
                ORDER BY m.id_material ASC
            ")
            ->bind(":matricula", $matricula)
            ->fetchAll();
    }

    public function createForVehiculo(string $matricula, int $id_material, array $data): bool
    {
        try {
           
            // Se asocia al vehículo en Vehiculo_Carga_Material con unidades o número de serie
            $this->db->query("
                INSERT INTO Vehiculo_Carga_Material (id_material, matricula, nserie, unidades)
                VALUES (:id_material, :matricula, :nserie, :unidades)
            ")
            ->bind(":id_material", $id_material)
            ->bind(":matricula", $matricula)
            ->bind(":nserie", $data['nserie'])
            ->bind(":unidades", $data['unidades'])
            ->execute();

            return true;

        } catch (\Exception $e) {
            error_log("Error en createForVehiculo: " . $e->getMessage());
            return false;
        }
    }
    public function updateForVehiculo(string $matricula, int $id_material, array $data): int
    {
        try {
            $this->db->query("
                UPDATE Vehiculo_Carga_Material SET
                    nserie = :nserie,
                    unidades = :unidades
                WHERE id_material = :id_material and matricula=:matricula
            ")
            ->bind(":id_material", $id_material)
            ->bind(":matricula", $matricula)
            ->bind(":nserie", $data['nserie'])
            ->bind(":unidades", $data['unidades'])
            ->execute();
            
            $result = $this->db->query("SELECT ROW_COUNT() AS affected")->fetch();
            return (int) $result['affected'];
            
        } catch (Exception $e) {
            error_log("Error en updatease: " . $e->getMessage());
            return 0;
        }
    }

    public function deleteForVehiculo(string $matricula, int $id_material): int
    {
        $this->db->query("
            DELETE FROM Vehiculo_Carga_Material 
            WHERE matricula = :matricula AND id_material = :id_material
        ")
        ->bind(":matricula", $matricula)
        ->bind(":id_material", $id_material)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }
}