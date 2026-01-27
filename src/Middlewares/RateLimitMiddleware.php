<?php
declare(strict_types=1);

namespace Middlewares;

use Core\Request;
use Core\Response;

class RateLimitMiddleware
{
    private int $maxRequests;
    private int $window;
    private string $storagePath;


    public function __construct(?int $maxRequests = null, ?int $window = null)
    {
        if ($maxRequests === null || $window === null) {
            $this->maxRequests = $GLOBALS['config']['rate_limit']['max_requests'] ?? 100; 
            $this->window = $GLOBALS['config']['rate_limit']['window_seconds'] ?? 60;   
        }else {
            $this->maxRequests = $maxRequests;
            $this->window = $window;
        }

        $this->storagePath = __DIR__ . '/../../storage/rate_limit/';
        
        if (!is_dir($this->storagePath)) {
            mkdir($this->storagePath, 0777, true);
        }
    }



    public function handle(Request $req, Response $res): bool
    {
        $ip = $req->getIp();
        $file = $this->storagePath . md5($ip) . '.json';

        $data = ['count' => 0, 'start' => time()];

        if (file_exists($file)) {
            $data = json_decode(file_get_contents($file), true);
            if (!$data) {
                $data = ['count' => 0, 'start' => time()];
            }
        }

        $now = time();

        if ($now - $data['start'] >= $this->window) {
            $data['count'] = 0;
            $data['start'] = $now;
        }

        $data['count']++;

        if ($data['count'] > $this->maxRequests) {
            $res->status(429)->json(['retry_after' => $this->window - ($now - $data['start'])." seg."], "Demasiadas solicitudes, inténtalo más tarde");
            return false;
        }

        file_put_contents($file, json_encode($data));
        return true;
    }
}
