<?php
declare(strict_types=1);

namespace Services;

use Models\CarnetModel;
use Models\GrupoModel;
use Models\PersonaModel;
use DateTimeImmutable;
use PDOException;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class CarnetService
{
    private CarnetModel $model;
    private GrupoModel $grupoModel;
    private PersonaModel $personaModel;

    public function __construct()
    {
        $this->model = new CarnetModel();
        $this->grupoModel = new GrupoModel();
        $this->personaModel = new PersonaModel();
    }

    /**
     * Obtener todos los carnets
     */
    public function getAllCarnets(): array
    {
        try {
            return $this->model->all();
        } catch (Throwable $e) {
            $this->rethrowServiceException($e);
        }
    }

    /**
     * Crear un carnet
     */
    public function createCarnet(array $input): array
    {
        $data = Validator::validate($input, [
            'nombre'         => 'required|string',
            'id_grupo'       => 'required|int|min:1',
            'duracion_meses' => 'required|int|min:1',
        ]);

        if (!$this->grupoModel->find((int) $data['id_grupo'])) {
            throw new \Exception("Grupo no encontrado", 404);
        }

        try {
            $id = $this->model->create($data);
        } catch (Throwable $e) {
            $this->rethrowServiceException($e);
        }

        if (!$id) {
            throw new \Exception("No se pudo crear el carnet");
        }

        return ['ID_Carnet' => $id];
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
            'id_grupo'      => 'int|min:1',
            'duracion_meses'=> 'int|min:1',

            // Asociación a persona (actualizada a string)
            'id_bombero' => 'string'
        ]);

        if (empty($data)) {
            throw new ValidationException([
                'body' => ['No se enviaron campos para actualizar']
            ]);
        }

        if (isset($data['id_grupo']) && !$this->grupoModel->find((int) $data['id_grupo'])) {
            throw new \Exception("Grupo no encontrado", 404);
        }

        try {
            $result = $this->model->update($ID_Carnet, $data);

            if (isset($data['duracion_meses'])) {
                $this->model->refreshPersonExpirationDates((int) $ID_Carnet, (int) $data['duracion_meses']);
            }
        } catch (Throwable $e) {
            $this->rethrowServiceException($e);
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
            if ($this->isForeignKeyConstraintViolation($e)) {
                throw new \Exception(
                    "No se puede eliminar el carnet: el registro está en uso",
                    409
                );
            }

            $this->rethrowServiceException($e);
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
            $exists = $this->model->find($ID_Carnet);

            if (!$exists) {
                throw new \Exception("Carnet no encontrado", 404);
            }

            return $this->model->getPersonsByCarnet($ID_Carnet);

        } catch (Throwable $e) {
            $this->rethrowServiceException($e);
        }
    }

    /**
     * Obtener todos los carnets asociados a una persona
     */
    public function getCarnetsByPerson(string $personIdentifier): array
    {
        Validator::validate(['id_bombero' => $personIdentifier], [
            'id_bombero' => 'required|string'
        ]);

        try {
            $persona = $this->personaModel->findByIdentifier($personIdentifier);

            if (!$persona) {
                throw new \Exception("Persona no encontrada", 404);
            }

            return $this->model->getCarnetsByPerson((string) $persona['id_bombero']);
        } catch (Throwable $e) {
            $this->rethrowServiceException($e);
        }
    }


        
    /**
     * Asignar carnet a una persona
     */
    public function assign(array $input): array
    {
        $data = Validator::validate($input, [
            'id_bombero' => 'required|string',
            'ID_Carnet'   => 'required|string',
            'f_obtencion' => 'required|string'
        ]);

        try {
            $carnet = $this->model->find($data['ID_Carnet']);

            if (!$carnet) {
                throw new \Exception("Carnet no encontrado", 404);
            }

            $fechaVencimiento = $this->calculateExpirationDate(
                $data['f_obtencion'],
                (int) ($carnet['duracion_meses'] ?? 0)
            );

            $result = $this->model->assign(
                $data['id_bombero'],
                $data['ID_Carnet'],
                $data['f_obtencion'],
                $fechaVencimiento
            );

        } catch (Throwable $e) {
            $this->rethrowServiceException($e);
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
            $this->rethrowServiceException($e);
        }

        if ($result === 0) {
            throw new \Exception("Asignación no encontrada", 404);
        }

        return [
            'status'  => 'unassigned',
            'message' => 'Asignación eliminada correctamente'
        ];
    }

    private function calculateExpirationDate(string $fechaObtencion, int $duracionMeses): string
    {
        if ($duracionMeses < 1) {
            throw new ValidationException([
                'duracion_meses' => ['La duración del carnet debe ser mayor que cero']
            ]);
        }

        try {
            $fecha = new DateTimeImmutable($fechaObtencion);
        } catch (Throwable $e) {
            throw new ValidationException([
                'f_obtencion' => ['La fecha de obtención no es válida']
            ]);
        }

        return $fecha->modify(sprintf('+%d months', $duracionMeses))->format('Y-m-d');
    }

    private function rethrowServiceException(Throwable $e): never
    {
        if ($e instanceof ValidationException) {
            throw $e;
        }

        $code = (int) $e->getCode();
        if ($code >= 400 && $code < 600) {
            throw $e;
        }

        throw new \Exception(
            "Error interno en la base de datos: " . $e->getMessage(),
            500
        );
    }

    private function isForeignKeyConstraintViolation(Throwable $e): bool
    {
        return $e instanceof PDOException && (string) $e->getCode() === '23000';
    }
}
?>
