<?php
declare(strict_types=1);

namespace Services;

use Models\IncidenciaModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class IncidenciaService{

    private IncidenciaModel $model;

    public function __construct()
    {
        $this->model = new IncidenciaModel();
    }


    public function getAllIncidencias(): array
    {
        try {
            return $this->model->all();
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }


    public function getIncidenciaById(int $id): array
    {
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        try {
            $incidencia = $this->model->find($id);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$incidencia) {
            throw new \Exception("Incidencia no encontrada", 404);
        }

        return $incidencia;
    }

    public function createIncidencia(array $input): array
    {
        $data = Validator::validate($input, [
            'titulo'            => 'required|string|min:3|max:100',
            'descripcion'       => 'required|string|min:0|max:1000',
            'fecha_fin'         => 'string',
            'id_ubicacion'      => 'required|int|max:120',
            'id_estado'         => 'required|int|min:1|max:3',
            'id_prioridad'      => 'required|int|min:1|max:3',
            'id_profesor'      => 'required|int|min:1|max:120'
        ]);

        try {
            $id = $this->model->create($data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$id) {
            throw new \Exception("No se pudo crear la incidencia");
        }

        return ['id' => $id];
    }


    public function updateIncidencia(int $id, array $input): array
    {
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        $data = Validator::validate($input, [
            'titulo'            => 'required|string|min:3|max:100',
            'descripcion'       => 'required|string|min:0|max:1000',
            'fecha_fin'         => 'string',
            'id_ubicacion'      => 'required|int|max:120',
            'id_estado'         => 'required|int|min:1|max:3',
            'id_prioridad'      => 'required|int|min:1|max:3',
            'id_profesor'      => 'required|int|min:1|max:120'
        ]);

        try {
            $result = $this->model->update($id, $data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            $exists = $this->model->find($id);

            if (!$exists) {
                throw new \Exception("Incidencia no encontrado", 404);
            }

            return [
                'status' => 'no_changes',
                'message' => 'No hubo cambios en los datos de la incidencia'
            ];
        }

        if ($result === -1) {
            throw new \Exception("No se pudo actualizar la incidencia: conflicto con restricciones", 409);
        }

        return [
            'status' => 'updated',
            'message' => 'Incidencia actualizada correctamente'
        ];
    }



    public function updateDescripcionIncidencia(int $id, array $input): array
    {
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        $data = Validator::validate($input, [
            'descripcion' => 'required|string|min:0|max:1000'
        ]);

        try {
            $result = $this->model->updateDescripcion($id, $data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            $exists = $this->model->find($id);

            if (!$exists) {
                throw new \Exception("Incidencia no encontrada", 404);
            }

            return [
                'status' => 'no_changes',
                'message' => 'No hubo cambios en descripcion de la incidencia'
            ];
        }

        if ($result === -1) {
            throw new \Exception("No se pudo actualizar la descripcion de la incidencia: conflicto con restricciones", 409);
        }

        return [
            'status' => 'updated',
            'message' => 'Descripcion de la incidencia actualizada correctamente'
        ];
    }



    public function deleteIncidencia(int $id): void
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
            throw new \Exception("Incidencia no encontrada", 404);
        }

        if ($result === -1) {
            // Conflicto por FK u otra restricción
            throw new \Exception("No se puede eliminar la incidencia: el registro está en uso", 409);
        }

        // Eliminación exitosa → no retorna nada
    }

    

    
}