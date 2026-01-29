<?php
declare(strict_types=1);

namespace Services;

use Models\CategoriaModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class CategoriaService
{
    private CategoriaModel $model;

    public function __construct()
    {
        $this->model = new CategoriaModel();
    }


    public function getAllCategorias(): array
    {
        try {
            return $this->model->all();
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function createCategoria(array $input): array
    {
        $data = Validator::validate($input, [
            'nombre'            => 'required|string|min:1|max:50',
            'inventariable'     => 'required|int|min:0|max:1'
        ]);

        try {
            $id = $this->model->create($data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$id) {
            throw new \Exception("No se pudo crear la categoría", 500);
        }

        return ['id' => $id];
    }

    public function deleteCategoria(int $id): void
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
            throw new \Exception("Categoría no encontrada", 404);
        }

        if ($result === -1) {
            // Conflicto por FK u otra restricción
            throw new \Exception("No se puede eliminar la categoría: el registro está en uso", 409);
        }

        // Eliminación exitosa → no retorna nada
    }

}
