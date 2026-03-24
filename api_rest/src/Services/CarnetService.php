<?php
declare(strict_types=1);

namespace Services;

use Models\CarnetModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;
use PDOException;

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
            'nombre'         => 'required|string',
            'categoria'      => 'required|string',
            'duracion_meses' => 'required|int|min:1',
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

        return ['ID_Carnet' => $id]; // ← devuelve el id generado por la BDD
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
            'id_bombero' => 'string'
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
        } catch (PDOException $e) {
            // Verificar si es una violación de clave foránea
            if ($e->getCode() === '23000' || strpos($e->getMessage(), 'foreign key constraint') !== false) {
                throw new \Exception("No se puede eliminar este carnet porque hay personas que lo tienen asignado", 409);
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
            throw new \Exception("Carnet no encontrado", 404);
        }
    }

    /**
     * Obtener todas las personas asociadas a un carnet NO SE USA TODAVIA PARA UNA FURUTA EXPANSION
     */
/*     public function getPersonsByCarnet(string $ID_Carnet): array
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
    } */


        
    /**
     * Asignar carnet a una persona
     */
    public function assign(array $input): array
    {
        $data = Validator::validate($input, [
            'id_bombero' => 'required|string',
            'ID_Carnet'     => 'required|string',
            'f_obtencion'   => 'required|string',
            'f_vencimiento' => 'required|string'
        ]);

        try {
            $exists = $this->model->find($data['ID_Carnet']);

            if (!$exists) {
                throw new \Exception("Carnet no encontrado", 404);
            }

            $result = $this->model->assign(
                $data['id_bombero'],
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
 * Obtener carnet por ID
 */
public function getCarnetById(int $id): array
{
    $carnet = $this->model->findById($id);

    if (!$carnet) {
        throw new \Exception("Carnet no encontrado", 404);
    }

    return $carnet;
}
    /**
     * Eliminar asignación carnet-persona
     */
    public function unassignCarnetFromPerson(string $id_bombero, string $ID_Carnet): array
    {
        Validator::validate([
            'id_bombero' => $id_bombero,
            'ID_Carnet'     => $ID_Carnet
        ], [
            'id_bombero' => 'required|string',
            'ID_Carnet'     => 'required|string'
        ]);

        try {
            $result = $this->model->unassignFromPerson($id_bombero, $ID_Carnet);
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
