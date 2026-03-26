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
     * Buscar persona por id_bombero o n_funcionario
     */
    public function findByIdentifier(string $identifier): ?array
    {
        $result = $this->db
            ->query("SELECT * FROM Persona WHERE id_bombero = :identifier OR n_funcionario = :identifier")
            ->bind(':identifier', $identifier)
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
                id_rol = :id_rol,
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
        ->bind(':id_rol', $data['id_rol'] ?? null)
        ->bind(':nombre_usuario', $data['nombre_usuario'] ?? null)
        ->bind(':activo', $data['activo'] ?? null)
        ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    /**
     * Actualizar solo los campos recibidos (PATCH parcial).
     * No toca ningún campo que no esté en $data.
     */
    public function updatePartial(string $id_bombero, array $data): int
    {
        // Campos permitidos en la tabla (whitelist a nivel de modelo)
        $permitidos = [
            'correo', 'telefono', 'telefono_emergencia',
            'talla_superior', 'talla_inferior', 'talla_calzado',
            'domicilio', 'localidad', 'nombre_usuario',
            'activo',  // solo accesible desde update() de admins
        ];

        // Filtrar y construir el SET dinámico
        $sets = [];
        foreach ($data as $campo => $valor) {
            if (in_array($campo, $permitidos, true)) {
                $sets[] = "{$campo} = :{$campo}";
            }
        }

        if (empty($sets)) {
            return 0; // Nada que actualizar
        }

        $sql = "UPDATE Persona SET " . implode(', ', $sets) . " WHERE id_bombero = :id_bombero";

        $query = $this->db->query($sql)->bind(':id_bombero', $id_bombero);

        foreach ($data as $campo => $valor) {
            if (in_array($campo, $permitidos, true)) {
                $query->bind(":{$campo}", $valor);
            }
        }

        $query->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    /**
     * Eliminar persona
     */
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

    public function addMaterialToBombero(string $id_bombero, int $id_material, string $nserie): void
    {
        $this->db
            ->query("
                INSERT INTO Persona_Material (id_bombero, id_material, nserie)
                VALUES (:id_bombero, :id_material, :nserie)
            ")
            ->bind(':id_bombero', $id_bombero)
            ->bind(':id_material', $id_material)
            ->bind(':nserie', $nserie)
            ->execute();
    }

    public function removeMaterialBombero(string $id_bombero, int $id_material): int
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

    /**
     * Obtiene todas las estadísticas del área personal en una sola llamada.
     * Ejecuta múltiples queries optimizadas y devuelve el array consolidado.
     */
    public function getStatsByBombero(string $id_bombero): array
    {
        // ── 1. Datos básicos de la persona con su rol ──────────────────────────
        $persona = $this->db
            ->query("
                SELECT
                    p.id_bombero,
                    p.n_funcionario,
                    p.nombre,
                    p.apellidos,
                    p.correo,
                    p.telefono,
                    p.f_nacimiento,
                    p.f_ingreso_diputacion,
                    p.talla_superior,
                    p.talla_inferior,
                    p.talla_calzado,
                    p.telefono_emergencia,
                    p.domicilio,
                    p.localidad,
                    p.nombre_usuario,
                    p.dni,
                    p.activo,
                    p.foto_perfil,
                    r.nombre  AS rol_nombre,
                    r.id_rol  AS id_rol,
                    TIMESTAMPDIFF(YEAR, p.f_ingreso_diputacion, CURDATE()) AS anios_servicio
                FROM Persona p
                LEFT JOIN Rol r ON p.id_rol = r.id_rol
                WHERE p.id_bombero = :id
            ")
            ->bind(':id', $id_bombero)
            ->fetch();

        // ── 2. Emergencias en las que ha participado (por EVP) ─────────────────
        $emergencias = $this->db
            ->query("
                SELECT
                    COUNT(DISTINCT evp.id_emergencia)                          AS total_emergencias,
                    SUM(CASE WHEN te.grupo = 'Incendios urbanos'
                                OR te.grupo = 'Incendios forestales'
                            THEN 1 ELSE 0 END)                                AS incendios,
                    SUM(CASE WHEN te.grupo = 'Rescates y accidentes'
                            THEN 1 ELSE 0 END)                                AS rescates,
                    SUM(CASE WHEN te.grupo = 'Materias peligrosas'
                            THEN 1 ELSE 0 END)                                AS materias_peligrosas,
                    SUM(CASE WHEN te.grupo = 'Fenómenos meteorológicos'
                                OR te.grupo = 'Estructuras y colapsos'
                            THEN 1 ELSE 0 END)                                AS otros,
                    -- Tiempo promedio de respuesta (minutos: f_registro_emergencia → f_llegada)
                    ROUND(AVG(
                        CASE WHEN ev.f_llegada IS NOT NULL
                        THEN TIMESTAMPDIFF(MINUTE, e.fecha, ev.f_llegada)
                        END
                    ), 1) AS avg_respuesta_min,
                    -- Tiempo promedio de resolución (minutos: f_salida → f_regreso)
                    ROUND(AVG(
                        CASE WHEN ev.f_regreso IS NOT NULL
                        THEN TIMESTAMPDIFF(MINUTE, ev.f_salida, ev.f_regreso)
                        END
                    ), 1) AS avg_resolucion_min,
                    -- % intervenciones cerradas (éxito)
                    ROUND(
                        SUM(CASE WHEN e.estado = 'CERRADA' THEN 1 ELSE 0 END)
                        * 100.0 / COUNT(DISTINCT evp.id_emergencia)
                    , 1) AS pct_exitosas
                FROM Emergencia_Vehiculo_Persona evp
                JOIN Emergencia_Vehiculo ev
                    ON ev.matricula      = evp.matricula
                AND ev.id_emergencia  = evp.id_emergencia
                JOIN Emergencia e
                    ON e.id_emergencia   = evp.id_emergencia
                LEFT JOIN Tipo_emergencia te
                    ON te.codigo_tipo    = e.codigo_tipo
                WHERE evp.id_bombero = :id
            ")
            ->bind(':id', $id_bombero)
            ->fetch();

        // Emergencias por año en curso y mes en curso
        $emergencias_periodo = $this->db
            ->query("
                SELECT
                    SUM(CASE WHEN YEAR(e.fecha) = YEAR(CURDATE())
                            THEN 1 ELSE 0 END)  AS emergencias_anio,
                    SUM(CASE WHEN YEAR(e.fecha)  = YEAR(CURDATE())
                                AND MONTH(e.fecha) = MONTH(CURDATE())
                            THEN 1 ELSE 0 END)  AS emergencias_mes
                FROM Emergencia_Vehiculo_Persona evp
                JOIN Emergencia e ON e.id_emergencia = evp.id_emergencia
                WHERE evp.id_bombero = :id
            ")
            ->bind(':id', $id_bombero)
            ->fetch();

        // ── 3. Guardias ────────────────────────────────────────────────────────
        $guardias = $this->db
            ->query("
                SELECT
                    COUNT(*)                                                    AS total_guardias,
                    SUM(CASE WHEN YEAR(g.fecha) = YEAR(CURDATE())
                            THEN 1 ELSE 0 END)                                AS guardias_anio,
                    -- Horas totales trabajadas en guardia
                    SUM(
                        CASE
                            WHEN g.h_fin > g.h_inicio
                            THEN TIME_TO_SEC(TIMEDIFF(g.h_fin, g.h_inicio)) / 3600
                            ELSE 24 - TIME_TO_SEC(g.h_inicio) / 3600
                                + TIME_TO_SEC(g.h_fin) / 3600
                        END
                    )                                                           AS horas_guardia_total,
                    -- Próximas 3 guardias
                    NULL                                                        AS proximas  -- se consultan por separado
                FROM Persona_Hace_Guardia phg
                JOIN Guardia g ON g.id_guardia = phg.id_guardia
                WHERE phg.id_bombero = :id
            ")
            ->bind(':id', $id_bombero)
            ->fetch();

        $proximas_guardias = $this->db
            ->query("
                SELECT
                    g.id_guardia,
                    g.fecha,
                    g.h_inicio,
                    g.h_fin,
                    g.notas,
                    phg.cargo
                FROM Persona_Hace_Guardia phg
                JOIN Guardia g ON g.id_guardia = phg.id_guardia
                WHERE phg.id_bombero = :id
                AND g.fecha >= CURDATE()
                ORDER BY g.fecha ASC, g.h_inicio ASC
                LIMIT 3
            ")
            ->bind(':id', $id_bombero)
            ->fetchAll();

        // ── 4. Formación ───────────────────────────────────────────────────────
        $formacion = $this->db
            ->query("
                SELECT
                    COUNT(*)                    AS total_ediciones,
                    COALESCE(SUM(ed.horas), 0)  AS horas_formacion_total,
                    SUM(CASE WHEN YEAR(ed.f_fin) = YEAR(CURDATE())
                            THEN ed.horas ELSE 0 END) AS horas_formacion_anio
                FROM Persona_Edicion pe
                JOIN Edicion ed
                    ON ed.id_formacion = pe.id_formacion
                AND ed.id_edicion   = pe.id_edicion
                WHERE pe.id_bombero = :id
            ")
            ->bind(':id', $id_bombero)
            ->fetch();

        // Formaciones pendientes (inicio > hoy)
        $formaciones_pendientes = $this->db
            ->query("
                SELECT
                    f.nombre,
                    ed.f_inicio,
                    ed.f_fin,
                    ed.horas
                FROM Persona_Edicion pe
                JOIN Edicion ed
                    ON ed.id_formacion = pe.id_formacion
                AND ed.id_edicion   = pe.id_edicion
                JOIN Formacion f ON f.id_formacion = ed.id_formacion
                WHERE pe.id_bombero = :id
                AND ed.f_inicio > CURDATE()
                ORDER BY ed.f_inicio ASC
                LIMIT 3
            ")
            ->bind(':id', $id_bombero)
            ->fetchAll();

        // ── 5. Carnets ─────────────────────────────────────────────────────────
        $carnets = $this->db
            ->query("
                SELECT
                    COUNT(*)  AS total_carnets,
                    SUM(CASE WHEN cp.f_vencimiento >= CURDATE() THEN 1 ELSE 0 END) AS vigentes,
                    SUM(CASE WHEN cp.f_vencimiento <  CURDATE() THEN 1 ELSE 0 END) AS caducados,
                    -- Carnets que vencen en los próximos 90 días
                    SUM(CASE WHEN cp.f_vencimiento BETWEEN CURDATE()
                                AND DATE_ADD(CURDATE(), INTERVAL 90 DAY)
                            THEN 1 ELSE 0 END)                                     AS proximos_vencer
                FROM Carnet_Persona cp
                WHERE cp.id_bombero = :id
            ")
            ->bind(':id', $id_bombero)
            ->fetch();

        $detalle_carnets = $this->db
            ->query("
                SELECT
                    c.nombre,
                    c.id_grupo,
                    g.nombre AS grupo_nombre,
                    cp.f_obtencion,
                    cp.f_vencimiento,
                    CASE WHEN cp.f_vencimiento >= CURDATE() THEN 1 ELSE 0 END AS vigente
                FROM Carnet_Persona cp
                JOIN Carnet c ON c.id_carnet = cp.id_carnet
                JOIN Grupo g ON g.id_grupo = c.id_grupo
                WHERE cp.id_bombero = :id
                ORDER BY cp.f_vencimiento ASC
            ")
            ->bind(':id', $id_bombero)
            ->fetchAll();

        // ── 6. Méritos ─────────────────────────────────────────────────────────
        $meritos = $this->db
            ->query("
                SELECT m.id_merito, m.nombre, m.descripcion
                FROM Persona_Tiene_Merito ptm
                JOIN Merito m ON m.id_merito = ptm.id_merito
                WHERE ptm.id_bombero = :id
                ORDER BY m.id_merito ASC
            ")
            ->bind(':id', $id_bombero)
            ->fetchAll();

        // ── 7. Turnos de refuerzo ──────────────────────────────────────────────
        $turnos = $this->db
            ->query("
                SELECT
                    COUNT(*)                              AS total_turnos_refuerzo,
                    COALESCE(SUM(tr.horas), 0)            AS horas_refuerzo_total,
                    SUM(CASE WHEN YEAR(tr.f_inicio) = YEAR(CURDATE())
                            THEN tr.horas ELSE 0 END)    AS horas_refuerzo_anio
                FROM Persona_Turno pt
                JOIN Turno_refuerzo tr ON tr.id_turno_refuerzo = pt.id_turno
                WHERE pt.id_bombero = :id
            ")
            ->bind(':id', $id_bombero)
            ->fetch();

        // ── 8. Permisos / Bienestar ────────────────────────────────────────────
        $permisos = $this->db
        ->query("
            SELECT
                COUNT(*)                                                            AS total_permisos,
                SUM(CASE WHEN p.estado = 'ACEPTADO' THEN 1 ELSE 0 END)             AS aceptados,
                SUM(CASE WHEN p.estado = 'DENEGADO' THEN 1 ELSE 0 END)             AS denegados,
                SUM(CASE WHEN p.estado = 'REVISION' THEN 1 ELSE 0 END)             AS en_revision,

                -- Días totales aceptados (suma de todas las categorías)
                ROUND(SUM(
                    CASE WHEN p.estado = 'ACEPTADO'
                    THEN
                        CASE
                            WHEN m.dias > 0 THEN m.dias
                            WHEN p.h_inicio IS NOT NULL AND p.h_fin IS NOT NULL
                            THEN TIME_TO_SEC(TIMEDIFF(p.h_fin, p.h_inicio)) / 86400.0
                            ELSE 0
                        END
                    ELSE 0 END
                ), 1)                                                               AS total_dias,

                -- Asuntos propios
                ROUND(SUM(
                    CASE WHEN m.nombre LIKE '%propios%' AND p.estado = 'ACEPTADO'
                    THEN
                        CASE
                            WHEN m.dias > 0 THEN m.dias
                            WHEN p.h_inicio IS NOT NULL AND p.h_fin IS NOT NULL
                            THEN TIME_TO_SEC(TIMEDIFF(p.h_fin, p.h_inicio)) / 86400.0
                            ELSE 0
                        END
                    ELSE 0 END
                ), 1)                                                               AS dias_asuntos_propios,

                -- Enfermedad / accidente no laboral
                ROUND(SUM(
                    CASE WHEN (m.nombre LIKE '%Enfermedad%' OR m.nombre LIKE '%accidente no%')
                            AND p.estado = 'ACEPTADO'
                    THEN
                        CASE
                            WHEN m.dias > 0 THEN m.dias
                            WHEN p.h_inicio IS NOT NULL AND p.h_fin IS NOT NULL
                            THEN TIME_TO_SEC(TIMEDIFF(p.h_fin, p.h_inicio)) / 86400.0
                            ELSE 0
                        END
                    ELSE 0 END
                ), 1)                                                               AS dias_enfermedad,

                -- Accidente laboral
                ROUND(SUM(
                    CASE WHEN m.nombre LIKE '%Accidente laboral%' AND p.estado = 'ACEPTADO'
                    THEN
                        CASE
                            WHEN m.dias > 0 THEN m.dias
                            WHEN p.h_inicio IS NOT NULL AND p.h_fin IS NOT NULL
                            THEN TIME_TO_SEC(TIMEDIFF(p.h_fin, p.h_inicio)) / 86400.0
                            ELSE 0
                        END
                    ELSE 0 END
                ), 1)                                                               AS dias_accidente_laboral,

                -- Fallecimiento (1er + 2º grado)
                ROUND(SUM(
                    CASE WHEN (m.nombre LIKE '%grado%' OR m.nombre LIKE '%fallec%')
                            AND p.estado = 'ACEPTADO'
                    THEN
                        CASE
                            WHEN m.dias > 0 THEN m.dias
                            WHEN p.h_inicio IS NOT NULL AND p.h_fin IS NOT NULL
                            THEN TIME_TO_SEC(TIMEDIFF(p.h_fin, p.h_inicio)) / 86400.0
                            ELSE 0
                        END
                    ELSE 0 END
                ), 1)                                                               AS dias_fallecimiento,

                -- Otros motivos no clasificados
                ROUND(SUM(
                    CASE WHEN m.nombre NOT LIKE '%propios%'
                            AND m.nombre NOT LIKE '%Enfermedad%'
                            AND m.nombre NOT LIKE '%accidente no%'
                            AND m.nombre NOT LIKE '%Accidente laboral%'
                            AND m.nombre NOT LIKE '%grado%'
                            AND m.nombre NOT LIKE '%fallec%'
                            AND p.estado = 'ACEPTADO'
                    THEN
                        CASE
                            WHEN m.dias > 0 THEN m.dias
                            WHEN p.h_inicio IS NOT NULL AND p.h_fin IS NOT NULL
                            THEN TIME_TO_SEC(TIMEDIFF(p.h_fin, p.h_inicio)) / 86400.0
                            ELSE 0
                        END
                    ELSE 0 END
                ), 1)                                                               AS dias_otros,

                -- Permisos aceptados en el año en curso (sigue siendo COUNT para referencia)
                SUM(CASE WHEN YEAR(p.fecha) = YEAR(CURDATE())
                            AND p.estado = 'ACEPTADO'
                        THEN 1 ELSE 0 END)                                         AS permisos_anio_actual
            FROM Permiso p
            JOIN Motivo m ON m.cod_motivo = p.cod_motivo
            WHERE p.id_bombero = :id
        ")
        ->bind(':id', $id_bombero)
        ->fetch();

        // Próximos permisos en revisión
        $permisos_pendientes = $this->db
            ->query("
                SELECT
                    p.id_permiso,
                    m.nombre  AS motivo,
                    p.fecha,
                    p.h_inicio,
                    p.h_fin,
                    p.estado,
                    p.descripcion
                FROM Permiso p
                JOIN Motivo m ON m.cod_motivo = p.cod_motivo
                WHERE p.id_bombero = :id
                AND p.fecha >= CURDATE()
                ORDER BY p.fecha ASC
                LIMIT 5
            ")
            ->bind(':id', $id_bombero)
            ->fetchAll();

        // ── 9. Componer y devolver el objeto completo ──────────────────────────
        return [
            'persona'              => $persona,
            'emergencias'          => array_merge(
                                        $emergencias ?? [],
                                        $emergencias_periodo ?? []
                                    ),
            'guardias'             => [
                'resumen'          => $guardias,
                'proximas'         => $proximas_guardias,
            ],
            'formacion'            => [
                'resumen'          => $formacion,
                'pendientes'       => $formaciones_pendientes,
            ],
            'carnets'              => [
                'resumen'          => $carnets,
                'detalle'          => $detalle_carnets,
            ],
            'meritos'              => $meritos,
            'turnos_refuerzo'      => $turnos,
            'permisos'             => [
                'resumen'          => $permisos,
                'pendientes'       => $permisos_pendientes,
            ],
        ];
    }

    /* Actualizar foto de perfil del usuario */
    public function updateFoto(string $id_bombero, string $filename): void
    {
        $this->db
            ->query("UPDATE Persona SET foto_perfil = :foto WHERE id_bombero = :id")
            ->bind(':foto', $filename)
            ->bind(':id', $id_bombero)
            ->execute();
    }
}
