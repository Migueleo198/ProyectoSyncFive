<?php
declare(strict_types=1);

namespace Middlewares;

use Core\Request;
use Core\JWT;

class AuthMiddleware
{
    public static function verify(Request $req): ?array
    {
        $authHeader = $req->getHeader('Authorization');
        
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }

        $token = trim(substr($authHeader, 7));

        return JWT::decode($token);
    }
}
