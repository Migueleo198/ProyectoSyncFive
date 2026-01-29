<?php
declare(strict_types=1);

namespace Services;

use Models\InstalacionModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class InstalacionService
{
    private InstalacionModel $model;

    public function __construct()
    {
        $this->model = new InstalacionModel();
    }

    /**
     * Obtener todas las Instalaciones
     */
    public function getAllInstalaciones(): array
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
     * Obtener una Instalacion por id_instalacion
     */
    public function getInstalacionById(string $id_instalacion): array
    {
        Validator::validate(['id_instalacion' => $id_instalacion], [
            'id_instalacion' => 'required|string'
        ]);

        try {
            $Instalacion = $this->model->find($id_instalacion);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if (!$Instalacion) {
            throw new \Exception("Instalacion no encontrada", 404);
        }

        return $Instalacion;
    }

    /**
     * Crear una Instalacion
     */
    public function createInstalacion(array $input): array
    {
        // Validación
        $data = Validator::validate($input, [
            'id_instalacion'        => 'required|string',
            'nombre'                => 'required|string|min:2|max:100',
            'direccion'             => 'required|string|min:5|max:150',
            'localidad'             => 'required|string|min:2|max:100',
            'provincia'             => 'required|string|min:5|max:255',
            'telefono'              => 'required|phone',
            'correo'                => 'required|email',

        ]);

        // Generación automática de token
        $data['token_activacion'] = bin2hex(random_bytes(32));
        $data['fecha_exp_token_activacion'] = (new \DateTimeImmutable('+1 hour'))
            ->format('Y-m-d H:i:s');

        try {
            $pk = $this->model->create($data);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if (!$pk) {
            throw new \Exception("No se pudo crear la Instalacion");
        }

        return [
            'id_instalacion' => $data['id_instalacion'],
        ];
    }

    /**
     * Actualizar datos de una Instalacion
     */
    public function updateInstalacion(string $id_instalacion, array $input): array
    {
        Validator::validate(['id_instalacion' => $id_instalacion], [
            'id_instalacion' => 'required|string'
        ]);

        $data = Validator::validate($input, [
            'talla_superior'        => 'string|min:1',
            'talla_inferior'        => 'string|min:1',
            'talla_calzado'         => 'int|min:30|max:50',

            'domicilio'             => 'string|min:5|max:255',
            'localidad'             => 'string|min:2|max:100',

            'correo'                => 'email',
            'telefono'              => 'phone',
            'telefono_emergencia'   => 'phone',

            'nombre_usuario'        => 'username',
            'activo'                => 'boolean',

            'fecha_ult_inicio_sesion' => 'datetime',
        ]);

        if (empty($data)) {
            throw new ValidationException([
                'body' => ['No se enviaron campos para actualizar']
            ]);
        }

        try {
            $result = $this->model->update($id_instalacion, $data);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            $exists = $this->model->find($id_instalacion);

            if (!$exists) {
                throw new \Exception("Instalacion no encontrada", 404);
            }

            return [
                'status'  => 'no_changes',
                'message' => 'No hubo cambios en la Instalacion'
            ];
        }

        if ($result === -1) {
            throw new \Exception(
                "No se pudo actualizar la Instalacion: conflicto con restricciones",
                409
            );
        }

        return [
            'status'  => 'updated',
            'message' => 'Instalacion actualizada correctamente'
        ];
    }

    /**
     * Eliminar una Instalacion
     */
    public function deleteInstalacion(string $id_instalacion): void
    {
        Validator::validate(['id_instalacion' => $id_instalacion], [
            'id_instalacion' => 'required|string'
        ]);

        try {
            $result = $this->model->delete($id_instalacion);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            throw new \Exception("Instalacion no encontrada", 404);
        }

        if ($result === -1) {
            throw new \Exception(
                "No se puede eliminar la Instalacion: el registro está en uso",
                409
            );
        }
    }
}
