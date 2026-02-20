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
     * Buscar persona por id_bombero
     */
    public function find(string $id_bombero): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Persona WHERE id_bombero = :id_bombero")
            ->bind(':id_bombero', $id_bombero)
            ->fetch();

        return $result ?: null;
    }
    /**
     * Crear una persona
     */
    public function create(array $data): string|false
    {
        $ok = $this->db->query("
            INSERT INTO Persona (
                id_bombero,
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
                :id_bombero,
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
        ->bind(':id_bombero', $data['id_bombero'] ?? null)
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
        ->bind(':fecha_exp_token_activacion', $data['fecha_exp_token_activacion'])
        ->execute();

        return $ok ? $data['id_bombero'] : false;
    }
/**
 * Actualizar datos de persona (PATCH)
 */
public function update(string $id_bombero, array $data): int  // ← string id_bombero
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
            activo = :activo
        WHERE id_bombero = :id_bombero
    ")
    ->bind(':id_bombero', $id_bombero)  // ← id_bombero en WHERE
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
    ->execute();

    return $this->db
        ->query("SELECT ROW_COUNT() AS affected")
        ->fetch()['affected'];
}

    /**
     * Eliminar persona
     */
    // ✅ Correcto - usa id_bombero (PK numérica)
    public function delete(string $id_bombero): int
    {
        $this->db
            ->query("DELETE FROM Persona WHERE id_bombero = :id_bombero")
            ->bind(':id_bombero', $id_bombero)
            ->execute();
        
        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    // ++++++++++++++++++++++++++++++++++ MÉTODOS SESIONES ++++++++++++++++++++++++++++++++++
     /**
     * Buscar usuario por login (nombre_usuario o correo)
     */
    public function findByLogin(string $login): ?array
    {
        $result = $this->db
            ->query("
                SELECT *
                FROM Persona
                WHERE nombre_usuario = :login
                LIMIT 1
            ")
            ->bind(':login', $login)
            ->fetch();

        return $result ?: null;
    }

    /**
     * Buscar usuario por correo
     */
    public function findByEmail(string $correo): ?array
    {
        $result = $this->db
            ->query("
                SELECT *
                FROM Persona
                WHERE correo = :correo
                LIMIT 1
            ")
            ->bind(':correo', $correo)
            ->fetch();

        return $result ?: null;
    }

    /**
     * Buscar usuario por token de activación
     */
    public function findByActivationToken(string $token): ?array
    {
        $result = $this->db
            ->query("
                SELECT *
                FROM Persona
                WHERE token_activacion = :token
                LIMIT 1
            ")
            ->bind(':token', $token)
            ->fetch();

        return $result ?: null;
    }

    /**
     * Activar cuenta de usuario
     */
    public function activateUser(string $id_bombero): int
    {
        $this->db
            ->query("
                UPDATE Persona SET
                    activo = TRUE,
                    token_activacion = NULL,
                    fecha_exp_token_activacion = NULL
                WHERE id_bombero = :id
            ")
            ->bind(':id', $id_bombero)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    /**
     * Guardar token de recuperación de contraseña
     */
    public function setPasswordResetToken(
        string $id_bombero,
        string $token,
        string $expiry
    ): int {
        $this->db
            ->query("
                UPDATE Persona SET
                    token_cambio_contrasenia = :token,
                    fecha_exp_cambio_contrasenia = :expiry
                WHERE id_bombero = :id
            ")
            ->bind(':id', $id_bombero)
            ->bind(':token', $token)
            ->bind(':expiry', $expiry)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    /**
     * Buscar usuario por token de cambio de contraseña
     */
    public function findByPasswordResetToken(string $token): ?array
    {
        $result = $this->db
            ->query("
                SELECT *
                FROM Persona
                WHERE token_cambio_contrasenia = :token
                LIMIT 1
            ")
            ->bind(':token', $token)
            ->fetch();

        return $result ?: null;
    }

    /**
     * Actualizar contraseña
     */
    public function updatePassword(string $id_bombero, string $hash): int
    {
        $this->db
            ->query("
                UPDATE Persona SET
                    contrasenia = :password,
                    token_cambio_contrasenia = NULL,
                    fecha_exp_cambio_contrasenia = NULL
                WHERE id_bombero = :id
            ")
            ->bind(':id', $id_bombero)
            ->bind(':password', $hash)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    /**
     * Actualizar último inicio de sesión
     */
    public function updateLastLogin(string $id_bombero): int
    {
        $this->db
            ->query("
                UPDATE Persona SET
                    fecha_ult_inicio_sesion = NOW()
                WHERE id_bombero = :id
            ")
            ->bind(':id', $id_bombero)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }


    //++++++++++++++++++++ Persona material ++++++++++++++++++++++

    public function getMaterialByBombero(int $id_bombero): array
    {
        return $this->db
            ->query("
                SELECT m.*
                FROM Material m
                JOIN Persona_Material pm ON m.id_material = pm.id_material
                WHERE pm.id_bombero = :id_bombero
            ")
            ->bind(':id_bombero', $id_bombero)
            ->fetchAll();
    }

    public function addMaterialToBombero(int $id_bombero, int $id_material, string $nserie): void
    {
        $this->db
            ->query("
                INSERT INTO Persona_Material (id_bombero, id_material, nserie)
                VALUES (:id_bombero, :id_material, :nserie)
            ")
            ->bind(':id_bombero', $id_bombero)
            ->bind(':id_material', $id_material)
            ->bind(':nserie', $nserie ?? null)
            ->execute();
    }

    public function removeMaterialBombero(int $id_bombero, int $id_material): int
    {
        $this->db
            ->query("
                DELETE FROM Persona_Material
                WHERE id_bombero = :id_bombero
                  AND id_material = :id_material
            ")
            ->bind(':id_bombero', $id_bombero)
            ->bind(':id_material', $id_material)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }
}