<?php
declare(strict_types=1);

namespace Services;

use Models\RefuerzoModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class RefuerzoService
{
    private RefuerzoModel $model;

    public function __construct()
    {
        $this->model = new RefuerzoModel();
    }

    /**
     * Obtener todos los refuerzos
     */
    public function getAllRefuerzos(): array
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
     * Obtener un refuerzo por su ID (string)
     */
    public function getRefuerzoById(string $ID_Refuerzo): array
    {
        Validator::validate(['ID_Refuerzo' => $ID_Refuerzo], [
            'ID_Refuerzo' => 'required|string'
        ]);

        try {
            $refuerzo = $this->model->find($ID_Refuerzo);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if (!$refuerzo) {
            throw new \Exception("Refuerzo no encontrado", 404);
        }

        return $refuerzo;
    }

    /**
     * Crear un refuerzo
     */
    public function createRefuerzo(array $input): array
    {
        $data = Validator::validate($input, [
            'ID_Refuerzo'     => 'required|string',
            'Fecha'        => 'required|date',
            'H_inicio'          => 'required|int',
            'H_fin'          => 'required|int',
            'horas'      => 'int'
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
            throw new \Exception("No se pudo crear el refuerzo");
        }

        return ['ID_Refuerzo' => $data['ID_Refuerzo']];
    }

    /**
     * Actualizar refuerzo
     */
    public function updateRefuerzo(string $ID_Refuerzo, array $input): array
    {
        Validator::validate(['ID_Refuerzo' => $ID_Refuerzo], [
            'ID_Refuerzo' => 'required|string'
        ]);

        $data = Validator::validate($input, [
            'ID_Refuerzo'     => 'required|string',
            'Fecha'        => 'required|date',
            'H_inicio'          => 'required|int',
            'H_fin'          => 'required|int',
            'horas'      => 'int'
        ]);

        if (empty($data)) {
            throw new ValidationException([
                'body' => ['No se enviaron campos para actualizar']
            ]);
        }

        try {
            $result = $this->model->update($ID_Refuerzo, $data);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            $exists = $this->model->find($ID_Refuerzo);

            if (!$exists) {
                throw new \Exception("Refuerzo no encontrado", 404);
            }

            return [
                'status'  => 'no_changes',
                'message' => 'No hubo cambios en el refuerzo'
            ];
        }

        if ($result === -1) {
            throw new \Exception(
                "No se pudo actualizar el refuerzo: conflicto con restricciones",
                409
            );
        }

        return [
            'status'  => 'updated',
            'message' => 'Refuerzo actualizado correctamente'
        ];
    }

    /**
     * Eliminar un refuerzo
     */
    public function deleteRefuerzo(string $ID_Refuerzo): void
    {
        Validator::validate(['ID_Refuerzo' => $ID_Refuerzo], [
            'ID_Refuerzo' => 'required|string'
        ]);

        try {
            $result = $this->model->delete($ID_Refuerzo);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            throw new \Exception("Refuerzo no encontrado", 404);
        }

        if ($result === -1) {
            throw new \Exception(
                "No se puede eliminar el refuerzo: el registro está en uso",
                409
            );
        }
    }
}
?>
