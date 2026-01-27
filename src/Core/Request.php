<?php
declare(strict_types=1);

namespace Core;

class Request
{
    private string $method;
    private string $uri;
    private array $queryParams;
    private array $body;
    private array $headers;
    private string $rawBody = '';
    private ?array $user = null;

    public function __construct()
    {
        $this->method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $this->uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';
        $this->queryParams = $_GET ?? [];

        $this->rawBody = file_get_contents('php://input') ?: '';

        $decoded = json_decode($this->rawBody, true);

        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            $this->body = $decoded;
        }

        else {
            $this->body = $_POST ?: [];
        }


        $this->headers = [];
        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $headerName = str_replace('_', '-', substr($key, 5));
                $this->headers[$headerName] = $value;
            }
        }
    }

    public function getMethod(): string
    {
        return $this->method;
    }

    public function getUri(): string
    {
        return $this->uri;
    }

    public function getQueryParams(): array
    {
        return $this->queryParams;
    }

    public function getBody(): array
    {
        return $this->body;
    }

    public function getHeaders(): array
    {
        return $this->headers;
    }

    public function getHeader(string $name): ?string
    {
        $key = str_replace('_', '-', strtoupper($name));
        return $this->headers[$key] ?? null;
    }

    public function getParam(string $key, mixed $default = null): mixed
    {
        return $this->queryParams[$key] ?? $this->body[$key] ?? $default;
    }

    public function setUser(?array $user): void
    {
        $this->user = $user;
    }

    public function getUser(): ?array
    {
        return $this->user;
    }
    

    public function json(): array
    {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        if (stripos($contentType, 'application/json') === false) {
            return $this->body;
        }

        $data = json_decode($this->rawBody, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception('JSON inválido: ' . json_last_error_msg());
        }

        return is_array($data) ? $data : [];
    }


    public function getIp(): string
    {
        return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }

}

