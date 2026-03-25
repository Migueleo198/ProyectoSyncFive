<?php
declare(strict_types=1);

namespace Services;

use Models\MeritoModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;
use PDOException;

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
        } catch (PDOException $e) {
            // Verificar si es una violación de clave foránea
            if ($e->getCode() === '23000' || strpos($e->getMessage(), 'foreign key constraint') !== false) {
                throw new \Exception("No se puede eliminar este mérito porque hay personas que lo tienen asignado", 409);
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
            throw new \Exception("Mérito no encontrado", 404);
        }
    }
    /**
     * Asignar mérito a persona
     */
    public function assignMeritoToPerson(array $input): array
    {
        $data = Validator::validate($input, [
            'id_bombero' => 'required|string',
            'id_merito'  => 'required|int|min:1'
        ]);

        try {
            $exists = $this->model->find($data['id_merito']);
            if (!$exists) {
                throw new \Exception("Mérito no encontrado", 404);
            }

            $result = $this->model->assignToPerson(
                $data['id_bombero'],
                $data['id_merito']
            );
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if (!$result) {
            throw new \Exception("No se pudo asignar el mérito", 409);
        }

        return [
            'status'  => 'assigned',
            'message' => 'Mérito asignado correctamente'
        ];
    }
    public function unassignMeritoFromPerson(array $input): array
    {
        $data = Validator::validate($input, [
            'id_bombero' => 'required|string',
            'id_merito'  => 'required|int|min:1'
        ]);

        try {
            $result = $this->model->unassignFromPerson(
                $data['id_bombero'],
                $data['id_merito']
            );
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            throw new \Exception("No existía esa asignación", 404);
        }

        return [
            'status'  => 'unassigned',
            'message' => 'Mérito desasignado correctamente'
        ];
    }
    public function getPersonsByMerito(string $id_merito): array
{
    try {
        return $this->model->getPersonsByMerito((int)$id_merito);
    } catch (Throwable $e) {
        throw new \Exception(
            "Error interno en la base de datos: " . $e->getMessage(),
            500
        );
    }
}
}
?>