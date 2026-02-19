<?php
declare(strict_types=1);

namespace Services;

use Models\RolModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class RolService
{
    private RolModel $model;

    public function __construct()
    {
        $this->model = new RolModel();
    }

    /**
     * Obtener todos los roles
     */
    public function getAllRoles(): array
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
     * Crear un nuevo rol
     */
    public function createRoles(array $input): array
    {
        // Validación de campos
        $data = Validator::validate($input, [
            'nombre'      => 'required|in:BOMBERO,OFICIAL,JEFE DE INTERVENCIÓN,JEFE DE MANDO,INSPECTOR',
            'descripcion' => 'nullable|string'
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
            throw new \Exception("No se pudo crear el rol");
        }

        return ['id' => $id];
    }

    /**
     * Actualizar un rol
     */
    public function updateRol(int $id, array $input): array
    {
        // Validar ID
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        // Validar datos
        $data = Validator::validate($input, [
            'nombre'      => 'required|in:BOMBERO,OFICIAL,JEFE DE INTERVENCIÓN,JEFE DE MANDO,INSPECTOR',
            'descripcion' => 'nullable|string'
        ]);

        try {
            $result = $this->model->update($id, $data);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            $exists = $this->model->find($id);

            if (!$exists) {
                throw new \Exception("Rol no encontrado", 404);
            }

            return [
                'status'  => 'no_changes',
                'message' => 'No hubo cambios en el rol'
            ];
        }

        if ($result === -1) {
            throw new \Exception(
                "No se pudo actualizar el rol: conflicto con restricciones",
                409
            );
        }

        return [
            'status'  => 'updated',
            'message' => 'Rol actualizado correctamente'
        ];
    }

    /**
     * Eliminar un rol
     */
    public function deleteRol(int $id): void
    {
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        try {
            $result = $this->model->delete($id);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            throw new \Exception("Rol no encontrado", 404);
        }

        if ($result === -1) {
            throw new \Exception(
                "No se puede eliminar el rol: el registro está en uso",
                409
            );
        }

        // Eliminación exitosa → no retorna nada
    }
        /**
     * Obtener todas las personas asociadas a un Rol
     */
    public function getPersonsByRol(int $ID_Rol): array
    {
        Validator::validate(['ID_Rol' => $ID_Rol], [
            'ID_Rol' => 'required|int|min:1'
        ]);

        try {
            // verificamos que el rol exista primero
            $exists = $this->model->find($ID_Rol);

            if (!$exists) {
                throw new \Exception("Rol no encontrado", 404);
            }

            return $this->model->getPersonsByRol($ID_Rol);

        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }
    }
    /**
     * Asignar rol a una persona
     */
    public function assignRolToPerson(array $input): array
    {
        $data = Validator::validate($input, [
            'n_funcionario' => 'required|string',
            'ID_Rol'     => 'required|int|min:1'
        ]);

        try {
            $exists = $this->model->find($data['ID_Rol']);
            if (!$exists) {
                throw new \Exception("Rol no encontrado", 404);
            }

            $result = $this->model->assignToPerson(
                $data['n_funcionario'],
                $data['ID_Rol']
            );

        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if (!$result) {
            throw new \Exception("No se pudo asignar el Rol", 409);
        }

        return [
            'status'  => 'assigned',
            'message' => 'Rol asignado correctamente'
        ];
    }
}
?>