<?php

namespace Middlewares;

use Exception;

class RoleMiddleware
{
    public static function check($user, array $allowedRoles)
    {
        if (empty($allowedRoles)) {
            return true;
        }

        if (!isset($user['rol'])) {
            throw new Exception("El usuario no tiene un rol asignado", 403);
        }

        if (!in_array($user['rol'], $allowedRoles)) {
            throw new Exception("No tienes permisos para acceder a este recurso", 403);
        }

        return true;
    }
}
