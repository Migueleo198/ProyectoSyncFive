<?php
declare(strict_types=1);

namespace Core;

class Session
{
    private static int $cookieLifetime = TMP_SESION;


    public static function start(): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_set_cookie_params(self::$cookieLifetime);
            session_start();
        }
    }


    public static function createUserSession(array $userData): void
    {
        self::start();
        session_regenerate_id(true);
        $_SESSION["user"] = $userData;
    }


    public static function hasUser(): bool
    {
        self::start();
        return isset($_SESSION["user"]);
    }


    public static function getUser(): ?array
    {
        self::start();
        return $_SESSION["user"] ?? null;
    }


    public static function get(string $key, mixed $default = null): mixed
    {
        self::start();
        return $_SESSION[$key] ?? $default;
    }


    public static function set(string $key, mixed $value): void
    {
        self::start();
        $_SESSION[$key] = $value;
    }


    public static function remove(string $key): void
    {
        self::start();
        unset($_SESSION[$key]);
    }


    public static function destroy(): void
    {
        self::start();

        setcookie(session_name(), '', time() - 3600, "/");
        session_unset();
        session_destroy();
        $_SESSION = [];
    }
}
