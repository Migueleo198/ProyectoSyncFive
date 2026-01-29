<?php
declare(strict_types=1);

namespace Services;

use Validation\Validator;
use Validation\ValidationException;
use Models\PersonaModel;
use Core\EmailService;
use PDOException;

class AuthSessionService
{
    private PersonaModel $model;
    private EmailService $mailer;

    public function __construct()
    {
        $this->model  = new PersonaModel();
        $this->mailer = new EmailService();
    }

    /**
     * Login de usuario
     */
    public function login(string $login, string $password): array
    {
        $this->validateLoginData($login, $password);

        try {
            $user = $this->model->findByLogin($login);
        } catch (PDOException) {
            throw new \Exception("Error interno en la base de datos", 500);
        }

        if (!$user || !password_verify($password, $user['contrasenia'])) {
            throw new \Exception("Credenciales incorrectas", 401);
        }

        if (!(bool)$user['activo']) {
            throw new \Exception("La cuenta no está activada", 403);
        }

        $this->model->updateLastLogin($user['id_bombero']);

        unset(
            $user['contrasenia'],
            $user['token_activacion'],
            $user['fecha_exp_token_activacion'],
            $user['token_cambio_contrasenia'],
            $user['fecha_exp_cambio_contrasenia']
        );

        $user['rol'] = $user['id_rol'];

        return $user;
    }

    /**
     * Recuperar contraseña (envía email con token)
     */
    public function recoverPassword(string $correo): void
    {
        if (!$correo) {
            throw new ValidationException(['correo' => ['Correo requerido']]);
        }

        $user = $this->model->findByEmail($correo);

        if (!$user || !(bool)$user['activo']) {
            return; // no revelamos si existe o no
        }

        $token  = bin2hex(random_bytes(32));
        $expiry = (new \DateTimeImmutable('+1 hour'))->format('Y-m-d H:i:s');

        $this->model->setPasswordResetToken(
            $user['id_bombero'],
            $token,
            $expiry
        );

        $this->mailer->sendPasswordResetEmail(
            $user['correo'],
            $user['nombre'],
            $token
        );
    }

    /**
     * Cambiar contraseña mediante token
     */
    public function changePassword(string $token, string $password): void
    {
        Validator::validate(compact('token', 'password'), [
            'token'    => 'required|string',
            'password' => 'required|string|min:6|max:100'
        ]);

        $user = $this->model->findByPasswordResetToken($token);

        if (!$user) {
            throw new \Exception("Token inválido", 404);
        }

        if (new \DateTimeImmutable($user['fecha_exp_cambio_contrasenia']) < new \DateTimeImmutable()) {
            throw new \Exception("Token expirado", 400);
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $this->model->updatePassword($user['id_bombero'], $hash);
    }

    /**
     * Validación de login
     */
    private function validateLoginData(string $login, string $password): void
    {
        Validator::validate(compact('login', 'password'), [
            'login'    => 'required|string|min:3|max:30',
            'password' => 'required|string|min:6|max:100'
        ]);
    }
}
