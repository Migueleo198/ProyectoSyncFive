<?php
declare(strict_types=1);

namespace Services;

use Models\CarnetModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class CarnetService
{
    private CarnetModel $model;

    public function __construct()
    {
        $this->model = new CarnetModel();
    }

    /**
     * Obtener todos los carnets
     */
    public function getAllCarnets(): array
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
     * Crear un carnet
     */
    public function createCarnet(array $input): array
    {
        $data = Validator::validate($input, [
            'ID_Carnet'     => 'required|string',
            'Nombre'        => 'required|string',
            'Tipo'          => 'required|string',
            'Duracion'      => 'required|int|min:1',

            // Si el carnet pertenece a una persona:
            'n_funcionario' => 'string' // ahora SIEMPRE string
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
            throw new \Exception("No se pudo crear el carnet");
        }

        return ['ID_Carnet' => $data['ID_Carnet']];
    }

    /**
     * Eliminar un carnet
     */
    public function deleteCarnet(string $ID_Carnet): void
    {
        Validator::validate(['ID_Carnet' => $ID_Carnet], [
            'ID_Carnet' => 'required|string'
        ]);

        try {
            $result = $this->model->delete($ID_Carnet);
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
