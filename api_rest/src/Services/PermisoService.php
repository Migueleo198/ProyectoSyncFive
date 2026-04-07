<?php
declare(strict_types=1);

namespace Services;

use Models\PermisoModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class PermisoService
{
    private PermisoModel $model;
    private const ESTADOS_VALIDOS = ['ACEPTADO', 'REVISION', 'DENEGADO'];

    public function __construct()
    {
        $this->model = new PermisoModel();
    }

    /**
     * Obtener todos los permisos
     */
    public function getAllPermisos(): array
    {
        try {
            return $this->model->all();
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }
    }

    /**
     * Obtener un permiso por su ID (string)
     */
    public function getPermisoById(string $ID_Permiso): array
    {
        Validator::validate(['ID_Permiso' => $ID_Permiso], [
            'ID_Permiso' => 'required|string'
        ]);

        try {
            $permiso = $this->model->find($ID_Permiso);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if (!$permiso) {
            throw new \Exception("Permiso no encontrado", 404);
        }

        return $permiso;
    }

    /**
     * Crear un permiso
     */
    public function createPermiso(array $input): array
    {
        $data = Validator::validate($input, [
            'cod_motivo'        => 'required|int',
            'id_bombero'        => 'required|string|max:4',
            'fecha_hora_inicio' => 'required|string|datetime|max:19',
            'fecha_hora_fin'    => 'string|datetime|max:19',
            'descripcion'       => 'string|max:255'
        ]);

        $data = $this->normalizeDateTimeFields($data, ['fecha_hora_inicio', 'fecha_hora_fin']);
        $data['fecha_hora_fin'] = $this->resolveFechaHoraFin($data);
        $this->assertDateTimeRange($data['fecha_hora_inicio'], $data['fecha_hora_fin']);

        try {
            $id = $this->model->create($data);
        } catch (Throwable $e) {
            if ($e->getCode() === 404) {
                throw $e;
            }

            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                $code
            );
        }

        if (!$id) {
            throw new \Exception("No se pudo crear el permiso");
        }

        return [
            'id_permiso'        => $id,
            'cod_motivo'        => $data['cod_motivo'],
            'id_bombero'        => $data['id_bombero'],
            'fecha_hora_inicio' => $data['fecha_hora_inicio'],
            'fecha_hora_fin'    => $data['fecha_hora_fin'],
            'descripcion'       => $data['descripcion'] ?? null
        ];
    }

    /**
     * Actualizar permiso
     */
    public function updatePermiso(string $id_permiso, array $input): array
    {
        $permisoExistente = $this->model->find($id_permiso);

        if (!$permisoExistente) {
            throw new \Exception("Permiso no encontrado", 404);
        }

        $data = Validator::validate($input, [
            'cod_motivo'        => 'int',
            'fecha_hora_inicio' => 'string|datetime|max:19',
            'fecha_hora_fin'    => 'string|datetime|max:19',
            'estado'            => 'string|in:ACEPTADO,REVISION,DENEGADO',
            'descripcion'       => 'string|max:255'
        ]);

        $data = array_intersect_key($data, $input);

        $data = $this->normalizeDateTimeFields($data, ['fecha_hora_inicio', 'fecha_hora_fin']);

        if (isset($data['fecha_hora_inicio']) || isset($data['fecha_hora_fin'])) {
            $fechaHoraInicio = $data['fecha_hora_inicio'] ?? $permisoExistente['fecha_hora_inicio'];
            $fechaHoraFin = $data['fecha_hora_fin'] ?? $permisoExistente['fecha_hora_fin'];
            $this->assertDateTimeRange($fechaHoraInicio, $fechaHoraFin);
        }

        if (isset($data['cod_motivo']) && !$this->model->motivoExists($data['cod_motivo'])) {
            throw new \Exception("Motivo no encontrado", 404);
        }

        if (isset($data['estado'])) {
            $data['estado'] = $this->normalizeEstado($data['estado']);
        }

        foreach ($data as $field => $value) {
            $valorActual = $permisoExistente[$field] ?? null;

            if ($field === 'descripcion') {
                $valorActual = $this->normalizeNullableString($valorActual);
                $value = $this->normalizeNullableString($value);
                $data[$field] = $value;
            }

            if ($value === $valorActual) {
                unset($data[$field]);
            }
        }

        if (empty($data)) {
            return ['status' => 'no_changes', 'message' => 'No hubo cambios en el permiso'];
        }

        try {
            $result = $this->model->update($id_permiso, $data);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            return ['status' => 'no_changes', 'message' => 'No hubo cambios en el permiso'];
        }

        return ['status' => 'updated', 'message' => 'Permiso actualizado correctamente'];
    }

    private function normalizeEstado(string $estado): string
    {
        $normalizado = strtoupper(trim($estado));

        if (!in_array($normalizado, self::ESTADOS_VALIDOS, true)) {
            throw new ValidationException([
                'estado' => ['El estado del permiso no es valido.']
            ]);
        }

        return $normalizado;
    }

    private function assertDateTimeRange(string $fechaHoraInicio, string $fechaHoraFin): void
    {
        $inicio = strtotime($fechaHoraInicio);
        $fin = strtotime($fechaHoraFin);

        if ($inicio === false) {
            throw new ValidationException([
                'fecha_hora_inicio' => ['La fecha y hora de inicio debe ser valida.']
            ]);
        }

        if ($fin === false) {
            throw new ValidationException([
                'fecha_hora_fin' => ['La fecha y hora de fin debe ser valida.']
            ]);
        }

        if ($fin < $inicio) {
            throw new ValidationException([
                'fecha_hora_fin' => ['La fecha y hora de fin debe ser igual o posterior a la fecha y hora de inicio.']
            ]);
        }
    }

    private function normalizeDateTimeFields(array $data, array $fields): array
    {
        foreach ($fields as $field) {
            if (!isset($data[$field]) || $data[$field] === null) {
                continue;
            }

            $timestamp = strtotime(str_replace('T', ' ', (string) $data[$field]));

            if ($timestamp === false) {
                throw new ValidationException([
                    $field => ['El campo ' . $field . ' debe contener una fecha y hora valida.']
                ]);
            }

            $data[$field] = date('Y-m-d H:i:s', $timestamp);
        }

        return $data;
    }

    private function normalizeNullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $texto = trim((string) $value);
        return $texto !== '' ? $texto : null;
    }

    private function resolveFechaHoraFin(array $data): string
    {
        if (!empty($data['fecha_hora_fin'])) {
            return $data['fecha_hora_fin'];
        }

        $motivo = $this->model->findMotivo((int) $data['cod_motivo']);

        if (!$motivo) {
            throw new \Exception("Motivo no encontrado", 404);
        }

        $dias = max(0, (int) ($motivo['dias'] ?? 0));
        $timestampInicio = strtotime($data['fecha_hora_inicio']);

        if ($timestampInicio === false) {
            throw new ValidationException([
                'fecha_hora_inicio' => ['La fecha y hora de inicio debe ser valida.']
            ]);
        }

        return date('Y-m-d H:i:s', strtotime('+' . $dias . ' days', $timestampInicio));
    }

    /**
     * Obtener las personas asociadas a un permiso
     */
    public function getPersonsByPermiso(string $id_permiso): array
    {
        Validator::validate(['id_permiso' => $id_permiso], [
            'id_permiso' => 'required|string'
        ]);

        try {
            $personas = $this->model->getPersonsByPermiso($id_permiso);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        return $personas;
    }
}
?>
