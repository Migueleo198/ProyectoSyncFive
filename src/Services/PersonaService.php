<?php
declare(strict_types=1);

namespace Services;

use Models\PersonaModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class PersonaService
{
    private PersonaModel $model;

    public function __construct()
    {
        $this->model = new PersonaModel();
    }

    /**
     * Obtener todas las personas
     */
    public function getAllPersonas(): array
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
     * Obtener una persona por n_funcionario
     */
    public function getPersonaById(string $n_funcionario): array
    {
        Validator::validate(['n_funcionario' => $n_funcionario], [
            'n_funcionario' => 'required|string'
        ]);

        try {
            $persona = $this->model->find($n_funcionario);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if (!$persona) {
            throw new \Exception("Persona no encontrada", 404);
        }

        return $persona;
    }

    /**
     * Crear una persona
     */
    public function createPersona(array $input): array
    {
        // Validación
        $data = Validator::validate($input, [
            'n_funcionario'         => 'required|string',
            'ID_bombero'            => 'required|string',

            'DNI'                   => 'required|string|dni',
            'nombre'                => 'required|string|min:2|max:100',
            'apellidos'             => 'required|string|min:2|max:150',
            'f_nacimiento'          => 'required|date',

            'talla_superior'        => 'required|string|min:1',
            'talla_inferior'        => 'required|string|min:1',
            'talla_calzado'         => 'required|int|min:30|max:50',

            'domicilio'             => 'required|string|min:5|max:255',
            'localidad'             => 'required|string|min:2|max:100',

            'correo'                => 'required|email',
            'telefono'              => 'required|phone',
            'telefono_emergencia'   => 'required|phone',

            'f_ingreso_diputacion'  => 'required|date',

            'nombre_usuario'        => 'required|username',
            'fecha_ult_inicio_sesion' => 'date',
            'activo'                => 'required|boolean',

            'token_activacion'      => 'string|min:32|max:255',
            'fecha_exp_token_activacion' => 'date'
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
            throw new \Exception("No se pudo crear la persona");
        }

        return [
            'n_funcionario' => $data['n_funcionario'],
            'ID_bombero'    => $data['ID_bombero']
        ];
    }

    /**
     * Actualizar datos de una persona
     */
    public function updatePersona(string $n_funcionario, array $input): array
    {
        Validator::validate(['n_funcionario' => $n_funcionario], [
            'n_funcionario' => 'required|string'
        ]);

        $data = Validator::validate($input, [
            'ID_bombero'            => 'string',

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
            $result = $this->model->update($n_funcionario, $data);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            $exists = $this->model->find($n_funcionario);

            if (!$exists) {
                throw new \Exception("Persona no encontrada", 404);
            }

            return [
                'status'  => 'no_changes',
                'message' => 'No hubo cambios en la persona'
            ];
        }

        if ($result === -1) {
            throw new \Exception(
                "No se pudo actualizar la persona: conflicto con restricciones",
                409
            );
        }

        return [
            'status'  => 'updated',
            'message' => 'Persona actualizada correctamente'
        ];
    }

    /**
     * Eliminar una persona
     */
    public function deletePersona(string $n_funcionario): void
    {
        Validator::validate(['n_funcionario' => $n_funcionario], [
            'n_funcionario' => 'required|string'
        ]);

        try {
            $result = $this->model->delete($n_funcionario);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            throw new \Exception("Persona no encontrada", 404);
        }

        if ($result === -1) {
            throw new \Exception(
                "No se puede eliminar la persona: el registro está en uso",
                409
            );
        }
    }
}
