<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class MeritoModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    /**
     * Obtener todos los meritos
     */
    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Merito ORDER BY id_merito ASC")
            ->fetchAll();
    }

    /**
     * Crear un merito
     */
    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Merito (
                nombre,
                descripcion
            ) VALUES (
                :nombre,
                :descripcion
            )
        ")
        ->bind(':nombre', $data['nombre'])
        ->bind(':descripcion', $data['descripcion'])
        ->execute();

        return (int) $this->db->lastId();
    }


    /**
     * Eliminar carnet
     */
    public function delete(int $id_carnet): int
    {
        $this->db
            ->query("DELETE FROM Merito WHERE id_merito = :id_merito")
            ->bind(':id_merito', $id_carnet)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }
}
?>