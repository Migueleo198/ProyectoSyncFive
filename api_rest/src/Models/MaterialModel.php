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
            // Primero verifica que el material esté asociado al vehículo
            $exists = $this->db
                ->query("
                    SELECT 1 FROM Vehiculo_Carga_Material 
                    WHERE matricula = :matricula AND id_material = :id_material
                ")
                ->bind(":matricula", $matricula)
                ->bind(":id_material", $id_material)
                ->fetch();

            if (!$exists) {
                return 0;
            }

            // Actualiza el material (SIN cantidad)
            $this->db->query("
                UPDATE Material SET
                    nombre = :nombre,
                    descripcion = :descripcion,
                    id_categoria = :id_categoria,
                    estado = :estado
                WHERE id_material = :id_material
            ")
            ->bind(":id_material", $id_material)
            ->bind(":nombre", $data['nombre'])
            ->bind(":descripcion", $data['descripcion'])
            ->bind(":id_categoria", $data['id_categoria'])
            ->bind(":estado", $data['estado'])
            ->execute();

            // Actualiza las unidades en la tabla de relación (y nserie si se proporciona)
            if (isset($data['unidades']) || isset($data['nserie'])) {
                $query = "UPDATE Vehiculo_Carga_Material SET ";
                $params = [];
                
                if (isset($data['nserie'])) {
                    $query .= "nserie = :nserie";
                    $params[':nserie'] = $data['nserie'];
                }
                
                if (isset($data['unidades'])) {
                    if (isset($data['nserie'])) {
                        $query .= ", ";
                    }
                    $query .= "unidades = :unidades";
                    $params[':unidades'] = $data['unidades'];
                }
                
                $query .= " WHERE matricula = :matricula AND id_material = :id_material";
                $params[':matricula'] = $matricula;
                $params[':id_material'] = $id_material;
                
                $stmt = $this->db->query($query);
                foreach ($params as $key => $value) {
                    $stmt->bind($key, $value);
                }
                $stmt->execute();
            }

            return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];

        } catch (\Exception $e) {
            error_log("Error en updateForVehiculo: " . $e->getMessage());
            return 0;
        }
    }

    public function deleteForVehiculo(string $matricula, int $id_material): int
    {
        try {
            // Primero verificar que existe la relación
            $existe = $this->db
                ->query("
                    SELECT COUNT(*) as count 
                    FROM Vehiculo_Carga_Material 
                    WHERE matricula = :matricula AND id_material = :id_material
                ")
                ->bind(":matricula", $matricula)
                ->bind(":id_material", $id_material)
                ->fetch();
            
            if (!$existe || $existe['count'] == 0) {
                error_log("DEBUG: No se encontró relación para matrícula: $matricula, id_material: $id_material");
                return 0;
            }
            
            error_log("DEBUG: Encontradas {$existe['count']} relaciones para eliminar");
            
            // Eliminar TODOS los registros (maneja NULL en nserie correctamente)
            $this->db->query("
                DELETE FROM Vehiculo_Carga_Material 
                WHERE matricula = :matricula AND id_material = :id_material
            ")
            ->bind(":matricula", $matricula)
            ->bind(":id_material", $id_material)
            ->execute();
            
            $rowsAffected = $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
            error_log("DEBUG: Filas eliminadas de Vehiculo_Carga_Material: $rowsAffected");
            
            if ($rowsAffected > 0) {
                // Verificar si el material aún está en uso
                $enUso = $this->db
                    ->query("
                        SELECT COUNT(*) as count 
                        FROM Vehiculo_Carga_Material 
                        WHERE id_material = :id_material
                    ")
                    ->bind(":id_material", $id_material)
                    ->fetch();
                
                // Solo eliminar el material si no está en uso
                if ($enUso['count'] == 0) {
                    $this->db->query("
                        DELETE FROM Material 
                        WHERE id_material = :id_material
                    ")
                    ->bind(":id_material", $id_material)
                    ->execute();
                    
                    $materialDeleted = $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
                    error_log("DEBUG: Material eliminado de tabla Material: $materialDeleted");
                } else {
                    error_log("DEBUG: Material $id_material sigue en uso por otros vehículos");
                }
            }
            
            return $rowsAffected;

        } catch (\Exception $e) {
            error_log("ERROR en deleteForVehiculo: " . $e->getMessage());
            error_log("TRACE: " . $e->getTraceAsString());
            return 0;
        }
    }
}