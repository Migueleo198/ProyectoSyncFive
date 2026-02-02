<?php
declare(strict_types=1);

namespace Core;

use PDO;

class DB
{
    private PDO $pdo;
    private \PDOStatement $stmt;

    public function __construct()
    {
        $this->pdo = Database::getConnection();
    }

    public function query(string $sql): self
    {
        $this->stmt = $this->pdo->prepare($sql);
        return $this;
    }

    public function bind(string $param, mixed $value): self
    {
        $type = match (true) {
            is_int($value)  => PDO::PARAM_INT,
            is_null($value) => PDO::PARAM_NULL,
            default         => PDO::PARAM_STR,
        };

        $this->stmt->bindValue($param, $value, $type);
        return $this;
    }

    public function execute(): bool
    {
        return $this->stmt->execute();
    }

    public function fetch(): array|false
    {
        $this->execute();
        return $this->stmt->fetch();
    }

    public function fetchAll(): array
    {
        $this->execute();
        return $this->stmt->fetchAll();
    }

    public function lastId(): string
    {
        return $this->pdo->lastInsertId();
    }

    public function beginTransaction(): void { $this->pdo->beginTransaction(); }
    public function commit(): void { $this->pdo->commit(); }
    public function rollback(): void { $this->pdo->rollBack(); }
}
