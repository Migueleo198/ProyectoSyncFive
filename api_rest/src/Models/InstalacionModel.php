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

    /**
     * Obtener todas las Instalaciones
     */
    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Instalacion ORDER BY id_instalacion ASC")
            ->fetchAll();
    }

    /**
     * Buscar Instalacion por id_instalacion
     */
    public function find(int $id_instalacion): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Instalacion WHERE id_instalacion = :id_instalacion")
            ->bind(':id_instalacion', $id_instalacion)
            ->fetch();

        return $result ?: null;
    }

    /**
     * Crear una Instalacion
     */
    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Instalacion (
                id_instalacion, 
                nombre, 
                direccion, 
                localidad, 
                provincia, 
                telefono, 
                correo
            ) VALUES (
                :id_instalacion, 
                :nombre, 
                :direccion, 
                :localidad, 
                :provincia, 
                :telefono, 
                :correo
            )
        ")
        ->bind(':id_instalacion', $data['id_instalacion'])
        ->bind(':nombre', $data['nombre'])
        ->bind(':direccion', $data['direccion'])
        ->bind(':localidad', $data['localidad'])
        ->bind(':provincia', $data['provincia'])
        ->bind(':telefono', $data['telefono'])
        ->bind(':correo', $data['correo'])
        ->execute();

        return (int) $this->db->lastId();
    }

    /**
     * Actualizar datos de Instalacion (PATCH)
     */
    public function update(int $id_instalacion, array $data): int
    {
        $this->db->query("
            UPDATE Instalacion SET
                nombre = :nombre, 
                direccion = :direccion, 
                localidad = :localidad, 
                provincia = :provincia, 
                telefono = :telefono, 
                correo = :correo
            WHERE id_instalacion = :id_instalacion
        ")
        ->bind(':id_instalacion', $data['id_instalacion'])
        ->bind(':nombre', $data['nombre'])
        ->bind(':direccion', $data['direccion'])
        ->bind(':localidad', $data['localidad'])
        ->bind(':provincia', $data['provincia'])
        ->bind(':telefono', $data['telefono'])
        ->bind(':correo', $data['correo'])
        ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    /**
     * Eliminar Instalacion
     */
    public function delete(int $id_instalacion): int
    {
        $this->db
            ->query("DELETE FROM Instalacion WHERE id_instalacion = :id_instalacion")
            ->bind(':id_instalacion', $id_instalacion)
            ->execute();
        
        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }
}
