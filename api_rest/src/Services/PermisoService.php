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

            'id_permiso'     => 'required|string',
            'fecha'        => 'required|date',
            'h_inicio'          => 'int',
            'h_fin'          => 'int',
            'descripcion'      => 'string',
            'estado'      => 'boolean'
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

        return ['ID_Permiso' => $data['id_permiso']];
    }

    /**
     * Actualizar permiso
     */
    public function updatePermiso(string $ID_Permiso, array $input): array
    {
        Validator::validate(['ID_Permiso' => $ID_Permiso], [
            'ID_Permiso' => 'required|string'
        ]);

        $data = Validator::validate($input, [
            'ID_Permiso'     => 'required|string',
            'fecha'        => 'required|date',
            'h_inicio'          => 'int',
            'h_fin'          => 'int',
            'descripcion'      => 'string',
            'estado'      => 'boolean'
        ]);

        if (empty($data)) {
            throw new ValidationException([
                'body' => ['No se enviaron campos para actualizar']
            ]);
        }

        try {
            $result = $this->model->update($ID_Permiso, $data);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            $exists = $this->model->find($ID_Permiso);

            if (!$exists) {
                throw new \Exception("Permiso no encontrado", 404);
            }

            return [
                'status'  => 'no_changes',
                'message' => 'No hubo cambios en el permiso'
            ];
        }

        if ($result === -1) {
            throw new \Exception(
                "No se pudo actualizar el permiso: conflicto con restricciones",
                409
            );
        }

        return [
            'status'  => 'updated',
            'message' => 'Permiso actualizado correctamente'
        ];
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
}
?>
