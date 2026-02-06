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
    
    // GET, /vehiculos
    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Vehiculo ORDER BY matricula ASC")
            ->fetchAll();
    }
    
    // POST, /vehiculos
    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Vehiculo (matricula, nombre, marca, modelo, tipo, disponibilidad)
            VALUES (:matricula, :nombre, :marca, :modelo, :tipo, :disponibilidad)
        ")
        ->bind(":matricula", $data['matricula'])
        ->bind(":nombre",  $data['nombre'] ?? $data['matricula'])
        ->bind(":marca", $data['marca'])
        ->bind(":modelo", $data['modelo'])
        ->bind(":tipo", $data['tipo'] ?? 'Desconocido')
        ->bind(":disponibilidad", $data['disponibilidad'] ?? 1)
        ->execute();

        $insertado = $this->find($data['matricula']);
        return $insertado ? 1 : false;
    }
    
    // GET, /vehiculos/{matricula}
    public function find(string $matricula): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Vehiculo WHERE matricula = :matricula")
            ->bind(":matricula", $matricula)
            ->fetch();

        return $result ?: null;
    }
    
    // PUT, /vehiculos/{matricula}
    public function update(string $matricula, array $data): int
    {
        $existente = $this->find($matricula);
        if (!$existente) {
            return 0;
        }
        
        $this->db->query("
            UPDATE Vehiculo SET
                nombre = :nombre,
                marca = :marca,
                modelo = :modelo,
                tipo = :tipo,
                disponibilidad = :disponibilidad
            WHERE matricula = :matricula
        ")
        ->bind(":matricula", $matricula)
        ->bind(":nombre", $data['nombre'] ?? $data['matricula'])
        ->bind(":marca", $data['marca'])
        ->bind(":modelo", $data['modelo'])
        ->bind(":tipo", $data['tipo'] ?? 'Desconocido')
        ->bind(":disponibilidad", $data['disponibilidad'] ?? 1)
        ->execute();
        
        $actualizado = $this->find($matricula);
        return $actualizado ? 1 : 0;
    }
    
    // DELETE, /vehiculos/{matricula}
    public function delete(string $matricula): int
    {
        $existente = $this->find($matricula);
        if (!$existente) {
            return 0;
        }
        
        $this->db->query("DELETE FROM Vehiculo WHERE matricula = :matricula")
            ->bind(":matricula", $matricula)
            ->execute();
            
        $eliminado = $this->find($matricula);
        return $eliminado ? 0 : 1;
    }

    // MATERIAL CARGADO EN VEHÍCULOS
    // GET, /vehiculos/{matricula}/materiales
    public function getMateriales(string $matricula): array
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
    
    // INSTALACIÓN DE VEHÍCULOS
    // GET, /vehiculos/{matricula}/instalacion
    public function getInstalacion(string $matricula): ?array
    {
        $result = $this->db
            ->query("
                SELECT i.*
                FROM Instalacion i
                JOIN Vehiculo v ON i.id_instalacion = v.id_instalacion
                WHERE v.matricula = :matricula
            ")
            ->bind(":matricula", $matricula)
            ->fetch();

        return $result ?: null;
    }
    
    // POST, /vehiculos/{matricula}/instalacion
    public function setInstalacion(string $matricula, int $id_instalacion): int|false
    {
        $existente = $this->find($matricula);
        if (!$existente) {
            return 0;
        }
        
        $this->db->query("
            UPDATE Vehiculo SET
                id_instalacion = :id_instalacion
            WHERE matricula = :matricula
        ")
        ->bind(":matricula", $matricula)
        ->bind(":id_instalacion", $id_instalacion)
        ->execute();
        
        $actualizado = $this->find($matricula);
        if (!$actualizado) {
            return 0;
        }
        
        return ($actualizado['id_instalacion'] == $id_instalacion) ? 1 : 0;
    }
    
    // DELETE, /vehiculos/{matricula}/instalacion
    public function deleteInstalacion(string $matricula): int
    {
        $existente = $this->find($matricula);
        if (!$existente) {
            return 0;
        }
        
        $this->db->query("
            UPDATE Vehiculo SET
                id_instalacion = NULL
            WHERE matricula = :matricula
        ")
        ->bind(":matricula", $matricula)
        ->execute();
        
        $actualizado = $this->find($matricula);
        if (!$actualizado) {
            return 0;
        }
        
        return ($actualizado['id_instalacion'] === null) ? 1 : 0;
    }
}