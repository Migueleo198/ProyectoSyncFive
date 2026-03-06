<?php
declare(strict_types=1);

namespace Models;

use Core\DB;
use Exception;

class InfraestructuraAguaModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }


    // ============================================================
    // CONSULTAS
    // ============================================================

    public function all(array $filtros = []): array
    {
        $where  = [];
        $params = [];

        if (!empty($filtros['tipo'])) {
            $where[]          = 'tipo = :tipo';
            $params[':tipo']  = $filtros['tipo'];
        }

        if (!empty($filtros['provincia'])) {
            $where[]              = 'provincia = :provincia';
            $params[':provincia'] = $filtros['provincia'];
        }

        if (!empty($filtros['municipio'])) {
            $where[]              = 'municipio LIKE :municipio';
            $params[':municipio'] = '%' . $filtros['municipio'] . '%';
        }

        if (!empty($filtros['estado'])) {
            $where[]            = 'estado = :estado';
            $params[':estado']  = $filtros['estado'];
        }

        $sql = "SELECT * FROM infraestructuras_agua";

        if (!empty($where)) {
            $sql .= " WHERE " . implode(' AND ', $where);
        }

        $sql .= " ORDER BY provincia, municipio, tipo, codigo";

        $stmt = $this->db->query($sql);

        foreach ($params as $key => $value) {
            $stmt->bind($key, $value);
        }

        return $stmt->fetchAll();
    }

    public function find(int $id): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM infraestructuras_agua WHERE id = :id")
            ->bind(":id", $id)
            ->fetch();

        return $result ?: null;
    }


    // ============================================================
    // ESCRITURA
    // ============================================================

    public function create(array $data): int
    {
        $this->db->query("
            INSERT INTO infraestructuras_agua
                (codigo, tipo, denominacion, municipio, provincia, latitud, longitud, estado)
            VALUES
                (:codigo, :tipo, :denominacion, :municipio, :provincia, :latitud, :longitud, :estado)
        ")
        ->bind(":codigo",       $data['codigo'])
        ->bind(":tipo",         $data['tipo'])
        ->bind(":denominacion", $data['denominacion'] ?? null)
        ->bind(":municipio",    $data['municipio'])
        ->bind(":provincia",    $data['provincia'])
        ->bind(":latitud",      $data['latitud'])
        ->bind(":longitud",     $data['longitud'])
        ->bind(":estado",       $data['estado'] ?? 'ACTIVO')
        ->execute();

        return (int) $this->db->lastId();
    }

    public function update(int $id, array $data): int
    {
        $this->db->query("
            UPDATE infraestructuras_agua SET
                codigo       = :codigo,
                tipo         = :tipo,
                denominacion = :denominacion,
                municipio    = :municipio,
                provincia    = :provincia,
                latitud      = :latitud,
                longitud     = :longitud,
                estado       = :estado
            WHERE id = :id
        ")
        ->bind(":id",          $id)
        ->bind(":codigo",      $data['codigo'])
        ->bind(":tipo",        $data['tipo'])
        ->bind(":denominacion",$data['denominacion'] ?? null)
        ->bind(":municipio",   $data['municipio'])
        ->bind(":provincia",   $data['provincia'])
        ->bind(":latitud",     $data['latitud'])
        ->bind(":longitud",    $data['longitud'])
        ->bind(":estado",      $data['estado'])
        ->execute();

        return (int) $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    public function delete(int $id): int
    {
        $this->db->query("DELETE FROM infraestructuras_agua WHERE id = :id")
            ->bind(":id", $id)
            ->execute();

        return (int) $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }
}