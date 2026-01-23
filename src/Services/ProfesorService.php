<?php
declare(strict_types=1);

namespace Services;

use Models\ProfesorModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class ProfesorService
{
    private ProfesorModel $model;

    public function __construct()
    {
        $this->model = new ProfesorModel();
    }


    public function getAllProfesores(): array
    {
        try {
            return $this->model->all();
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }


    public function getProfesorById(int $id): array
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


    public function createProfesor(array $input): array
    {
        $data = Validator::validate($input, [
            'login'             => 'required|string|min:3|max:30',
            'password'          => 'required|string|min:6|max:100',
            'nombre_completo'   => 'string',
            'email'             => 'required|email|max:120',
            'id_rol'            => 'required|int|min:1'
        ]);

        $data['password'] = password_hash($data['password'], PASSWORD_BCRYPT);

        try {
            $id = $this->model->create($data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$id) {
            throw new \Exception("No se pudo crear el profesor");
        }

        return ['id' => $id];
    }


    public function updateProfesor(int $id, array $input): array
    {
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        $data = Validator::validate($input, [
            'login'             => 'required|string|min:3|max:30',
            'password'          => 'string|min:6|max:100',
            'nombre_completo'   => 'string',
            'email'             => 'required|email|max:120',
            'id_rol'            => 'required|int|min:1'
        ]);

        if (isset($data['password'])) {
            $data['password'] = password_hash($data['password'], PASSWORD_BCRYPT);
        }

        try {
            $result = $this->model->update($id, $data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            $exists = $this->model->find($id);

            if (!$exists) {
                throw new \Exception("Profesor no encontrado", 404);
            }

            return [
                'status' => 'no_changes',
                'message' => 'No hubo cambios en los datos del profesor'
            ];
        }

        if ($result === -1) {
            throw new \Exception("No se pudo actualizar el profesor: conflicto con restricciones", 409);
        }

        return [
            'status' => 'updated',
            'message' => 'Profesor actualizado correctamente'
        ];
    }



    public function updateEmailProfesor(int $id, array $input): array
    {
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        $data = Validator::validate($input, [
            'email' => 'required|email|max:120'
        ]);

        try {
            $result = $this->model->updateEmail($id, $data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            $exists = $this->model->find($id);

            if (!$exists) {
                throw new \Exception("Profesor no encontrado", 404);
            }

            return [
                'status' => 'no_changes',
                'message' => 'No hubo cambios en Email del profesor'
            ];
        }

        if ($result === -1) {
            throw new \Exception("No se pudo actualizar el Email del profesor: conflicto con restricciones", 409);
        }

        return [
            'status' => 'updated',
            'message' => 'Email de profesor actualizado correctamente'
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
