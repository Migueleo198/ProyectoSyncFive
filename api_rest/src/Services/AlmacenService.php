<?php
declare(strict_types=1);

namespace Services;

use Models\AlmacencionModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class AlmacenService
{
    private AlmacenModel $model;

    public function __construct()
    {
        $this->model = new AlmacenModel();
    }


    public function getAllAlmacenes(): array
    {
        try {
            return $this->model->all();
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }


    public function getAlmacenById(int $id): array
    {
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        try {
            $almacen = $this->model->find($id);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$almacen) {
            throw new \Exception("ALmacen no encontrada", 404);
        }

        return $almacen;
    }


    public function createAlmacen(array $input): array
    {
        $data = Validator::validate($input, [
            'n_serie'           => 'required|string|max:100',
            'unidades'          => 'required|int|min:0'
        ]);

        try {
            $id = $this->model->create($data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$id) {
            throw new \Exception("No se pudo crear el almacén");
        }

        return ['id' => $id];
    }


    public function updateAlmacen(int $id, array $input): array
    {
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        $data = Validator::validate($input, [
            'n_serie'           => 'required|string|max:100',
            'unidades'          => 'required|int|min:0'
        ]);


        try {
            $result = $this->model->update($id, $data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            $exists = $this->model->find($id);

            if (!$exists) {
                throw new \Exception("Almacén no encontrado", 404);
            }

            return [
                'status' => 'no_changes',
                'message' => 'No hubo cambios en los datos del almacén'
            ];
        }

        if ($result === -1) {
            throw new \Exception("No se pudo actualizar el almacén: conflicto con restricciones", 409);
        }

        return [
            'status' => 'updated',
            'message' => 'Almacén actualizado correctamente'
        ];
    }

    public function deleteAlmacen(int $id): void
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
            throw new \Exception("Almacén no encontrado", 404);
        }

        if ($result === -1) {
            // Conflicto por FK u otra restricción
            throw new \Exception("No se puede eliminar el almacén: el registro está en uso", 409);
        }

        // Eliminación exitosa → no retorna nada
    }
}