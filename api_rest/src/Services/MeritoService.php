<?php
declare(strict_types=1);

namespace Services;

use Models\MeritoModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class MeritoService
{
    private MeritoModel $model;

    public function __construct()
    {
        $this->model = new MeritoModel();
    }

    /**
     * Obtener todos los meritos
     */
    public function getAllMeritos(): array
    {
        try {
            return $this->model->all();
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }
    }

    /**
     * Crear un merito
     */
    public function createMerito(array $input): array
    {
        $data = Validator::validate($input, [
            'nombre'              => 'required|string|max:100',
            'descripcion'         => 'required|string'
        ]);

        try {
            $id = $this->model->create($data);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if (!$id) {
            throw new \Exception("No se pudo crear el merito");
        }

        return ['id_merito' => $id];
    }

    /**
     * Eliminar un merito
     */
    public function deleteMerito(int $id_merito): void
    {
        Validator::validate(['id_merito' => $id_merito], [
            'id_merito' => 'required|int|min:1'
        ]);

        try {
            $result = $this->model->delete($id_merito);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            throw new \Exception("Carnet no encontrado", 404);
        }

        if ($result === -1) {
            throw new \Exception(
                "No se puede eliminar el carnet: el registro está en uso",
                409
            );
        }
    }
}
?>