<?php
declare(strict_types=1);

namespace Services;

use Models\TipoEmergenciaModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class TipoEmergenciaService
{
    private TipoEmergenciaModel $model;

    public function __construct()
    {
        $this->model = new TipoEmergenciaModel();
    }


    public function getAllTipoEmergencias(): array
    {
        try {
            return $this->model->all();
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }


    public function getTipoEmergenciaById(int $id): array
    {
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        try {
            $formacion = $this->model->find($id);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$formacion) {
            throw new \Exception("Tipo de emergencia no encontrada", 404);
        }

        return $formacion;
    }


    public function createTipoEmergencia(array $input): array
    {
        $data = Validator::validate($input, [
            'nombre' => 'required|string|max:50',
            'grupo' => 'string|max:50',
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


    public function updateTipoEmergencia(int $id, array $input): array
    {
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        $data = Validator::validate($input, [
            'nombre' => 'required|string|max:50',
            'grupo' => 'string|max:50',
        ]);

        try {
            $result = $this->model->update($id, $data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            $exists = $this->model->find($id);

            if (!$exists) {
                throw new \Exception("Tipo de emergencia no encontrado", 404);
            }

            return [
                'status' => 'no_changes',
                'message' => 'No hubo cambios en los datos del tipo de emergencia'
            ];
        }

        if ($result === -1) {
            throw new \Exception("No se pudo actualizar el tipo de emergencia: conflicto con restricciones", 409);
        }

        return [
            'status' => 'updated',
            'message' => 'Tipo de emergencia actualizado correctamente'
        ];
    }

    public function deleteTipoEmergencia(int $id): void
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
            throw new \Exception("Tipo de emergencia no encontrado", 404);
        }

        if ($result === -1) {
            // Conflicto por FK u otra restricción
            throw new \Exception("No se puede eliminar el tipo de emergencia: el registro está en uso", 409);
        }

        // Eliminación exitosa → no retorna nada
    }

    

    
}
