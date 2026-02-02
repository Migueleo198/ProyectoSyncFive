<?php
declare(strict_types=1);

namespace Services;

use Models\PersonaModel;
use Validation\Validator;
use Validation\ValidationException;
use Core\EmailService;
use Throwable;

class PersonaService
{
    private PersonaModel $model;
    private EmailService $mailer;

    public function __construct()
    {
        $this->model = new PersonaModel();
        $this->mailer = new EmailService();
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
     * Registrar un nuevo usuario y enviar email de activación
     */
    public function registerUser(array $data): array
    {
        Validator::validate($data, [
            'id_bombero'    => 'required|string|max:4',
            'n_funcionario' => 'required|string|max:17',
            'nombre'        => 'required|string|max:50',
            'apellidos'     => 'required|string|max:100',
            'correo'        => 'required|email|max:100',
            'nombre_usuario'=> 'required|string|max:30',
            'contrasenia'   => 'required|string|min:6|max:100',
        ]);

        // Hash de la contraseña
        $data['contrasenia'] = password_hash($data['contrasenia'], PASSWORD_DEFAULT);

        // Generar token de activación
        $data['token_activacion'] = bin2hex(random_bytes(32));
        $data['fecha_exp_token_activacion'] = (new \DateTimeImmutable('+24 hours'))->format('Y-m-d H:i:s');
        $data['activo'] = 0;

        $id_bombero = $this->model->create($data);

        if ($id_bombero === false) {
            throw new \Exception("No se pudo crear la persona", 500);
        }

        // Enviar email de activación
        $this->mailer->sendActivationEmail(
            $data['correo'],
            $data['nombre'],
            $data['token_activacion']
        );

        // Devolver token y datos principales
        return [
            'token_activacion' => $data['token_activacion'],
            'n_funcionario'    => $data['n_funcionario'],
            'id_bombero'       => $id_bombero,
        ];
    }

    /**
     * Activar cuenta mediante token
     */
    public function activateAccount(string $token): void
    {
        if (!$token) {
            throw new ValidationException(['token' => ['Token requerido']]);
        }

        $user = $this->model->findByActivationToken($token);

        if (!$user) {
            throw new \Exception("Token inválido", 404);
        }

        if (new \DateTimeImmutable($user['fecha_exp_token_activacion']) < new \DateTimeImmutable()) {
            throw new \Exception("Token expirado", 400);
        }

        if ((bool)$user['activo']) {
            throw new \Exception("La cuenta ya está activada", 400);
        }

        $this->model->activateUser($user['id_bombero']);
    }

    /**
    * Actualizar datos de persona
    */
    public function updatePersona(int $n_funcionario, array $input): array
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
