<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class PermisoModel
{
    private DB $db;

    private const ALLOWED_UPDATE_FIELDS = [
        'cod_motivo',
        'fecha_hora_inicio',
        'fecha_hora_fin',
        'estado',
        'descripcion'
    ];

    public function __construct()
    {
        $this->db = new DB();
    }

    /**
     * Obtener todos los permisos
     */
    public function all(): array
    {
        return $this->db
            ->query($this->baseSelect() . " ORDER BY p.fecha_hora_inicio DESC, p.id_permiso DESC")
            ->fetchAll();
    }

    /**
     * Buscar permiso por ID_Permiso
     */
    public function find(string $id_permiso): ?array
    {
        $result = $this->db
            ->query($this->baseSelect() . " WHERE p.id_permiso = :id")
            ->bind(':id', $id_permiso)
            ->fetch();

        return $result ?: null;
    }

    /**
     * Crear un permiso
     */
    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Permiso (
                cod_motivo,
                id_bombero,
                fecha_solicitud,
                fecha_hora_inicio,
                fecha_hora_fin,
                estado,
                descripcion
            )
            VALUES (
                :cod_motivo,
                :id_bombero,
                CURRENT_TIMESTAMP,
                :fecha_hora_inicio,
                :fecha_hora_fin,
                'REVISION',
                :descripcion
            )
        ")
        ->bind(':cod_motivo',  $data['cod_motivo'])
        ->bind(':id_bombero',  $data['id_bombero'])
        ->bind(':fecha_hora_inicio', $data['fecha_hora_inicio'])
        ->bind(':fecha_hora_fin', $data['fecha_hora_fin'])
        ->bind(':descripcion', $data['descripcion'] ?? null)
        ->execute();

        return (int) $this->db->lastId();
    }

    /**
     * Actualizar permiso (PATCH)
     */
    public function update(string $id_permiso, array $data): int
    {
        $data = array_intersect_key($data, array_flip(self::ALLOWED_UPDATE_FIELDS));

        if (empty($data)) {
            return 0;
        }

        $setParts = [];
        foreach ($data as $field => $_value) {
            $setParts[] = "$field = :$field";
        }

        $query = $this->db->query(
            "UPDATE Permiso SET " . implode(', ', $setParts) . " WHERE id_permiso = :id_permiso"
        )
        ->bind(':id_permiso', $id_permiso);

        foreach ($data as $field => $value) {
            $query->bind(':' . $field, $value);
        }

        $query->execute();

        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }

    public function motivoExists(int $cod_motivo): bool
    {
        $result = $this->db
            ->query("SELECT cod_motivo FROM Motivo WHERE cod_motivo = :cod_motivo")
            ->bind(':cod_motivo', $cod_motivo)
            ->fetch();

        return $result !== false;
    }

    public function findMotivo(int $cod_motivo): ?array
    {
        $result = $this->db
            ->query("SELECT cod_motivo, nombre, dias FROM Motivo WHERE cod_motivo = :cod_motivo")
            ->bind(':cod_motivo', $cod_motivo)
            ->fetch();

        return $result ?: null;
    }

    /**
     * Obtener todas las personas que tienen un permiso (con fechas)
     */
    public function getPersonsByPermiso(string $id_permiso): array
    {
        return $this->db
            ->query("
                SELECT 
                    p.id_bombero,
                    p.n_funcionario,
                    p.nombre,
                    p.apellidos,
                    permiso.fecha_solicitud,
                    permiso.fecha_hora_inicio,
                    permiso.fecha_hora_fin,
                    DATE(permiso.fecha_hora_inicio) AS fecha,
                    TIME_FORMAT(permiso.fecha_hora_inicio, '%H:%i:%s') AS h_inicio,
                    TIME_FORMAT(permiso.fecha_hora_fin, '%H:%i:%s') AS h_fin,
                    permiso.estado
                FROM Permiso permiso
                INNER JOIN Persona p
                    ON p.id_bombero = permiso.id_bombero
                WHERE permiso.id_permiso = :id_permiso
            ")
            ->bind(':id_permiso', $id_permiso)
            ->fetchAll();
    }

    private function baseSelect(): string
    {
        return "
            SELECT
                p.id_permiso,
                p.cod_motivo,
                p.id_bombero,
                p.fecha_solicitud,
                p.fecha_hora_inicio,
                p.fecha_hora_fin,
                p.estado,
                p.descripcion,
                DATE(p.fecha_hora_inicio) AS fecha,
                TIME_FORMAT(p.fecha_hora_inicio, '%H:%i:%s') AS h_inicio,
                TIME_FORMAT(p.fecha_hora_fin, '%H:%i:%s') AS h_fin,
                TIMESTAMPDIFF(MINUTE, p.fecha_hora_inicio, p.fecha_hora_fin) AS duracion_minutos,
                m.nombre AS motivo_nombre,
                pe.nombre AS bombero_nombre,
                pe.apellidos AS bombero_apellidos
            FROM Permiso p
            LEFT JOIN Motivo m ON m.cod_motivo = p.cod_motivo
            LEFT JOIN Persona pe ON pe.id_bombero = p.id_bombero
        ";
    }

}
?>
