<?php
declare(strict_types=1);

namespace Services;

use Models\RefuerzoModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;
use PDOException;

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
    public function getRefuerzoById(string $id_turno_refuerzo): array
    {
        Validator::validate(['id_turno_refuerzo' => $id_turno_refuerzo], [
            'id_turno_refuerzo' => 'required|string'
        ]);

        try {
            $refuerzo = $this->model->find($id_turno_refuerzo);
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
            'f_inicio' => 'required|string',
            'f_fin'    => 'required|string',
            'horas'    => 'int'
        ]);

        try {
            $id = $this->model->create($data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$id) {
            throw new \Exception("No se pudo crear el refuerzo");
        }

        return [
            'id_turno_refuerzo' => $id,
            'f_inicio' => $data['f_inicio'],
            'f_fin'    => $data['f_fin'],
            'horas'    => $data['horas'] ?? null
        ];
    }

    /**
     * Actualizar refuerzo
     */
    public function updateRefuerzo(string $id_turno_refuerzo, array $input): array
    {
        Validator::validate(['id_turno_refuerzo' => $id_turno_refuerzo], [
            'id_turno_refuerzo' => 'required|string'
        ]);

        $data = Validator::validate($input, [
            'f_inicio'   => 'required|string',
            'f_fin'      => 'required|string',
            'horas'      => 'int'
        ]);

        if (empty($data)) {
            throw new ValidationException([
                'body' => ['No se enviaron campos para actualizar']
            ]);
        }

        try {
            $result = $this->model->update($id_turno_refuerzo, $data);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            $exists = $this->model->find($id_turno_refuerzo);

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
    public function deleteRefuerzo(string $id_turno_refuerzo): void
    {
        Validator::validate(['id_turno_refuerzo' => $id_turno_refuerzo], [
            'id_turno_refuerzo' => 'required|string'
        ]);

        try {
            $result = $this->model->delete($id_turno_refuerzo);
        } catch (PDOException $e) {
            // Verificar si es una violación de clave foránea
            if ($e->getCode() === '23000' || strpos($e->getMessage(), 'foreign key constraint') !== false) {
                throw new \Exception("No se puede eliminar este refuerzo porque hay personas asignadas", 409);
            }
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            throw new \Exception("Refuerzo no encontrado", 404);
        }
    }
    /**
 * Asignar un refuerzo a una persona
 */
public function assignRefuerzoToPerson(array $input): array
{
    $data = Validator::validate($input, [
        'id_bombero'        => 'required|string',
        'id_turno_refuerzo'          => 'required|string',  // coincide con lo que envía el frontend
    ]);

    try {
        $success = $this->model->assignToPerson(
            $data['id_bombero'],
            $data['id_turno_refuerzo']
        );
    } catch (Throwable $e) {
        throw new \Exception("Error interno al asignar refuerzo: " . $e->getMessage(), 500);
    }

    if (!$success) {
        throw new \Exception("No se pudo asignar el refuerzo a la persona", 409);
    }

    return [
        'status'   => 'assigned',
        'message'  => 'Refuerzo asignado correctamente',
        'id_bombero' => $data['id_bombero'],
        'id_turno_refuerzo'   => $data['id_turno_refuerzo']
    ];
}

    /**
     * Desasignar un refuerzo de una persona
     */
    public function unassignRefuerzoFromPerson(string $id_bombero, string $id_turno_refuerzo): array
    {
        Validator::validate([
            'id_bombero' => $id_bombero,
            'id_turno_refuerzo'   => $id_turno_refuerzo
        ], [
            'id_bombero' => 'required|string',
            'id_turno_refuerzo'   => 'required|string'
        ]);

        try {
            $affected = $this->model->unassignFromPerson($id_bombero, $id_turno_refuerzo);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno al desasignar refuerzo: " . $e->getMessage(),
                500
            );
        }

        if ($affected === 0) {
            throw new \Exception("No se encontró la asignación para eliminar", 404);
        }

        return [
            'status' => 'unassigned',
            'message' => 'Refuerzo desasignado correctamente',
            'id_bombero' => $id_bombero,
            'id_turno_refuerzo' => $id_turno_refuerzo
        ];
    }

}
?>
