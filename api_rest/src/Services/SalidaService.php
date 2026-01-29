<?php
declare(strict_types=1);

namespace Services;

use Models\SalidaModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class SalidaService
{
    private SalidaModel $model;

    public function __construct()
    {
        $this->model = new SalidaModel();
    }

    //================= Salidas =====================

    public function getAllSalidas(): array
    {
        try {
            return $this->model->all();
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function createSalida(array $input): array
    {
        $data = Validator::validate($input, [
            'login'             => 'required|string|min:3|max:30',
            'password'          => 'required|string|min:6|max:100',
            'nombre_completo'   => 'string',
            'email'             => 'required|email|max:120',
            'id_rol'            => 'required|int|min:1'
        ]);

        try {
            $id = $this->model->create($data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$id) {
            throw new \Exception("No se pudo crear la salida");
        }

        return ['id' => $id];
    }


    public function updateSalida(int $id, array $input): array
    {
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        $data = Validator::validate($input, [
            'matricula'         => 'required|string|min:1|max:10',
            'f_recogida'        => 'required|datetime',
            'f_entrega'         => 'required|datetime',
            'km_inicio'         => 'required|int',
            'km_fin'            => 'required|int'
        ]);

        try {
            $result = $this->model->update($id, $data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            $exists = $this->model->find($id);

            if (!$exists) {
                throw new \Exception("Salida no encontrada", 404);
            }

            return [
                'status' => 'no_changes',
                'message' => 'No hubo cambios en los datos de la salida'
            ];
        }

        if ($result === -1) {
            throw new \Exception("No se pudo actualizar la salida: conflicto con restricciones", 409);
        }

        return [
            'status' => 'updated',
            'message' => 'Salida actualizada correctamente'
        ];
    }

    public function deleteSalida(int $id): void
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
            throw new \Exception("Salida no encontrada", 404);
        }

        if ($result === -1) {
            // Conflicto por FK u otra restricción
            throw new \Exception("No se puede eliminar la salida: el registro está en uso", 409);
        }

        // Eliminación exitosa → no retorna nada
    }



        //================= Personas en salidas =====================
    public function getAllPersonas(int $id_registro): array
    {
        try {
            return $this->model->allPersonas($id_registro);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function setPersonaSalida(int $id_registro, array $input): array
    {
        $data = Validator::validate($input, [
            'n_funcionario' => 'required|int|min:1'
        ]);

        try {
            $this->model->addPersonaSalida($id_registro, $data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        return ['message' => 'Persona añadida a la salida correctamente'];
    }

    public function deletePersonaSalida(int $id_registro, int $n_funcionario): void
    {
        try {
            $result = $this->model->deletePersonaSalida($id_registro, $n_funcionario);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            throw new \Exception("Persona no encontrada en la salida", 404);
        }

        // Eliminación exitosa → no retorna nada
    }
}