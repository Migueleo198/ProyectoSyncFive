<?php
declare(strict_types=1);

namespace Services;

use Models\GrupoModel;
use PDOException;
use Validation\Validator;
use Throwable;

class GrupoService
{
    private GrupoModel $model;

    public function __construct()
    {
        $this->model = new GrupoModel();
    }

    /**
     * Obtener todos los grupos
     */
    public function getAll(): array
    {
        return $this->model->all();
    }

    /**
     * Obtener grupo por ID
     */
    public function getById(int $id): ?array
    {
        $grupo = $this->model->find($id);
        if (!$grupo) {
            throw new \Exception("Grupo no encontrado", 404);
        }
        return $grupo;
    }

    /**
     * Crear grupo
     */
    public function create(array $input): array
    {
        Validator::validate($input, [
            'nombre' => 'required|string|min:1|max:100',
            'descripcion' => 'nullable|string|max:255'
        ]);

        try {
            $id = $this->model->create($input);
            if (!$id) {
                throw new \Exception("No se pudo crear el grupo");
            }
            return ['id_grupo' => $id];
        } catch (Throwable $e) {
            throw new \Exception("Error al crear el grupo: " . $e->getMessage(), 500);
        }
    }

    /**
     * Actualizar grupo
     */
    public function update(int $id, array $input): array
    {
        Validator::validate($input, [
            'nombre' => 'required|string|min:1|max:100',
            'descripcion' => 'nullable|string|max:255'
        ]);

        $exists = $this->model->find($id);
        if (!$exists) {
            throw new \Exception("Grupo no encontrado", 404);
        }

        try {
            $result = $this->model->update($id, $input);
            if ($result === 0) {
                throw new \Exception("No se pudo actualizar el grupo");
            }
            return ['message' => 'Grupo actualizado correctamente'];
        } catch (Throwable $e) {
            throw new \Exception("Error al actualizar el grupo: " . $e->getMessage(), 500);
        }
    }

    /**
     * Eliminar grupo
     */
    public function delete(int $id): array
    {
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        $exists = $this->model->find($id);
        if (!$exists) {
            throw new \Exception("Grupo no encontrado", 404);
        }

        try {
            $result = $this->model->delete($id);
        } catch (Throwable $e) {
            if ($this->isForeignKeyConstraintViolation($e)) {
                throw new \Exception("No se puede eliminar el grupo: el registro está en uso", 409);
            }

            throw new \Exception("Error al eliminar el grupo: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            throw new \Exception("No se pudo eliminar el grupo");
        }

        return ['message' => 'Grupo eliminado correctamente'];
    }

    private function isForeignKeyConstraintViolation(Throwable $e): bool
    {
        return $e instanceof PDOException && (string) $e->getCode() === '23000';
    }
}
