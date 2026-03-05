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

    // GET /vehiculos
    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Vehiculo ORDER BY matricula ASC")
            ->fetchAll();
    }

    // GET /vehiculos/{matricula}
    public function find(string $matricula): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Vehiculo WHERE matricula = :matricula")
            ->bind(":matricula", $matricula)
            ->fetch();

        return $result ?: null;
    }

    // POST /vehiculos
    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Vehiculo (matricula, nombre, marca, modelo, tipo, disponibilidad)
            VALUES (:matricula, :nombre, :marca, :modelo, :tipo, :disponibilidad)
        ")
        ->bind(":matricula",      $data['matricula'])
        ->bind(":nombre",         $data['nombre'])
        ->bind(":marca",          $data['marca'])
        ->bind(":modelo",         $data['modelo'])
        ->bind(":tipo",           $data['tipo'])
        ->bind(":disponibilidad", $data['disponibilidad'])
        ->execute();

        return $this->find($data['matricula']) ? 1 : false;
    }

    // PUT /vehiculos/{matricula}
    public function update(string $matricula, array $data): int
    {
        if (!$this->find($matricula)) return 0;

        $this->db->query("
            UPDATE Vehiculo SET
                nombre        = :nombre,
                marca         = :marca,
                modelo        = :modelo,
                tipo          = :tipo,
                disponibilidad = :disponibilidad
            WHERE matricula = :matricula
        ")
        ->bind(":matricula",      $matricula)
        ->bind(":nombre",         $data['nombre'])
        ->bind(":marca",          $data['marca'])
        ->bind(":modelo",         $data['modelo'])
        ->bind(":tipo",           $data['tipo'])
        ->bind(":disponibilidad", $data['disponibilidad'])
        ->execute();

        return $this->find($matricula) ? 1 : 0;
    }

    // DELETE /vehiculos/{matricula}
    public function delete(string $matricula): int
    {
        if (!$this->find($matricula)) return 0;

        $this->db->query("DELETE FROM Vehiculo WHERE matricula = :matricula")
            ->bind(":matricula", $matricula)
            ->execute();

        return $this->find($matricula) ? 0 : 1;
    }

    // ========== MATERIAL EN VEHÍCULO (nuevo esquema) ==========

    // GET /vehiculos/{matricula}/materiales — devuelve unidades y serie unificados
    public function getMateriales(string $matricula): array
    {
        $porUnidades = $this->db
            ->query("
                SELECT m.*, vcu.unidades, NULL AS nserie, 'unidades' AS modo
                FROM Material m
                INNER JOIN Vehiculo_Carga_Unidades vcu ON m.id_material = vcu.id_material
                WHERE vcu.matricula = :matricula
                ORDER BY m.id_material ASC
            ")
            ->bind(":matricula", $matricula)
            ->fetchAll();

        $porSerie = $this->db
            ->query("
                SELECT m.*, NULL AS unidades, vcs.nserie, 'serie' AS modo
                FROM Material m
                INNER JOIN Vehiculo_Carga_Serie vcs ON m.id_material = vcs.id_material
                WHERE vcs.matricula = :matricula
                ORDER BY m.id_material ASC
            ")
            ->bind(":matricula", $matricula)
            ->fetchAll();

        return array_merge($porUnidades, $porSerie);
    }

    // Comprobar si ya existe asignación por unidades
    public function getMaterialUnidades(string $matricula, int $id_material): ?array
    {
        $result = $this->db
            ->query("SELECT 1 FROM Vehiculo_Carga_Unidades WHERE matricula = :matricula AND id_material = :id_material")
            ->bind(":matricula", $matricula)
            ->bind(":id_material", $id_material)
            ->fetch();

        return $result ?: null;
    }

    // POST material por unidades
    public function addMaterialUnidades(string $matricula, int $id_material, int $unidades): int
    {
        $this->db->query("
            INSERT INTO Vehiculo_Carga_Unidades (matricula, id_material, unidades)
            VALUES (:matricula, :id_material, :unidades)
        ")
        ->bind(":matricula",   $matricula)
        ->bind(":id_material", $id_material)
        ->bind(":unidades",    $unidades)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    // POST material por número de serie
    public function addMaterialSerie(string $matricula, int $id_material, string $nserie): int
    {
        $this->db->query("
            INSERT INTO Vehiculo_Carga_Serie (matricula, id_material, nserie)
            VALUES (:matricula, :id_material, :nserie)
        ")
        ->bind(":matricula",   $matricula)
        ->bind(":id_material", $id_material)
        ->bind(":nserie",      $nserie)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    // DELETE material — busca en ambas tablas
    public function deleteMaterial(string $matricula, int $id_material): int
    {
        // Intentar borrar en unidades
        $this->db->query("
            DELETE FROM Vehiculo_Carga_Unidades
            WHERE matricula = :matricula AND id_material = :id_material
        ")
        ->bind(":matricula",   $matricula)
        ->bind(":id_material", $id_material)
        ->execute();

        $affected = $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
        if ($affected > 0) return $affected;

        // Intentar borrar en serie
        $this->db->query("
            DELETE FROM Vehiculo_Carga_Serie
            WHERE matricula = :matricula AND id_material = :id_material
        ")
        ->bind(":matricula",   $matricula)
        ->bind(":id_material", $id_material)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    // ========== INSTALACIÓN ==========

    public function getInstalacion(string $matricula): ?array
    {
        $result = $this->db
            ->query("
                SELECT i.*
                FROM Instalacion i
                INNER JOIN Vehiculo v ON i.id_instalacion = v.id_instalacion
                WHERE v.matricula = :matricula
            ")
            ->bind(":matricula", $matricula)
            ->fetch();

        return $result ?: null;
    }

    public function setInstalacion(string $matricula, int $id_instalacion): int
    {
        if (!$this->find($matricula)) return 0;

        $this->db->query("
            UPDATE Vehiculo SET id_instalacion = :id_instalacion
            WHERE matricula = :matricula
        ")
        ->bind(":matricula",      $matricula)
        ->bind(":id_instalacion", $id_instalacion)
        ->execute();

        $actualizado = $this->find($matricula);
        return ($actualizado && $actualizado['id_instalacion'] == $id_instalacion) ? 1 : 0;
    }

    public function deleteInstalacion(string $matricula): int
    {
        if (!$this->find($matricula)) return 0;

        $this->db->query("
            UPDATE Vehiculo SET id_instalacion = NULL
            WHERE matricula = :matricula
        ")
        ->bind(":matricula", $matricula)
        ->execute();

        $actualizado = $this->find($matricula);
        return ($actualizado && $actualizado['id_instalacion'] === null) ? 1 : 0;
    }
}
?>