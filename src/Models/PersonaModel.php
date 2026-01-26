<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class PersonaModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    /**
     * Obtener todas las personas
     */
    public function all(): array
    {
        return $this->db
            ->query("SELECT * FROM Persona ORDER BY n_funcionario ASC")
            ->fetchAll();
    }

    /**
     * Buscar persona por n_funcionario
     */
    public function find(int $n_funcionario): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Persona WHERE n_funcionario = :n_funcionario")
            ->bind(':n_funcionario', $n_funcionario)
            ->fetch();

        return $result ?: null;
    }

    /**
     * Crear una persona
     */
    public function create(array $data): int|false
    {
        $this->db->query("
            INSERT INTO Persona (
                n_funcionario,
                DNI,
                correo,
                telefono,
                f_ingreso_diputacion,
                talla_superior,
                talla_inferior,
                talla_calzado,
                nombre,
                apellidos,
                f_nacimiento,
                telefono_emergencia,
                domicilio,
                localidad,
                activo,
                nombre_usuario,
                token_activacion,
                fecha_exp_token_activacion
            ) VALUES (
                :n_funcionario,
                :DNI,
                :correo,
                :telefono,
                :f_ingreso_diputacion,
                :talla_superior,
                :talla_inferior,
                :talla_calzado,
                :nombre,
                :apellidos,
                :f_nacimiento,
                :telefono_emergencia,
                :domicilio,
                :localidad,
                :activo,
                :nombre_usuario,
                :token_activacion,
                :fecha_exp_token_activacion
            )
        ")
        ->bind(':n_funcionario', $data['n_funcionario'])
        ->bind(':DNI', $data['DNI'])
        ->bind(':correo', $data['correo'])
        ->bind(':telefono', $data['telefono'])
        ->bind(':f_ingreso_diputacion', $data['f_ingreso_diputacion'])
        ->bind(':talla_superior', $data['talla_superior'] ?? null)
        ->bind(':talla_inferior', $data['talla_inferior'] ?? null)
        ->bind(':talla_calzado', $data['talla_calzado'] ?? null)
        ->bind(':nombre', $data['nombre'])
        ->bind(':apellidos', $data['apellidos'])
        ->bind(':f_nacimiento', $data['f_nacimiento'])
        ->bind(':telefono_emergencia', $data['telefono_emergencia'] ?? null)
        ->bind(':domicilio', $data['domicilio'] ?? null)
        ->bind(':localidad', $data['localidad'])
        ->bind(':activo', $data['activo'])
        ->bind(':nombre_usuario', $data['nombre_usuario'])
        ->bind(':token_activacion', $data['token_activacion'])
        ->bind(':fecha_exp_token_activacion', $data['f_exp_token_activacion'])
        ->execute();

        return (int) $this->db->lastId();
    }

    /**
     * Actualizar datos de persona (PATCH)
     */
    public function update(int $n_funcionario, array $data): int
    {
        $this->db->query("
            UPDATE Persona SET
                talla_superior = :talla_superior,
                talla_inferior = :talla_inferior,
                talla_calzado = :talla_calzado,
                domicilio = :domicilio,
                localidad = :localidad,
                correo = :correo,
                telefono = :telefono,
                telefono_emergencia = :telefono_emergencia,
                nombre_usuario = :nombre_usuario,
                activo = :activo,
                fecha_ult_inicio_sesion = :fecha_ult_inicio_sesion
            WHERE n_funcionario = :n_funcionario
        ")
        ->bind(':n_funcionario', $n_funcionario)
        ->bind(':talla_superior', $data['talla_superior'] ?? null)
        ->bind(':talla_inferior', $data['talla_inferior'] ?? null)
        ->bind(':talla_calzado', $data['talla_calzado'] ?? null)
        ->bind(':domicilio', $data['domicilio'] ?? null)
        ->bind(':localidad', $data['localidad'] ?? null)
        ->bind(':correo', $data['correo'] ?? null)
        ->bind(':telefono', $data['telefono'] ?? null)
        ->bind(':telefono_emergencia', $data['telefono_emergencia'] ?? null)
        ->bind(':nombre_usuario', $data['nombre_usuario'] ?? null)
        ->bind(':activo', $data['activo'] ?? null)
        ->bind(':fecha_ult_inicio_sesion', $data['fecha_ult_inicio_sesion'] ?? null)
        ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    /**
     * Eliminar persona
     */
    public function delete(int $n_funcionario): int
    {
        $this->db
            ->query("DELETE FROM Persona WHERE n_funcionario = :n_funcionario")
            ->bind(':n_funcionario', $n_funcionario)
            ->execute();
        
        return $this->db->query("SELECT ROW_COUNT() AS affected")->fetch()['affected'];
    }
}
