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
            'nombre'        => 'required|string',
            'categoria'          => 'required|string',
            'duracion_meses'      => 'required|int|min:1',

            // Si el carnet pertenece a una persona:
            'id_bombero' => 'string'
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
     * Actualizar carnet
     */
    public function updateCarnet(string $ID_Carnet, array $input): array
    {
        Validator::validate(['ID_Carnet' => $ID_Carnet], [
            'ID_Carnet' => 'required|string'
        ]);

        $data = Validator::validate($input, [
            'nombre'        => 'string|min:1',
            'categoria'          => 'string|min:1',
            'duracion_meses'      => 'int|min:1',

            // Asociación a persona (actualizada a string)
            'n_funcionario' => 'string'
        ]);

        if (empty($data)) {
            throw new ValidationException([
                'body' => ['No se enviaron campos para actualizar']
            ]);
        }

        try {
            $result = $this->model->update($ID_Carnet, $data);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            $exists = $this->model->find($ID_Carnet);

            if (!$exists) {
                throw new \Exception("Carnet no encontrado", 404);
            }

            return [
                'status'  => 'no_changes',
                'message' => 'No hubo cambios en el carnet'
            ];
        }

        if ($result === -1) {
            throw new \Exception(
                "No se pudo actualizar el carnet: conflicto con restricciones",
                409
            );
        }

        return [
            'status'  => 'updated',
            'message' => 'Carnet actualizado correctamente'
        ];
    }

    /**
     * Eliminar un carnet
     */
    public function deleteCarnet(int $ID_Carnet): void
    {
        Validator::validate(['ID_Carnet' => $ID_Carnet], [
            'ID_Carnet' => 'required|int|min:1'
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

    /**
     * Obtener todas las personas asociadas a un carnet
     */
    public function getPersonsByCarnet(string $ID_Carnet): array
    {
        Validator::validate(['ID_Carnet' => $ID_Carnet], [
            'ID_Carnet' => 'required|string'
        ]);

        try {
            // verificamos que el carnet exista primero
            $exists = $this->model->find($ID_Carnet);

            if (!$exists) {
                throw new \Exception("Carnet no encontrado", 404);
            }

            return $this->model->getPersonsByCarnet($ID_Carnet);

        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }
    }
    /**
     * Asignar carnet a una persona
     */
    public function assignCarnetToPerson(array $input): array
    {
        $data = Validator::validate($input, [
            'n_funcionario' => 'required|string',
            'ID_Carnet'     => 'required|string',
            'f_obtencion'   => 'required|string',
            'f_vencimiento' => 'required|string'
        ]);

        try {
            $exists = $this->model->find($data['ID_Carnet']);

            if (!$exists) {
                throw new \Exception("Carnet no encontrado", 404);
            }

            $result = $this->model->assignToPerson(
                $data['n_funcionario'],
                $data['ID_Carnet'],
                $data['f_obtencion'],
                $data['f_vencimiento']
            );

        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if (!$result) {
            throw new \Exception("No se pudo asignar el carnet", 409);
        }

        return [
            'status'  => 'assigned',
            'message' => 'Carnet asignado correctamente'
        ];
    }
    /**
     * Eliminar asignación carnet-persona
     */
    public function unassignCarnetFromPerson(string $n_funcionario, string $ID_Carnet): array
    {
        Validator::validate([
            'n_funcionario' => $n_funcionario,
            'ID_Carnet'     => $ID_Carnet
        ], [
            'n_funcionario' => 'required|string',
            'ID_Carnet'     => 'required|string'
        ]);

        try {
            $result = $this->model->unassignFromPerson($n_funcionario, $ID_Carnet);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            throw new \Exception("Asignación no encontrada", 404);
        }

        return [
            'status'  => 'unassigned',
            'message' => 'Asignación eliminada correctamente'
        ];
    }


}
?>
