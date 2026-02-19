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
            ->query("SELECT * FROM Instalacion ORDER BY id_instalacion ASC")
            ->fetchAll();
    }

    public function find(int $id): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Instalacion WHERE id_instalacion = :id")
            ->bind(":id", $id)
            ->fetch();

        return $result ?: null;
    }

    public function findByLogin(string $login): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Instalacion WHERE login = :login")
            ->bind(":login", $login)
            ->fetch();

        return $result ?: null;
    }

    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Instalacion ( nombre, direccion, localidad, telefono, correo)
            VALUES (:nombre, :direccion, :localidad, :telefono, :correo)
        ")
        ->bind(":nombre",   $data['nombre'])
        ->bind(":direccion",   $data['direccion'])
        ->bind(":localidad",   $data['localidad'])
        ->bind(":telefono",   $data['telefono'])
        ->bind(":correo",   $data['correo'])
        ->execute();

        return (int) $this->db->lastId();
    }

    public function update(int $id, array $data): int
    {
        $this->db->query("
            UPDATE Instalacion SET 
                nombre = :nombre,
                direccion = :direccion,
                localidad = :localidad,
                telefono = :telefono,
                correo = :correo
            WHERE id_instalacion = :id
        ")
        ->bind(":id", $id)
        ->bind(":nombre",   $data['nombre'] ?? null)
        ->bind(":direccion",   $data['direccion'] ?? null)
        ->bind(":localidad",   $data['localidad'] ?? null)
        ->bind(":telefono",   $data['telefono'] ?? null)
        ->bind(":correo",   $data['correo'] ?? null)
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function updateEmail(int $id, array $data): int
    {
        $this->db->query("
            UPDATE Instalacion SET
                email = :email
            WHERE id_instalacion = :id
        ")
        ->bind(":id", $id)
        ->bind(":email",    $data['email'])
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
}
