<?php
declare(strict_types=1);

namespace Services;

use Models\IncidenciaModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class IncidenciaService
{
    private IncidenciaModel $model;

    public function __construct()
    {
        $this->model = new IncidenciaModel();
    }

    // GET, /incidencias
    public function getAllIncidencias(): array
    {
        try {
            return $this->model->all();
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    // POST, /incidencias
    public function createIncidencia(array $input): array
    {
        $data = Validator::validate($input, [
            'id_bombero' => 'required|integer|min:1',
            'id_material' => 'nullable|integer|min:1',
            'matricula' => 'nullable|string|max:15',
            'fecha' => 'required|date',
            'asunto' => 'required|string|max:150',
            'estado' => 'required|string|in:ABIERTA,CERRADA',
            'tipo' => 'required|string|max:50'
        ]);

        try {
            $id = $this->model->create($data);
            return $this->model->find($id);
        } catch (Throwable $e) {
            throw new \Exception("Error al crear incidencia: " . $e->getMessage(), 500);
        }
    }

    // PUT, /incidencias/{id_incidencia}
    public function updateIncidencia(int $id, array $input): array
    {
        $data = Validator::validate($input, [
            'id_bombero' => 'required|integer|min:1',
            'id_material' => 'nullable|integer|min:1',
            'matricula' => 'nullable|string|max:15',
            'fecha' => 'required|date',
            'asunto' => 'required|string|max:150',
            'estado' => 'required|string|in:ABIERTA,CERRADA',
            'tipo' => 'required|string|max:50'
        ]);

        try {
            $existing = $this->model->find($id);
            if (!$existing) {
                throw new \Exception("Incidencia no encontrada", 404);
            }

            $updated = $this->model->update($id, $data);
            if ($updated === 0) {
                throw new \Exception("No se pudo actualizar la incidencia", 500);
            }
            return $this->model->find($id);
        } catch (Throwable $e) {
            if ($e->getCode() === 404) {
                throw $e;
            }
            throw new \Exception("Error al actualizar incidencia: " . $e->getMessage(), 500);
        }
    }

    // PATCH, /incidencias/{id_incidencia}
    public function patchIncidencia(int $id, array $input): array
    {
        $data = Validator::validate($input, [
            'id_bombero' => 'nullable|integer|min:1',
            'id_material' => 'nullable|integer|min:1',
            'matricula' => 'nullable|string|max:15',
            'fecha' => 'nullable|date',
            'asunto' => 'nullable|string|max:150',
            'estado' => 'nullable|string|in:ABIERTA,CERRADA',
            'tipo' => 'nullable|string|max:50'
        ]);

        // Si el array está vacío, no hay nada que actualizar
        if (empty($data)) {
            throw new \Exception("No se proporcionaron datos para actualizar", 400);
        }

        try {
            $existing = $this->model->find($id);
            if (!$existing) {
                throw new \Exception("Incidencia no encontrada", 404);
            }

            $updatedData = array_merge($existing, $data);
            $updated = $this->model->update($id, $updatedData);
            if ($updated === 0) {
                throw new \Exception("No se pudo actualizar la incidencia", 500);
            }
            return $this->model->find($id);
        } catch (Throwable $e) {
            if ($e->getCode() === 404 || $e->getCode() === 400) {
                throw $e;
            }
            throw new \Exception("Error al actualizar incidencia: " . $e->getMessage(), 500);
        }
    }

    // DELETE, /incidencias/{id_incidencia}
    public function deleteIncidencia(int $id): void
    {
        try {
            $existing = $this->model->find($id);
            if (!$existing) {
                throw new \Exception("Incidencia no encontrada", 404);
            }
            
            $deleted = $this->model->delete($id);
            if ($deleted === 0) {
                throw new \Exception("No se pudo eliminar la incidencia", 500);
            }
        } catch (Throwable $e) {
            if ($e->getCode() === 404) {
                throw $e;
            }
            throw new \Exception("Error al eliminar incidencia: " . $e->getMessage(), 500);
        }
    }
}