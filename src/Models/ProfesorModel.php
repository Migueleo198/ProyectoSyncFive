<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class ProfesorModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM man_profesor ORDER BY id_profesor ASC")
            ->fetchAll();
    }

    public function find(int $id): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM man_profesor WHERE id_profesor = :id")
            ->bind(":id", $id)
            ->fetch();

        return $result ?: null;
    }

    public function findByLogin(string $login): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM man_profesor WHERE login = :login")
            ->bind(":login", $login)
            ->fetch();

        return $result ?: null;
    }

    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO man_profesor (login, password, nombre_completo, email, id_rol)
            VALUES (:login, :password, :nombre, :email, :rol)
        ")
        ->bind(":login",  $data['login'])
        ->bind(":password", $data['password'])
        ->bind(":nombre",   $data['nombre_completo'])
        ->bind(":email",    $data['email'])
        ->bind(":rol",      $data['id_rol'])
        ->execute();

        return (int) $this->db->lastId();
    }

    public function update(int $id, array $data): int
    {
        $this->db->query("
            UPDATE man_profesor SET
                login = :login,
                password = :password,
                nombre_completo = :nombre,
                email = :email,
                id_rol = :rol,
                updated_at = NOW()
            WHERE id_profesor = :id
        ")
        ->bind(":id", $id)
        ->bind(":login",  $data['login'])
        ->bind(":password", $data['password'] ?? null)
        ->bind(":nombre",   $data['nombre_completo'] ?? null)
        ->bind(":email",    $data['email'])
        ->bind(":rol",      $data['id_rol'])
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function updateEmail(int $id, array $data): int
    {
        $this->db->query("
            UPDATE man_profesor SET
                email = :email
            WHERE id_profesor = :id
        ")
        ->bind(":id", $id)
        ->bind(":email",    $data['email'])
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function delete(int $id): int
    {
        $this->db->query("DELETE FROM man_profesor WHERE id_profesor = :id")
                 ->bind(":id", $id)
                 ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }
}
