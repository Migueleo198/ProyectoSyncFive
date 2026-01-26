<?php
declare(strict_types=1);

namespace Services;

use Models\EdicionModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class EdicionService
{
    private EdicionModel $model;

    public function __construct()
    {
        $this->model = new EdicionModel();
    }


    public function getEdicionById(int $id): array
    {
        Validator::validate(['id_formacion' => $id], [
            'id_formacion' => 'required|int|min:1'
        ]);

        try {
            $formacion = $this->model->find($id);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$formacion) {
            throw new \Exception("Formación no encontrada", 404);
        }

        return $formacion;
    }


    public function createEdicion(array $input): array
    {
        $data = Validator::validate($input, [
            'id_formacion'      => 'required|int|min:1',
            'f_inicio'          => 'required|date',
            'f_fin'             => 'required|date',
            'horas'             => 'required|int'
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


    public function updateEdicion(int $id, array $input): array
    {
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        $data = Validator::validate($input, [
            'id_formacion'      => 'required|int|min:1',
            'f_inicio'          => 'required|date',
            'f_fin'             => 'required|date',
            'horas'             => 'required|int'
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
            throw new \Exception("No se pudo actualizar la edición: conflicto con restricciones", 409);
        }

        return [
            'status' => 'updated',
            'message' => 'Edición actualizada correctamente'
        ];
    }

    public function deleteEdicion(int $id): void
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
            throw new \Exception("Edición no encontrada", 404);
        }

        if ($result === -1) {
            // Conflicto por FK u otra restricción
            throw new \Exception("No se puede eliminar la edición: el registro está en uso", 409);
        }

        // Eliminación exitosa → no retorna nada
    }

    public function getPersonasEdicion(int $id): array
    {
        Validator::validate(['id_edicion' => $id], [
            'id_edicion' => 'required|int|min:1'
        ]);

        try {
            $personas = $this->model->getPersonasByEdicionId($id);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        return $personas;
    }

    
}
