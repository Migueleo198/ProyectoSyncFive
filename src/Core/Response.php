<?php
declare(strict_types=1);

namespace Core;

class Response
{
    private int $statusCode = 200;
    private array $headers = [];
    private mixed $data = null;
    private ?string $message = null;


    public function status(int $code): self
    {
        $this->statusCode = $code;
        return $this;
    }

    public function header(string $name, string $value): self
    {
        $this->headers[$name] = $value;
        return $this;
    }


    public function json(array|object $data, ?string $message = null): void
    {
        $this->header('Content-Type', 'application/json; charset=utf-8');
        $this->data = $data;
        $this->message = $message;
        $this->sendJson();
    }


    private function sendJson(): void
    {
        http_response_code($this->statusCode);

        foreach ($this->headers as $name => $value) {
            header("$name: $value");
        }

        echo json_encode([
            'status' => $this->statusCode < 400 ? 'success' : 'error',
            'message' => $this->message,
            'data' => $this->data,
            'timestamp' => date('c')
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        exit;
    }


    public function view(string $template, array $data = []): void
    {
        $this->header('Content-Type', 'text/html; charset=utf-8');
        http_response_code($this->statusCode);

        foreach ($this->headers as $name => $value) {
            header("$name: $value");
        }


        $base = __DIR__ . '/../Views/';
        $phpFile = $base . $template . '.php';
        $htmlFile = $base . $template . '.html';


        if (file_exists($phpFile)) {
            extract($data, EXTR_SKIP);
            require $phpFile;
            exit;
        }


        if (file_exists($htmlFile)) {
            readfile($htmlFile);
            exit;
        }

        throw new \RuntimeException("Vista '$template' no encontrada (.php ni .html)."); 
    }


    public function redirect(string $url, int $code = 302): void
    {
        http_response_code($code);
        header("Location: $url");
        exit;
    }



    public function errorJson(string $message, int $code = 400): void
    {
        $this->status($code)
             ->json([], $message);
    }



    public function errorView(string $message, int $code = 400): void
    {
        $this->status($code)
             ->header('Content-Type', 'text/html; charset=utf-8');

        http_response_code($code);

        if (file_exists(__DIR__ . '/../Views/errors/error.php')) {
            $msg = $message;
            require __DIR__ . '/../Views/errors/error.php';
            exit;
        }

        echo "<h1>Error</h1><p>$message</p>";
        exit;
    }

}
