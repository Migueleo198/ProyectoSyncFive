<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class InstalacionModel
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
                SELECT i.*, l.provincia 
                FROM Instalacion i
                INNER JOIN Localidad l ON i.localidad = l.localidad
                ORDER BY i.id_instalacion ASC
            ")
            ->fetchAll();
    }

    public function find(int $id): ?array
    {
        $result = $this->db
            ->query("
                SELECT i.*, l.provincia 
                FROM Instalacion i
                INNER JOIN Localidad l ON i.localidad = l.localidad
                WHERE i.id_instalacion = :id
            ")
            ->bind(":id", $id)
            ->fetch();

        return $result ?: null;
    }

    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Instalacion (nombre, direccion, telefono, correo, localidad)
            VALUES (:nombre, :direccion, :telefono, :correo, :localidad)
        ")
        ->bind(":nombre", $data['nombre'])
        ->bind(":direccion", $data['direccion'])
        ->bind(":telefono", $data['telefono'])
        ->bind(":correo", $data['correo'])
        ->bind(":localidad", $data['localidad'])
        ->execute();

        return (int) $this->db->lastId();
    }

    public function update(int $id, array $data): int
    {
        $this->db->query("
            UPDATE Instalacion SET
                nombre = :nombre,
                direccion = :direccion,
                telefono = :telefono,
                correo = :correo,
                localidad = :localidad
            WHERE id_instalacion = :id
        ")
        ->bind(":id", $id)
        ->bind(":nombre", $data['nombre'])
        ->bind(":direccion", $data['direccion'])
        ->bind(":telefono", $data['telefono'])
        ->bind(":correo", $data['correo'])
        ->bind(":localidad", $data['localidad'])
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function delete(int $id): int
    {
        $this->db->query("DELETE FROM Instalacion WHERE id_instalacion = :id")
                 ->bind(":id", $id)
                 ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function existeLocalidad(string $localidad): bool
    {
        $result = $this->db
            ->query("SELECT 1 FROM Localidad WHERE localidad = :localidad")
            ->bind(":localidad", $localidad)
            ->fetch();

        return $result !== null;
    }

    public function getVehiculos(int $id_instalacion): array
    {
        return $this->db
            ->query("
                SELECT v.* 
                FROM Vehiculo v
                WHERE v.id_instalacion = :id_instalacion
                ORDER BY v.matricula ASC
            ")
            ->bind(":id_instalacion", $id_instalacion)
            ->fetchAll();
    }
}