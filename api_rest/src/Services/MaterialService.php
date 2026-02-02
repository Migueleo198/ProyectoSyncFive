<?php
declare(strict_types=1);

namespace Services;

use Models\MaterialModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class MaterialService
{
    private MaterialModel $model;

    public function __construct()
    {
        $this->model = new MaterialModel();
    }


    public function getAllMateriales(): array
    {
        try {
            return $this->model->all();
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }


    public function getMaterialById(int $id): array
    {
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        try {
            $material = $this->model->find($id);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$material) {
            throw new \Exception("Material no encontrado", 404);
        }

        return $material;
    }


    public function createMaterial(array $input): array
    {
        $data = Validator::validate($input, [
            'id_categoria'      => 'required|int|min:1',
            'nombre'            => 'required|string|max:100',
            'descripcion'       => 'required|string|max:300',
            'estado'            => 'required|string'
        ]);

        try {
            $id = $this->model->create($data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$id) {
            throw new \Exception("No se pudo crear el material");
        }

        return ['id' => $id];
    }


    public function updateMaterial(int $id, array $input): array
    {
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        $data = Validator::validate($input, [
            'id_categoria'      => 'required||min:1',
            'nombre'            => 'required|string|max:100',
            'descripcion'       => 'required|string|max:300',
            'estado'            => 'required|string'
        ]);

        try {
            $result = $this->model->update($id, $data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            $exists = $this->model->find($id);

            if (!$exists) {
                throw new \Exception("Material no encontrado", 404);
            }

            return [
                'status' => 'no_changes',
                'message' => 'No hubo cambios en los datos del material'
            ];
        }

        if ($result === -1) {
            throw new \Exception("No se pudo actualizar el material: conflicto con restricciones", 409);
        }

        return [
            'status' => 'updated',
            'message' => 'Material actualizado correctamente'
        ];
    }

    public function deleteMaterial(int $id): void
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
            throw new \Exception("Material no encontrado", 404);
        }

        if ($result === -1) {
            // Conflicto por FK u otra restricción
            throw new \Exception("No se puede eliminar el material: el registro está en uso", 409);
        }

        // Eliminación exitosa → no retorna nada
    }
   
}
