<?php
declare(strict_types=1);

namespace Services;

use Validation\Validator;
use Validation\ValidationException;
use Models\ProfesorModel;
use Core\JWT;
use PDOException;

class AuthSessionService
{
    private ProfesorModel $model;

    public function __construct()
    {
        $this->model = new ProfesorModel();
    }


    public function login(string $login, string $password): array
    {
        $this->validateLoginData($login, $password);
        
        try {
            $user = $this->model->findByLogin($login);
        } catch (PDOException $e) {
            throw new \Exception("Error interno en la base de datos", 500);
        }

        if (!$user || !password_verify($password, $user['password'])) {
            throw new \Exception("Credenciales incorrectas", 401);
        }

        unset($user['password']);
        $user['rol'] = $user['id_rol'];

        return $user;
    }


    private function validateLoginData(string $login, string $password): void
    {
        Validator::validate(compact('login','password'), [
            'login'    => 'required|string|min:3|max:30',
            'password' => 'required|string|min:6|max:100'
        ]);
    }
}
