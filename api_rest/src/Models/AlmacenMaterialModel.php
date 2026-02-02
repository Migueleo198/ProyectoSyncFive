<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class AlmacenMaterialModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Almacen_Material ORDER BY id_almacen ASC")
            ->fetchAll();
    }

    public function find(int $id): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Almacen_Material WHERE id_almacen = :id")
            ->bind(":id", $id)
            ->fetch();

        return $result ?: null;
    }

    public function findByLogin(string $login): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Almacen_Material WHERE login = :login")
            ->bind(":login", $login)
            ->fetch();

        return $result ?: null;
    }

    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Almacen_Material ( id_almacen, id_instalacion, id_material, nserie, unidades)
            VALUES (:id_almacen, :id_instalacion, :id_material, :nserie, :unidades)
        ")
        ->bind(":id_almacen", $data['id_almacen'])
        ->bind(":id_instalacion", $data['id_instalacion'])
        ->bind(":id_material", $data['id_material'])
        ->bind(":nserie", $data['nserie'])
        ->bind(":unidades", $data['unidades'])
        ->execute();

        return (int) $this->db->lastId();
    }

    public function update(int $id, array $data): int
    {
        $this->db->query("
            UPDATE Almacen_material
            SET 
                n_serie = :nserie,
                unidades = :unidades
            WHERE 
                id_almacen = :id_almacen
                AND id_instalacion = :id_instalacion
                AND id_material = :id_material;

        ")
        ->bind(":id", $id)
        ->bind(":id_almacen",   $data['id_almacen'] ?? null)
        ->bind(":id_instalacion",   $data['id_instalacion'] ?? null)
        ->bind(":id_material",   $data['id_material'] ?? null)
        ->bind(":nserie",   $data['nserie'] ?? null)
        ->bind(":unidades",   $data['unidades'] ?? null)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }
}
