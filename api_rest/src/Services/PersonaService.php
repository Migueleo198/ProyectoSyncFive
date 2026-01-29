<?php
declare(strict_types=1);

namespace Services;

// Acceso a la base de datos
use Models\PersonaModel;
// Validación centralizada de datos
use Validation\Validator;
// Permite capturar cualquier tipo de error o excepción
use Throwable;

class PersonaService
{
    private PersonaModel $model;
    // Constructor
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
            // Devuelve todas las personas
            return $this->model->all();
        } catch (Throwable $e) {
            throw new \Exception(
                // Captura errores genéricos
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }
    }

    /**
     * Obtener una persona por numero de funcionario
     */
    public function getPersonaById(int $n_funcionario): array
    {
        // Valida ID
        Validator::validate(['n_funcionario' => $n_funcionario], [
            'n_funcionario' => 'required|int|min:1'
        ]);

        try {
            // Busqueda de la persona por n_funcionario
            $persona = $this->model->find($n_funcionario);
        } catch (Throwable $e) {
            throw new \Exception(
                // Errores genéricos
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if (!$persona) {
            // Si no se encuentra la persona
            throw new \Exception("Persona no encontrada", 404);
        }
        // Éxito
        return $persona;
    }
    
    /**
     * Crear una persona
     */
    public function createPersona(array $input): array
    {
        // Validación de campos
        $data = Validator::validate($input, [
            // Datos personales
            'n_funcionario'         => 'required|string',
            'DNI'                   => 'required|string|dni',
            'nombre'                => 'required|string|min:2|max:100',
            'apellidos'             => 'required|string|min:2|max:150',
            'f_nacimiento'          => 'required|date',

            // Habría que mejorar esta gestión de tallas
            'talla_superior'        => 'required|string|min:1',
            'talla_inferior'        => 'required|string|min:1',
            'talla_calzado'         => 'required|int|min:30|max:50',

            'domicilio'             => 'required|string|min:5|max:255',
            'localidad'             => 'required|string|min:2|max:100',

            // Información de contacto
            'correo'                => 'required|email',
            'telefono'              => 'required|phone',
            'telefono_emergencia'        => 'required|phone',

            // Datos trabajo
            'f_ingreso_diputacion'  => 'required|date',

            // Datos de usuario
            'nombre_usuario'        => 'required|username',
            'fecha_ult_inicio_sesion'   => 'date',
            'activo'                => 'required|boolean',

            'token_activacion'      => 'string|min:32|max:255',
            'fecha_exp_token_activacion'=> 'date'
        ]);


        // Enriquecer datos
        $data['token_activacion'] = bin2hex(random_bytes(32));
        $data['fecha_exp_token_activacion'] = (new \DateTimeImmutable('+1 hour'))
            ->format('Y-m-d H:i:s');

        try {
            // Inserta la persona
            $n_funcionario = $this->model->create($data);
        } catch (Throwable $e) {
            throw new \Exception(
                // Error general
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if (!$n_funcionario) {
            // Error
            throw new \Exception("No se pudo crear la persona");
        }

        // Éxito
        return ['n_funcionario' => $n_funcionario];
    }

    /**
     * Registrar nuevo usuario
     */
    public function registerUser(array $data): string
    {
        Validator::validate($data, [
            'id_bombero'    => 'required|string|max:20',
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
        $data['activo'] = false;

        $this->model->create($data);

        // Enviar email de activación
        $this->mailer->sendActivationEmail(
            $data['correo'],
            $data['nombre'],
            $data['token_activacion']
        );

        return $data['token_activacion'];
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
        // Valida el ID
        Validator::validate(['n_funcionario' => $n_funcionario], [
            'n_funcionario' => 'required|int|min:1'
        ]);

        $data = Validator::validate($input, [

            // Se podría mejorar estas validaciones
            'talla_superior'        => 'string|min:1',
            'talla_inferior'        => 'string|min:1',
            'talla_calzado'         => 'int|min:30|max:50',

            'domicilio'             => 'string|min:5|max:255',
            'localidad'             => 'string|min:2|max:100',

            // Contacto
            'correo'                => 'email',
            'telefono'              => 'phone',
            'telefono_emergencia'   => 'phone',

            // Usuario
            'nombre_usuario'        => 'username',
            'activo'                => 'boolean',

            // Auditoría
            'fecha_ult_inicio_sesion' => 'datetime',
        ]);

        // Si llega vacio
        if (empty($data)) {
            throw new ValidationException([
                'body' => ['No se enviaron campos para actualizar']
            ]);
        }

        try {
            // Intenta realizar la actualización
            $result = $this->model->update($n_funcionario, $data);
        } catch (Throwable $e) {
            throw new \Exception(
                // Error genérico
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            $exists = $this->model->find($n_funcionario);

            // Persona no existe
            if (!$exists) {
                throw new \Exception("Persona no encontrada", 404);
            }

            // No hubo cambios
            return [
                'status'  => 'no_changes',
                'message' => 'No hubo cambios en la persona'
            ];
        }

        if ($result === -1) {
            // Conflicto FK
            throw new \Exception(
                "No se pudo actualizar la persona: conflicto con restricciones",
                409
            );
        }

        // Éxito
        return [
            'status'  => 'updated',
            'message' => 'Persona actualizada correctamente'
        ];
    }

    /**
     * Eliminar una persona
     */
    public function deletePersona(int $n_funcionario): void
    {
        Validator::validate(['n_funcionario' => $n_funcionario], [
            'n_funcionario' => 'required|int|min:1'
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

        // Eliminación exitosa → no retorna nada
    }
}