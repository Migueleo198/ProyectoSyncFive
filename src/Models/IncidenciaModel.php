<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class IncidenciaModel{

    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM man_incidencias ORDER BY id_incidencia ASC")
            ->fetchAll();
    }

    public function find(int $id): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM man_incidencias WHERE id_incidencia = :id")
            ->bind(":id", $id)
            ->fetch();

        return $result ?: null;
    }
             
     public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO man_incidencias (titulo, descripcion, fecha_fin, id_ubicacion, id_estado, id_prioridad, id_profesor)
            VALUES (:titulo, :descripcion, :fecha_fin, :id_ubicacion, :id_estado, :id_prioridad, :id_profesor)
        ")
        ->bind(":titulo",  $data['titulo'])
        ->bind(":descripcion", $data['descripcion'])
        ->bind(":fecha_fin",   $data['fecha_fin'])
        ->bind(":id_ubicacion",    $data['id_ubicacion'])
        ->bind(":id_estado",      $data['id_estado'])
        ->bind(":id_prioridad",    $data['id_prioridad'])
        ->bind(":id_profesor",    $data['id_profesor'])
        ->execute();

        return (int) $this->db->lastId();
    }

    public function update(int $id, array $data): int
    {
        $this->db->query("
            UPDATE man_incidencias SET
                titulo = :titulo,
                descripcion = :descripcion,
                fecha_fin = :fecha_fin,
                id_ubicacion = :id_ubicacion,
                id_estado = :id_estado,
                id_prioridad = :id_prioridad,
                id_profesor = :id_profesor,
                updated_at = NOW()
            WHERE id_incidencia = :id
        ")
        ->bind(":id", $id)
        ->bind(":titulo",  $data['titulo'])
        ->bind(":descripcion", $data['descripcion'] ?? null)
        ->bind(":fecha_fin",   $data['fecha_fin'] ?? null)
        ->bind(":id_ubicacion",    $data['id_ubicacion'])
        ->bind(":id_estado",      $data['id_estado'])
        ->bind(":id_prioridad",    $data['id_prioridad'])
        ->bind(":id_profesor",    $data['id_profesor'])
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function updateDescripcion(int $id, array $data): int
    {
        $this->db->query("
            UPDATE man_incidencias SET
                descripcion = :descripcion
            WHERE id_incidencia = :id
        ")
        ->bind(":id", $id)
        ->bind(":descripcion",    $data['descripcion'])
        ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function delete(int $id): int
    {
        $this->db->query("DELETE FROM man_incidencias WHERE id_incidencia = :id")
                 ->bind(":id", $id)
                 ->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }
}