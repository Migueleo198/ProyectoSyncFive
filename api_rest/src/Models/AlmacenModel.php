<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class AlmacenModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Almacen ORDER BY id_almacen ASC")
            ->fetchAll();
    }

    public function find(int $id): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Almacen WHERE id_almacen = :id")
            ->bind(":id", $id)
            ->fetch();

        return $result ?: null;
    }

    public function findByInstalacion(int $id_instalacion): array
    {
        return $this->db
            ->query("
                SELECT a.* 
                FROM Almacen a
                INNER JOIN Almacen_Instalacion ai ON a.id_almacen = ai.id_almacen
                WHERE ai.id_instalacion = :id_instalacion
                ORDER BY a.id_almacen ASC
            ")
            ->bind(":id_instalacion", $id_instalacion)
            ->fetchAll();
    }

    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Almacen (planta, nombre)
            VALUES (:planta, :nombre)
        ")
        ->bind(":planta", $data['planta'])
        ->bind(":nombre", $data['nombre'])
        ->execute();

        return (int) $this->db->lastId();
    }

    public function asociarConInstalacion(int $id_almacen, int $id_instalacion): bool
    {
        $this->db->query("
            INSERT INTO Almacen_Instalacion (id_almacen, id_instalacion)
            VALUES (:id_almacen, :id_instalacion)
        ")
        ->bind(":id_almacen", $id_almacen)
        ->bind(":id_instalacion", $id_instalacion)
        ->execute();

        return $this->db->rowCount() > 0;
    }

    public function update(int $id, array $data): int
    {
        $this->db->query("
            UPDATE Almacen SET
                planta = :planta,
                nombre = :nombre
            WHERE id_almacen = :id
        ")
        ->bind(":id", $id)
        ->bind(":planta", $data['planta'])
        ->bind(":nombre", $data['nombre'])
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function delete(int $id): int
    {
        // Primero eliminar las asociaciones con instalaciones
        $this->db->query("DELETE FROM Almacen_Instalacion WHERE id_almacen = :id")
                 ->bind(":id", $id)
                 ->execute();

        // Luego eliminar el almacén
        $this->db->query("DELETE FROM Almacen WHERE id_almacen = :id")
                 ->bind(":id", $id)
                 ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function desasociarDeInstalacion(int $id_almacen, int $id_instalacion): int
    {
        $this->db->query("
            DELETE FROM Almacen_Instalacion 
            WHERE id_almacen = :id_almacen 
            AND id_instalacion = :id_instalacion
        ")
        ->bind(":id_almacen", $id_almacen)
        ->bind(":id_instalacion", $id_instalacion)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function existeAsociacion(int $id_almacen, int $id_instalacion): bool
    {
        $result = $this->db
            ->query("
                SELECT 1 
                FROM Almacen_Instalacion 
                WHERE id_almacen = :id_almacen 
                AND id_instalacion = :id_instalacion
            ")
            ->bind(":id_almacen", $id_almacen)
            ->bind(":id_instalacion", $id_instalacion)
            ->fetch();

        return $result !== null;
    }
}