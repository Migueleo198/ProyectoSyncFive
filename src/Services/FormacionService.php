<?php
declare(strict_types=1);

namespace Services;

use Models\FormacionModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class FormacionService
{
    private FormacionModel $model;

    public function __construct()
    {
        $this->model = new FormacionModel();
    }


    public function getAllFormaciones(): array
    {
        try {
            return $this->model->all();
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }


    public function getFormacionById(int $id): array
    {
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        try {
            $profesor = $this->model->find($id);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$profesor) {
            throw new \Exception("Profesor no encontrado", 404);
        }

        return $profesor;
    }


    public function createFormacion(array $input): array
    {
        $data = Validator::validate($input, [
            'nombre'            => 'required|string|min:1|max:50',
            'descripcion'       => 'required|string|min:1|max:100'
        ]);

        try {
            $id = $this->model->create($data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$id) {
            throw new \Exception("No se pudo crear la formación");
        }

        return ['id' => $id];
    }


    public function updateFormacion(int $id, array $input): array
    {
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        $data = Validator::validate($input, [
            'nombre'            => 'required|string|min:1|max:50',
            'descripcion'       => 'required|string|min:1|max:100'
        ]);

        try {
            $result = $this->model->update($id, $data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            $exists = $this->model->find($id);

            if (!$exists) {
                throw new \Exception("Formación no encontrada", 404);
            }

            return [
                'status' => 'no_changes',
                'message' => 'No hubo cambios en los datos de la formación'
            ];
        }

        if ($result === -1) {
            throw new \Exception("No se pudo actualizar la formación: conflicto con restricciones", 409);
        }

        return [
            'status' => 'updated',
            'message' => 'Formación actualizada correctamente'
        ];
    }

    public function deleteProfesor(int $id): void
    {
        // Validar ID
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        try {
            $result = $this->model->delete($id);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            // No existe el registro
            throw new \Exception("Profesor no encontrado", 404);
        }

        if ($result === -1) {
            // Conflicto por FK u otra restricción
            throw new \Exception("No se puede eliminar el profesor: el registro está en uso", 409);
        }

        // Eliminación exitosa → no retorna nada
    }

    

    
}
