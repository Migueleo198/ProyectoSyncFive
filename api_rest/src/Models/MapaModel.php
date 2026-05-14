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

        $sql = "SELECT * FROM Infraestructuras_Agua";

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

    public function find(string $codigo): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Infraestructuras_Agua WHERE codigo = :codigo")
            ->bind(":codigo", $codigo)
            ->fetch();

        return $result ?: null;
    }


    // ============================================================
    // ESCRITURA
    // ============================================================

    public function create(array $data): void
    {
        $this->db->query("
            INSERT INTO Infraestructuras_Agua
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
    }
    public function update(string $codigo, array $data): int
    {
        $this->db->query("
            UPDATE Infraestructuras_Agua SET
                codigo       = :nuevoCodigo,
                tipo         = :tipo,
                denominacion = :denominacion,
                municipio    = :municipio,
                provincia    = :provincia,
                latitud      = :latitud,
                longitud     = :longitud,
                estado       = :estado
            WHERE codigo = :codigoActual
        ")
        ->bind(":codigoActual",  $codigo)
        ->bind(":nuevoCodigo",   $data['codigo'])
        ->bind(":tipo",          $data['tipo'])
        ->bind(":denominacion",  $data['denominacion'] ?? null)
        ->bind(":municipio",     $data['municipio'])
        ->bind(":provincia",     $data['provincia'])
        ->bind(":latitud",       $data['latitud'])
        ->bind(":longitud",      $data['longitud'])
        ->bind(":estado",        $data['estado'])
        ->execute();

        return (int) $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    public function delete(string $codigo): int
    {
        $this->db->query("DELETE FROM Infraestructuras_Agua WHERE codigo = :codigo")
            ->bind(":codigo", $codigo)
            ->execute();

        return (int) $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }
}