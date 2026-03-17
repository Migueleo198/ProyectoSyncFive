<?php
declare(strict_types=1);

namespace Services;

use Models\InstalacionModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class InstalacionService
{
    private InstalacionModel $model;

    public function __construct()
    {
        $this->model = new InstalacionModel();
    }


    public function getAllInstalaciones(): array
    {
        try {
            return $this->model->all();
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }


    public function getInstalacionById(int $id): array
    {
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        try {
            $instalacion = $this->model->find($id);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$instalacion) {
            throw new \Exception("Instalación no encontrada", 404);
        }

        return $instalacion;
    }


    public function createInstalacion(array $input): array
    {
        $data = Validator::validate($input, [
            'nombre'            => 'required|string|max:100',
            'direccion'         => 'required|string|max:255',
            'localidad'         => 'required|string|max:100',
            'telefono'          => 'string|max:20',
            'correo'            => 'required|string|max:120'
        ]);

        try {
            $id = $this->model->create($data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$id) {
            throw new \Exception("No se pudo crear la instalación");
        }

        return ['id' => $id];
    }


    public function updateInstalacion(int $id, array $input): array
    {
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        $data = Validator::validate($input, [
            'nombre'            => 'required|string|max:100',
            'direccion'         => 'required|string|max:255',
            'localidad'         => 'required|string|max:100',
            'telefono'          => 'string|max:20',
            'correo'            => 'required|string|max:120'
        ]);


        try {
            $result = $this->model->update($id, $data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            $exists = $this->model->find($id);

            if (!$exists) {
                throw new \Exception("Instalación no encontrada", 404);
            }

            return [
                'status' => 'no_changes',
                'message' => 'No hubo cambios en los datos de la instalación'
            ];
        }

        if ($result === -1) {
            throw new \Exception("No se pudo actualizar la instalación: conflicto con restricciones", 409);
        }

        return [
            'status' => 'updated',
            'message' => 'Instalación actualizada correctamente'
        ];
    }

    public function deleteInstalacion(int $id): void
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
            throw new \Exception("Instalación no encontrada", 404);
        }

        if ($result === -1) {
            // Conflicto por FK u otra restricción
            throw new \Exception("No se puede eliminar la instalación: el registro está en uso", 409);
        }

        // Eliminación exitosa → no retorna nada
    }
}