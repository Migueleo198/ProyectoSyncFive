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
            'cod_motivo'  => 'required|int',
            'h_inicio'    => 'string',
            'h_fin'       => 'string',
            'descripcion' => 'string'
        ]);

        try {
            $id = $this->model->create($data);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if (!$id) {
            throw new \Exception("No se pudo crear el permiso");
        }

        return [
            'id_permiso'  => $id,
            'cod_motivo'  => $data['cod_motivo'],
            'h_inicio'    => $data['h_inicio'] ?? null,
            'h_fin'       => $data['h_fin'] ?? null,
            'descripcion' => $data['descripcion'] ?? null
        ];
    }

    /**
     * Actualizar permiso
     */
    public function updatePermiso(string $id_permiso, array $input): array
{
    $data = Validator::validate($input, [
        'h_inicio'    => 'string',
        'h_fin'       => 'string',
        'estado'      => 'string|in:ACEPTADO,REVISION,DENEGADO',
        'descripcion' => 'string'
    ]);

    if (empty($data)) {
        throw new ValidationException([
            'body' => ['No se enviaron campos para actualizar']
        ]);
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
        if (!$this->model->find($id_permiso)) {
            throw new \Exception("Permiso no encontrado", 404);
        }
        return ['status' => 'no_changes', 'message' => 'No hubo cambios en el permiso'];
    }

    return ['status' => 'updated', 'message' => 'Permiso actualizado correctamente'];
}

    /**
     * Eliminar un permiso
     */
    public function deletePermiso(string $ID_Permiso): void
    {
        Validator::validate(['ID_Permiso' => $ID_Permiso], [
            'ID_Permiso' => 'required|string'
        ]);

        try {
            $result = $this->model->delete($ID_Permiso);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            throw new \Exception("Permiso no encontrado", 404);
        }

        if ($result === -1) {
            throw new \Exception(
                "No se puede eliminar el permiso: el registro está en uso",
                409
            );
        }
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
