<?php
declare(strict_types=1);

namespace Core;

class JWT
{
    private static string $secret = '6Jpvmb6BjqwANY0ZCfuUpi5C2gH1GWXiaLhWvhq8Xpw3mATRtu3V24XiHtzhmp98FxY0KeCkG5m034BMzbTf';     // Esta clave se cambiara para cada proyecto

    public static function encode(array $payload, ?int $expMinutes = null): string
    {
        $header = ['alg' => 'HS256', 'typ' => 'JWT'];

        if ($expMinutes === null) {
            $expMinutes = $GLOBALS['config']['jwt']['default_exp_minutes'] ?? 60;
        }

        $payload['exp'] = time() + ($expMinutes * 60);

        $segments = [
            self::base64url_encode(json_encode($header)),
            self::base64url_encode(json_encode($payload)),
        ];

        $signature = hash_hmac('sha256', implode('.', $segments), self::$secret, true);

        $segments[] = self::base64url_encode($signature);

        return implode('.', $segments);
    }

    public static function decode(string $jwt): ?array
    {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) return null;

        [$header, $payload, $signature] = $parts;

        $check = self::base64url_encode(
            hash_hmac('sha256', "$header.$payload", self::$secret, true)
        );

        if (!hash_equals($check, $signature)) {
            return null;
        }

        $data = json_decode(self::base64url_decode($payload), true);
        if (!$data || ($data['exp'] ?? 0) < time()) {
            return null;
        }

        return $data;
    }

    private static function base64url_encode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64url_decode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
