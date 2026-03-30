/* =======================
   1. FORMACION
   ======================= */
CREATE TABLE Formacion (
    id_formacion INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL
);

/* =======================
   2. EDICION
   ======================= */
CREATE TABLE Edicion (
    id_edicion INT,
    id_formacion INT, 
    f_inicio DATE NOT NULL,
    f_fin DATE NOT NULL,
    horas INT NOT NULL,
    PRIMARY KEY (id_formacion, id_edicion),
    CHECK (horas > 0),
    CHECK (f_fin >= f_inicio),
    FOREIGN KEY (id_formacion) REFERENCES Formacion(id_formacion)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   3. TURNO_REFUERZO
   ======================= */
CREATE TABLE Turno_refuerzo (
    id_turno_refuerzo INT AUTO_INCREMENT PRIMARY KEY,
    f_inicio TIMESTAMP NOT NULL DEFAULT '2000-01-01 00:00:00',
    f_fin TIMESTAMP NOT NULL DEFAULT '2000-01-01 00:00:00',
    horas INT NOT NULL,
    CHECK (horas > 0),
    CHECK (f_fin >= f_inicio)
);

/* =======================
   4. ROL
   ======================= */
CREATE TABLE Rol (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre ENUM('BOMBERO','OFICIAL','JEFE DE INTERVENCIÓN','JEFE DE MANDO','INSPECTOR') NOT NULL,
    descripcion TEXT
);

/* =======================
   5. TIPO_EMERGENCIA
   ======================= */
CREATE TABLE Tipo_emergencia (
    codigo_tipo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    grupo VARCHAR(50) NOT NULL
);

/* =======================
   6. CATEGORIA
   ======================= */
CREATE TABLE Categoria (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    inventariable BOOLEAN NOT NULL
);

/* =======================
   7. MATERIAL
   ======================= */
CREATE TABLE Material (
    id_material INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria INT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    estado ENUM('ALTA','BAJA') NOT NULL,
    FOREIGN KEY (id_categoria) REFERENCES Categoria(id_categoria)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   8. LOCALIDAD
   ======================= */
CREATE TABLE Localidad (
    localidad VARCHAR(100) PRIMARY KEY,
    provincia VARCHAR(100) NOT NULL
);

/* =======================
   9. INSTALACION
   ======================= */
CREATE TABLE Instalacion (
    id_instalacion INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(150) NOT NULL,
    telefono VARCHAR(15) NOT NULL,
    correo VARCHAR(100) NOT NULL,
    localidad VARCHAR(100) NOT NULL,
    FOREIGN KEY (localidad) REFERENCES Localidad(localidad)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   10. ALMACEN
   ======================= */
CREATE TABLE Almacen (
    id_almacen INT,
    id_instalacion INT,
    planta INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    PRIMARY KEY (id_almacen, id_instalacion),
    FOREIGN KEY (id_instalacion) REFERENCES Instalacion(id_instalacion)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   11A. ALMACEN_MATERIAL_UNIDADES
   ======================= */
CREATE TABLE Almacen_Material_Unidades (
    id_almacen INT,
    id_instalacion INT,
    id_material INT,
    unidades INT NOT NULL,
    PRIMARY KEY (id_almacen, id_instalacion, id_material),
    CHECK (unidades > 0),
    FOREIGN KEY (id_almacen, id_instalacion) REFERENCES Almacen(id_almacen, id_instalacion)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_material) REFERENCES Material(id_material)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   11B. ALMACEN_MATERIAL_SERIE
   ======================= */
CREATE TABLE Almacen_Material_Serie (
    id_almacen INT,
    id_instalacion INT,
    id_material INT,
    n_serie VARCHAR(50),
    PRIMARY KEY (id_almacen, id_instalacion, id_material, n_serie),
    FOREIGN KEY (id_almacen, id_instalacion) REFERENCES Almacen(id_almacen, id_instalacion)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_material) REFERENCES Material(id_material)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   12. VEHICULO
   ======================= */
CREATE TABLE Vehiculo (
    matricula VARCHAR(15) PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    id_instalacion INT,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    disponibilidad TINYINT(1) NOT NULL,
    ult_latitud DECIMAL(9,6),
    ult_longitud DECIMAL(9,6),
    FOREIGN KEY (id_instalacion) REFERENCES Instalacion(id_instalacion)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   13. PERSONA
   ======================= */
CREATE TABLE Persona (
    id_bombero VARCHAR(4) PRIMARY KEY,
    n_funcionario VARCHAR(17) UNIQUE NOT NULL,
    dni VARCHAR(15) UNIQUE NOT NULL,
    correo VARCHAR(100) NOT NULL,
    telefono VARCHAR(15) NOT NULL,
    f_ingreso_diputacion DATE NOT NULL,
    talla_superior VARCHAR(10),
    talla_inferior VARCHAR(10),
    talla_calzado VARCHAR(10),
    nombre VARCHAR(50) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    f_nacimiento DATE NOT NULL,
    telefono_emergencia VARCHAR(15),
    domicilio VARCHAR(150),
    localidad VARCHAR(100),
    id_rol INT,
    activo TINYINT(1) NOT NULL,
    nombre_usuario VARCHAR(20) UNIQUE NOT NULL,
    foto_perfil VARCHAR(255),
    contrasenia VARCHAR(255),
    fecha_ult_inicio_sesion TIMESTAMP NULL DEFAULT NULL,
    token_activacion VARCHAR(64),
    fecha_exp_token_activacion TIMESTAMP NULL DEFAULT NULL,
    token_cambio_contrasenia VARCHAR(64),
    fecha_exp_cambio_contrasenia TIMESTAMP NULL DEFAULT NULL,
    CHECK (f_nacimiento < f_ingreso_diputacion),
    FOREIGN KEY (id_rol) REFERENCES Rol(id_rol)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (localidad) REFERENCES Localidad(localidad)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   14. PERSONA_MATERIAL
   ======================= */
CREATE TABLE Persona_Material (
    id_bombero VARCHAR(4),
    id_material INT,
    nserie VARCHAR(50),
    PRIMARY KEY (id_bombero, id_material, nserie),
    FOREIGN KEY (id_bombero) REFERENCES Persona(id_bombero)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_material) REFERENCES Material(id_material)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   15. EMERGENCIA
   ======================= */
CREATE TABLE Emergencia (
    id_emergencia INT AUTO_INCREMENT PRIMARY KEY,
    id_bombero VARCHAR(4),
    fecha TIMESTAMP NOT NULL DEFAULT '2000-01-01 00:00:00',
    descripcion TEXT NOT NULL,
    estado ENUM('ACTIVA','CERRADA') NOT NULL,
    direccion VARCHAR(150) NOT NULL,
    nombre_solicitante VARCHAR(100),
    tlf_solicitante VARCHAR(15),
    codigo_tipo INT,
    FOREIGN KEY (id_bombero) REFERENCES Persona(id_bombero)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (codigo_tipo) REFERENCES Tipo_emergencia(codigo_tipo)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   16. EMERGENCIA_VEHICULO
   ======================= */
CREATE TABLE Emergencia_Vehiculo (
    matricula VARCHAR(15),
    id_emergencia INT,
    f_salida TIMESTAMP NOT NULL DEFAULT '2000-01-01 00:00:00',
    f_llegada TIMESTAMP NULL DEFAULT NULL,
    f_regreso TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (matricula, id_emergencia),
    CHECK (f_llegada IS NULL OR f_llegada >= f_salida),
    CHECK (f_regreso IS NULL OR f_regreso >= f_llegada),
    FOREIGN KEY (matricula) REFERENCES Vehiculo(matricula)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_emergencia) REFERENCES Emergencia(id_emergencia)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   17. EMERGENCIA_VEHICULO_PERSONA
   ======================= */
CREATE TABLE Emergencia_Vehiculo_Persona (
    id_bombero VARCHAR(4),
    matricula VARCHAR(15),
    id_emergencia INT,
    cargo VARCHAR(50),
    PRIMARY KEY (id_bombero, matricula, id_emergencia),
    FOREIGN KEY (id_bombero) REFERENCES Persona(id_bombero)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (matricula, id_emergencia) REFERENCES Emergencia_Vehiculo(matricula, id_emergencia)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   18. PERSONA_EDICION
   ======================= */
CREATE TABLE Persona_Edicion (
    id_formacion INT,
    id_edicion INT,
    id_bombero VARCHAR(4),
    PRIMARY KEY (id_formacion, id_edicion, id_bombero),
    FOREIGN KEY (id_formacion, id_edicion) REFERENCES Edicion(id_formacion, id_edicion),
    FOREIGN KEY (id_bombero) REFERENCES Persona(id_bombero)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   19. PERSONA_TURNO
   ======================= */
CREATE TABLE Persona_Turno (
    id_turno INT,
    id_bombero VARCHAR(4),
    PRIMARY KEY (id_turno, id_bombero),
    FOREIGN KEY (id_turno) REFERENCES Turno_refuerzo(id_turno_refuerzo)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_bombero) REFERENCES Persona(id_bombero)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   20. SALIDA
   ======================= */
CREATE TABLE Salida (
    id_registro INT AUTO_INCREMENT PRIMARY KEY,
    matricula VARCHAR(15) NOT NULL,
    id_bombero VARCHAR(4) NOT NULL,
    f_salida TIMESTAMP NOT NULL DEFAULT '2000-01-01 00:00:00',
    f_regreso TIMESTAMP NOT NULL DEFAULT '2000-01-01 00:00:00',
    km_inicio INT NOT NULL,
    km_fin INT NOT NULL,
    CHECK (km_fin > km_inicio),
    CHECK (f_regreso >= f_salida),
    FOREIGN KEY (matricula) REFERENCES Vehiculo(matricula)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_bombero) REFERENCES Persona(id_bombero)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   21A. GRUPO
   ======================= */
CREATE TABLE Grupo (
    id_grupo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

/* =======================
   21B. CARNET
   ======================= */
CREATE TABLE Carnet (
    id_carnet INT AUTO_INCREMENT PRIMARY KEY,
    id_grupo INT NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    duracion_meses INT NOT NULL,
    CHECK (duracion_meses > 0),
    FOREIGN KEY (id_grupo) REFERENCES Grupo(id_grupo)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   22. CARNET_PERSONA
   ======================= */
CREATE TABLE Carnet_Persona (
    id_bombero VARCHAR(4),
    id_carnet INT,
    f_obtencion DATE NOT NULL,
    f_vencimiento DATE NOT NULL,
    PRIMARY KEY (id_bombero, id_carnet),
    CHECK (f_vencimiento > f_obtencion),
    FOREIGN KEY (id_bombero) REFERENCES Persona(id_bombero)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_carnet) REFERENCES Carnet(id_carnet)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   23. AVISO
   ======================= */
CREATE TABLE Aviso (
    id_aviso INT AUTO_INCREMENT PRIMARY KEY,
    asunto VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    fecha TIMESTAMP NOT NULL DEFAULT '2000-01-01 00:00:00',
    remitente VARCHAR(4),
    FOREIGN KEY (remitente) REFERENCES Persona(id_bombero)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   24. PERSONA_RECIBE_AVISO
   ======================= */
CREATE TABLE Persona_Recibe_Aviso (
    id_aviso INT,
    id_bombero VARCHAR(4),
    PRIMARY KEY (id_aviso, id_bombero),
    FOREIGN KEY (id_aviso) REFERENCES Aviso(id_aviso)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_bombero) REFERENCES Persona(id_bombero)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   25. GUARDIA
   ======================= */
CREATE TABLE Guardia (
    id_guardia INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    h_inicio TIME NOT NULL,
    h_fin TIME NOT NULL,
    notas TEXT
);

/* =======================
   26. PERSONA_HACE_GUARDIA
   ======================= */
CREATE TABLE Persona_Hace_Guardia (
    id_bombero VARCHAR(4),
    id_guardia INT,
    cargo VARCHAR(50),
    PRIMARY KEY (id_bombero, id_guardia),
    CHECK (
        cargo IN ('OFICIAL1', 'OFICIAL2', 'CONDUCTOR1', 'CONDUCTOR2')
        OR (
            cargo LIKE 'BOMBERO%'
            AND CAST(SUBSTRING(cargo, 8) AS UNSIGNED) BETWEEN 1 AND 10
        )
    ),
    FOREIGN KEY (id_bombero) REFERENCES Persona(id_bombero)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_guardia) REFERENCES Guardia(id_guardia)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   27. MERITO
   ======================= */
CREATE TABLE Merito (
    id_merito INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL
);

/* =======================
   28. PERSONA_TIENE_MERITO
   ======================= */
CREATE TABLE Persona_Tiene_Merito (
    id_bombero VARCHAR(4),
    id_merito INT,
    PRIMARY KEY (id_bombero, id_merito),
    FOREIGN KEY (id_bombero) REFERENCES Persona(id_bombero)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_merito) REFERENCES Merito(id_merito)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   29A. VEHICULO_CARGA_UNIDADES
   ======================= */
CREATE TABLE Vehiculo_Carga_Unidades (
    id_material INT,
    matricula VARCHAR(15),
    unidades INT NOT NULL,
    PRIMARY KEY (id_material, matricula),
    CHECK (unidades > 0),
    FOREIGN KEY (id_material) REFERENCES Material(id_material),
    FOREIGN KEY (matricula) REFERENCES Vehiculo(matricula)
);

/* =======================
   29B. VEHICULO_CARGA_SERIE
   ======================= */
CREATE TABLE Vehiculo_Carga_Serie (
    id_material INT,
    matricula VARCHAR(15),
    nserie VARCHAR(50),
    PRIMARY KEY (id_material, matricula, nserie),
    FOREIGN KEY (id_material) REFERENCES Material(id_material),
    FOREIGN KEY (matricula) REFERENCES Vehiculo(matricula)
);

/* =======================
   30. INCIDENCIA
   ======================= */
CREATE TABLE Incidencia (
    id_incidencia INT AUTO_INCREMENT PRIMARY KEY,
    id_material INT,
    id_bombero VARCHAR(4),
    matricula VARCHAR(15),
    fecha DATE NOT NULL,
    asunto VARCHAR(150) NOT NULL,
    estado ENUM('ABIERTA','CERRADA') NOT NULL,
    tipo VARCHAR(50),
    FOREIGN KEY (id_material) REFERENCES Material(id_material)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_bombero) REFERENCES Persona(id_bombero)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (matricula) REFERENCES Vehiculo(matricula)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   31. MOTIVO
   ======================= */
CREATE TABLE Motivo (
    cod_motivo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    dias INT NOT NULL
);

/* =======================
   32. PERMISO
   ======================= */
CREATE TABLE Permiso (
    id_permiso INT AUTO_INCREMENT PRIMARY KEY,
    cod_motivo INT,
    id_bombero VARCHAR(4),
    fecha_solicitud TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_hora_inicio DATETIME NOT NULL,
    fecha_hora_fin DATETIME NOT NULL,
    estado ENUM('ACEPTADO','REVISION','DENEGADO') NOT NULL,
    descripcion VARCHAR(255),
    CHECK (fecha_hora_fin >= fecha_hora_inicio),
    FOREIGN KEY (cod_motivo) REFERENCES Motivo(cod_motivo)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_bombero) REFERENCES Persona(id_bombero)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   33. MANTENIMIENTO
   ======================= */
CREATE TABLE Mantenimiento (
    cod_mantenimiento INT AUTO_INCREMENT PRIMARY KEY,
    id_bombero VARCHAR(4),
    estado ENUM('ABIERTO','REALIZADO') NOT NULL,
    f_inicio DATE NOT NULL,
    f_fin DATE,
    descripcion TEXT,
    FOREIGN KEY (id_bombero) REFERENCES Persona(id_bombero)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE Mantenimiento_Persona (
    cod_mantenimiento INT,
    id_bombero VARCHAR(4),
    PRIMARY KEY (cod_mantenimiento,id_bombero),
    FOREIGN KEY (cod_mantenimiento) REFERENCES Mantenimiento(cod_mantenimiento)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_bombero) REFERENCES Persona(id_bombero)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE Mantenimiento_Vehiculo (
    cod_mantenimiento INT,
    matricula VARCHAR(15),
    PRIMARY KEY (cod_mantenimiento, matricula),
    FOREIGN KEY (cod_mantenimiento) REFERENCES Mantenimiento(cod_mantenimiento)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (matricula) REFERENCES Vehiculo(matricula)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE Mantenimiento_Material (
    cod_mantenimiento INT,
    cod_material INT,
    PRIMARY KEY (cod_mantenimiento, cod_material),
    FOREIGN KEY (cod_mantenimiento) REFERENCES Mantenimiento(cod_mantenimiento)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (cod_material) REFERENCES Material(id_material)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   34. INFRAESTRUCTURAS_AGUA
   ======================= */
CREATE TABLE Infraestructuras_Agua (
    codigo VARCHAR(10) PRIMARY KEY,
    tipo ENUM('HIDRANTE','BOCA_RIEGO') NOT NULL,
    denominacion VARCHAR(150),
    municipio VARCHAR(100) NOT NULL,
    provincia ENUM('HUESCA','ZARAGOZA','TERUEL') NOT NULL,
    latitud DECIMAL(9,6) NOT NULL,
    longitud DECIMAL(9,6) NOT NULL,
    estado ENUM('ACTIVO','AVERIA','SECO','FUERA_SERVICIO','RETIRADO') NOT NULL DEFAULT 'ACTIVO'       
);


/* =======================
   Función para obtener id_edicion automático
   ======================= */
DELIMITER $$

CREATE FUNCTION siguiente_id_edicion(p_id_formacion INT)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE v_id_edicion INT;
    
    SELECT COALESCE(MAX(id_edicion), 0) + 1
    INTO v_id_edicion
    FROM Edicion
    WHERE id_formacion = p_id_formacion;
    
    RETURN v_id_edicion;
END$$

DELIMITER ;

/* =======================
   Función para obtener id_almacen automático
   ======================= */
DELIMITER $$

CREATE FUNCTION siguiente_id_almacen(p_id_instalacion INT)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE v_id_almacen INT;

    SELECT COALESCE(MAX(id_almacen), 0) + 1
    INTO v_id_almacen
    FROM Almacen
    WHERE id_instalacion = p_id_instalacion;

    RETURN v_id_almacen;
END$$

DELIMITER ;

/* =======================
   DATOS DE EJEMPLO
   ======================= */

-- =======================================================
--  SCRIPT DE CARGA DE DATOS DE EJEMPLO
--  Base de datos: SyncFive - Cuerpo de Bomberos de Aragón
--  Datos adaptados a validaciones españolas
-- =======================================================

SET FOREIGN_KEY_CHECKS = 0;

-- =======================================================
-- 1. FORMACION
-- =======================================================
INSERT INTO Formacion (nombre, descripcion) VALUES
('Prevención y Extinción de Incendios Forestales', 'Formación específica en técnicas de extinción de incendios forestales adaptadas al entorno mediterráneo y pirenaico'),
('Rescate en Accidentes de Tráfico', 'Técnicas avanzadas de rescate de víctimas atrapadas en vehículos y manejo de herramientas hidráulicas'),
('Primeros Auxilios y Soporte Vital Básico', 'Formación en SVB, RCP y uso de desfibriladores semiautomáticos (DESA)'),
('Rescate en Altura y Montaña', 'Técnicas de rescate vertical, rappel y operaciones en entornos de alta montaña pirenaica'),
('Intervención en Materias Peligrosas (MMPP)', 'Identificación, clasificación y actuación ante incidentes con mercancías peligrosas (ADR)'),
('Conducción de Vehículos de Emergencia', 'Técnicas de conducción segura y eficiente de vehículos de bomberos en situaciones de emergencia'),
('Rescate en Espacios Confinados', 'Protocolos de entrada y rescate en silos, pozos, alcantarillas y recintos cerrados'),
('Intervención en Incendios Urbanos', 'Tácticas de ataque interior y exterior en incendios de edificios residenciales e industriales'),
('Buceo y Rescate Acuático', 'Técnicas de rescate en medio acuático: ríos, embalses y zonas inundadas. Uso de embarcaciones de rescate y equipos de buceo de emergencia'),
('Desfibrilación y SVA', 'Soporte Vital Avanzado con uso de desfibriladores, administración de fármacos de emergencia y coordinación con el 061'),
('Intervención en Aeronaves', 'Protocolos específicos de intervención en accidentes de aeronaves: extinción ARFF y rescate de ocupantes'),
('Gestión de Emergencias en Eventos Masivos', 'Planificación y coordinación de dispositivos preventivos en concentraciones de más de 1.000 personas'),
('Rescate con Perros de Búsqueda', 'Coordinación operativa con unidades caninas de búsqueda y rescate en zonas de derrumbe y monte'),
('Seguridad Vial y Señalización de Emergencia', 'Protocolos de señalización y corte de carreteras durante intervenciones en vías de alta capacidad'),
('Drones en Emergencias', 'Uso de vehículos aéreos no tripulados para reconocimiento, vigilancia y apoyo en operaciones de extinción y rescate');

-- =======================================================
-- 2. EDICION
-- =======================================================
INSERT INTO Edicion (id_edicion, id_formacion, f_inicio, f_fin, horas) VALUES
(1, 1, '2023-04-10', '2023-04-21', 80),
(2, 1, '2024-04-08', '2024-04-19', 80),
(1, 2, '2023-06-05', '2023-06-09', 40),
(2, 2, '2024-06-03', '2024-06-07', 40),
(1, 3, '2023-02-13', '2023-02-17', 40),
(2, 3, '2024-02-12', '2024-02-16', 40),
(1, 4, '2023-07-10', '2023-07-21', 80),
(1, 5, '2023-09-11', '2023-09-15', 40),
(1, 6, '2023-03-06', '2023-03-10', 40),
(1, 7, '2024-01-15', '2024-01-19', 40),
(1, 8, '2024-03-04', '2024-03-15', 80),
(3, 1, '2026-04-06', '2026-04-17', 80),
(3, 2, '2026-06-01', '2026-06-05', 40),
(3, 3, '2026-02-09', '2026-02-13', 40),
(2, 4, '2026-07-06', '2026-07-17', 80),
(2, 5, '2026-05-04', '2026-05-08', 40),
(2, 6, '2026-03-02', '2026-03-06', 40),
(2, 7, '2026-01-12', '2026-01-16', 40),
(2, 8, '2026-03-16', '2026-03-27', 80),
(1, 9, '2025-10-06', '2025-10-10', 40),
(1, 10, '2025-11-10', '2025-11-14', 40),
(1, 11, '2026-05-18', '2026-05-22', 40),
(1, 12, '2025-09-15', '2025-09-19', 40),
(1, 13, '2026-06-08', '2026-06-12', 40),
(1, 14, '2026-01-19', '2026-01-23', 40),
(1, 15, '2026-04-20', '2026-04-24', 40),
(2, 9,  '2026-10-05', '2026-10-09', 40),
(2, 12, '2026-09-14', '2026-09-18', 40);

-- =======================================================
-- 3. TURNO_REFUERZO
-- =======================================================
INSERT INTO Turno_refuerzo (f_inicio, f_fin, horas) VALUES
('2024-07-15 08:00:00', '2024-07-15 20:00:00', 12),
('2024-07-16 08:00:00', '2024-07-16 20:00:00', 12),
('2024-12-24 20:00:00', '2024-12-25 08:00:00', 12),
('2024-12-31 20:00:00', '2025-01-01 08:00:00', 12),
('2025-03-10 08:00:00', '2025-03-10 20:00:00', 12),
('2025-08-12 08:00:00', '2025-08-12 20:00:00', 12),
('2025-08-13 08:00:00', '2025-08-13 20:00:00', 12),
('2025-08-14 08:00:00', '2025-08-14 20:00:00', 12),
('2025-12-24 20:00:00', '2025-12-25 08:00:00', 12),
('2025-12-31 20:00:00', '2026-01-01 08:00:00', 12),
('2026-01-05 20:00:00', '2026-01-06 08:00:00', 12),
('2026-01-06 08:00:00', '2026-01-06 20:00:00', 12),
('2026-02-27 08:00:00', '2026-02-27 20:00:00', 12),
('2026-03-15 08:00:00', '2026-03-15 20:00:00', 12),
('2026-03-16 08:00:00', '2026-03-16 20:00:00', 12),
('2026-04-02 08:00:00', '2026-04-02 20:00:00', 12),
('2026-04-03 08:00:00', '2026-04-03 20:00:00', 12),
('2026-07-20 08:00:00', '2026-07-20 20:00:00', 12),
('2026-07-21 08:00:00', '2026-07-21 20:00:00', 12),
('2026-08-10 08:00:00', '2026-08-10 20:00:00', 12),
('2026-08-11 08:00:00', '2026-08-11 20:00:00', 12),
('2026-08-12 08:00:00', '2026-08-12 20:00:00', 12),
('2026-10-12 08:00:00', '2026-10-12 20:00:00', 12),
('2026-11-01 08:00:00', '2026-11-01 20:00:00', 12),
('2026-12-24 20:00:00', '2026-12-25 08:00:00', 12),
('2026-12-31 20:00:00', '2027-01-01 08:00:00', 12);

-- =======================================================
-- 4. ROL
-- =======================================================
INSERT INTO Rol (id_rol, nombre, descripcion) VALUES
(1, 'BOMBERO',             'Bombero operativo de base. Realiza labores de extinción, rescate y salvamento'),
(2, 'OFICIAL',             'Oficial de guardia. Coordina el equipo de bomberos durante su turno'),
(3, 'JEFE DE INTERVENCIÓN','Responsable de la dirección táctica de las operaciones en el lugar del siniestro'),
(4, 'JEFE DE MANDO',       'Responsable de la dirección estratégica y coordinación de múltiples unidades'),
(5, 'INSPECTOR',           'Inspector del cuerpo. Funciones de supervisión, inspección y control de calidad del servicio');

-- =======================================================
-- 5. TIPO_EMERGENCIA
-- =======================================================
INSERT INTO Tipo_emergencia (nombre, grupo) VALUES
('Incendio en vivienda',                'Incendios urbanos'),
('Incendio en local comercial',         'Incendios urbanos'),
('Incendio en nave industrial',         'Incendios urbanos'),
('Incendio forestal',                   'Incendios forestales'),
('Incendio de interfaz urbano-forestal','Incendios forestales'),
('Accidente de tráfico en carretera',   'Rescates y accidentes'),
('Accidente de tráfico en autopista',   'Rescates y accidentes'),
('Rescate en altura',                   'Rescates y accidentes'),
('Rescate en montaña',                  'Rescates y accidentes'),
('Rescate en espacio confinado',        'Rescates y accidentes'),
('Inundación',                          'Fenómenos meteorológicos'),
('Nevada y hielo en calzada',           'Fenómenos meteorológicos'),
('Viento fuerte y daños estructurales', 'Fenómenos meteorológicos'),
('Fuga de gas',                         'Materias peligrosas'),
('Derrame de sustancia química',        'Materias peligrosas'),
('Accidente con mercancías peligrosas', 'Materias peligrosas'),
('Derrumbamiento de edificio',          'Estructuras y colapsos'),
('Socavón y hundimiento de terreno',    'Estructuras y colapsos');

-- =======================================================
-- 6. CATEGORIA
-- =======================================================
INSERT INTO Categoria (nombre, inventariable) VALUES
('Equipo de Protección Individual (EPI)',   TRUE),
('Herramientas de rescate hidráulico',      TRUE),
('Equipos de respiración autónoma (ERA)',   TRUE),
('Material de iluminación',                 TRUE),
('Material sanitario y primeros auxilios',  FALSE),
('Herramientas manuales',                   TRUE),
('Material de señalización',               FALSE),
('Equipos de comunicación',                 TRUE),
('Material para incendios forestales',      TRUE),
('Equipos de detección y medición',         TRUE);

-- =======================================================
-- 7. MATERIAL
-- =======================================================
INSERT INTO Material (id_categoria, nombre, descripcion, estado) VALUES
-- EPI
(1, 'Casco de intervención',        'Casco ignífugo homologado EN 443 para intervención en incendios estructurales', 'ALTA'),
(1, 'Traje de intervención',        'Traje de aproximación ignífugo dos piezas, homologado EN 469 Nivel 2', 'ALTA'),
(1, 'Guantes de intervención',      'Guantes ignífugos de cuero y Nomex, homologados EN 659', 'ALTA'),
(1, 'Botas de intervención',        'Botas de cuero con puntera de acero y suela antideslizante, homologadas EN 15090', 'ALTA'),
(1, 'Cinturón de seguridad',        'Cinturón de seguridad para bombero con anilla de rescate', 'ALTA'),
-- Hidráulico
(2, 'Cizalla hidráulica',           'Cizalla hidráulica de rescate vehicular, apertura máxima 200mm, fuerza 550kN', 'ALTA'),
(2, 'Expansor hidráulico',          'Expansor hidráulico de separación con brazos intercambiables, fuerza 115kN', 'ALTA'),
(2, 'Cilindro hidráulico',          'Cilindro hidráulico telescópico de elevación, longitud mín. 300mm máx. 800mm', 'ALTA'),
(2, 'Motobomba hidráulica',         'Motobomba hidráulica de gasolina para alimentación de herramientas de rescate', 'ALTA'),
-- ERA
(3, 'Equipo de respiración autónoma','ERA de circuito abierto con botella de 6,8L y 300 bar, autonomía 45 min', 'ALTA'),
(3, 'Botella de repuesto ERA 300bar','Botella de aluminio 6,8L cargada a 300 bar para ERA', 'ALTA'),
(3, 'Máscara panorámica',           'Máscara panorámica completa para ERA, homologada EN 136', 'ALTA'),
-- Iluminación
(4, 'Foco halógeno portátil 1000W', 'Foco halógeno portátil con trípode, cable 10m, 1000W 220V', 'ALTA'),
(4, 'Linterna frontal LED',         'Linterna frontal recargable LED, 300 lúmenes, resistente al agua IP67', 'ALTA'),
(4, 'Torre de iluminación LED',     'Torre de iluminación LED telescópica con grupo electrógeno integrado, 4x150W', 'ALTA'),
-- Sanitario
(5, 'Botiquín de intervención',     'Botiquín completo de primeros auxilios para uso en emergencias', 'ALTA'),
(5, 'Desfibrilador DESA',           'Desfibrilador semiautomático externo, homologado para uso en emergencias', 'ALTA'),
(5, 'Tablero espinal',              'Tablero espinal rígido con inmovilizadores laterales y correas de sujeción', 'ALTA'),
-- Herramientas
(6, 'Hacha de bombero',             'Hacha de mango de fibra de vidrio con filo y gancho, 1,5 kg', 'ALTA'),
(6, 'Barra Halligan',               'Barra Halligan de acero forjado para apertura de puertas y forzado', 'ALTA'),
(6, 'Sierra de cadena',             'Sierra de cadena de gasolina para tala de árboles y corte estructural', 'ALTA'),
-- Comunicación
(8, 'Radio portátil TETRA',         'Terminal portátil de red TETRA homologado para uso en emergencias, ATEX', 'ALTA'),
(8, 'Radio de vehículo TETRA',      'Terminal fijo de red TETRA para instalación en vehículo, 10W', 'ALTA'),
-- Forestal
(9, 'Mochila de extinción 20L',     'Mochila de extinción de incendios forestales de 20 litros con bomba manual', 'ALTA'),
(9, 'Herramienta Pulaski',          'Herramienta combinada de hacha y azada para construcción de cortafuegos', 'ALTA'),
-- Detección
(10,'Detector de gases multigas',   'Detector portátil 4 gases: O2, CO, H2S, LEL. Alarmas sonora y vibratoria', 'ALTA'),
(10,'Cámara termográfica',          'Cámara termográfica portátil para detección de focos de calor, resolución 160x120', 'ALTA');

-- =======================================================
-- 8. LOCALIDAD (Aragón – las tres provincias)
-- =======================================================
INSERT INTO Localidad (localidad, provincia) VALUES
-- Zaragoza (provincia)
('Zaragoza',          'Zaragoza'),
('Calatayud',         'Zaragoza'),
('Ejea de los Caballeros', 'Zaragoza'),
('Tarazona',          'Zaragoza'),
('Borja',             'Zaragoza'),
('Caspe',             'Zaragoza'),
('Utebo',             'Zaragoza'),
('Cuarte de Huerva',  'Zaragoza'),
('La Muela',          'Zaragoza'),
('Zuera',             'Zaragoza'),
('Épila',             'Zaragoza'),
('Cariñena',          'Zaragoza'),
('Daroca',            'Zaragoza'),
('Sos del Rey Católico','Zaragoza'),
('Uncastillo',        'Zaragoza'),
('Mallén',            'Zaragoza'),
('Alagón',            'Zaragoza'),
('Mequinenza',        'Zaragoza'),
('Sádaba',            'Zaragoza'),
('Maella',            'Zaragoza'),
-- Huesca (provincia)
('Huesca',            'Huesca'),
('Jaca',              'Huesca'),
('Monzón',            'Huesca'),
('Barbastro',         'Huesca'),
('Fraga',             'Huesca'),
('Sabiñánigo',        'Huesca'),
('Graus',             'Huesca'),
('Benabarre',         'Huesca'),
('Broto',             'Huesca'),
('Hecho',             'Huesca'),
('Ansó',              'Huesca'),
('Sallent de Gállego','Huesca'),
('Aínsa',             'Huesca'),
('Boltaña',           'Huesca'),
('Benasque',          'Huesca'),
('Bielsa',            'Huesca'),
-- Teruel (provincia)
('Teruel',            'Teruel'),
('Alcañiz',           'Teruel'),
('Andorra',           'Teruel'),
('Calamocha',         'Teruel'),
('Utrillas',          'Teruel'),
('Mora de Rubielos',  'Teruel'),
('Rubielos de Mora',  'Teruel'),
('Montalbán',         'Teruel'),
('Aliaga',            'Teruel'),
('Albarracín',        'Teruel'),
('Calaceite',         'Teruel'),
('Valderrobres',      'Teruel'),
('Castellote',        'Teruel'),
('Híjar',             'Teruel');

-- =======================================================
-- 9. INSTALACION
-- =======================================================
INSERT INTO Instalacion (nombre, direccion, telefono, correo, localidad) VALUES
('Parque de Bomberos de Zaragoza Centro',    'Calle Compromiso de Caspe, 36',      '976123456', 'zbomberos.centro@aragon.es',    'Zaragoza'),
('Parque de Bomberos de Zaragoza Sur',       'Avenida Ranillas, 107',              '976234567', 'zbomberos.sur@aragon.es',       'Zaragoza'),
('Parque de Bomberos de Huesca',             'Calle Ricardo del Arco, 6',          '974111222', 'hbomberos@aragon.es',           'Huesca'),
('Parque de Bomberos de Teruel',             'Avenida Sagunto, 110',               '978100200', 'tbomberos@aragon.es',           'Teruel'),
('Parque de Bomberos de Calatayud',          'Polígono Industrial El Frasno, s/n', '976882233', 'calatayud.bomberos@aragon.es',  'Calatayud'),
('Parque de Bomberos de Jaca',              'Avenida de Francia, 45',             '974360011', 'jaca.bomberos@aragon.es',       'Jaca'),
('Parque de Bomberos de Alcañiz',            'Polígono Industrial Bajo Aragón, 8', '978830055', 'alcaniz.bomberos@aragon.es',    'Alcañiz'),
('Parque de Bomberos de Ejea de los Caballeros','Calle Mediodía, 22',             '976663344', 'ejea.bomberos@aragon.es',       'Ejea de los Caballeros'),
('Parque de Bomberos de Barbastro',          'Avenida de la Estación, 2',          '974311100', 'barbastro.bomberos@aragon.es',  'Barbastro'),
('Parque de Bomberos de Fraga',              'Calle Mayor, 80',                    '974470033', 'fraga.bomberos@aragon.es',      'Fraga');

-- =======================================================
-- 10. ALMACEN
-- =======================================================
INSERT INTO Almacen (id_almacen, id_instalacion, planta, nombre) VALUES
(1, 1, 0, 'Almacén Principal Planta Baja'),
(2, 1, 1, 'Almacén Equipos ERA Planta 1'),
(3, 1, 0, 'Almacén Herramientas Hidráulicas'),
(1, 2, 0, 'Almacén General Sur'),
(2, 2, 1, 'Almacén Material Forestal'),
(1, 3, 0, 'Almacén Principal Huesca'),
(2, 3, 1, 'Almacén ERA Huesca'),
(1, 4, 0, 'Almacén Principal Teruel'),
(1, 5, 0, 'Almacén Calatayud'),
(1, 6, 0, 'Almacén Jaca'),
(1, 7, 0, 'Almacén Alcañiz'),
(1, 8, 0, 'Almacén Ejea');

-- =======================================================
-- 11A. ALMACEN_MATERIAL_UNIDADES
-- =======================================================
INSERT INTO Almacen_Material_Unidades (id_almacen, id_instalacion, id_material, unidades) VALUES
(1, 1,  1, 15),
(1, 1,  2, 15),
(1, 1,  3, 30),
(1, 1,  4, 15),
(1, 1,  5, 15),
(1, 1, 19, 10),
(1, 1, 20, 8),
(1, 1, 22, 12),

(2, 1, 11, 20),
(2, 1, 12, 10),

(1, 2,  1, 12),
(1, 2,  2, 12),
(2, 2, 24, 20),
(2, 2, 25, 15),

(1, 3,  1, 10),
(1, 3,  2, 10),
(1, 3, 26, 6),

(1, 4,  1, 8),
(1, 4,  2, 8);

-- =======================================================
-- 11B. ALMACEN_MATERIAL_SERIE
-- =======================================================
INSERT INTO Almacen_Material_Serie
(id_almacen, id_instalacion, id_material, n_serie) VALUES

(2, 1, 10, '30001'),

(3, 1,  6, '60001'),
(3, 1,  7, '70001'),
(3, 1,  8, '80001'),
(3, 1,  9, '90001'),

(1, 2, 10, '30010'),

(2, 3, 10, '30020'),

(1, 4, 10, '30025');

-- =======================================================
-- 12. VEHICULO
--  Matrículas españolas actuales: 4 dígitos + 3 letras (sin Q,Ñ,CH,LL)
--  Matrículas antiguas de servicio oficial aún en circulación
-- =======================================================
INSERT INTO Vehiculo (matricula, nombre, id_instalacion, marca, modelo, tipo, disponibilidad, ult_latitud, ult_longitud) VALUES
-- Zaragoza Centro
('3421BCP', 'BZC-01 Autobomba Urbana Pesada', 1, 'Mercedes-Benz', 'Atego 1530 F',       'Autobomba Urbana Pesada',    1,  41.656100, -0.878290),
('5678DFG', 'BZC-02 Autobomba Urbana Media',  1, 'Iveco',          'Eurocargo 120E',     'Autobomba Urbana Media',     1,  41.656200, -0.878100),
('7890GHJ', 'BZC-03 Autoescala 42m',          1, 'MAN',            'TGS 32.400 6x4',    'Autoescala',                 1,  41.656300, -0.878000),
('1122KLM', 'BZC-04 Vehículo de Mando',       1, 'Toyota',         'Land Cruiser 150',  'Vehículo Ligero de Mando',   1,  41.656000, -0.878500),
('3344NOP', 'BZC-05 Unidad MMPP',             1, 'Volvo',          'FH 460',            'Unidad Materias Peligrosas', 0,  NULL,       NULL      ),
('5566RST', 'BZC-06 Autobomba Forestal',      1, 'Land Rover',     'Defender 130 4x4',  'Autobomba Forestal Ligera',  1,  41.656100, -0.878290),
-- Zaragoza Sur
('7788VWX', 'BZS-01 Autobomba Urbana Pesada', 2, 'Mercedes-Benz', 'Actros 2532 L',      'Autobomba Urbana Pesada',    1,  41.630500, -0.895100),
('9900YZB', 'BZS-02 Autoescala 30m',          2, 'Scania',         'P360 CB',           'Autoescala',                 1,  41.630600, -0.895000),
('2233CDF', 'BZS-03 Autobomba Forestal',      2, 'Toyota',         'Hilux 4x4 Extra Cab','Autobomba Forestal Ligera', 1,  41.630400, -0.895200),
-- Huesca
('4455GHK', 'BHU-01 Autobomba Urbana Media',  3, 'Iveco',          'Eurocargo 150E',    'Autobomba Urbana Media',     1,  42.136200, -0.408800),
('6677LMN', 'BHU-02 Vehículo de Mando',       3, 'Mitsubishi',     'L200 4x4',          'Vehículo Ligero de Mando',   1,  42.136300, -0.408700),
('8899PQR', 'BHU-03 Autobomba Forestal 4x4',  3, 'Land Rover',     'Defender 130 4x4',  'Autobomba Forestal Ligera',  1,  42.136100, -0.408900),
-- Teruel
('1023STW', 'BTE-01 Autobomba Urbana Media',  4, 'MAN',            'TGM 15.240',        'Autobomba Urbana Media',     1,  40.344100, -1.106500),
('3045XYA', 'BTE-02 Vehículo de Mando',       4, 'Toyota',         'Land Cruiser 150',  'Vehículo Ligero de Mando',   1,  40.344200, -1.106400),
('5067BCD', 'BTE-03 Autobomba Forestal 4x4',  4, 'Nissan',         'Patrol GR 4.2 TD',  'Autobomba Forestal Ligera',  1,  40.344000, -1.106600),
-- Calatayud
('7089EFG', 'BCA-01 Autobomba Urbana Ligera', 5, 'Iveco',          'Daily 70C',         'Autobomba Urbana Ligera',    1,  41.357800, -1.643200),
-- Jaca
('9012HJK', 'BJA-01 Autobomba Urbana Ligera', 6, 'Mercedes-Benz', 'Sprinter 519 CDI',   'Autobomba Urbana Ligera',    1,  42.568500, -0.551300),
('1234LMN', 'BJA-02 Autobomba Forestal 4x4',  6, 'Land Rover',     'Defender 110 4x4',  'Autobomba Forestal Ligera',  1,  42.568400, -0.551400),
-- Alcañiz
('3456PQS', 'BAL-01 Autobomba Urbana Media',  7, 'Renault',        'D18 4x2',           'Autobomba Urbana Media',     1,  41.050200, -0.133800),
-- Ejea
('5678TVX', 'BEJ-01 Autobomba Urbana Ligera', 8, 'Volkswagen',     'Crafter 50 4x4',    'Autobomba Urbana Ligera',    1,  42.130100, -1.137200);

-- =======================================================
-- 13. PERSONA
--  DNI: 8 dígitos + letra de control (cálculo correcto)
--  Teléfono: móvil español 6xx-7xx-8xx-9xx / fijo 97x-96x-91x
--  n_funcionario: formato DGA-AAAA-NNNN
-- =======================================================
-- =======================================================
-- 13. PERSONA (con columna foto_perfil añadida)
-- Requisito previo: haber ejecutado MIGRACION_foto_perfil.sql
-- =======================================================
INSERT INTO Persona (
    id_bombero, n_funcionario, dni, correo, telefono,
    f_ingreso_diputacion, talla_superior, talla_inferior, talla_calzado,
    nombre, apellidos, f_nacimiento,
    telefono_emergencia, domicilio, localidad,
    id_rol, activo, nombre_usuario, contrasenia,
    foto_perfil
) VALUES
-- INSPECTOR
('I001', 'DGA-2008-0001', '72345678Z', 'carlos.lopez.ruiz@aragon.es',      '976111222',
 '2008-03-01', 'L',  'L',  '43', 'Carlos',    'López Ruiz',         '1975-06-14',
 '629111222', 'Calle Goya, 12, 2ºA',        'Zaragoza', 5, 1, 'c.lopez.inspector',     '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),

('I002', 'DGA-2010-0002', '33456789R', 'marta.garcia.sans@aragon.es',      '974222333',
 '2010-05-15', 'M',  'M',  '38', 'Marta',     'García Sans',        '1978-11-22',
 '636222333', 'Plaza Navarra, 5, 3ºB',      'Huesca',   5, 1, 'm.garcia.inspector',    '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),

-- JEFE DE MANDO
('M001', 'DGA-2005-0010', '22567890F', 'pedro.sanchez.vidal@aragon.es',    '976333444',
 '2005-09-01', 'XL', 'XL', '45', 'Pedro',     'Sánchez Vidal',      '1971-03-05',
 '651333444', 'Paseo de la Independencia, 8, 1ºC', 'Zaragoza', 4, 1, 'p.sanchez.mando', '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),

('M002', 'DGA-2007-0011', '44678901H', 'ana.fernandez.gil@aragon.es',      '978444555',
 '2007-01-10', 'M',  'M',  '39', 'Ana',       'Fernández Gil',      '1974-08-17',
 '662444555', 'Calle San Francisco, 3, 4ºD', 'Teruel',   4, 1, 'a.fernandez.mando',   '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),

-- JEFE DE INTERVENCION
('J001', 'DGA-2009-0020', '55789012B', 'luis.martinez.pardo@aragon.es',    '976555666',
 '2009-04-20', 'L',  'L',  '44', 'Luis',      'Martínez Pardo',     '1976-01-28',
 '671555666', 'Avenida Cesar Augusto, 15, 2ºA', 'Zaragoza', 3, 1, 'l.martinez.jinter', '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),

('J002', 'DGA-2011-0021', '66890123W', 'elena.romero.blasco@aragon.es',    '974666777',
 '2011-02-14', 'S',  'S',  '37', 'Elena',     'Romero Blasco',      '1980-04-09',
 '683666777', 'Calle Ramón y Cajal, 7, 1ºB', 'Huesca',   3, 1, 'e.romero.jinter',     '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),

('J003', 'DGA-2012-0022', '77901234K', 'roberto.jimenez.luna@aragon.es',   '978777888',
 '2012-06-01', 'L',  'L',  '43', 'Roberto',   'Jiménez Luna',       '1979-09-15',
 '690777888', 'Plaza del Torico, 2, 3ºC',   'Teruel',   3, 1, 'r.jimenez.jinter',     '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),

-- OFICIALES
('O001', 'DGA-2013-0030', '88012345P', 'david.navarro.rico@aragon.es',     '976888999',
 '2013-03-11', 'L',  'L',  '44', 'David',     'Navarro Rico',       '1982-12-03',
 '605888999', 'Calle Miguel Servet, 22, 5ºA','Zaragoza', 2, 1, 'd.navarro.oficial',   '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),

('O002', 'DGA-2014-0031', '99123456X', 'laura.torres.molina@aragon.es',    '974900111',
 '2014-07-07', 'M',  'M',  '38', 'Laura',     'Torres Molina',      '1984-05-20',
 '617900111', 'Calle Padre Huesca, 11, 2ºD','Huesca',   2, 1, 'l.torres.oficial',    '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),

('O003', 'DGA-2015-0032', '10234567Q', 'miguel.delgado.pons@aragon.es',    '978100200',
 '2015-01-19', 'XL', 'L',  '46', 'Miguel',    'Delgado Pons',       '1983-07-11',
 '629100200', 'Avenida Aragón, 33, 1ºB',   'Teruel',   2, 1, 'm.delgado.oficial',   '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),

('O004', 'DGA-2016-0033', '20345678G', 'sofia.moreno.castillo@aragon.es',  '976200300',
 '2016-09-05', 'S',  'S',  '36', 'Sofía',     'Moreno Castillo',    '1986-02-28',
 '651200300', 'Plaza de España, 4, 4ºA',   'Zaragoza', 2, 1, 's.moreno.oficial',    '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),

-- BOMBEROS
('B001', 'DGA-2015-0100', '30456789M', 'juan.perez.herrero@aragon.es',     '976300400',
 '2015-06-15', 'L',  'L',  '43', 'Juan',      'Pérez Herrero',      '1985-05-10',
 '660300400', 'Calle Las Armas, 5, 3ºC',   'Zaragoza', 1, 1, 'j.perez.bombero',     '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),

('B002', 'DGA-2016-0101', '40567890C', 'maria.ruiz.espinosa@aragon.es',    '976400500',
 '2016-03-01', 'M',  'M',  '39', 'María',     'Ruiz Espinosa',      '1987-08-22',
 '672400500', 'Calle Predicadores, 8, 1ºA','Zaragoza', 1, 1, 'm.ruiz.bombero',      '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),

('B003', 'DGA-2017-0102', '50678901D', 'alberto.gonzalez.vera@aragon.es',  '976500600',
 '2017-09-18', 'XL', 'XL', '45', 'Alberto',   'González Vera',      '1988-03-14',
 '681500600', 'Avenida Goya, 40, 2ºB',     'Zaragoza', 1, 1, 'a.gonzalez.bombero',  '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),

('B004', 'DGA-2018-0103', '60789012V', 'paula.lopez.sainz@aragon.es',      '976600700',
 '2018-01-08', 'S',  'S',  '37', 'Paula',     'López Sainz',        '1990-11-05',
 '696600700', 'Calle Alfonso I, 16, 3ºD',  'Zaragoza', 1, 1, 'p.lopez.bombero',     '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),

('B005', 'DGA-2019-0104', '70890123N', 'sergio.martin.bravo@aragon.es',    '976700800',
 '2019-04-29', 'L',  'L',  '44', 'Sergio',    'Martín Bravo',       '1991-07-18',
 '617700800', 'Plaza San Pedro Nolasco, 3, 1ºA','Zaragoza', 1, 1, 's.martin.bombero','$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),

('B006', 'DGA-2020-0105', '80901234J', 'carla.garcia.pla@aragon.es',       '974800900',
 '2020-02-17', 'M',  'M',  '38', 'Carla',     'García Pla',         '1992-01-30',
 '629800900', 'Calle Padre Huesca, 9, 2ºC','Huesca',   1, 1, 'c.garcia.bombero',    '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),

('B007', 'DGA-2021-0106', '91012345S', 'andres.fernandez.mora@aragon.es',  '974900100',
 '2021-09-01', 'L',  'L',  '43', 'Andrés',    'Fernández Mora',     '1993-05-07',
 '651900100', 'Avenida Martínez de Velasco, 14, 4ºB','Huesca', 1, 1, 'a.fernandez.bombero','$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),

('B008', 'DGA-2022-0107', '01123456T', 'irene.torres.valls@aragon.es',     '978900200',
 '2022-03-14', 'M',  'S',  '38', 'Irene',     'Torres Valls',       '1994-09-21',
 '662900200', 'Calle San Francisco, 7, 3ºA','Teruel',  1, 1, 'i.torres.bombero',    '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),

('B009', 'DGA-2022-0108', '11234567Z', 'victor.sanchez.abad@aragon.es',    '978100300',
 '2022-06-20', 'L',  'L',  '42', 'Víctor',    'Sánchez Abad',       '1993-12-15',
 '671100300', 'Avenida Sagunto, 55, 2ºB',  'Teruel',  1, 1, 'v.sanchez.bombero',   '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),

('B010', 'DGA-2023-0109', '21345678R', 'noelia.jimenez.lara@aragon.es',    '976200400',
 '2023-01-09', 'M',  'M',  '38', 'Noelia',    'Jiménez Lara',       '1995-03-28',
 '683200400', 'Calle Costa, 6, 1ºD',       'Zaragoza', 1, 1, 'n.jimenez.bombero',   '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),

('B011', 'DGA-2023-0110', '31456789F', 'oscar.morales.vera@aragon.es',     '976300500',
 '2023-05-22', 'XL', 'XL', '46', 'Óscar',     'Morales Vera',       '1994-06-11',
 '690300500', 'Paseo Echegaray y Caballero, 12, 5ºC','Zaragoza', 1, 1, 'o.morales.bombero','$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),

('B012', 'DGA-2024-0111', '41567890H', 'diana.ruiz.gascon@aragon.es',      '974400600',
 '2024-02-01', 'S',  'S',  '36', 'Diana',     'Ruiz Gascón',        '1996-10-04',
 '605400600', 'Calle Coso Alto, 3, 2ºA',   'Huesca',   1, 1, 'd.ruiz.bombero',      '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),

-- Bombero inactivo (baja)
('B099', 'DGA-2010-0099', '51678901B', 'marcos.ibarra.gil@aragon.es',      '976500700',
 '2010-11-03', 'L',  'L',  '44', 'Marcos',    'Ibarra Gil',         '1980-02-17',
 '617500700', 'Calle Zurita, 18, 4ºB',     'Zaragoza', 1, 0, 'm.ibarra.baja',       NULL,
 NULL),

-- INSPECTOR adicional
('I003', 'DGA-2012-0003', '43567890L', 'ramon.castillo.vega@aragon.es', '976444111',
 '2012-01-15', 'L', 'L', '44', 'Ramón', 'Castillo Vega', '1977-09-10',
 '651444111', 'Calle Zurita, 22, 3ºA', 'Zaragoza', 5, 1, 'r.castillo.inspector',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
-- JEFE DE MANDO adicionales
('M003', 'DGA-2006-0012', '54678901P', 'jose.albericio.gil@aragon.es', '974333111',
 '2006-03-01', 'XL', 'XL', '46', 'José', 'Albericio Gil', '1972-04-20',
 '660333111', 'Calle Ramón y Cajal, 3, 2ºB', 'Huesca', 4, 1, 'j.albericio.mando',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('M004', 'DGA-2008-0013', '65789012K', 'carmen.villanueva.rios@aragon.es', '978222111',
 '2008-07-01', 'M', 'M', '38', 'Carmen', 'Villanueva Ríos', '1973-11-14',
 '672222111', 'Avenida Aragón, 55, 1ºD', 'Teruel', 4, 1, 'c.villanueva.mando',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL), 

-- JEFE DE INTERVENCIÓN adicionales
('J004', 'DGA-2013-0023', '76890123G', 'francisco.molina.bueno@aragon.es', '976444555',
 '2013-09-01', 'L', 'L', '43', 'Francisco', 'Molina Bueno', '1980-07-22',
 '681444555', 'Calle Coso, 45, 4ºC', 'Zaragoza', 3, 1, 'f.molina.jinter',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('J005', 'DGA-2014-0024', '87901234H', 'patricia.serrano.campo@aragon.es', '974555666',
 '2014-03-10', 'S', 'S', '37', 'Patricia', 'Serrano Campo', '1981-02-18',
 '692555666', 'Plaza Navarra, 8, 3ºA', 'Huesca', 3, 1, 'p.serrano.jinter',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('J006', 'DGA-2015-0025', '98012345W', 'emilio.pardo.lahoz@aragon.es', '978666777',
 '2015-06-22', 'L', 'L', '44', 'Emilio', 'Pardo Lahoz', '1982-08-03',
 '603666777', 'Calle Nueva, 7, 2ºB', 'Alcañiz', 3, 1, 'e.pardo.jinter',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
-- OFICIALES adicionales
('O005', 'DGA-2016-0034', '09123456B', 'roberto.gimenez.otin@aragon.es', '976777888',
 '2016-01-11', 'L', 'L', '44', 'Roberto', 'Giménez Otín', '1984-03-29',
 '614777888', 'Avenida Goya, 18, 5ºA', 'Zaragoza', 2, 1, 'r.gimenez.oficial',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('O006', 'DGA-2017-0035', '19234567C', 'beatriz.marco.lasierra@aragon.es', '974888999',
 '2017-09-04', 'M', 'M', '39', 'Beatriz', 'Marco Lasierra', '1985-06-15',
 '625888999', 'Calle del Parque, 12, 1ºB', 'Barbastro', 2, 1, 'b.marco.oficial',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('O007', 'DGA-2018-0036', '29345678D', 'alejandro.vicente.crespo@aragon.es', '978999100',
 '2018-04-16', 'XL', 'XL', '46', 'Alejandro', 'Vicente Crespo', '1986-10-07',
 '636999100', 'Plaza del Torico, 5, 2ºC', 'Teruel', 2, 1, 'a.vicente.oficial',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('O008', 'DGA-2019-0037', '39456789E', 'nuria.ibañez.palomar@aragon.es', '976100200',
 '2019-02-25', 'S', 'S', '36', 'Nuria', 'Ibáñez Palomar', '1987-01-24',
 '647100200', 'Calle Alfonso I, 30, 3ºD', 'Zaragoza', 2, 1, 'n.ibanez.oficial',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
-- BOMBEROS adicionales (30 más)
('B013', 'DGA-2024-0112', '49567890F', 'gabriel.blasco.peiro@aragon.es', '976200300',
 '2024-09-02', 'L', 'L', '43', 'Gabriel', 'Blasco Peiró', '1997-04-12',
 '658200300', 'Calle Las Armas, 12, 1ºA', 'Zaragoza', 1, 1, 'g.blasco.bombero',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('B014', 'DGA-2024-0113', '59678901H', 'lucia.asensio.mur@aragon.es', '974300400',
 '2024-09-02', 'M', 'M', '38', 'Lucía', 'Asensio Mur', '1998-07-03',
 '669300400', 'Calle Coso Alto, 9, 2ºB', 'Huesca', 1, 1, 'l.asensio.bombero',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('B015', 'DGA-2024-0114', '69789012J', 'jorge.lacueva.simon@aragon.es', '978400500',
 '2024-09-02', 'XL', 'L', '45', 'Jorge', 'Lacueva Simón', '1996-11-21',
 '676400500', 'Avenida Sagunto, 33, 4ºA', 'Teruel', 1, 1, 'j.lacueva.bombero',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('B016', 'DGA-2025-0115', '79890123K', 'elena.gracia.lobera@aragon.es', '976500600',
 '2025-01-13', 'S', 'S', '37', 'Elena', 'Gracia Lobera', '1999-02-08',
 '683500600', 'Calle Predicadores, 15, 1ºC', 'Zaragoza', 1, 1, 'e.gracia.bombero',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('B017', 'DGA-2025-0116', '89901234L', 'hector.franco.latre@aragon.es', '974600700',
 '2025-01-13', 'L', 'L', '44', 'Héctor', 'Franco Latre', '1998-05-19',
 '690600700', 'Calle Ricardo del Arco, 11, 3ºB', 'Huesca', 1, 1, 'h.franco.bombero',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('B018', 'DGA-2025-0117', '90012345M', 'silvia.aznar.belio@aragon.es', '978700800',
 '2025-01-13', 'M', 'M', '38', 'Silvia', 'Aznar Belío', '2000-09-30',
 '601700800', 'Plaza San Pedro Nolasco, 6, 2ºD', 'Teruel', 1, 1, 's.aznar.bombero',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('B019', 'DGA-2025-0118', '00123456N', 'ivan.palacin.otal@aragon.es', '976800900',
 '2025-01-13', 'XL', 'XL', '46', 'Iván', 'Palacín Otal', '1997-12-16',
 '612800900', 'Paseo Sagasta, 44, 5ºA', 'Zaragoza', 1, 1, 'i.palacin.bombero',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('B020', 'DGA-2025-0119', '10234567P', 'andrea.roca.quilez@aragon.es', '974900100',
 '2025-04-07', 'S', 'S', '36', 'Andrea', 'Roca Quílez', '1999-03-25',
 '623900100', 'Avenida de Francia, 22, 1ºA', 'Jaca', 1, 1, 'a.roca.bombero',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('B021', 'DGA-2025-0120', '20345678Q', 'carlos.pueyo.barcos@aragon.es', '978100200',
 '2025-04-07', 'L', 'L', '43', 'Carlos', 'Pueyo Barcos', '1998-08-11',
 '634100200', 'Polígono Industrial Bajo Aragón, 3 piso 2', 'Alcañiz', 1, 1, 'c.pueyo.bombero',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('B022', 'DGA-2025-0121', '30456789R', 'marta.biel.escuer@aragon.es', '976200300',
 '2025-04-07', 'M', 'M', '39', 'Marta', 'Biel Escuer', '2000-01-07',
 '645200300', 'Calle Mediodía, 8, 3ºC', 'Ejea de los Caballeros', 1, 1, 'm.biel.bombero',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('B023', 'DGA-2025-0122', '40567890S', 'pablo.usieto.gracia@aragon.es', '976300400',
 '2025-09-01', 'L', 'L', '44', 'Pablo', 'Usieto Gracia', '1999-06-22',
 '656300400', 'Calle Goya, 55, 2ºA', 'Zaragoza', 1, 1, 'p.usieto.bombero',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('B024', 'DGA-2025-0123', '50678901T', 'ana.asin.plou@aragon.es', '974400500',
 '2025-09-01', 'S', 'S', '37', 'Ana', 'Asín Plou', '2000-10-14',
 '667400500', 'Calle Padre Huesca, 25, 4ºB', 'Huesca', 1, 1, 'a.asin.bombero',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('B025', 'DGA-2025-0124', '60787012V', 'sergio.subias.ara@aragon.es', '978500600',
 '2025-09-01', 'XL', 'XL', '45', 'Sergio', 'Subías Ara', '1998-04-03',
 '678500600', 'Avenida Aragón, 44, 1ºD', 'Teruel', 1, 1, 's.subias.bombero',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('B026', 'DGA-2025-0125', '70890123W', 'raquel.lafuente.esteban@aragon.es', '976600700',
 '2025-09-01', 'M', 'M', '38', 'Raquel', 'Lafuente Esteban', '2001-07-29',
 '689600700', 'Paseo de la Independencia, 22, 3ºC', 'Zaragoza', 1, 1, 'r.lafuente.bombero',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('B027', 'DGA-2025-0126', '80901234X', 'david.fanlo.lainez@aragon.es', '974700800',
 '2025-09-01', 'L', 'L', '43', 'David', 'Fanlo Laínez', '1999-09-16',
 '696700800', 'Calle Monzón, 7, 2ºA', 'Barbastro', 1, 1, 'd.fanlo.bombero',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('B028', 'DGA-2025-0127', '91012345Y', 'cristina.camara.pina@aragon.es', '978800900',
 '2025-09-01', 'S', 'M', '37', 'Cristina', 'Cámara Piña', '2000-12-05',
 '603800900', 'Calle San Francisco, 18, 3ºD', 'Teruel', 1, 1, 'c.camara.bombero',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('B029', 'DGA-2026-0128', '01123456Z', 'miguel.trasobares.gil@aragon.es', '976900100',
 '2026-01-12', 'XL', 'XL', '46', 'Miguel', 'Trasobares Gil', '2000-03-18',
 '614900100', 'Calle Las Armas, 30, 1ºB', 'Zaragoza', 1, 1, 'm.trasobares.bombero',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('B030', 'DGA-2026-0129', '11234567A', 'leire.ezpeleta.garde@aragon.es', '974100200',
 '2026-01-12', 'M', 'M', '38', 'Leire', 'Ezpeleta Garde', '2001-05-27',
 '625100200', 'Avenida de Francia, 33, 2ºC', 'Jaca', 1, 1, 'l.ezpeleta.bombero',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('B031', 'DGA-2026-0130', '21345678B', 'felix.romeo.gimenez@aragon.es', '976200300',
 '2026-01-12', 'L', 'L', '44', 'Félix', 'Romeo Giménez', '1999-10-09',
 '636200300', 'Avenida Ranillas, 55, 4ºA', 'Zaragoza', 1, 1, 'f.romeo.bombero',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('B032', 'DGA-2026-0131', '31456789C', 'natalia.gonzalez.mena@aragon.es', '974300400',
 '2026-01-12', 'S', 'S', '36', 'Natalia', 'González Mena', '2001-01-31',
 '647300400', 'Calle Coso Alto, 15, 3ºB', 'Huesca', 1, 1, 'n.gonzalez.bombero',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('B033', 'DGA-2026-0132', '41567890D', 'andres.abad.seral@aragon.es', '978400500',
 '2026-03-02', 'L', 'L', '43', 'Andrés', 'Abad Seral', '2000-08-20',
 '658400500', 'Calle San Francisco, 9, 1ºA', 'Alcañiz', 1, 1, 'a.abad.bombero',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('B034', 'DGA-2026-0133', '51678901E', 'teresa.lamana.rivas@aragon.es', '976500600',
 '2026-03-02', 'M', 'M', '39', 'Teresa', 'Lamana Rivas', '2001-11-12',
 '669500600', 'Calle Costa, 22, 2ºC', 'Zaragoza', 1, 1, 't.lamana.bombero',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
('B035', 'DGA-2026-0134', '61789012F', 'oscar.pino.tena@aragon.es', '974600700',
 '2026-03-02', 'XL', 'L', '45', 'Óscar', 'Pino Tena', '2000-06-08',
 '676600700', 'Plaza Navarra, 14, 5ºA', 'Huesca', 1, 1, 'o.pino.bombero',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL),
 
-- Bombero inactivo adicional
('B098', 'DGA-2009-0098', '71890123G', 'elena.casanova.broto@aragon.es', '974500600',
 '2009-04-01', 'M', 'M', '38', 'Elena', 'Casanova Broto', '1979-07-05',
 '683500600', 'Calle San Pedro, 3, 1ºA', 'Jaca', 1, 0, 'e.casanova.baja',
 '$2a$12$LFrtSbZTRJfQn23edTwxhOryZZhFfMnwI6JWfqdQQ6mA8mZrUZcIe',
 NULL);

-- =======================================================
-- 14. PERSONA_MATERIAL
-- =======================================================
INSERT INTO Persona_Material (id_bombero, id_material, nserie) VALUES
('I001',  1, 'CASCO-ZC-001'), ('I001',  2, 'TRAJE-ZC-001'), ('I001', 10, 'ERA-ZC-001'),
('M001',  1, 'CASCO-ZC-002'), ('M001',  2, 'TRAJE-ZC-002'), ('M001', 10, 'ERA-ZC-002'),
('J001',  1, 'CASCO-ZC-003'), ('J001',  2, 'TRAJE-ZC-003'), ('J001', 10, 'ERA-ZC-003'),
('O001',  1, 'CASCO-ZC-004'), ('O001',  2, 'TRAJE-ZC-004'), ('O001', 10, 'ERA-ZC-004'),
('B001',  1, 'CASCO-ZC-005'), ('B001',  2, 'TRAJE-ZC-005'), ('B001', 10, 'ERA-ZC-005'),
('B002',  1, 'CASCO-ZC-006'), ('B002',  2, 'TRAJE-ZC-006'), ('B002', 10, 'ERA-ZC-006'),
('B003',  1, 'CASCO-ZC-007'), ('B003',  2, 'TRAJE-ZC-007'), ('B003', 10, 'ERA-ZC-007'),
('B004',  1, 'CASCO-ZC-008'), ('B004',  2, 'TRAJE-ZC-008'), ('B004', 10, 'ERA-ZC-008'),
('B005',  1, 'CASCO-ZC-009'), ('B005',  2, 'TRAJE-ZC-009'), ('B005', 10, 'ERA-ZC-009'),
('B006',  1, 'CASCO-HU-001'), ('B006',  2, 'TRAJE-HU-001'), ('B006', 10, 'ERA-HU-001'),
('B007',  1, 'CASCO-HU-002'), ('B007',  2, 'TRAJE-HU-002'), ('B007', 10, 'ERA-HU-002'),
('B008',  1, 'CASCO-TE-001'), ('B008',  2, 'TRAJE-TE-001'), ('B008', 10, 'ERA-TE-001'),
('B009',  1, 'CASCO-TE-002'), ('B009',  2, 'TRAJE-TE-002'), ('B009', 10, 'ERA-TE-002'),
('B010',  1, 'CASCO-ZC-010'), ('B010',  2, 'TRAJE-ZC-010'), ('B010', 10, 'ERA-ZC-010'),
('B011',  1, 'CASCO-ZC-011'), ('B011',  2, 'TRAJE-ZC-011'), ('B011', 10, 'ERA-ZC-011'),
('B012',  1, 'CASCO-HU-003'), ('B012',  2, 'TRAJE-HU-003'), ('B012', 10, 'ERA-HU-003'),
('I003',  1, 'CASCO-ZC-020'), ('I003',  2, 'TRAJE-ZC-020'), ('I003', 10, 'ERA-ZC-020'),
('M003',  1, 'CASCO-HU-010'), ('M003',  2, 'TRAJE-HU-010'), ('M003', 10, 'ERA-HU-010'),
('M004',  1, 'CASCO-TE-010'), ('M004',  2, 'TRAJE-TE-010'), ('M004', 10, 'ERA-TE-010'),
('J004',  1, 'CASCO-ZC-021'), ('J004',  2, 'TRAJE-ZC-021'), ('J004', 10, 'ERA-ZC-021'),
('J005',  1, 'CASCO-HU-011'), ('J005',  2, 'TRAJE-HU-011'), ('J005', 10, 'ERA-HU-011'),
('J006',  1, 'CASCO-AL-001'), ('J006',  2, 'TRAJE-AL-001'), ('J006', 10, 'ERA-AL-001'),
('O005',  1, 'CASCO-ZC-022'), ('O005',  2, 'TRAJE-ZC-022'), ('O005', 10, 'ERA-ZC-022'),
('O006',  1, 'CASCO-BA-001'), ('O006',  2, 'TRAJE-BA-001'), ('O006', 10, 'ERA-BA-001'),
('O007',  1, 'CASCO-TE-011'), ('O007',  2, 'TRAJE-TE-011'), ('O007', 10, 'ERA-TE-011'),
('O008',  1, 'CASCO-ZC-023'), ('O008',  2, 'TRAJE-ZC-023'), ('O008', 10, 'ERA-ZC-023'),
('B013',  1, 'CASCO-ZC-024'), ('B013',  2, 'TRAJE-ZC-024'), ('B013', 10, 'ERA-ZC-024'),
('B014',  1, 'CASCO-HU-012'), ('B014',  2, 'TRAJE-HU-012'), ('B014', 10, 'ERA-HU-012'),
('B015',  1, 'CASCO-TE-012'), ('B015',  2, 'TRAJE-TE-012'), ('B015', 10, 'ERA-TE-012'),
('B016',  1, 'CASCO-ZC-025'), ('B016',  2, 'TRAJE-ZC-025'), ('B016', 10, 'ERA-ZC-025'),
('B017',  1, 'CASCO-HU-013'), ('B017',  2, 'TRAJE-HU-013'), ('B017', 10, 'ERA-HU-013'),
('B018',  1, 'CASCO-TE-013'), ('B018',  2, 'TRAJE-TE-013'), ('B018', 10, 'ERA-TE-013'),
('B019',  1, 'CASCO-ZC-026'), ('B019',  2, 'TRAJE-ZC-026'), ('B019', 10, 'ERA-ZC-026'),
('B020',  1, 'CASCO-JA-001'), ('B020',  2, 'TRAJE-JA-001'), ('B020', 10, 'ERA-JA-001'),
('B021',  1, 'CASCO-AL-002'), ('B021',  2, 'TRAJE-AL-002'), ('B021', 10, 'ERA-AL-002'),
('B022',  1, 'CASCO-EJ-001'), ('B022',  2, 'TRAJE-EJ-001'), ('B022', 10, 'ERA-EJ-001'),
('B023',  1, 'CASCO-ZC-027'), ('B023',  2, 'TRAJE-ZC-027'), ('B023', 10, 'ERA-ZC-027'),
('B024',  1, 'CASCO-HU-014'), ('B024',  2, 'TRAJE-HU-014'), ('B024', 10, 'ERA-HU-014'),
('B025',  1, 'CASCO-TE-014'), ('B025',  2, 'TRAJE-TE-014'), ('B025', 10, 'ERA-TE-014'),
('B026',  1, 'CASCO-ZC-028'), ('B026',  2, 'TRAJE-ZC-028'), ('B026', 10, 'ERA-ZC-028'),
('B027',  1, 'CASCO-BA-002'), ('B027',  2, 'TRAJE-BA-002'), ('B027', 10, 'ERA-BA-002'),
('B028',  1, 'CASCO-TE-015'), ('B028',  2, 'TRAJE-TE-015'), ('B028', 10, 'ERA-TE-015'),
('B029',  1, 'CASCO-ZC-029'), ('B029',  2, 'TRAJE-ZC-029'), ('B029', 10, 'ERA-ZC-029'),
('B030',  1, 'CASCO-JA-002'), ('B030',  2, 'TRAJE-JA-002'), ('B030', 10, 'ERA-JA-002'),
('B031',  1, 'CASCO-ZC-030'), ('B031',  2, 'TRAJE-ZC-030'), ('B031', 10, 'ERA-ZC-030'),
('B032',  1, 'CASCO-HU-015'), ('B032',  2, 'TRAJE-HU-015'), ('B032', 10, 'ERA-HU-015'),
('B033',  1, 'CASCO-AL-003'), ('B033',  2, 'TRAJE-AL-003'), ('B033', 10, 'ERA-AL-003'),
('B034',  1, 'CASCO-ZC-031'), ('B034',  2, 'TRAJE-ZC-031'), ('B034', 10, 'ERA-ZC-031'),
('B035',  1, 'CASCO-HU-016'), ('B035',  2, 'TRAJE-HU-016'), ('B035', 10, 'ERA-HU-016');

-- =======================================================
-- 15. EMERGENCIA
-- =======================================================
INSERT INTO Emergencia (id_bombero, fecha, descripcion, estado, direccion, nombre_solicitante, tlf_solicitante, codigo_tipo) VALUES
('I001', '2025-01-15 02:34:00', 'Incendio declarado en vivienda de tres plantas. Posibles personas atrapadas en segunda planta.',                            'CERRADA', 'Calle Goya, 87',                   'Vecino Comunidad',  '976100200', 1),
('J001', '2025-02-03 14:20:00', 'Colisión múltiple en la A-2 con tres vehículos implicados. Dos personas atrapadas en turismo.',                             'CERRADA', 'A-2 Km 292 dirección Madrid',      'Guardia Civil',     '062',       6),
('J002', '2025-02-18 09:10:00', 'Incendio forestal en zona de pinares en las proximidades de la localidad. Riesgo de propagación al casco urbano.',          'CERRADA', 'Monte Pinar Alto, Huesca',         'BRIF Arabí',        '974500600', 4),
('M001', '2025-03-05 20:45:00', 'Fuga de gas en restaurante. Evacuación preventiva del edificio. Empresa suministradora avisada.',                           'CERRADA', 'Calle Don Jaime I, 22',            'Propietario local', '976222333', 14),
('J001', '2025-03-22 11:30:00', 'Trabajador atrapado en silo de grano. Extracción complicada por escasez de espacio.',                                       'CERRADA', 'Cooperativa Agraria San Valero, Ejea','Responsable RRHH','976663355', 10),
('O001', '2025-04-10 16:15:00', 'Incendio en nave industrial con almacenamiento de plásticos. Columna de humo visible a 10 km.',                             'CERRADA', 'Polígono Ind. Malpica, Nave 34',   'Seguridad empresa', '976455566', 3),
('J003', '2025-04-28 07:05:00', 'Accidente de tráfico en la N-234. Camión volcado con carga de madera. Un herido leve.',                                     'CERRADA', 'N-234 Km 55, Calamocha',           '112 Aragón',        '112',       6),
('J001', '2025-06-14 13:50:00', 'Incendio de interfaz en zona de vegetación contigua a urbanización Las Viñas. Viento 60 km/h.',                             'CERRADA', 'Urbanización Las Viñas, Cuarte',   'Presidente CCPP',   '976433322', 5),
('I002', '2025-07-02 15:20:00', 'Gran incendio forestal en Sierra de Guara. Coordinación con helicópteros del GEA y bomberos forestales de la DGA.',         'CERRADA', 'Sierra de Guara, sector norte',    'Agente Forestal',   '974556677', 4),
('M002', '2025-07-19 23:10:00', 'Explosión en gasolinera con posterior incendio. Tres vehículos afectados. Sin heridos graves.',                              'CERRADA', 'Avenida Sagunto, 89',              '112 Aragón',        '112',       3),
('J001', '2025-08-07 10:30:00', 'Derrumbamiento parcial de edificio de viviendas de 1950. Planta baja colapsada. Búsqueda de posibles atrapados.',           'CERRADA', 'Calle Manifestación, 14',          'Policia Local Zgz', '092',       17),
('O002', '2025-09-01 08:45:00', 'Vehículo accidentado en el río Gállego. Conductor en el agua. Rescate acuático activado.',                                  'CERRADA', 'Puente de Cartuja Baja',           'Testigo',           '629445566', 6),
('J001', '2025-10-12 19:00:00', 'Incendio en local comercial de electrodomésticos. Propagación contenida. Sin heridos.',                                     'CERRADA', 'Calle Coso, 112',                  'Propietario',       '976334455', 2),
('M001', '2025-11-20 06:30:00', 'Camión de mercancías peligrosas (clase 3, líquido inflamable) con fuga tras accidente en la AP-2.',                         'ACTIVA',  'AP-2 Km 240 salida 234',           '112 Aragón',        '112',       16),
('J002', '2025-12-01 14:00:00', 'Rescate de senderista con fractura de tobillo en zona de barrancos, Riglos. Colaboración con GRS.',                         'ACTIVA',  'Mallos de Riglos, barranc sur',    'Acompañante',       '695334411', 9),
('J001', '2026-01-03 03:15:00', 'Incendio declarado en vivienda primera planta. Vecinos evacuados. Sin heridos. Causa probable cortocircuito en cuadro eléctrico.', 'CERRADA', 'Calle Boggiero, 34', 'Policía Local', '092', 1),
('J004', '2026-01-05 14:20:00', 'Accidente tráfico en la A-2 con dos turismos. Un herido leve atrapado en el asiento del conductor.', 'CERRADA', 'A-2 Km 305 dirección Barcelona', 'Guardia Civil', '062', 6),
('J002', '2026-01-07 09:45:00', 'Fuga de gas natural en edificio de viviendas. Evacuación preventiva de tres plantas. Endesa avisada.', 'CERRADA', 'Calle Miguel Servet, 88', 'Vecino 3ºB', '976445566', 14),
('M001', '2026-01-10 21:30:00', 'Incendio en nave industrial de almacenamiento de productos plásticos en polígono. Riesgo de colapso de cubierta.', 'CERRADA', 'Polígono Industrial La Cartuja, Nave 12', 'Seguridad nocturna', '976233344', 3),
('J001', '2026-01-12 11:00:00', 'Nevada intensa. Árbol caído sobre vehículo en vía pública. Conductor ileso. Retirada del obstáculo y señalización.', 'CERRADA', 'Paseo Constitución cruce con Calle Lugo', '112 Aragón', '112', 12),
('J005', '2026-01-15 07:30:00', 'Incendio en local hostelería planta baja. Extinción contenida. Dos trabajadores con inhalación de humo leve.', 'CERRADA', 'Calle Ramón y Cajal, 12, Huesca', 'Propietario bar', '974556677', 2),
('O005', '2026-01-18 16:00:00', 'Rescate de persona mayor caída en barranco junto al río Gállego. Fractura de tobillo. Coordinación con 061.', 'CERRADA', 'Parque Lineal del Gállego, km 3', 'Excursionista', '629112233', 8),
('J001', '2026-01-20 23:55:00', 'Incendio en contenedor de basura con propagación a fachada de edificio. Afectada planta baja. Sin heridos.', 'CERRADA', 'Calle Mayor, 7', '112 Aragón', '112', 1),
('J003', '2026-01-22 10:20:00', 'Camión de mercancías peligrosas clase 3 volcado en la N-234. Fuga contenida. Zona perimetrada y descontaminada.', 'CERRADA', 'N-234 Km 80, Teruel', 'Guardia Civil Tráfico', '062', 16),
('J004', '2026-01-25 08:45:00', 'Viento fuerte causa desprendimiento de cornisa en edificio histórico. Afectada la acera. Sin víctimas.', 'CERRADA', 'Plaza España, 3, Zaragoza', 'Policía Local', '092', 13),
('J001', '2026-02-02 13:30:00', 'Accidente de moto en la A-23. Motorista atrapado bajo vehículo. Rescate de urgencia. Herido grave trasladado al HUMS.', 'CERRADA', 'A-23 Km 160, dirección Valencia', '112 Aragón', '112', 7),
('J002', '2026-02-04 19:00:00', 'Incendio forestal en zona de matorral en las inmediaciones de Zuera. Viento moderado. Controlado en 4 horas.', 'CERRADA', 'Monte Zuera, sector suroeste', 'Agente Forestal DGA', '974233344', 4),
('M002', '2026-02-06 02:10:00', 'Derrumbe de falso techo en local de ocio nocturno. Cuatro personas con traumatismos leves. Búsqueda de posibles atrapados. Negativo.', 'CERRADA', 'Calle del Temple, 9, Zaragoza', 'Servicio de Seguridad', '976889900', 17),
('J004', '2026-02-09 11:15:00', 'Inundación de garaje comunitario por rotura de colector. Achique de agua y ventilación de gases.', 'CERRADA', 'Calle Coso, 200, Zaragoza', 'Presidente comunidad', '976334411', 11),
('J005', '2026-02-11 15:40:00', 'Rescate en espacio confinado. Trabajador de mantenimiento inconsciente en depósito de agua. Extraído con vida.', 'CERRADA', 'Estación Depuradora Huesca, sector norte', 'Responsable planta', '974100200', 10),
('J006', '2026-02-13 08:50:00', 'Incendio en vehículo industrial aparcado en zona de servicio. Extinción antes de propagación.', 'CERRADA', 'Área de Servicio La Puebla, N-232', 'Conductor camión', '676445533', 3),
('J001', '2026-02-17 20:00:00', 'Explosión de caldera en vivienda unifamiliar. Dos heridos con quemaduras de segundo grado. Evacuados por 061.', 'CERRADA', 'Calle Torrecilla, 5, Utebo', '112 Aragón', '112', 1),
('J003', '2026-02-19 10:30:00', 'Accidente de tráfico con tres vehículos en la A-23. Cuatro heridos, uno atrapado. Extracción con herramienta hidráulica.', 'CERRADA', 'A-23 Km 87 dirección Zaragoza', 'Guardia Civil', '062', 7),
('O007', '2026-02-21 14:00:00', 'Incendio en vivienda con animal atrapado. Extinción rápida. Sin heridos humanos. Gato rescatado.', 'CERRADA', 'Calle Nueva, 18, Teruel', 'Vecina del bloque', '978556677', 1),
('J004', '2026-02-24 09:00:00', 'Accidente laboral. Operario atrapado en prensa hidráulica de nave industrial. Rescate con corte de maquinaria.', 'CERRADA', 'Polígono Malpica, Nave 88, Zaragoza', 'Encargado planta', '976101010', 10),
('J001', '2026-02-26 03:45:00', 'Incendio en edificio de ocho plantas. Origen en cuarto de contadores. Evacuación de 22 familias. Sin heridos.', 'CERRADA', 'Avenida Goya, 78, Zaragoza', '112 Aragón', '112', 1),
('J002', '2026-03-01 11:00:00', 'Incendio forestal en Sierra de Guara. Coordinación con helicópteros del GEA. Superficie afectada 3 ha.', 'CERRADA', 'Sierra de Guara, paraje Mascún', 'Agente Forestal', '974556611', 4),
('J004', '2026-03-02 16:30:00', 'Accidente de tráfico en la AP-2. Turismo contra quitamiedos. Conductor herido leve atrapado. Extracción satisfactoria.', 'CERRADA', 'AP-2 Km 255 sentido Madrid', 'Autopista Henarsa', '900200200', 6),
('M001', '2026-03-04 08:15:00', 'Fuga de amoniaco en instalación frigorífica de empresa cárnica. Evacuación preventiva. Tres trabajadores con irritación ocular.', 'CERRADA', 'Polígono Industrial Sur, Calamocha', 'Encargado empresa', '978334455', 15),
('J001', '2026-03-05 22:10:00', 'Incendio en vivienda de planta baja. Causa estufa de leña mal apagada. Afectada sala de estar. Sin heridos.', 'CERRADA', 'Calle Contamina, 3, Zaragoza', 'Propietario', '976777888', 1),
('J005', '2026-03-07 14:45:00', 'Rescate de senderista con hipotermia en zona de barrancos de Mascún. Helicóptero GEA activado. Traslado al Hospital de Huesca.', 'CERRADA', 'Barrancos de Mascún, Rodellar', 'Compañero de ruta', '695221133', 9),
('J003', '2026-03-10 10:00:00', 'Derrame de gasóleo en calzada tras accidente de cisternas. Absorción y limpieza de calzada.', 'CERRADA', 'N-420 Km 215, Alcañiz', 'Conductor cisterna', '978233344', 15),
('O005', '2026-03-11 21:30:00', 'Incendio en local comercial de ropa. Extinción antes de propagación. Sin heridos. Daños materiales moderados.', 'CERRADA', 'Calle Don Jaime I, 44, Zaragoza', 'Vecino planta alta', '976556677', 2),
('J004', '2026-03-13 09:15:00', 'Accidente tráfico con motocicleta. Motorista atrapado bajo vehículo. Herido grave. Rescate y coordinación con 061.', 'CERRADA', 'Carretera de Madrid, Km 6, Zaragoza', '112 Aragón', '112', 6),
('J001', '2026-03-14 03:00:00', 'Incendio en edificio de viviendas. Cuarta planta afectada. Evacuación de todo el edificio. Una persona con quemaduras leves.', 'CERRADA', 'Calle Predicadores, 55, Zaragoza', '112 Aragón', '112', 1),
('J002', '2026-03-15 12:20:00', 'Incendio forestal en zona de pinar cerca de Zuera. Viento fuerte. Coordinación con bomberos forestales DGA. Superficie afectada 8 ha.', 'CERRADA', 'Monte Zuera, pista forestal km 12', 'BRIF Jaca', '974345678', 4),
('J005', '2026-03-16 15:00:00', 'Vehículo accidentado sumergido en acequia de riego. Conductor rescatado con vida. Herido leve.', 'CERRADA', 'Camino de las Canteras, Huesca', 'Agricultor testigo', '974889900', 11),
('J006', '2026-03-17 08:30:00', 'Incendio en almacén agrícola. Afectadas billas de paja. Sin heridos. Control en 2 horas.', 'CERRADA', 'Camino de Alcañiz, polígono agrícola, Híjar', 'Propietario', '978112233', 3),
('M001', '2026-03-18 11:00:00', 'Accidente en autopista con camión tráiler volcado. Carga de madera en calzada. Conductor herido leve. Limpieza viaria.', 'CERRADA', 'AP-2 Km 241 sentido Barcelona', 'Operador autopista', '900200200', 7),
('J001', '2026-03-19 16:45:00', 'Incendio en cuarto de instalaciones de comunidad de vecinos. Propagación a local de aparcamiento. Sin heridos.', 'CERRADA', 'Avenida César Augusto, 33, Zaragoza', 'Administrador finca', '976224433', 1),
('J004', '2026-03-20 07:15:00', 'Incendio declarado en vivienda segunda y tercera planta. Posibles personas atrapadas. Equipos de búsqueda activados.', 'ACTIVA', 'Calle Las Armas, 22, Zaragoza', '112 Aragón', '112', 1),
('J002', '2026-03-20 09:30:00', 'Incendio forestal en zona de sierra. Viento 80 km/h. Coordinación con helicópteros. Riesgo de propagación a urbanización.', 'ACTIVA', 'Sierra de Alcubierre, sector este', 'Agente Forestal DGA', '974556611', 5),
('J005', '2026-03-20 11:45:00', 'Accidente de tráfico múltiple en la A-22. Cuatro vehículos implicados, dos personas atrapadas. Intervención en curso.', 'ACTIVA', 'A-22 Km 68, Huesca sentido Lleida', 'Guardia Civil Tráfico', '062', 7),
('J001', '2025-12-03 14:30:00', 'Incendio en vivienda de planta alta. Causa posible vela encendida. Sin heridos. Daños materiales en dormitorio.', 'CERRADA', 'Calle Boggiero, 15, Zaragoza', 'Propietario', '976334455', 1),
('J003', '2025-12-10 09:00:00', 'Accidente de tráfico con camión articulado. Derrame de carga. Un herido grave. Rescate y limpieza de calzada.', 'CERRADA', 'N-232 Km 65, dirección Alcañiz', 'Guardia Civil', '062', 7),
('J002', '2025-12-15 15:00:00', 'Rescate de montañero con fractura de pierna en zona de alta montaña. Colaboración con GRS Montaña. Evacuado en helicóptero.', 'CERRADA', 'Macizo del Aneto, cara norte', 'Compañero', '695446677', 9),
('M002', '2025-12-18 20:30:00', 'Fuga de gas en restaurante. Evacuación preventiva. Empresa distribuidora notificada. Sin heridos.', 'CERRADA', 'Calle Mayor, 33, Calatayud', 'Propietario', '976552233', 14),
('J001', '2025-12-22 12:00:00', 'Incendio nave industrial con materiales pirotécnicos en zona controlada. Gestión de riesgo especial.', 'CERRADA', 'Polígono El Portazgo, Nave 4, Zaragoza', 'Guardia de seguridad', '976900100', 3),
('J004', '2025-12-28 04:45:00', 'Incendio en vivienda de planta baja. Una persona mayor rescatada con quemaduras. Trasladada al HUMS.', 'CERRADA', 'Calle Zurita, 7, Zaragoza', '112 Aragón', '112', 1),
('O007', '2026-01-08 17:30:00', 'Socavón y hundimiento de terreno en vía pública. Afectado firme de calzada. Balizado y restricción de tráfico.', 'CERRADA', 'Avenida Sagunto, 44, Teruel', 'Policía Local Teruel', '092', 18),
('J006', '2026-01-14 10:00:00', 'Accidente tráfico en carretera comarcal. Turismo y furgoneta. Dos heridos atrapados. Extracción satisfactoria.', 'CERRADA', 'CV-35 Km 22, Alcañiz', 'Guardia Civil', '062', 6),
('J005', '2026-01-28 08:00:00', 'Rescate de trabajador atrapado en silo de cereal. Extracción compleja en espacio confinado. Sin heridos graves.', 'CERRADA', 'Cooperativa Agraria de Barbastro', 'Encargado RRHH', '974449900', 10),
('O006', '2026-02-03 16:00:00', 'Incendio en cubierta de nave industrial. Extinción exitosa antes de propagación. Sin heridos.', 'CERRADA', 'Polígono de Barbastro, Nave 22', 'Vigilante seguridad', '974887766', 3),
('J004', '2026-02-28 22:00:00', 'Incendio en garaje comunitario. Cuatro vehículos afectados. Sin heridos. Daños estructurales menores.', 'CERRADA', 'Calle Goya, 104, Zaragoza', 'Vecino 1ºA', '976223344', 1);

-- =======================================================
-- 16. EMERGENCIA_VEHICULO
-- =======================================================
INSERT INTO Emergencia_Vehiculo (matricula, id_emergencia, f_salida, f_llegada, f_regreso) VALUES
('3421BCP', 1,  '2025-01-15 02:40:00', '2025-01-15 02:58:00', '2025-01-15 05:30:00'),
('5678DFG', 1,  '2025-01-15 02:40:00', '2025-01-15 03:00:00', '2025-01-15 05:30:00'),
('1122KLM', 1,  '2025-01-15 02:41:00', '2025-01-15 02:59:00', '2025-01-15 05:35:00'),
('3421BCP', 2,  '2025-02-03 14:28:00', '2025-02-03 14:55:00', '2025-02-03 18:00:00'),
('5678DFG', 2,  '2025-02-03 14:28:00', '2025-02-03 14:56:00', '2025-02-03 18:00:00'),
('4455GHK', 3,  '2025-02-18 09:18:00', '2025-02-18 09:40:00', '2025-02-18 20:00:00'),
('8899PQR', 3,  '2025-02-18 09:19:00', '2025-02-18 09:42:00', '2025-02-18 20:00:00'),
('1122KLM', 4,  '2025-03-05 20:52:00', '2025-03-05 21:05:00', '2025-03-05 23:30:00'),
('7089EFG', 5,  '2025-03-22 11:38:00', '2025-03-22 12:10:00', '2025-03-22 17:00:00'),
('3421BCP', 6,  '2025-04-10 16:23:00', '2025-04-10 16:42:00', '2025-04-11 02:00:00'),
('5678DFG', 6,  '2025-04-10 16:23:00', '2025-04-10 16:43:00', '2025-04-11 02:00:00'),
('7788VWX', 6,  '2025-04-10 16:25:00', '2025-04-10 16:50:00', '2025-04-11 02:00:00'),
('3045XYA', 7,  '2025-04-28 07:13:00', '2025-04-28 07:45:00', '2025-04-28 12:00:00'),
('5566RST', 8,  '2025-06-14 13:58:00', '2025-06-14 14:20:00', '2025-06-14 22:00:00'),
('2233CDF', 8,  '2025-06-14 13:59:00', '2025-06-14 14:22:00', '2025-06-14 22:00:00'),
('4455GHK', 9,  '2025-07-02 15:28:00', '2025-07-02 16:10:00', '2025-07-03 08:00:00'),
('6677LMN', 9,  '2025-07-02 15:29:00', '2025-07-02 16:12:00', '2025-07-03 08:00:00'),
('8899PQR', 9,  '2025-07-02 15:30:00', '2025-07-02 16:15:00', '2025-07-03 08:00:00'),
('1023STW', 10, '2025-07-19 23:18:00', '2025-07-19 23:35:00', '2025-07-20 04:00:00'),
('3045XYA', 10, '2025-07-19 23:18:00', '2025-07-19 23:36:00', '2025-07-20 04:00:00'),
('3421BCP', 11, '2025-08-07 10:38:00', '2025-08-07 10:58:00', '2025-08-07 19:00:00'),
('5678DFG', 11, '2025-08-07 10:38:00', '2025-08-07 10:59:00', '2025-08-07 19:00:00'),
('9900YZB', 11, '2025-08-07 10:40:00', '2025-08-07 11:02:00', '2025-08-07 19:00:00'),
('9900YZB', 12, '2025-09-01 08:53:00', '2025-09-01 09:10:00', '2025-09-01 12:00:00'),
('3421BCP', 13, '2025-10-12 19:08:00', '2025-10-12 19:25:00', '2025-10-12 23:00:00'),
('3344NOP', 14, '2025-11-20 06:38:00',  NULL,                  NULL),
('1122KLM', 14, '2025-11-20 06:40:00',  NULL,                  NULL),
('6677LMN', 15, '2025-12-01 14:08:00',  NULL,                  NULL),
('9012HJK', 15, '2025-12-01 14:09:00',  NULL,                  NULL),
('3421BCP', 16, '2026-01-03 03:22:00', '2026-01-03 03:41:00', '2026-01-03 06:30:00'),
('1122KLM', 16, '2026-01-03 03:23:00', '2026-01-03 03:43:00', '2026-01-03 06:30:00'),
('3421BCP', 17, '2026-01-05 14:28:00', '2026-01-05 14:55:00', '2026-01-05 18:00:00'),
('5678DFG', 17, '2026-01-05 14:29:00', '2026-01-05 14:57:00', '2026-01-05 18:00:00'),
('1122KLM', 18, '2026-01-07 09:52:00', '2026-01-07 10:08:00', '2026-01-07 12:30:00'),
('3421BCP', 19, '2026-01-10 21:38:00', '2026-01-10 21:55:00', '2026-01-11 05:00:00'),
('5678DFG', 19, '2026-01-10 21:38:00', '2026-01-10 21:56:00', '2026-01-11 05:00:00'),
('7788VWX', 19, '2026-01-10 21:40:00', '2026-01-10 22:01:00', '2026-01-11 05:00:00'),
('7890GHJ', 19, '2026-01-10 21:41:00', '2026-01-10 22:05:00', '2026-01-11 05:00:00'),
('1122KLM', 20, '2026-01-12 11:08:00', '2026-01-12 11:20:00', '2026-01-12 13:00:00'),
('4455GHK', 21, '2026-01-15 07:38:00', '2026-01-15 07:52:00', '2026-01-15 11:00:00'),
('9900YZB', 22, '2026-01-18 16:08:00', '2026-01-18 16:30:00', '2026-01-18 20:00:00'),
('5678DFG', 23, '2026-01-20 00:03:00', '2026-01-20 00:15:00', '2026-01-20 02:00:00'),
('3344NOP', 24, '2026-01-22 10:28:00', '2026-01-22 11:05:00', '2026-01-22 20:00:00'),
('1023STW', 24, '2026-01-22 10:30:00', '2026-01-22 11:10:00', '2026-01-22 20:00:00'),
('1122KLM', 25, '2026-01-25 08:53:00', '2026-01-25 09:05:00', '2026-01-25 11:30:00'),
('3421BCP', 26, '2026-02-02 13:38:00', '2026-02-02 14:10:00', '2026-02-02 18:00:00'),
('5678DFG', 26, '2026-02-02 13:38:00', '2026-02-02 14:12:00', '2026-02-02 18:00:00'),
('5566RST', 27, '2026-02-04 19:08:00', '2026-02-04 19:45:00', '2026-02-04 23:00:00'),
('2233CDF', 27, '2026-02-04 19:09:00', '2026-02-04 19:47:00', '2026-02-04 23:00:00'),
('3421BCP', 28, '2026-02-06 02:18:00', '2026-02-06 02:35:00', '2026-02-06 06:00:00'),
('9900YZB', 28, '2026-02-06 02:19:00', '2026-02-06 02:37:00', '2026-02-06 06:00:00'),
('1122KLM', 29, '2026-02-09 11:23:00', '2026-02-09 11:38:00', '2026-02-09 16:00:00'),
('5678DFG', 29, '2026-02-09 11:24:00', '2026-02-09 11:40:00', '2026-02-09 16:00:00'),
('4455GHK', 30, '2026-02-11 15:48:00', '2026-02-11 16:15:00', '2026-02-11 21:00:00'),
('8899PQR', 30, '2026-02-11 15:49:00', '2026-02-11 16:17:00', '2026-02-11 21:00:00'),
('3456PQS', 31, '2026-02-13 08:58:00', '2026-02-13 09:20:00', '2026-02-13 12:00:00'),
('3421BCP', 32, '2026-02-17 20:08:00', '2026-02-17 20:25:00', '2026-02-17 23:30:00'),
('5678DFG', 32, '2026-02-17 20:08:00', '2026-02-17 20:26:00', '2026-02-17 23:30:00'),
('7788VWX', 32, '2026-02-17 20:10:00', '2026-02-17 20:30:00', '2026-02-17 23:30:00'),
('3421BCP', 33, '2026-02-19 10:38:00', '2026-02-19 11:05:00', '2026-02-19 18:00:00'),
('5678DFG', 33, '2026-02-19 10:39:00', '2026-02-19 11:07:00', '2026-02-19 18:00:00'),
('1122KLM', 33, '2026-02-19 10:40:00', '2026-02-19 11:10:00', '2026-02-19 18:00:00'),
('1023STW', 34, '2026-02-21 14:08:00', '2026-02-21 14:22:00', '2026-02-21 17:00:00'),
('3421BCP', 35, '2026-02-24 09:08:00', '2026-02-24 09:28:00', '2026-02-24 14:00:00'),
('5678DFG', 35, '2026-02-24 09:09:00', '2026-02-24 09:30:00', '2026-02-24 14:00:00'),
('3421BCP', 36, '2026-02-26 03:53:00', '2026-02-26 04:10:00', '2026-02-26 09:00:00'),
('5678DFG', 36, '2026-02-26 03:53:00', '2026-02-26 04:11:00', '2026-02-26 09:00:00'),
('7890GHJ', 36, '2026-02-26 03:55:00', '2026-02-26 04:15:00', '2026-02-26 09:00:00'),
('7788VWX', 36, '2026-02-26 03:56:00', '2026-02-26 04:18:00', '2026-02-26 09:00:00'),
('4455GHK', 37, '2026-03-01 11:08:00', '2026-03-01 11:50:00', '2026-03-01 22:00:00'),
('8899PQR', 37, '2026-03-01 11:09:00', '2026-03-01 11:52:00', '2026-03-01 22:00:00'),
('6677LMN', 37, '2026-03-01 11:10:00', '2026-03-01 11:55:00', '2026-03-01 22:00:00'),
('3421BCP', 38, '2026-03-02 16:38:00', '2026-03-02 17:05:00', '2026-03-02 20:00:00'),
('3344NOP', 39, '2026-03-04 08:23:00', '2026-03-04 09:00:00', '2026-03-04 18:00:00'),
('7089EFG', 39, '2026-03-04 08:25:00', '2026-03-04 09:05:00', '2026-03-04 18:00:00'),
('5678DFG', 40, '2026-03-05 22:18:00', '2026-03-05 22:32:00', '2026-03-06 00:30:00'),
('6677LMN', 41, '2026-03-07 14:53:00', '2026-03-07 16:00:00', '2026-03-07 22:00:00'),
('9012HJK', 41, '2026-03-07 14:54:00', '2026-03-07 16:05:00', '2026-03-07 22:00:00'),
('3456PQS', 42, '2026-03-10 10:08:00', '2026-03-10 10:35:00', '2026-03-10 16:00:00'),
('5678DFG', 43, '2026-03-11 21:38:00', '2026-03-11 21:52:00', '2026-03-12 00:30:00'),
('3421BCP', 44, '2026-03-13 09:23:00', '2026-03-13 09:45:00', '2026-03-13 13:00:00'),
('1122KLM', 44, '2026-03-13 09:24:00', '2026-03-13 09:47:00', '2026-03-13 13:00:00'),
('3421BCP', 45, '2026-03-14 03:08:00', '2026-03-14 03:25:00', '2026-03-14 08:00:00'),
('5678DFG', 45, '2026-03-14 03:08:00', '2026-03-14 03:26:00', '2026-03-14 08:00:00'),
('7890GHJ', 45, '2026-03-14 03:10:00', '2026-03-14 03:30:00', '2026-03-14 08:00:00'),
('5566RST', 46, '2026-03-15 12:28:00', '2026-03-15 13:00:00', '2026-03-15 23:00:00'),
('2233CDF', 46, '2026-03-15 12:29:00', '2026-03-15 13:02:00', '2026-03-15 23:00:00'),
('4455GHK', 46, '2026-03-15 12:30:00', '2026-03-15 13:05:00', '2026-03-15 23:00:00'),
('4455GHK', 47, '2026-03-16 15:08:00', '2026-03-16 15:25:00', '2026-03-16 18:00:00'),
('3456PQS', 48, '2026-03-17 08:38:00', '2026-03-17 09:10:00', '2026-03-17 15:00:00'),
('3421BCP', 49, '2026-03-18 11:08:00', '2026-03-18 11:35:00', '2026-03-18 16:00:00'),
('1122KLM', 49, '2026-03-18 11:09:00', '2026-03-18 11:37:00', '2026-03-18 16:00:00'),
('5678DFG', 50, '2026-03-19 16:53:00', '2026-03-19 17:05:00', '2026-03-19 21:00:00'),
('3421BCP', 50, '2026-03-19 16:53:00', '2026-03-19 17:06:00', '2026-03-19 21:00:00'),
('3421BCP', 51, '2026-03-20 07:23:00', NULL, NULL),
('5678DFG', 51, '2026-03-20 07:23:00', NULL, NULL),
('7890GHJ', 51, '2026-03-20 07:25:00', NULL, NULL),
('1122KLM', 51, '2026-03-20 07:26:00', NULL, NULL),
('5566RST', 52, '2026-03-20 09:38:00', NULL, NULL),
('2233CDF', 52, '2026-03-20 09:39:00', NULL, NULL),
('4455GHK', 52, '2026-03-20 09:40:00', NULL, NULL),
('4455GHK', 53, '2026-03-20 11:53:00', NULL, NULL),
('8899PQR', 53, '2026-03-20 11:54:00', NULL, NULL),
('6677LMN', 53, '2026-03-20 11:55:00', NULL, NULL);
 

-- =======================================================
-- 17. EMERGENCIA_VEHICULO_PERSONA
-- =======================================================
INSERT INTO Emergencia_Vehiculo_Persona (id_bombero, matricula, id_emergencia, cargo) VALUES
('I001', '1122KLM', 1, 'Mando incidente'),
('J001', '3421BCP', 1, 'Jefe de intervención'),
('B001', '3421BCP', 1, 'Bombero extinción'),
('B002', '3421BCP', 1, 'Bombero extinción'),
('O001', '5678DFG', 1, 'Oficial'),
('B003', '5678DFG', 1, 'Bombero extinción'),
('B004', '5678DFG', 1, 'Bombero extinción'),
('J001', '3421BCP', 2, 'Jefe de intervención'),
('B001', '3421BCP', 2, 'Bombero rescate'),
('B002', '3421BCP', 2, 'Bombero rescate'),
('O001', '5678DFG', 2, 'Oficial'),
('B003', '5678DFG', 2, 'Bombero rescate'),
('J002', '4455GHK', 3, 'Jefe de intervención'),
('B006', '4455GHK', 3, 'Bombero forestal'),
('B007', '8899PQR', 3, 'Bombero forestal'),
('M001', '1122KLM', 6, 'Mando incidente'),
('J001', '3421BCP', 6, 'Jefe de intervención'),
('B001', '3421BCP', 6, 'Bombero extinción'),
('B005', '3421BCP', 6, 'Bombero extinción'),
('O004', '5678DFG', 6, 'Oficial'),
('B002', '5678DFG', 6, 'Bombero extinción'),
('O001', '7788VWX', 6, 'Oficial apoyo'),
('B010', '7788VWX', 6, 'Bombero extinción'),
('M001', '1122KLM', 14, 'Mando incidente MMPP'),
('J001', '3344NOP', 14, 'Jefe intervención MMPP'),
('B001', '3344NOP', 14, 'Especialista MMPP'),
('B005', '3344NOP', 14, 'Especialista MMPP'),
('J002', '6677LMN', 15, 'Jefe de intervención rescate'),
('B006', '6677LMN', 15, 'Bombero rescate montaña'),
('B007', '9012HJK', 15, 'Bombero rescate montaña'),
('J001', '3421BCP', 16, 'Jefe de intervención'),
('B001', '3421BCP', 16, 'Bombero extinción'),
('B013', '3421BCP', 16, 'Bombero extinción'),
('I001', '1122KLM', 16, 'Mando incidente'),
('J004', '3421BCP', 17, 'Jefe de intervención'),
('B002', '3421BCP', 17, 'Bombero rescate'),
('B016', '3421BCP', 17, 'Bombero rescate'),
('O005', '5678DFG', 17, 'Oficial'),
('B003', '5678DFG', 17, 'Bombero rescate'),
('O001', '1122KLM', 18, 'Oficial MMPP'),
('B004', '1122KLM', 18, 'Bombero'),
('M001', '1122KLM', 19, 'Mando incidente'),
('J001', '3421BCP', 19, 'Jefe de intervención'),
('B001', '3421BCP', 19, 'Bombero extinción'),
('B002', '3421BCP', 19, 'Bombero extinción'),
('O001', '5678DFG', 19, 'Oficial'),
('B013', '5678DFG', 19, 'Bombero extinción'),
('B019', '5678DFG', 19, 'Bombero extinción'),
('O004', '7788VWX', 19, 'Oficial apoyo'),
('B010', '7788VWX', 19, 'Bombero extinción'),
('B023', '7788VWX', 19, 'Bombero extinción'),
('J004', '7890GHJ', 19, 'Jefe intervención apoyo'),
('B005', '7890GHJ', 19, 'Bombero extinción'),
('O005', '1122KLM', 20, 'Oficial'),
('B016', '1122KLM', 20, 'Bombero'),
('J005', '4455GHK', 21, 'Jefe de intervención'),
('B014', '4455GHK', 21, 'Bombero extinción'),
('B017', '4455GHK', 21, 'Bombero extinción'),
('O005', '9900YZB', 22, 'Oficial rescate acuático'),
('B013', '9900YZB', 22, 'Bombero rescate'),
('J003', '3344NOP', 24, 'Jefe intervención MMPP'),
('B015', '3344NOP', 24, 'Especialista MMPP'),
('B025', '3344NOP', 24, 'Especialista MMPP'),
('O007', '1023STW', 24, 'Oficial apoyo'),
('B028', '1023STW', 24, 'Bombero'),
('J001', '3421BCP', 26, 'Jefe de intervención'),
('B001', '3421BCP', 26, 'Bombero rescate'),
('B013', '3421BCP', 26, 'Bombero rescate'),
('O001', '5678DFG', 26, 'Oficial'),
('B002', '5678DFG', 26, 'Bombero rescate'),
('J002', '5566RST', 27, 'Jefe de intervención'),
('B006', '5566RST', 27, 'Bombero forestal'),
('B022', '5566RST', 27, 'Bombero forestal'),
('B007', '2233CDF', 27, 'Bombero forestal'),
('B024', '2233CDF', 27, 'Bombero forestal'),
('M002', '3421BCP', 28, 'Mando incidente'),
('J004', '3421BCP', 28, 'Jefe de intervención'),
('B016', '3421BCP', 28, 'Bombero búsqueda'),
('O002', '9900YZB', 28, 'Oficial rescate'),
('B022', '9900YZB', 28, 'Bombero búsqueda'),
('J005', '4455GHK', 30, 'Jefe de intervención'),
('B014', '4455GHK', 30, 'Especialista EC'),
('B017', '4455GHK', 30, 'Especialista EC'),
('O006', '8899PQR', 30, 'Oficial apoyo'),
('B032', '8899PQR', 30, 'Bombero'),
('J004', '3421BCP', 32, 'Jefe de intervención'),
('B001', '3421BCP', 32, 'Bombero extinción'),
('B013', '3421BCP', 32, 'Bombero extinción'),
('O005', '5678DFG', 32, 'Oficial'),
('B002', '5678DFG', 32, 'Bombero extinción'),
('B016', '5678DFG', 32, 'Bombero extinción'),
('O001', '7788VWX', 32, 'Oficial apoyo'),
('B023', '7788VWX', 32, 'Bombero extinción'),
('J001', '3421BCP', 33, 'Jefe de intervención'),
('B001', '3421BCP', 33, 'Bombero rescate'),
('B013', '3421BCP', 33, 'Bombero rescate'),
('O001', '5678DFG', 33, 'Oficial'),
('B002', '5678DFG', 33, 'Bombero rescate'),
('B019', '5678DFG', 33, 'Bombero rescate'),
('M001', '1122KLM', 33, 'Mando incidente'),
('B005', '1122KLM', 33, 'Bombero'),
('J004', '3421BCP', 35, 'Jefe de intervención'),
('B001', '3421BCP', 35, 'Bombero EC/rescate'),
('B013', '3421BCP', 35, 'Bombero EC/rescate'),
('O005', '5678DFG', 35, 'Oficial'),
('B026', '5678DFG', 35, 'Bombero'),
('M001', '1122KLM', 36, 'Mando incidente'),
('J001', '3421BCP', 36, 'Jefe de intervención'),
('B001', '3421BCP', 36, 'Bombero extinción'),
('B002', '3421BCP', 36, 'Bombero extinción'),
('B013', '3421BCP', 36, 'Bombero extinción'),
('O001', '5678DFG', 36, 'Oficial'),
('B003', '5678DFG', 36, 'Bombero extinción'),
('B016', '5678DFG', 36, 'Bombero extinción'),
('J004', '7890GHJ', 36, 'Jefe intervención apoyo'),
('B019', '7890GHJ', 36, 'Bombero'),
('O004', '7788VWX', 36, 'Oficial apoyo'),
('B010', '7788VWX', 36, 'Bombero extinción'),
('B023', '7788VWX', 36, 'Bombero extinción'),
('J002', '4455GHK', 37, 'Jefe de intervención'),
('B006', '4455GHK', 37, 'Bombero forestal'),
('B014', '4455GHK', 37, 'Bombero forestal'),
('O006', '8899PQR', 37, 'Oficial'),
('B007', '8899PQR', 37, 'Bombero forestal'),
('B032', '8899PQR', 37, 'Bombero forestal'),
('J005', '6677LMN', 37, 'Jefe intervención apoyo'),
('B017', '6677LMN', 37, 'Bombero forestal'),
('J001', '3421BCP', 45, 'Jefe de intervención'),
('B001', '3421BCP', 45, 'Bombero extinción'),
('B013', '3421BCP', 45, 'Bombero extinción'),
('O001', '5678DFG', 45, 'Oficial'),
('B002', '5678DFG', 45, 'Bombero extinción'),
('B016', '5678DFG', 45, 'Bombero extinción'),
('M001', '7890GHJ', 45, 'Mando incidente'),
('B005', '7890GHJ', 45, 'Bombero'),
('J002', '5566RST', 46, 'Jefe de intervención'),
('B006', '5566RST', 46, 'Bombero forestal'),
('B022', '5566RST', 46, 'Bombero forestal'),
('O004', '2233CDF', 46, 'Oficial'),
('B007', '2233CDF', 46, 'Bombero forestal'),
('J005', '4455GHK', 46, 'Jefe intervención apoyo'),
('B024', '4455GHK', 46, 'Bombero forestal'),
('J004', '3421BCP', 51, 'Jefe de intervención'),
('B001', '3421BCP', 51, 'Bombero extinción'),
('B013', '3421BCP', 51, 'Bombero extinción'),
('O005', '5678DFG', 51, 'Oficial'),
('B002', '5678DFG', 51, 'Bombero extinción'),
('B016', '5678DFG', 51, 'Bombero extinción'),
('J001', '7890GHJ', 51, 'Jefe intervención apoyo'),
('B019', '7890GHJ', 51, 'Bombero extinción'),
('M001', '1122KLM', 51, 'Mando incidente'),
('J002', '5566RST', 52, 'Jefe de intervención'),
('B006', '5566RST', 52, 'Bombero forestal'),
('B007', '5566RST', 52, 'Bombero forestal'),
('O004', '2233CDF', 52, 'Oficial'),
('B022', '2233CDF', 52, 'Bombero forestal'),
('J005', '4455GHK', 52, 'Jefe intervención apoyo'),
('B014', '4455GHK', 52, 'Bombero forestal'),
('J005', '4455GHK', 53, 'Jefe de intervención'),
('B017', '4455GHK', 53, 'Bombero rescate'),
('B014', '4455GHK', 53, 'Bombero rescate'),
('O006', '8899PQR', 53, 'Oficial'),
('B032', '8899PQR', 53, 'Bombero rescate'),
('J002', '6677LMN', 53, 'Jefe intervención apoyo'),
('B024', '6677LMN', 53, 'Bombero rescate');

-- =======================================================
-- 18. PERSONA_EDICION
-- =======================================================
INSERT INTO Persona_Edicion (id_formacion, id_edicion, id_bombero) VALUES
(1, 1, 'J001'), (1, 1, 'J002'), (1, 1, 'O001'), (1, 1, 'B001'), (1, 1, 'B002'),
(1, 1, 'B003'), (1, 1, 'B006'), (1, 1, 'B007'),
(1, 2, 'B004'), (1, 2, 'B005'), (1, 2, 'B008'), (1, 2, 'B009'), (1, 2, 'B010'),
(1, 2, 'B011'), (1, 2, 'B012'),
(2, 1, 'J001'), (2, 1, 'O001'), (2, 1, 'B001'), (2, 1, 'B002'), (2, 1, 'B003'),
(2, 2, 'J003'), (2, 2, 'O003'), (2, 2, 'B008'), (2, 2, 'B009'),
(3, 1, 'B001'), (3, 1, 'B002'), (3, 1, 'B003'), (3, 1, 'B004'), (3, 1, 'B005'),
(3, 1, 'B006'), (3, 1, 'B007'), (3, 1, 'B008'),
(3, 2, 'B009'), (3, 2, 'B010'), (3, 2, 'B011'), (3, 2, 'B012'),
(4, 1, 'J002'), (4, 1, 'B006'), (4, 1, 'B007'), (4, 1, 'B012'),
(5, 1, 'M001'), (5, 1, 'J001'), (5, 1, 'B001'), (5, 1, 'B005'),
(1, 3, 'B013'), (1, 3, 'B014'), (1, 3, 'B016'), (1, 3, 'B017'),
(1, 3, 'B019'), (1, 3, 'B022'), (1, 3, 'B023'), (1, 3, 'B026'),
(1, 3, 'O005'), (1, 3, 'O008'),
(2, 3, 'J004'), (2, 3, 'O005'), (2, 3, 'B013'), (2, 3, 'B016'), (2, 3, 'B029'),
(3, 3, 'B016'), (3, 3, 'B017'), (3, 3, 'B018'), (3, 3, 'B019'), (3, 3, 'B020'),
(3, 3, 'B021'), (3, 3, 'B022'), (3, 3, 'B023'), (3, 3, 'B024'), (3, 3, 'B025'),
(4, 2, 'J005'), (4, 2, 'B020'), (4, 2, 'B030'), (4, 2, 'B014'),
(5, 2, 'M003'), (5, 2, 'J004'), (5, 2, 'B013'), (5, 2, 'B016'), (5, 2, 'B029'),
(6, 2, 'B013'), (6, 2, 'B014'), (6, 2, 'B015'), (6, 2, 'B016'), (6, 2, 'B017'),
(6, 2, 'B018'), (6, 2, 'B019'), (6, 2, 'B020'), (6, 2, 'B021'), (6, 2, 'B022'),
(7, 2, 'J004'), (7, 2, 'J005'), (7, 2, 'O005'), (7, 2, 'O006'), (7, 2, 'B013'),
(7, 2, 'B014'), (7, 2, 'B017'), (7, 2, 'B023'), (7, 2, 'B032'),
(8, 2, 'B029'), (8, 2, 'B030'), (8, 2, 'B031'), (8, 2, 'B032'), (8, 2, 'B033'),
(8, 2, 'B034'), (8, 2, 'B035'), (8, 2, 'O005'), (8, 2, 'O007'),
(9,  1, 'B006'), (9,  1, 'B007'), (9,  1, 'B012'), (9,  1, 'B014'), (9,  1, 'B020'),
(10, 1, 'O001'), (10, 1, 'O005'), (10, 1, 'J001'), (10, 1, 'B001'), (10, 1, 'B013'),
(11, 1, 'J002'), (11, 1, 'J005'), (11, 1, 'B006'), (11, 1, 'B014'), (11, 1, 'B020'),
(12, 1, 'J001'), (12, 1, 'J004'), (12, 1, 'O001'), (12, 1, 'O005'), (12, 1, 'B001'),
(12, 1, 'B002'), (12, 1, 'B013'), (12, 1, 'B016'),
(13, 1, 'I001'), (13, 1, 'M001'), (13, 1, 'J004'), (13, 1, 'O005'),
(14, 1, 'M001'), (14, 1, 'M003'), (14, 1, 'J001'), (14, 1, 'J004'), (14, 1, 'O001'),
(14, 1, 'O005'), (14, 1, 'B001'), (14, 1, 'B013'),
(15, 1, 'I001'), (15, 1, 'I003'), (15, 1, 'J001'), (15, 1, 'J004'), (15, 1, 'M001'),
(15, 1, 'O005'), (15, 1, 'B013'), (15, 1, 'B016'), (15, 1, 'B029');

-- =======================================================
-- 19. PERSONA_TURNO
-- =======================================================
INSERT INTO Persona_Turno (id_turno, id_bombero) VALUES
(1, 'B001'), (1, 'B002'), (1, 'B006'), (1, 'B007'),
(2, 'B003'), (2, 'B004'), (2, 'B008'), (2, 'B009'),
(3, 'B005'), (3, 'O001'), (3, 'B010'),
(4, 'B011'), (4, 'O002'), (4, 'B012'),
(6, 'B001'), (6, 'B002'), (6, 'B006'),
(7, 'B003'), (7, 'B008'), (7, 'B010'),
(8, 'B004'), (8, 'B007'), (8, 'B009'),
(9,  'B013'), (9,  'O005'), (9,  'B019'),
(10, 'B014'), (10, 'O008'), (10, 'B026'),
(11, 'B016'), (11, 'O005'), (11, 'B023'), (11, 'B029'),
(12, 'B002'), (12, 'O001'), (12, 'B013'), (12, 'B031'),
(13, 'B001'), (13, 'B002'), (13, 'B013'),
(14, 'B003'), (14, 'B016'), (14, 'B019'), (14, 'B026'),
(15, 'B004'), (15, 'B005'), (15, 'B023'),
(16, 'B001'), (16, 'B002'), (16, 'O005'), (16, 'B013'),
(17, 'B003'), (17, 'B004'), (17, 'O001'), (17, 'B016'),
(18, 'B001'), (18, 'B002'), (18, 'B006'), (18, 'B007'),
(19, 'B013'), (19, 'B014'), (19, 'B022'), (19, 'B024'),
(20, 'B003'), (20, 'B008'), (20, 'B017'), (20, 'B027'),
(21, 'B004'), (21, 'B009'), (21, 'B018'), (21, 'B028'),
(22, 'B005'), (22, 'B010'), (22, 'B019'), (22, 'B029');

-- =======================================================
-- 20. SALIDA
-- =======================================================
INSERT INTO Salida (matricula, id_bombero, f_salida, f_regreso, km_inicio, km_fin) VALUES
('3421BCP', 'B001', '2025-01-10 08:00:00', '2025-01-10 18:00:00', 45200, 45380),
('5678DFG', 'B003', '2025-01-20 08:00:00', '2025-01-20 20:00:00', 33100, 33295),
('1122KLM', 'O001', '2025-02-05 09:00:00', '2025-02-05 17:00:00', 22000, 22115),
('4455GHK', 'B006', '2025-02-12 07:30:00', '2025-02-12 19:30:00', 61800, 62050),
('6677LMN', 'J002', '2025-03-01 08:00:00', '2025-03-01 16:00:00', 15300, 15420),
('3421BCP', 'B001', '2025-03-15 08:00:00', '2025-03-15 20:00:00', 45380, 45600),
('7788VWX', 'B005', '2025-04-02 08:00:00', '2025-04-02 18:00:00', 28700, 28880),
('9900YZB', 'O001', '2025-04-22 08:00:00', '2025-04-22 16:00:00', 19500, 19620),
('1023STW', 'B008', '2025-05-10 08:00:00', '2025-05-10 20:00:00', 41200, 41390),
('3045XYA', 'O003', '2025-05-18 07:00:00', '2025-05-18 15:00:00', 12100, 12230),
('3421BCP', 'B001', '2025-10-06 08:00:00', '2025-10-06 20:00:00', 46800, 46985),
('5678DFG', 'B003', '2025-10-14 08:00:00', '2025-10-14 18:00:00', 34500, 34680),
('1122KLM', 'O001', '2025-10-20 09:00:00', '2025-10-20 17:00:00', 23200, 23330),
('4455GHK', 'B006', '2025-10-27 07:30:00', '2025-10-27 19:30:00', 63800, 64050),
('6677LMN', 'J002', '2025-11-03 08:00:00', '2025-11-03 16:00:00', 16500, 16620),
('3421BCP', 'B002', '2025-11-10 08:00:00', '2025-11-10 20:00:00', 46985, 47200),
('7788VWX', 'B005', '2025-11-17 08:00:00', '2025-11-17 18:00:00', 30100, 30280),
('9900YZB', 'O002', '2025-11-24 08:00:00', '2025-11-24 16:00:00', 21200, 21340),
('1023STW', 'B008', '2025-12-01 08:00:00', '2025-12-01 20:00:00', 42900, 43090),
('3045XYA', 'O003', '2025-12-08 07:00:00', '2025-12-08 15:00:00', 13500, 13640),
('5678DFG', 'B001', '2025-12-15 08:00:00', '2025-12-15 20:00:00', 34680, 34870),
('1122KLM', 'J001', '2025-12-22 09:00:00', '2025-12-22 17:00:00', 23330, 23480),
('3421BCP', 'B001', '2026-01-05 08:00:00', '2026-01-05 20:00:00', 47200, 47390),
('5678DFG', 'B003', '2026-01-08 08:00:00', '2026-01-08 18:00:00', 34870, 35050),
('4455GHK', 'B006', '2026-01-12 07:30:00', '2026-01-12 19:30:00', 64050, 64290),
('7788VWX', 'O004', '2026-01-14 08:00:00', '2026-01-14 18:00:00', 30280, 30450),
('1122KLM', 'O001', '2026-01-16 09:00:00', '2026-01-16 17:00:00', 23480, 23610),
('3456PQS', 'B021', '2026-01-19 08:00:00', '2026-01-19 20:00:00', 12400, 12580),
('5678TVX', 'B022', '2026-01-21 08:00:00', '2026-01-21 18:00:00', 8900,  9080),
('9012HJK', 'B020', '2026-01-23 07:30:00', '2026-01-23 17:30:00', 5600,  5730),
('3421BCP', 'B002', '2026-01-26 08:00:00', '2026-01-26 20:00:00', 47390, 47580),
('6677LMN', 'J002', '2026-01-28 08:00:00', '2026-01-28 16:00:00', 16620, 16740),
('5678DFG', 'B013', '2026-02-02 08:00:00', '2026-02-02 20:00:00', 35050, 35240),
('4455GHK', 'B014', '2026-02-04 07:30:00', '2026-02-04 19:30:00', 64290, 64530),
('1122KLM', 'J001', '2026-02-06 09:00:00', '2026-02-06 17:00:00', 23610, 23740),
('3421BCP', 'B016', '2026-02-09 08:00:00', '2026-02-09 20:00:00', 47580, 47770),
('7089EFG', 'B021', '2026-02-11 08:00:00', '2026-02-11 18:00:00', 18200, 18360),
('3456PQS', 'J006', '2026-02-13 08:00:00', '2026-02-13 16:00:00', 12580, 12700),
('5678DFG', 'O005', '2026-02-17 09:00:00', '2026-02-17 17:00:00', 35240, 35380),
('9900YZB', 'O002', '2026-02-19 08:00:00', '2026-02-19 16:00:00', 21340, 21480),
('1023STW', 'B015', '2026-02-23 08:00:00', '2026-02-23 20:00:00', 43090, 43280),
('3421BCP', 'B001', '2026-02-25 08:00:00', '2026-02-25 20:00:00', 47770, 47960),
('5678DFG', 'B002', '2026-03-02 08:00:00', '2026-03-02 20:00:00', 35380, 35570),
('4455GHK', 'B006', '2026-03-04 07:30:00', '2026-03-04 19:30:00', 64530, 64770),
('1122KLM', 'O001', '2026-03-06 09:00:00', '2026-03-06 17:00:00', 23740, 23870),
('3421BCP', 'B013', '2026-03-09 08:00:00', '2026-03-09 20:00:00', 47960, 48150),
('7788VWX', 'B019', '2026-03-11 08:00:00', '2026-03-11 18:00:00', 30450, 30620),
('6677LMN', 'J005', '2026-03-12 08:00:00', '2026-03-12 16:00:00', 16740, 16860),
('5678DFG', 'B016', '2026-03-13 08:00:00', '2026-03-13 20:00:00', 35570, 35760),
('3456PQS', 'B033', '2026-03-16 08:00:00', '2026-03-16 16:00:00', 12700, 12820),
('3421BCP', 'B003', '2026-03-17 08:00:00', '2026-03-17 20:00:00', 48150, 48340),
('1122KLM', 'J004', '2026-03-18 09:00:00', '2026-03-18 17:00:00', 23870, 24000),
('5678DFG', 'O005', '2026-03-19 08:00:00', '2026-03-19 20:00:00', 35760, 35950),
('9012HJK', 'B030', '2026-03-04 07:30:00', '2026-03-04 17:30:00', 5730,  5860),
('1234LMN', 'B020', '2026-03-10 08:00:00', '2026-03-10 18:00:00', 8100,  8280),
('5678TVX', 'B022', '2026-03-15 08:00:00', '2026-03-15 18:00:00', 9080,  9250);

-- =======================================================
-- 21A. GRUPO
-- =======================================================
INSERT INTO Grupo (id_grupo, nombre, descripcion) VALUES
(1, 'Conducción ligera', 'Permisos habilitantes para la conducción de turismos, furgones ligeros y vehículos de apoyo del servicio'),
(2, 'Conducción pesada', 'Permisos habilitantes para la conducción de autobombas, nodrizas, autoescalas y otros vehículos pesados de emergencias'),
(3, 'Aptitud profesional', 'Acreditaciones complementarias para el transporte profesional de mercancías o viajeros en servicio'),
(4, 'Mercancías peligrosas', 'Habilitaciones específicas para la conducción y actuación con vehículos o cargas ADR'),
(5, 'Náutica y rescate acuático', 'Titulaciones náuticas útiles para maniobras con embarcaciones de apoyo y rescate en medio acuático'),
(6, 'Maquinaria y elevación', 'Acreditaciones para el manejo seguro de grúas, plataformas y maquinaria auxiliar en intervenciones');

-- =======================================================
-- 21B. CARNET
-- =======================================================
INSERT INTO Carnet (id_grupo, nombre, duracion_meses) VALUES
(1, 'Permiso de Conducción B', 120),
(2, 'Permiso de Conducción C', 60),
(2, 'Permiso de Conducción C+E', 60),
(2, 'Permiso de Conducción D', 60),
(3, 'CAP Mercancías', 60),
(3, 'CAP Viajeros', 60),
(4, 'ADR Básico', 60),
(4, 'ADR Clase 1 y 7', 60),
(5, 'Patrón de Embarcación de Recreo', 120),
(6, 'Grúa Torre', 36),
(6, 'Elevadora Telescópica', 36);

-- =======================================================
-- 22. CARNET_PERSONA
-- =======================================================
INSERT INTO Carnet_Persona (id_bombero, id_carnet, f_obtencion, f_vencimiento) VALUES
('I001', 1, '2000-06-15', '2030-06-15'),
('I001', 2, '2002-09-20', '2027-09-20'),
('I001', 7, '2022-03-10', '2027-03-10'),
('M001', 1, '1997-04-10', '2027-04-10'),
('M001', 2, '2000-07-22', '2025-07-22'),
('M001', 3, '2003-11-05', '2025-11-05'),
('M001', 5, '2022-06-01', '2027-06-01'),
('J001', 1, '2003-08-14', '2028-08-14'),
('J001', 2, '2006-03-20', '2026-03-20'),
('J001', 7, '2021-05-10', '2026-05-10'),
('J002', 1, '2005-10-01', '2030-10-01'),
('J002', 9, '2015-04-20', '2025-04-20'),
('J003', 1, '2006-02-28', '2026-02-28'),
('J003', 2, '2009-07-15', '2025-07-15'),
('O001', 1, '2007-05-19', '2027-05-19'),
('O001', 2, '2010-11-08', '2025-11-08'),
('O002', 1, '2009-03-22', '2029-03-22'),
('O002', 2, '2012-09-30', '2027-09-30'),
('O003', 1, '2008-07-04', '2028-07-04'),
('O003', 3, '2012-01-15', '2027-01-15'),
('O003', 5, '2023-02-20', '2028-02-20'),
('B001', 1, '2010-09-11', '2030-09-11'),
('B001', 2, '2014-06-22', '2024-06-22'),
('B002', 1, '2011-04-17', '2031-04-17'),
('B003', 1, '2012-12-05', '2032-12-05'),
('B003', 2, '2016-08-30', '2026-08-30'),
('B004', 1, '2014-06-10', '2034-06-10'),
('B005', 1, '2015-03-25', '2035-03-25'),
('B006', 1, '2016-01-18', '2036-01-18'),
('B007', 1, '2017-07-07', '2037-07-07'),
('B008', 1, '2018-11-22', '2038-11-22'),
('B009', 1, '2018-05-14', '2038-05-14'),
('B010', 1, '2019-09-03', '2039-09-03'),
('B011', 1, '2020-02-27', '2040-02-27'),
('B012', 1, '2021-06-15', '2041-06-15'),
('I003', 1, '2001-09-10', '2031-09-10'),
('I003', 2, '2004-03-15', '2029-03-15'),
('I003', 3, '2006-07-20', '2031-07-20'),
('I003', 5, '2023-04-10', '2028-04-10'),
('M003', 1, '1998-06-20', '2028-06-20'),
('M003', 2, '2001-10-05', '2026-10-05'),
('M003', 5, '2022-09-12', '2027-09-12'),
('M004', 1, '1999-04-14', '2029-04-14'),
('M004', 2, '2003-08-22', '2028-08-22'),
('J004', 1, '2007-10-08', '2027-10-08'),
('J004', 2, '2011-04-19', '2026-04-19'),
('J005', 1, '2009-03-03', '2029-03-03'),
('J005', 2, '2012-09-10', '2027-09-10'),
('J006', 1, '2010-07-27', '2030-07-27'),
('J006', 2, '2013-11-18', '2028-11-18'),
('O005', 1, '2011-05-14', '2031-05-14'),
('O005', 2, '2014-12-01', '2029-12-01'),
('O006', 1, '2013-02-28', '2033-02-28'),
('O007', 1, '2014-09-09', '2034-09-09'),
('O007', 3, '2017-03-22', '2027-03-22'),
('O008', 1, '2015-06-17', '2035-06-17'),
('B013', 1, '2019-05-22', '2039-05-22'),
('B014', 1, '2020-08-10', '2040-08-10'),
('B015', 1, '2018-11-30', '2038-11-30'),
('B015', 2, '2023-02-14', '2028-02-14'),
('B016', 1, '2021-03-16', '2041-03-16'),
('B017', 1, '2020-07-21', '2040-07-21'),
('B018', 1, '2022-01-08', '2042-01-08'),
('B019', 1, '2019-09-25', '2039-09-25'),
('B019', 2, '2023-06-03', '2028-06-03'),
('B020', 1, '2021-06-04', '2041-06-04'),
('B021', 1, '2020-10-15', '2040-10-15'),
('B022', 1, '2022-04-28', '2042-04-28'),
('B023', 1, '2021-08-12', '2041-08-12'),
('B024', 1, '2022-09-06', '2042-09-06'),
('B025', 1, '2020-12-17', '2040-12-17'),
('B025', 2, '2024-03-05', '2029-03-05'),
('B026', 1, '2023-02-09', '2043-02-09'),
('B027', 1, '2021-11-03', '2041-11-03'),
('B028', 1, '2022-07-19', '2042-07-19'),
('B029', 1, '2022-11-28', '2042-11-28'),
('B030', 1, '2023-04-14', '2043-04-14'),
('B031', 1, '2021-10-07', '2041-10-07'),
('B032', 1, '2023-06-20', '2043-06-20'),
('B033', 1, '2022-08-31', '2042-08-31'),
('B034', 1, '2023-10-11', '2043-10-11'),
('B035', 1, '2022-05-16', '2042-05-16');


-- =======================================================
-- 23. AVISO
-- =======================================================
INSERT INTO Aviso (asunto, mensaje, fecha, remitente) VALUES
('Revisión anual de EPI',
 'Se comunica a todo el personal que durante la próxima semana se realizará la revisión anual de los Equipos de Protección Individual. Por favor, entregad el material asignado en el almacén del parque antes del viernes.',
 '2025-01-05 08:00:00', 'I001'),
('Simulacro de emergencia química - 20 enero',
 'El próximo 20 de enero se realizará un simulacro de intervención con mercancías peligrosas en el Polígono Malpica. Es obligatoria la asistencia de todo el personal de guardia. Se ruega confirmar disponibilidad.',
 '2025-01-12 10:30:00', 'M001'),
('Cambio de guardia - festivo 6 de enero',
 'Debido al festivo del día 6 de enero, se modifica la composición de los turnos de guardia. Consultar el cuadrante actualizado en el tablón de anuncios del parque.',
 '2025-01-03 09:00:00', 'O001'),
('Formación SVB - plazas disponibles',
 'Quedan 4 plazas disponibles para la segunda edición del curso de Soporte Vital Básico programada para febrero. Interesados contactar con la jefatura antes del día 20 de enero.',
 '2025-01-15 11:00:00', 'I002'),
('Mantenimiento vehículos - fin de semana',
 'Durante el próximo fin de semana (sábado y domingo) se realizará el mantenimiento programado de la flota de vehículos. Los vehículos afectados estarán fuera de servicio temporalmente. Consultar listado adjunto.',
 '2025-02-14 08:30:00', 'M002'),
('Alerta meteorológica - riesgo incendio forestal',
 'La Agencia Estatal de Meteorología ha emitido aviso naranja por temperaturas extremas y viento para el próximo fin de semana. Se activa el protocolo de alerta forestal nivel 2. Todo el personal debe estar localizable.',
 '2025-07-11 16:00:00', 'M001'),
('Incorporación nuevos compañeros',
 'Es un placer comunicar la incorporación al cuerpo de los compañeros Noelia Jiménez y Óscar Morales. Os pedimos que les ayudéis en su integración y les mostréis el funcionamiento de los parques.',
 '2025-01-09 09:00:00', 'I001'),
('Recordatorio: entrega de solicitudes de vacaciones',
 'Se recuerda que el plazo para la entrega de solicitudes de vacaciones del período estival (junio-septiembre) finaliza el próximo 28 de febrero. Pasado ese plazo no se garantiza la asignación preferente.',
 '2025-02-10 08:00:00', 'O004'),
('Formación SVB - nueva edición febrero 2026',
 'Se informa de la apertura del plazo de inscripción para la tercera edición del curso de Soporte Vital Básico, que se realizará del 9 al 13 de febrero de 2026. Plazas limitadas. Los interesados deben comunicarlo antes del 30 de enero.',
 '2026-01-10 09:00:00', 'I001'),
('Protocolo alerta nevada Pirineo - enero 2026',
 'La Agencia Estatal de Meteorología ha emitido aviso naranja por nevadas en cotas de Pirineo por encima de 1.200 metros. Se activa el protocolo de alerta invernal. Todo el personal debe estar localizable durante el fin de semana del 10 y 11 de enero.',
 '2026-01-09 16:00:00', 'M001'),
('Bienvenida a los nuevos compañeros',
 'Es un placer comunicar la incorporación al cuerpo de Gabriel Blasco, Lucía Asensio, Jorge Lacueva, Elena Gracia, Héctor Franco y Silvia Aznar. Os pedimos a todos que les ayudéis en su integración. El próximo viernes habrá un pequeño acto de bienvenida en el parque central.',
 '2026-01-13 10:00:00', 'I001'),
('Revisión anual EPI - programación',
 'Durante la semana del 19 al 23 de enero se procederá a la revisión anual de los Equipos de Protección Individual. Por favor, entregad el material asignado al almacén del parque antes del lunes 19. Las fichas de revisión estarán disponibles en el tablón.',
 '2026-01-15 08:00:00', 'I003'),
('Simulacro MMPP Polígono Malpica - 23 febrero',
 'El próximo 23 de febrero a las 10:00 h se realizará un simulacro de intervención con mercancías peligrosas en el Polígono Malpica, Nave 55. Es obligatoria la asistencia de todo el personal de guardia. Se ruega confirmar disponibilidad antes del 16 de febrero.',
 '2026-02-05 09:00:00', 'M001'),
('Actualización protocolo alerta forestal 2026',
 'Se informa que la DGA ha actualizado el Protocolo de Alerta por Riesgo de Incendio Forestal para la campaña 2026. El nuevo protocolo entra en vigor el 1 de marzo. Todos los mandos deben leer el documento adjunto antes de dicha fecha. Disponible en la intranet del parque.',
 '2026-02-20 10:30:00', 'I001'),
('Mantenimiento preventivo flota - semana 9 de marzo',
 'Durante la semana del 9 al 13 de marzo se realizará el mantenimiento preventivo de los vehículos BZC-01, BZC-02 y BHU-01. Estarán disponibles vehículos de sustitución. Consultar cuadrante de disponibilidad en el tablón.',
 '2026-03-03 08:30:00', 'M002'),
('Alerta forestal nivel 1 activada - 15 de marzo',
 'La Dirección General de Medio Natural ha declarado el Nivel 1 de Alerta por Riesgo de Incendio Forestal en las provincias de Huesca y Zaragoza a partir del 15 de marzo. Se activa el protocolo correspondiente. Todo el personal de guardia debe estar localizable.',
 '2026-03-14 17:00:00', 'M001'),
('Reunión coordinación parques - 25 marzo',
 'Se convoca reunión de coordinación de mandos de todos los parques para el 25 de marzo a las 10:00 h en el Parque de Bomberos de Zaragoza Centro. Orden del día: revisión protocolo forestal 2026, presentación nuevas dotaciones, turnos verano.',
 '2026-03-18 09:00:00', 'I001'),
('Curso Drones en Emergencias - abril 2026',
 'Se abre el plazo de inscripción para el curso de Drones en Emergencias, del 20 al 24 de abril de 2026. Plazas: 12. Requisito: carnet de piloto UAS o disposición a obtenerlo. Interesados contactar con la jefatura antes del 5 de abril.',
 '2026-03-19 09:00:00', 'I003');

-- =======================================================
-- 24. PERSONA_RECIBE_AVISO
-- =======================================================
INSERT INTO Persona_Recibe_Aviso (id_aviso, id_bombero) VALUES
(1,'I001'),(1,'I002'),(1,'M001'),(1,'M002'),(1,'J001'),(1,'J002'),(1,'J003'),
(1,'O001'),(1,'O002'),(1,'O003'),(1,'O004'),
(1,'B001'),(1,'B002'),(1,'B003'),(1,'B004'),(1,'B005'),
(1,'B006'),(1,'B007'),(1,'B008'),(1,'B009'),(1,'B010'),(1,'B011'),(1,'B012'),
(2,'M001'),(2,'J001'),(2,'O001'),(2,'O004'),
(2,'B001'),(2,'B002'),(2,'B003'),(2,'B004'),(2,'B005'),(2,'B010'),(2,'B011'),
(3,'J001'),(3,'O001'),(3,'O004'),(3,'B001'),(3,'B002'),(3,'B003'),
(4,'B009'),(4,'B010'),(4,'B011'),(4,'B012'),
(5,'M001'),(5,'M002'),(5,'J001'),(5,'J002'),(5,'J003'),
(6,'I001'),(6,'I002'),(6,'M001'),(6,'M002'),(6,'J001'),(6,'J002'),(6,'J003'),
(6,'O001'),(6,'O002'),(6,'O003'),(6,'O004'),
(6,'B001'),(6,'B002'),(6,'B003'),(6,'B004'),(6,'B005'),
(6,'B006'),(6,'B007'),(6,'B008'),(6,'B009'),(6,'B010'),(6,'B011'),(6,'B012'),
(7,'J001'),(7,'O001'),(7,'O004'),(7,'B001'),(7,'B002'),(7,'B003'),
(8,'I001'),(8,'I002'),(8,'M001'),(8,'M002'),(8,'J001'),(8,'J002'),(8,'J003'),
(8,'O001'),(8,'O002'),(8,'O003'),(8,'O004'),
(8,'B001'),(8,'B002'),(8,'B003'),(8,'B004'),(8,'B005'),
(8,'B006'),(8,'B007'),(8,'B008'),(8,'B009'),(8,'B010'),(8,'B011'),(8,'B012'),
(9,'B009'),(9,'B010'),(9,'B011'),(9,'B012'),(9,'B013'),(9,'B014'),(9,'B015'),
(9,'B016'),(9,'B017'),(9,'B018'),(9,'B019'),(9,'B020'),(9,'B021'),(9,'B022'),
(10,'I001'),(10,'I002'),(10,'I003'),(10,'M001'),(10,'M002'),(10,'M003'),(10,'M004'),
(10,'J001'),(10,'J002'),(10,'J003'),(10,'J004'),(10,'J005'),(10,'J006'),
(10,'O001'),(10,'O002'),(10,'O003'),(10,'O004'),(10,'O005'),(10,'O006'),(10,'O007'),(10,'O008'),
(10,'B001'),(10,'B002'),(10,'B003'),(10,'B004'),(10,'B005'),(10,'B006'),(10,'B007'),
(10,'B008'),(10,'B009'),(10,'B010'),(10,'B011'),(10,'B012'),(10,'B013'),(10,'B014'),
(10,'B015'),(10,'B016'),(10,'B017'),(10,'B018'),(10,'B019'),(10,'B020'),(10,'B021'),
(10,'B022'),(10,'B023'),(10,'B024'),(10,'B025'),(10,'B026'),(10,'B027'),(10,'B028'),
(10,'B029'),(10,'B030'),(10,'B031'),(10,'B032'),(10,'B033'),(10,'B034'),(10,'B035'),
(11,'I001'),(11,'I002'),(11,'I003'),(11,'M001'),(11,'M002'),(11,'M003'),(11,'M004'),
(11,'J001'),(11,'J002'),(11,'J003'),(11,'J004'),(11,'J005'),(11,'J006'),
(11,'O001'),(11,'O002'),(11,'O003'),(11,'O004'),(11,'O005'),(11,'O006'),(11,'O007'),(11,'O008'),
(12,'I001'),(12,'I002'),(12,'I003'),(12,'M001'),(12,'M002'),(12,'M003'),(12,'M004'),
(12,'J001'),(12,'J002'),(12,'J003'),(12,'J004'),(12,'J005'),(12,'J006'),
(12,'O001'),(12,'O002'),(12,'O003'),(12,'O004'),(12,'O005'),(12,'O006'),(12,'O007'),(12,'O008'),
(12,'B001'),(12,'B002'),(12,'B003'),(12,'B004'),(12,'B005'),(12,'B006'),(12,'B007'),
(12,'B008'),(12,'B009'),(12,'B010'),(12,'B011'),(12,'B012'),(12,'B013'),(12,'B014'),
(12,'B015'),(12,'B016'),(12,'B017'),(12,'B018'),(12,'B019'),(12,'B020'),(12,'B021'),
(12,'B022'),(12,'B023'),(12,'B024'),(12,'B025'),(12,'B026'),(12,'B027'),(12,'B028'),
(12,'B029'),(12,'B030'),(12,'B031'),(12,'B032'),(12,'B033'),(12,'B034'),(12,'B035'),
(13,'M001'),(13,'J001'),(13,'J004'),(13,'O001'),(13,'O004'),(13,'O005'),
(13,'B001'),(13,'B002'),(13,'B003'),(13,'B004'),(13,'B005'),(13,'B013'),(13,'B016'),(13,'B019'),
(13,'B023'),(13,'B026'),(13,'B029'),(13,'B031'),(13,'B034'),
(14,'I001'),(14,'I002'),(14,'I003'),(14,'M001'),(14,'M002'),(14,'M003'),(14,'M004'),
(14,'J001'),(14,'J002'),(14,'J003'),(14,'J004'),(14,'J005'),(14,'J006'),
(14,'O001'),(14,'O002'),(14,'O003'),(14,'O004'),(14,'O005'),(14,'O006'),(14,'O007'),(14,'O008'),
(15,'M001'),(15,'M002'),(15,'J001'),(15,'J002'),(15,'J003'),(15,'J004'),(15,'J005'),
(15,'O001'),(15,'O002'),(15,'O005'),(15,'O006'),
(16,'I001'),(16,'I002'),(16,'I003'),(16,'M001'),(16,'M002'),(16,'M003'),(16,'M004'),
(16,'J001'),(16,'J002'),(16,'J003'),(16,'J004'),(16,'J005'),(16,'J006'),
(16,'O001'),(16,'O002'),(16,'O003'),(16,'O004'),(16,'O005'),(16,'O006'),(16,'O007'),(16,'O008'),
(16,'B001'),(16,'B002'),(16,'B003'),(16,'B004'),(16,'B005'),(16,'B006'),(16,'B007'),
(16,'B008'),(16,'B009'),(16,'B010'),(16,'B011'),(16,'B012'),(16,'B013'),(16,'B014'),
(16,'B015'),(16,'B016'),(16,'B017'),(16,'B018'),(16,'B019'),(16,'B020'),(16,'B021'),
(16,'B022'),(16,'B023'),(16,'B024'),(16,'B025'),(16,'B026'),(16,'B027'),(16,'B028'),
(16,'B029'),(16,'B030'),(16,'B031'),(16,'B032'),(16,'B033'),(16,'B034'),(16,'B035'),
(17,'I001'),(17,'I002'),(17,'I003'),(17,'M001'),(17,'M002'),(17,'M003'),(17,'M004'),
(17,'J001'),(17,'J002'),(17,'J003'),(17,'J004'),(17,'J005'),(17,'J006'),
(18,'I001'),(18,'I002'),(18,'I003'),(18,'M001'),(18,'M002'),(18,'M003'),(18,'M004'),
(18,'J001'),(18,'J002'),(18,'J003'),(18,'J004'),(18,'J005'),(18,'J006'),
(18,'O001'),(18,'O002'),(18,'O003'),(18,'O004'),(18,'O005'),(18,'O006'),(18,'O007'),(18,'O008'),
(18,'B001'),(18,'B002'),(18,'B003'),(18,'B004'),(18,'B005'),(18,'B006'),(18,'B007'),
(18,'B008'),(18,'B009'),(18,'B010'),(18,'B011'),(18,'B012'),(18,'B013'),(18,'B014'),
(18,'B015'),(18,'B016'),(18,'B017'),(18,'B018'),(18,'B019'),(18,'B020'),(18,'B021'),
(18,'B022'),(18,'B023'),(18,'B024'),(18,'B025'),(18,'B026'),(18,'B027'),(18,'B028'),
(18,'B029'),(18,'B030'),(18,'B031'),(18,'B032'),(18,'B033'),(18,'B034'),(18,'B035');

-- =======================================================
-- 25. GUARDIA
-- =======================================================
INSERT INTO Guardia (fecha, h_inicio, h_fin, notas) VALUES
('2025-01-06', '08:00:00', '20:00:00', 'Guardia festivo Reyes. Turno reforzado. Protocolo alerta invierno activo.'),
('2025-01-06', '20:00:00', '08:00:00', 'Guardia festivo Reyes - turno noche.'),
('2025-02-01', '08:00:00', '20:00:00', 'Guardia ordinaria. Sin incidencias previstas.'),
('2025-02-01', '20:00:00', '08:00:00', 'Guardia ordinaria noche.'),
('2025-03-20', '08:00:00', '20:00:00', 'Guardia Fallas Valencia. Alerta por riesgo de incendio.'),
('2025-04-17', '08:00:00', '20:00:00', 'Guardia Semana Santa. Protocolo especial festivos.'),
('2025-04-17', '20:00:00', '08:00:00', 'Guardia Semana Santa noche.'),
('2025-07-15', '08:00:00', '20:00:00', 'Guardia verano. Alerta naranja incendio forestal activa.'),
('2025-07-15', '20:00:00', '08:00:00', 'Guardia verano noche. Alerta naranja activa.'),
('2025-08-15', '08:00:00', '20:00:00', 'Guardia festivo Asunción. Turno reforzado. Alerta forestal máxima.'),
('2025-10-12', '08:00:00', '20:00:00', 'Guardia festivo Día de la Hispanidad.'),
('2025-12-24', '20:00:00', '08:00:00', 'Guardia Nochebuena. Personal voluntario.'),
('2025-12-31', '20:00:00', '08:00:00', 'Guardia Nochevieja. Protocolo especial pirotecnia.'),
('2026-01-01', '08:00:00', '20:00:00', 'Guardia Año Nuevo. Turno reforzado. Alerta por celebraciones nocturnas.'),
('2026-01-01', '20:00:00', '08:00:00', 'Guardia Año Nuevo - noche.'),
('2026-01-06', '08:00:00', '20:00:00', 'Guardia festivo Reyes. Turno reforzado.'),
('2026-01-06', '20:00:00', '08:00:00', 'Guardia festivo Reyes - noche.'),
('2026-01-12', '08:00:00', '20:00:00', 'Guardia ordinaria. Alerta naranja por nevada en Pirineo.'),
('2026-01-15', '08:00:00', '20:00:00', 'Guardia ordinaria enero.'),
('2026-01-19', '08:00:00', '20:00:00', 'Guardia ordinaria enero.'),
('2026-01-22', '08:00:00', '20:00:00', 'Guardia ordinaria enero.'),
('2026-01-26', '08:00:00', '20:00:00', 'Guardia ordinaria enero.'),
('2026-02-02', '08:00:00', '20:00:00', 'Guardia ordinaria febrero.'),
('2026-02-02', '20:00:00', '08:00:00', 'Guardia ordinaria febrero noche.'),
('2026-02-09', '08:00:00', '20:00:00', 'Guardia ordinaria febrero.'),
('2026-02-12', '08:00:00', '20:00:00', 'Guardia festivo. Alerta por viento fuerte.'),
('2026-02-16', '08:00:00', '20:00:00', 'Guardia ordinaria febrero.'),
('2026-02-19', '08:00:00', '20:00:00', 'Guardia ordinaria febrero.'),
('2026-02-23', '08:00:00', '20:00:00', 'Guardia ordinaria febrero. Simulacro en Polígono Malpica a las 10:00.'),
('2026-02-26', '08:00:00', '20:00:00', 'Guardia ordinaria febrero.'),
('2026-02-26', '20:00:00', '08:00:00', 'Guardia febrero noche. Alerta por viento en Ibérica.'),
('2026-03-02', '08:00:00', '20:00:00', 'Guardia ordinaria marzo.'),
('2026-03-02', '20:00:00', '08:00:00', 'Guardia ordinaria marzo noche.'),
('2026-03-05', '08:00:00', '20:00:00', 'Guardia ordinaria marzo.'),
('2026-03-09', '08:00:00', '20:00:00', 'Guardia ordinaria marzo.'),
('2026-03-12', '08:00:00', '20:00:00', 'Guardia ordinaria marzo.'),
('2026-03-16', '08:00:00', '20:00:00', 'Guardia ordinaria marzo. Protocolo alerta forestal nivel 1 activo.'),
('2026-03-16', '20:00:00', '08:00:00', 'Guardia noche. Alerta forestal nivel 1.'),
('2026-03-19', '08:00:00', '20:00:00', 'Guardia ordinaria marzo.'),
('2026-03-19', '20:00:00', '08:00:00', 'Guardia noche 19-20 marzo.'),
('2026-04-02', '08:00:00', '20:00:00', 'Guardia Jueves Santo.'),
('2026-04-02', '20:00:00', '08:00:00', 'Guardia Jueves Santo noche.'),
('2026-04-03', '08:00:00', '20:00:00', 'Guardia Viernes Santo. Protocolo festivos.'),
('2026-04-06', '08:00:00', '20:00:00', 'Guardia Lunes Pascua.'),
('2026-04-23', '08:00:00', '20:00:00', 'Guardia San Jorge. Turno reforzado para eventos en Zaragoza.'),
('2026-05-01', '08:00:00', '20:00:00', 'Guardia festivo 1 de mayo.'),
('2026-07-20', '08:00:00', '20:00:00', 'Guardia verano. Alerta naranja forestal prevista.'),
('2026-07-20', '20:00:00', '08:00:00', 'Guardia verano noche.'),
('2026-08-10', '08:00:00', '20:00:00', 'Guardia agosto. Alerta roja forestal prevista.'),
('2026-08-15', '08:00:00', '20:00:00', 'Guardia festivo Asunción. Turno reforzado máximo.'),
('2026-12-24', '20:00:00', '08:00:00', 'Guardia Nochebuena 2026.'),
('2026-12-31', '20:00:00', '08:00:00', 'Guardia Nochevieja 2026.');

-- =======================================================
-- 26. PERSONA_HACE_GUARDIA
-- =======================================================
INSERT INTO Persona_Hace_Guardia (id_bombero, id_guardia, cargo) VALUES
('M001', 1, 'OFICIAL1'),
('J001', 1, 'OFICIAL2'),
('O001', 1, 'CONDUCTOR1'),
('B001', 1, 'BOMBERO1'),
('B002', 1, 'BOMBERO2'),
('B003', 1, 'BOMBERO3'),
('J001', 3, 'OFICIAL2'),
('O004', 3, 'CONDUCTOR1'),
('B004', 3, 'BOMBERO1'),
('B005', 3, 'BOMBERO2'),
('M001', 6, 'OFICIAL1'),
('J001', 6, 'OFICIAL2'),
('O001', 6, 'CONDUCTOR1'),
('B001', 6, 'BOMBERO1'),
('B002', 6, 'BOMBERO2'),
('B010', 6, 'BOMBERO3'),
('M001', 8, 'OFICIAL1'),
('J001', 8, 'OFICIAL2'),
('J002', 8, 'CONDUCTOR2'),
('O001', 8, 'CONDUCTOR1'),
('O002', 8, 'CONDUCTOR2'),
('B001', 8, 'BOMBERO1'),
('B002', 8, 'BOMBERO2'),
('B006', 8, 'BOMBERO3'),
('B007', 8, 'BOMBERO4'),
('M002', 10, 'OFICIAL1'),
('J003', 10, 'OFICIAL2'),
('O003', 10, 'CONDUCTOR1'),
('B008', 10, 'BOMBERO1'),
('B009', 10, 'BOMBERO2'),
('J001', 12, 'OFICIAL2'),
('O004', 12, 'CONDUCTOR1'),
('B003', 12, 'BOMBERO1'),
('B011', 12, 'BOMBERO2'),
('J001', 13, 'OFICIAL2'),
('O001', 13, 'CONDUCTOR1'),
('B004', 13, 'BOMBERO1'),
('B012', 13, 'BOMBERO2'),
('M001', 14, 'OFICIAL1'),
('J001', 14, 'OFICIAL2'),
('O001', 14, 'CONDUCTOR1'),
('B001', 14, 'BOMBERO1'),
('B002', 14, 'BOMBERO2'),
('B013', 14, 'BOMBERO3'),
('B016', 14, 'BOMBERO4'),
('M002', 15, 'OFICIAL1'),
('J004', 15, 'OFICIAL2'),
('O005', 15, 'CONDUCTOR1'),
('B019', 15, 'BOMBERO1'),
('B026', 15, 'BOMBERO2'),
('M001', 16, 'OFICIAL1'),
('J001', 16, 'OFICIAL2'),
('O001', 16, 'CONDUCTOR1'),
('O004', 16, 'CONDUCTOR2'),
('B001', 16, 'BOMBERO1'),
('B002', 16, 'BOMBERO2'),
('B003', 16, 'BOMBERO3'),
('B013', 16, 'BOMBERO4'),
('I001', 17, 'OFICIAL1'),
('J004', 17, 'OFICIAL2'),
('O005', 17, 'CONDUCTOR1'),
('B016', 17, 'BOMBERO1'),
('B019', 17, 'BOMBERO2'),
('B026', 17, 'BOMBERO3'),
('M003', 18, 'OFICIAL1'),
('J005', 18, 'OFICIAL2'),
('O006', 18, 'CONDUCTOR1'),
('B014', 18, 'BOMBERO1'),
('B017', 18, 'BOMBERO2'),
('B024', 18, 'BOMBERO3'),
('J001', 19, 'OFICIAL2'),
('O001', 19, 'CONDUCTOR1'),
('B001', 19, 'BOMBERO1'),
('B004', 19, 'BOMBERO2'),
('B010', 19, 'BOMBERO3'),
('J004', 20, 'OFICIAL2'),
('O005', 20, 'CONDUCTOR1'),
('B002', 20, 'BOMBERO1'),
('B013', 20, 'BOMBERO2'),
('B023', 20, 'BOMBERO3'),
('M002', 21, 'OFICIAL1'),
('J003', 21, 'OFICIAL2'),
('O007', 21, 'CONDUCTOR1'),
('B015', 21, 'BOMBERO1'),
('B025', 21, 'BOMBERO2'),
('B028', 21, 'BOMBERO3'),
('J001', 22, 'OFICIAL2'),
('O001', 22, 'CONDUCTOR1'),
('B001', 22, 'BOMBERO1'),
('B005', 22, 'BOMBERO2'),
('B011', 22, 'BOMBERO3'),
('M001', 23, 'OFICIAL1'),
('J004', 23, 'OFICIAL2'),
('O005', 23, 'CONDUCTOR1'),
('B002', 23, 'BOMBERO1'),
('B013', 23, 'BOMBERO2'),
('B016', 23, 'BOMBERO3'),
('B029', 23, 'BOMBERO4'),
('J001', 24, 'OFICIAL2'),
('O004', 24, 'CONDUCTOR1'),
('B003', 24, 'BOMBERO1'),
('B019', 24, 'BOMBERO2'),
('B026', 24, 'BOMBERO3'),
('M004', 25, 'OFICIAL1'),
('J006', 25, 'OFICIAL2'),
('O007', 25, 'CONDUCTOR1'),
('B015', 25, 'BOMBERO1'),
('B021', 25, 'BOMBERO2'),
('B033', 25, 'BOMBERO3'),
('M003', 26, 'OFICIAL1'),
('J005', 26, 'OFICIAL2'),
('O006', 26, 'CONDUCTOR1'),
('B014', 26, 'BOMBERO1'),
('B017', 26, 'BOMBERO2'),
('B020', 26, 'BOMBERO3'),
('B030', 26, 'BOMBERO4'),
('J001', 27, 'OFICIAL2'),
('O001', 27, 'CONDUCTOR1'),
('B001', 27, 'BOMBERO1'),
('B004', 27, 'BOMBERO2'),
('B010', 27, 'BOMBERO3'),
('J004', 28, 'OFICIAL2'),
('O005', 28, 'CONDUCTOR1'),
('B002', 28, 'BOMBERO1'),
('B016', 28, 'BOMBERO2'),
('B023', 28, 'BOMBERO3'),
('M001', 29, 'OFICIAL1'),
('J001', 29, 'OFICIAL2'),
('O001', 29, 'CONDUCTOR1'),
('O004', 29, 'CONDUCTOR2'),
('B001', 29, 'BOMBERO1'),
('B002', 29, 'BOMBERO2'),
('B003', 29, 'BOMBERO3'),
('B005', 29, 'BOMBERO4'),
('B013', 29, 'BOMBERO5'),
('J002', 30, 'OFICIAL2'),
('O002', 30, 'CONDUCTOR1'),
('B006', 30, 'BOMBERO1'),
('B007', 30, 'BOMBERO2'),
('B012', 30, 'BOMBERO3'),
('B014', 30, 'BOMBERO4'),
('M002', 31, 'OFICIAL1'),
('J005', 31, 'OFICIAL2'),
('O006', 31, 'CONDUCTOR1'),
('B017', 31, 'BOMBERO1'),
('B024', 31, 'BOMBERO2'),
('M001', 32, 'OFICIAL1'),
('J001', 32, 'OFICIAL2'),
('O001', 32, 'CONDUCTOR1'),
('O005', 32, 'CONDUCTOR2'),
('B001', 32, 'BOMBERO1'),
('B002', 32, 'BOMBERO2'),
('B013', 32, 'BOMBERO3'),
('B016', 32, 'BOMBERO4'),
('B029', 32, 'BOMBERO5'),
('J004', 33, 'OFICIAL2'),
('O004', 33, 'CONDUCTOR1'),
('B003', 33, 'BOMBERO1'),
('B019', 33, 'BOMBERO2'),
('B026', 33, 'BOMBERO3'),
('J002', 34, 'OFICIAL2'),
('O002', 34, 'CONDUCTOR1'),
('B006', 34, 'BOMBERO1'),
('B007', 34, 'BOMBERO2'),
('B022', 34, 'BOMBERO3'),
('M004', 35, 'OFICIAL1'),
('J003', 35, 'OFICIAL2'),
('O007', 35, 'CONDUCTOR1'),
('B015', 35, 'BOMBERO1'),
('B025', 35, 'BOMBERO2'),
('B028', 35, 'BOMBERO3'),
('M003', 36, 'OFICIAL1'),
('J001', 36, 'OFICIAL2'),
('O001', 36, 'CONDUCTOR1'),
('B001', 36, 'BOMBERO1'),
('B004', 36, 'BOMBERO2'),
('B011', 36, 'BOMBERO3'),
('M001', 37, 'OFICIAL1'),
('J001', 37, 'OFICIAL2'),
('O001', 37, 'CONDUCTOR1'),
('O004', 37, 'CONDUCTOR2'),
('B001', 37, 'BOMBERO1'),
('B002', 37, 'BOMBERO2'),
('B003', 37, 'BOMBERO3'),
('B013', 37, 'BOMBERO4'),
('B016', 37, 'BOMBERO5'),
('J002', 38, 'OFICIAL2'),
('O002', 38, 'CONDUCTOR1'),
('B006', 38, 'BOMBERO1'),
('B007', 38, 'BOMBERO2'),
('B022', 38, 'BOMBERO3'),
('M001', 39, 'OFICIAL1'),
('J004', 39, 'OFICIAL2'),
('O005', 39, 'CONDUCTOR1'),
('O008', 39, 'CONDUCTOR2'),
('B002', 39, 'BOMBERO1'),
('B005', 39, 'BOMBERO2'),
('B019', 39, 'BOMBERO3'),
('B023', 39, 'BOMBERO4'),
('B026', 39, 'BOMBERO5'),
('J001', 40, 'OFICIAL2'),
('O001', 40, 'CONDUCTOR1'),
('O004', 40, 'CONDUCTOR2'),
('B001', 40, 'BOMBERO1'),
('B013', 40, 'BOMBERO2'),
('B016', 40, 'BOMBERO3'),
('B029', 40, 'BOMBERO4');

-- =======================================================
-- 27. MERITO
-- =======================================================
INSERT INTO Merito (nombre, descripcion) VALUES
('Cruz al Mérito de Protección Civil', 'Distinción otorgada por la Dirección General de Protección Civil y Emergencias por servicios destacados'),
('Medalla al Mérito del Cuerpo de Bomberos', 'Distinción interna del cuerpo por trayectoria profesional ejemplar'),
('Felicitación Pública por Actuación Destacada', 'Reconocimiento público por intervención de especial relevancia o riesgo'),
('10 años de servicio', 'Reconocimiento por una década de servicio continuado en el cuerpo'),
('20 años de servicio', 'Reconocimiento por dos décadas de servicio continuado en el cuerpo'),
('Rescate con riesgo para la propia vida', 'Reconocimiento específico por rescate de víctimas asumiendo riesgo extraordinario'),
('30 años de servicio', 'Reconocimiento por tres décadas de servicio continuado en el cuerpo'),
('Especialista en Materias Peligrosas', 'Acreditación como especialista operativo en intervenciones con MMPP ADR'),
('Instructor Formación Interna', 'Reconocimiento a la labor docente dentro del programa de formación del cuerpo'),
('Coordinación en Emergencia Nivel 2', 'Mención por dirección efectiva en emergencias de nivel 2 o superior');

-- =======================================================
-- 28. PERSONA_TIENE_MERITO
-- =======================================================
INSERT INTO Persona_Tiene_Merito (id_bombero, id_merito) VALUES
('I001', 4), ('I001', 5), ('I001', 2),
('M001', 4), ('M001', 5), ('M001', 2),
('M002', 4), ('M002', 5),
('J001', 4), ('J001', 3), ('J001', 6),
('J002', 4), ('J002', 3),
('J003', 4),
('O001', 4), ('O001', 3),
('B001', 4),
('B099', 4), ('B099', 5),
('I001', 7),
('M001', 7),
('I003', 4),  ('I003', 8),
('M003', 4),  ('M003', 5), ('M003', 8),
('M004', 4),  ('M004', 5),
('J004', 4),  ('J004', 9),
('J005', 4),
('J006', 3),  ('J006', 9),
('O005', 3),
('J001', 8),
('M001', 9);

-- =======================================================
-- 29A. VEHICULO_CARGA_UNIDADES
-- =======================================================
INSERT INTO Vehiculo_Carga_Unidades
(id_material, matricula, unidades) VALUES

(1,  '3421BCP', 4),
(22, '3421BCP', 4),
(26, '3421BCP', 2),

(1,  '5678DFG', 4),

(1,  '7890GHJ', 2),
(22, '7890GHJ', 2),

(22, '1122KLM', 2),
(26, '1122KLM', 1),

(22, '3344NOP', 4),
(26, '3344NOP', 4),

(1,  '5566RST', 2),
(24, '5566RST', 4),
(25, '5566RST', 4),

(1,  '4455GHK', 4),
(22, '4455GHK', 4),
(24, '8899PQR', 4),
(25, '8899PQR', 4),

(1,  '1023STW', 3),
(22, '1023STW', 3);

-- =======================================================
-- 29B. VEHICULO_CARGA_SERIE
-- =======================================================
INSERT INTO Vehiculo_Carga_Serie
(id_material, matricula, nserie) VALUES

(10, '3421BCP', 'ERA-VH-001'),
(27, '3421BCP', 'TERMO-001'),

(10, '5678DFG', 'ERA-VH-005'),
(6,  '5678DFG', 'CIZ-VH-001'),
(7,  '5678DFG', 'EXP-VH-001'),

(10, '7890GHJ', 'ERA-VH-009'),

(27, '3344NOP', 'TERMO-002'),

(10, '4455GHK', 'ERA-VH-013'),

(10, '1023STW', 'ERA-VH-017');

-- =======================================================
-- 30. INCIDENCIA
-- =======================================================
INSERT INTO Incidencia (id_material, id_bombero, matricula, fecha, asunto, estado, tipo) VALUES
(2,  'B003', '3421BCP', '2025-01-20', 'Traje de intervención con quemaduras en el torso tras incendio de nave industrial. Requiere sustitución.',           'CERRADA', 'Deterioro por uso en intervención'),
(10, 'B001', '5678DFG', '2025-02-10', 'ERA con manómetro que no marca correctamente. Enviado a servicio técnico oficial.',                                   'CERRADA', 'Avería equipo'),
(6,  'J001', '5678DFG', '2025-03-05', 'Cizalla hidráulica con pérdida de presión. Revisión urgente antes de próxima intervención.',                         'ABIERTA', 'Avería equipo'),
(1,  'B002', NULL,       '2025-04-12', 'Casco con golpe visible en la cúpula tras derrumbe parcial. No apto para uso hasta revisión.',                        'ABIERTA', 'Deterioro por uso en intervención'),
(NULL,'O001', '7890GHJ', '2025-05-20', 'Fallo en el sistema hidráulico de la escalera en el tramo 3. Vehículo fuera de servicio hasta reparación.',           'ABIERTA', 'Avería mecánica'),
(22, 'B008', NULL,       '2025-06-01', 'Radio portátil TETRA sin señal en zona de barrancos. Posible fallo de antena.',                                       'CERRADA', 'Avería equipo'),
(27, 'J002', '4455GHK', '2025-07-10', 'Cámara termográfica con imagen degradada en incendio forestal. Se solicita revisión del sensor.',                     'ABIERTA', 'Avería equipo'),
(1,  'B013', NULL,       '2025-10-15', 'Casco con fisura visible en la visera tras intervención en derrumbe. Retirado de servicio para revisión.',                                         'CERRADA', 'Deterioro por uso en intervención'),
(10, 'O005', '3421BCP',  '2025-11-08', 'ERA del vehículo BZC-01 con manómetro descalibrado. Enviado a servicio técnico oficial para revisión y recalibración.',                            'CERRADA', 'Avería equipo'),
(22, 'B006', '8899PQR',  '2025-11-22', 'Radio TETRA del vehículo BHU-03 con problemas de conexión en zona de montaña. Posible fallo de antena externa.',                                  'CERRADA', 'Avería equipo'),
(2,  'B007', NULL,       '2025-12-03', 'Traje de intervención con quemaduras menores en mangas tras incendio de vivienda. Se solicita sustitución urgente.',                              'ABIERTA', 'Deterioro por uso en intervención'),
(NULL,'O001', '7890GHJ', '2025-12-10', 'Sistema hidráulico de escalera en tramo 2 presenta resistencia inusual en extensión. Se ha comunicado al servicio técnico.',                     'ABIERTA', 'Avería mecánica'),
(27, 'J002', '6677LMN',  '2025-12-18', 'Cámara termográfica del vehículo BHU-02 muestra imagen degradada en zonas de alta temperatura. Enviada a revisión de sensor.',                  'ABIERTA', 'Avería equipo'),
(1,  'B016', NULL,       '2026-01-05', 'Casco nuevo con defecto de fábrica en la correa de sujeción. Se ha comunicado al proveedor para sustitución bajo garantía.',                    'CERRADA', 'Defecto de fábrica'),
(10, 'B001', '3421BCP',  '2026-01-15', 'ERA del vehículo BZC-01 con válvula de demanda con ligera fuga. Retirado de servicio hasta reparación por técnico certificado.',               'CERRADA', 'Avería equipo'),
(6,  'J001', '5678DFG',  '2026-01-20', 'Cizalla hidráulica usada en rescate con desgaste visible en cuchillas. Se solicita sustitución de cuchillas o reemplazo del equipo.',          'ABIERTA', 'Deterioro por uso en intervención'),
(NULL,'O004', '5678TVX', '2026-01-24', 'Fallo en sistema eléctrico del vehículo BEJ-01. Luces de emergencia no funcionan correctamente. Enviado a taller.',                              'CERRADA', 'Avería mecánica'),
(22, 'B013', NULL,       '2026-01-28', 'Radio portátil TETRA con batería defectuosa. No mantiene carga más de 2 horas. Solicitud de sustitución de batería.',                           'CERRADA', 'Avería equipo'),
(2,  'B002', NULL,       '2026-02-03', 'Traje de intervención con cremallera rota en el cierre del cuello. No apto para uso hasta reparación.',                                         'CERRADA', 'Deterioro por uso normal'),
(10, 'B017', '4455GHK',  '2026-02-09', 'ERA del vehículo BHU-01 con alarma de baja presión defectuosa. No activa en prueba. Enviado a revisión urgente.',                              'CERRADA', 'Avería equipo'),
(NULL,'J005', '4455GHK', '2026-02-14', 'Vehículo BHU-01 con pérdida de presión en neumático trasero derecho durante intervención. Rueda reparada en campo.',                           'CERRADA', 'Avería mecánica'),
(1,  'B014', NULL,       '2026-02-18', 'Casco con deformación en la visera tras impacto de escombro en intervención de derrumbe. Retirado de servicio.',                               'ABIERTA', 'Deterioro por uso en intervención'),
(7,  'B006', '8899PQR',  '2026-02-23', 'Expansor hidráulico con pérdida de aceite en junta del vástago. Retirado de servicio hasta reparación.',                                       'ABIERTA', 'Avería equipo'),
(2,  'B013', NULL,       '2026-03-01', 'Traje de intervención con rozaduras en zona de rodillas. Solicitud de refuerzo o sustitución.',                                                  'ABIERTA', 'Deterioro por uso normal'),
(NULL,'O002', '9900YZB', '2026-03-03', 'Autoescala BZS-02 con ruido anómalo en sistema de rotación de la pluma. Enviado a revisión técnica urgente.',                                  'ABIERTA', 'Avería mecánica'),
(22, 'B016', '3421BCP',  '2026-03-06', 'Radio TETRA de vehículo BZC-01 sin cobertura en zona del polígono La Cartuja. Posible problema de configuración de red.',                     'CERRADA', 'Avería equipo'),
(10, 'O001', '5678DFG',  '2026-03-10', 'ERA del vehículo BZC-02 con indicador de presión con aguja bloqueada. Retirado de servicio para revisión.',                                    'ABIERTA', 'Avería equipo'),
(1,  'B023', NULL,       '2026-03-13', 'Casco con golpe en cúpula tras intervención en accidente de tráfico. No apto para uso hasta revisión por técnico.',                             'ABIERTA', 'Deterioro por uso en intervención'),
(NULL,'J001', '7890GHJ', '2026-03-15', 'Autoescala BZC-03 con fallo en sistema hidráulico. Enviada a taller especializado. Vehículo fuera de servicio indefinidamente.',               'ABIERTA', 'Avería mecánica'),
(24, 'B006', '5566RST',  '2026-03-16', 'Mochila de extinción 20L con válvula de bomba manual dañada. No ejerce presión suficiente. Solicitud de sustitución.',                         'ABIERTA', 'Deterioro por uso en intervención'),
(NULL,'O006', '4455GHK', '2026-03-17', 'Vehículo BHU-01 con bomba de agua fuera de servicio. En reparación en taller. Se usa BHU-03 como sustitución.',                               'ABIERTA', 'Avería mecánica'),
(2,  'B019', NULL,       '2026-03-19', 'Traje de intervención dañado en intervención de incendio de edificio. Quemaduras en zona de espalda. Solicitud urgente de sustitución.',       'ABIERTA', 'Deterioro por uso en intervención');

-- =======================================================
-- 31. MOTIVO
-- =======================================================
INSERT INTO Motivo (nombre, dias) VALUES
('Asuntos propios',                     6),
('Enfermedad o accidente no laboral',   0),
('Accidente laboral',                   0),
('Matrimonio o pareja de hecho',       15),
('Nacimiento o adopción de hijo',      16),
('Fallecimiento de familiar 1er grado', 3),
('Fallecimiento de familiar 2o grado',  2),
('Mudanza de domicilio',                1),
('Deber inexcusable de carácter público',0),
('Lactancia',                           0),
('Permiso de formación oficial',        0),
('Conciliación familiar',               0);

-- =======================================================
-- 32. PERMISO
-- =======================================================
INSERT INTO Permiso (cod_motivo, id_bombero, fecha_solicitud, fecha_hora_inicio, fecha_hora_fin, estado, descripcion) VALUES
(1,  'B001', '2025-01-28 09:15:00', '2025-02-14 08:00:00', '2025-02-14 20:00:00', 'ACEPTADO', 'Día de asuntos propios para gestión personal'),
(1,  'B003', '2025-03-10 11:00:00', '2025-03-28 08:00:00', '2025-03-28 20:00:00', 'ACEPTADO', 'Día de asuntos propios'),
(4,  'B004', '2025-03-15 10:20:00', '2025-04-05 00:00:00', '2025-04-19 23:59:59', 'ACEPTADO', 'Permiso matrimonio. Boda civil el 5 de abril en Zaragoza'),
(5,  'O002', '2025-05-20 08:45:00', '2025-06-10 00:00:00', '2025-06-25 23:59:59', 'ACEPTADO', 'Permiso nacimiento hijo. Parto el día 10 de junio'),
(6,  'B007', '2025-01-21 07:50:00', '2025-01-22 00:00:00', '2025-01-24 23:59:59', 'ACEPTADO', 'Fallecimiento padre. Enterramiento el 22 de enero en Huesca'),
(1,  'B010', '2025-07-17 13:30:00', '2025-08-04 08:00:00', '2025-08-04 20:00:00', 'REVISION', 'Solicitud día de asuntos propios, pendiente confirmar cobertura guardia'),
(11, 'J002', '2025-08-30 09:00:00', '2025-09-15 08:00:00', '2025-09-17 18:00:00', 'ACEPTADO', 'Asistencia a curso de rescate en montaña GRS en Jaca'),
(1,  'B005', '2025-10-04 16:10:00', '2025-10-31 08:00:00', '2025-10-31 20:00:00', 'DENEGADO', 'Solicitud asuntos propios. Denegada por falta de cobertura mínima de guardia'),
(8,  'B002', '2025-10-20 10:40:00', '2025-11-08 08:00:00', '2025-11-08 20:00:00', 'ACEPTADO', 'Mudanza a nueva vivienda en Zaragoza'),
(1,  'B012', '2025-12-02 12:00:00', '2025-12-26 08:00:00', '2025-12-26 20:00:00', 'REVISION', 'Solicitud día libre después de Navidad. Pendiente revisión cuadrante'),
(1,  'B013', '2025-09-15 09:30:00', '2025-10-10 08:00:00', '2025-10-10 20:00:00', 'ACEPTADO', 'Día de asuntos propios para trámite administrativo'),
(1,  'B014', '2025-09-28 08:30:00', '2025-10-22 08:00:00', '2025-10-22 20:00:00', 'ACEPTADO', 'Día de asuntos propios'),
(6,  'O005', '2025-11-03 07:40:00', '2025-11-05 00:00:00', '2025-11-07 23:59:59', 'ACEPTADO', 'Fallecimiento padre. Entierro el 5 de noviembre en Zaragoza'),
(11, 'B006', '2025-10-23 09:15:00', '2025-11-17 08:00:00', '2025-11-18 18:00:00', 'ACEPTADO', 'Asistencia a curso de rescate acuático en Zaragoza'),
(1,  'B007', '2025-11-12 14:00:00', '2025-12-04 08:00:00', '2025-12-04 20:00:00', 'ACEPTADO', 'Día de asuntos propios'),
(8,  'B003', '2025-11-20 09:50:00', '2025-12-12 08:00:00', '2025-12-12 20:00:00', 'ACEPTADO', 'Mudanza a nueva vivienda en Zaragoza centro'),
(1,  'B011', '2025-12-01 15:25:00', '2025-12-19 08:00:00', '2025-12-19 20:00:00', 'REVISION', 'Solicitud día asuntos propios, pendiente confirmar cobertura guardia del 19'),
(4,  'O006', '2025-11-18 11:10:00', '2025-12-27 00:00:00', '2026-01-10 23:59:59', 'ACEPTADO', 'Permiso matrimonio. Boda civil el 27 de diciembre en Barbastro'),
(1,  'B001', '2025-12-15 08:20:00', '2026-01-09 08:00:00', '2026-01-09 20:00:00', 'ACEPTADO', 'Día de asuntos propios para gestión de herencia'),
(2,  'B016', '2026-01-11 06:45:00', '2026-01-12 00:00:00', '2026-01-16 23:59:59', 'ACEPTADO', 'Baja médica por gripe. IT emitida por médico de cabecera'),
(11, 'O001', '2025-12-20 10:30:00', '2026-01-14 08:00:00', '2026-01-15 18:00:00', 'ACEPTADO', 'Curso de actualización ERA en Madrid. Autorizado por jefatura'),
(1,  'B002', '2025-12-22 09:05:00', '2026-01-16 08:00:00', '2026-01-16 20:00:00', 'ACEPTADO', 'Día de asuntos propios'),
(9,  'J001', '2026-01-05 12:30:00', '2026-01-20 08:00:00', '2026-01-20 14:00:00', 'ACEPTADO', 'Deber inexcusable: declaración como testigo en juzgado de Zaragoza'),
(6,  'B008', '2026-01-22 07:30:00', '2026-01-23 00:00:00', '2026-01-25 23:59:59', 'ACEPTADO', 'Fallecimiento abuelo materno. Entierro en Teruel'),
(1,  'B017', '2026-01-03 09:40:00', '2026-01-27 08:00:00', '2026-01-27 20:00:00', 'ACEPTADO', 'Día de asuntos propios'),
(5,  'B013', '2026-01-12 08:15:00', '2026-02-03 00:00:00', '2026-02-18 23:59:59', 'ACEPTADO', 'Permiso nacimiento primer hijo. Parto el 3 de febrero'),
(1,  'B004', '2026-01-21 10:05:00', '2026-02-06 08:00:00', '2026-02-06 20:00:00', 'ACEPTADO', 'Día de asuntos propios'),
(11, 'J002', '2026-01-26 11:30:00', '2026-02-10 08:00:00', '2026-02-11 18:00:00', 'ACEPTADO', 'Asistencia a jornada técnica de rescate en montaña, Jaca'),
(2,  'B019', '2026-02-12 07:10:00', '2026-02-13 00:00:00', '2026-02-18 23:59:59', 'ACEPTADO', 'Baja médica por luxación de tobillo. IT emitida'),
(1,  'B022', '2026-01-30 14:15:00', '2026-02-17 08:00:00', '2026-02-17 20:00:00', 'ACEPTADO', 'Día de asuntos propios'),
(7,  'B009', '2026-02-18 06:50:00', '2026-02-19 00:00:00', '2026-02-20 23:59:59', 'ACEPTADO', 'Fallecimiento abuelo paterno'),
(8,  'O007', '2026-02-02 09:20:00', '2026-02-24 08:00:00', '2026-02-24 20:00:00', 'ACEPTADO', 'Mudanza a nuevo domicilio en Teruel'),
(1,  'B003', '2026-02-09 13:40:00', '2026-02-27 08:00:00', '2026-02-27 20:00:00', 'REVISION', 'Solicitud asuntos propios. Pendiente verificar cobertura guardia'),
(1,  'B005', '2026-02-11 10:10:00', '2026-03-03 08:00:00', '2026-03-03 20:00:00', 'ACEPTADO', 'Día de asuntos propios'),
(11, 'O006', '2026-02-14 12:20:00', '2026-03-04 08:00:00', '2026-03-05 18:00:00', 'ACEPTADO', 'Asistencia a jornada formativa espacio confinado, Zaragoza'),
(2,  'B025', '2026-03-05 07:05:00', '2026-03-06 00:00:00', '2026-03-12 23:59:59', 'ACEPTADO', 'Baja médica por lesión lumbar. IT emitida por médico'),
(1,  'B010', '2026-02-16 08:45:00', '2026-03-09 08:00:00', '2026-03-09 20:00:00', 'ACEPTADO', 'Día de asuntos propios'),
(9,  'B006', '2026-02-20 11:00:00', '2026-03-10 09:00:00', '2026-03-10 13:00:00', 'ACEPTADO', 'Deber inexcusable: renovación permiso de conducción tipo C'),
(6,  'B024', '2026-03-11 06:55:00', '2026-03-12 00:00:00', '2026-03-14 23:59:59', 'ACEPTADO', 'Fallecimiento madre. Entierro en Huesca'),
(1,  'B011', '2026-02-25 15:10:00', '2026-03-13 08:00:00', '2026-03-13 20:00:00', 'DENEGADO', 'Solicitud asuntos propios denegada. Guardia reforzada por alerta forestal activa'),
(1,  'O002', '2026-02-18 09:35:00', '2026-03-16 08:00:00', '2026-03-16 20:00:00', 'ACEPTADO', 'Día de asuntos propios'),
(11, 'B007', '2026-02-27 10:00:00', '2026-03-17 08:00:00', '2026-03-18 18:00:00', 'ACEPTADO', 'Asistencia a curso de rescate acuático en Zaragoza'),
(1,  'B023', '2026-03-03 16:00:00', '2026-03-19 08:00:00', '2026-03-19 20:00:00', 'REVISION', 'Solicitud día asuntos propios, pendiente confirmar cobertura guardia'),
(4,  'B014', '2026-03-01 09:25:00', '2026-04-10 00:00:00', '2026-04-24 23:59:59', 'REVISION', 'Solicitud permiso matrimonio. Boda prevista el 10 de abril en Huesca'),
(1,  'B016', '2026-03-12 12:10:00', '2026-04-14 08:00:00', '2026-04-14 20:00:00', 'REVISION', 'Solicitud día asuntos propios previo a festivo de Semana Santa'),
(5,  'J004', '2026-03-18 10:50:00', '2026-04-20 00:00:00', '2026-05-05 23:59:59', 'REVISION', 'Solicitud permiso nacimiento. Parto previsto en abril'),
(1,  'B002', '2026-04-09 14:30:00', '2026-05-01 08:00:00', '2026-05-01 20:00:00', 'DENEGADO', 'Solicitud asuntos propios en festivo. Aplicación convenio: no procede en festivo'),
(11, 'O005', '2026-04-07 11:15:00', '2026-05-15 08:00:00', '2026-05-15 18:00:00', 'REVISION', 'Solicitud permiso formación: jornada técnica MMPP en Madrid'),
(1,  'B013', '2026-04-23 08:25:00', '2026-05-22 08:00:00', '2026-05-22 20:00:00', 'REVISION', 'Solicitud día asuntos propios'),
(1,  'B001', '2026-05-12 09:55:00', '2026-06-05 08:00:00', '2026-06-05 20:00:00', 'REVISION', 'Solicitud día asuntos propios'),
(8,  'B026', '2026-05-20 13:05:00', '2026-06-12 08:00:00', '2026-06-12 20:00:00', 'REVISION', 'Solicitud permiso mudanza a nueva vivienda en Zaragoza');

-- =======================================================
-- 33. MANTENIMIENTO
-- =======================================================
INSERT INTO Mantenimiento (id_bombero, estado, f_inicio, f_fin, descripcion) VALUES
('O001', 'REALIZADO', '2025-01-13', '2025-01-14', 'Revisión trimestral de ERA. Recarga de botellas y comprobación de máscaras y reguladores de todos los equipos del Parque Centro.'),
('O001', 'REALIZADO', '2025-02-10', '2025-02-11', 'Mantenimiento preventivo de herramientas hidráulicas. Cambio de aceite hidráulico y ajuste de presiones en cizallas y expansores.'),
('O003', 'REALIZADO', '2025-03-03', '2025-03-03', 'Revisión ITV de flota Teruel. Paso por ITV de los vehículos BTE-01, BTE-02 y BTE-03.'),
('O002', 'REALIZADO', '2025-04-07', '2025-04-07', 'Comprobación y calibración de detectores de gases multigas. Verificación de alarmas y sensores con gases patrón certificados.'),
('O001', 'ABIERTO',   '2025-05-05', NULL,          'Reparación del sistema hidráulico de la escalera del vehículo BZC-03 (7890GHJ). Enviado a taller especializado. ETA: 3 semanas.'),
('O004', 'REALIZADO', '2025-06-02', '2025-06-03', 'Revisión semestral de extintores y mangueras de todos los parques de Zaragoza. Sustitución de los elementos caducados.'),
('O001', 'REALIZADO', '2025-07-01', '2025-07-02', 'Mantenimiento preventivo pre-verano. Revisión completa de la flota forestal y reposición de material de extinción forestal.'),
('O002', 'ABIERTO',   '2025-11-10', NULL,          'Mantenimiento correctivo del vehículo BZS-02 (9900YZB). Avería en el sistema de bombeo de agua. Pendiente diagnóstico taller.'),
('O005', 'REALIZADO', '2025-10-06', '2025-10-07', 'Revisión semestral de ERA en Parque Zaragoza Centro. Recarga de botellas, inspección de válvulas y sustitución de juntas deterioradas.'),
('O003', 'REALIZADO', '2025-10-20', '2025-10-21', 'ITV y mantenimiento preventivo de flota Teruel. Revisión BTE-01, BTE-02 y BTE-03. Cambio de aceite y filtros.'),
('O002', 'REALIZADO', '2025-11-03', '2025-11-03', 'Calibración y recertificación de detectores de gases multigas de toda la flota. Uso de gases patrón certificados.'),
('O001', 'REALIZADO', '2025-11-17', '2025-11-18', 'Mantenimiento preventivo de herramientas hidráulicas: cizallas, expansores y cilindros. Cambio de aceite hidráulico.'),
('O004', 'REALIZADO', '2025-12-01', '2025-12-02', 'Revisión anual de extintores y mangueras de los parques de Zaragoza Sur, Calatayud y Ejea.'),
('O006', 'REALIZADO', '2025-12-15', '2025-12-16', 'Revisión ITV y mantenimiento preventivo flota Huesca y Barbastro. BHU-01, BHU-02, BHU-03.'),
('O007', 'ABIERTO',   '2025-12-22', NULL,          'Reparación del sistema de bombeo del vehículo BTE-01 (1023STW). Enviado a taller de Teruel. Pendiente diagnóstico definitivo.'),
('O005', 'REALIZADO', '2026-01-05', '2026-01-06', 'Mantenimiento pre-campaña invernal. Revisión de cadenas para nieve, materiales de balizamiento y vehículos 4x4.'),
('O001', 'REALIZADO', '2026-01-12', '2026-01-13', 'Revisión trimestral ERA Parque Zaragoza Centro. Botellas recargadas. Máscaras y reguladores comprobados.'),
('O006', 'REALIZADO', '2026-01-19', '2026-01-19', 'Comprobación de radios TETRA de toda la flota. Actualización de firmware y prueba de cobertura en zonas de barranco.'),
('O003', 'REALIZADO', '2026-02-02', '2026-02-03', 'Mantenimiento preventivo de herramientas hidráulicas Teruel y Alcañiz. Reemplazo de mangueras deterioradas.'),
('O001', 'REALIZADO', '2026-02-09', '2026-02-10', 'Revisión de vehículos forestales BZC-06, BZS-03, BHU-03 previo a campaña forestal 2026. Comprobación de equipos de extinción.'),
('O005', 'REALIZADO', '2026-02-16', '2026-02-16', 'Calibración de cámaras termográficas de toda la dotación. Limpieza de sensores y actualización de software.'),
('O004', 'REALIZADO', '2026-02-23', '2026-02-24', 'Revisión integral de extintores y mangueras de los parques de Zaragoza. Sustitución de elementos caducados.'),
('O002', 'ABIERTO',   '2026-03-02', NULL,          'Reparación de fallo hidráulico en autoescala BZC-03 (7890GHJ). Enviada a taller especializado en Zaragoza. ETA: 2 semanas.'),
('O005', 'REALIZADO', '2026-03-09', '2026-03-10', 'Mantenimiento preventivo de equipos de respiración autónoma. Revisión de botellas, máscaras y reguladores en todos los parques.'),
('O001', 'REALIZADO', '2026-03-11', '2026-03-11', 'Comprobación de vehículos de primera salida. Revisión de niveles, neumáticos y equipos de a bordo. Sin incidencias.'),
('O006', 'ABIERTO',   '2026-03-16', NULL,          'Mantenimiento correctivo BHU-01 (4455GHK). Avería en sistema de suministro de agua. Sustitución de bomba en curso.'),
('O007', 'REALIZADO', '2026-03-17', '2026-03-17', 'Revisión semestral detectores de gases Teruel y Alcañiz. Todo en correcto estado. Certificados renovados.'),
('O001', 'ABIERTO',   '2026-03-19', NULL,          'Revisión post-intervención de materiales usados en emergencia forestal del 15 de marzo. Reposición de material forestal consumido.');

INSERT INTO Mantenimiento_Persona (cod_mantenimiento, id_bombero) VALUES
(1, 'O001'), (1, 'B001'), (1, 'B002'),
(2, 'O001'), (2, 'B003'),
(3, 'O003'), (3, 'B008'), (3, 'B009'),
(4, 'O002'), (4, 'B006'),
(5, 'O001'), (5, 'B001'),
(6, 'O004'), (6, 'B004'), (6, 'B005'),
(7, 'O001'), (7, 'B001'), (7, 'B006'), (7, 'B007'),
(8, 'O002'), (8, 'B010'),
(9,  'O005'), (9,  'B001'), (9,  'B002'), (9,  'B013'),
(10, 'O003'), (10, 'B008'), (10, 'B009'), (10, 'B015'),
(11, 'O002'), (11, 'B006'), (11, 'B024'),
(12, 'O001'), (12, 'B001'), (12, 'B003'), (12, 'B013'),
(13, 'O004'), (13, 'B004'), (13, 'B005'), (13, 'B011'),
(14, 'O006'), (14, 'B014'), (14, 'B017'), (14, 'B032'),
(15, 'O007'), (15, 'B008'), (15, 'B009'), (15, 'B025'),
(16, 'O005'), (16, 'B001'), (16, 'B006'), (16, 'B007'), (16, 'B013'),
(17, 'O001'), (17, 'B001'), (17, 'B002'), (17, 'B013'),
(18, 'O006'), (18, 'B014'), (18, 'B017'), (18, 'B024'), (18, 'B032'),
(19, 'O003'), (19, 'B015'), (19, 'B021'), (19, 'B025'), (19, 'B028'),
(20, 'O001'), (20, 'B001'), (20, 'B006'), (20, 'B007'),
(21, 'O005'), (21, 'B013'), (21, 'B016'), (21, 'B019'), (21, 'B023'),
(22, 'O004'), (22, 'B004'), (22, 'B005'), (22, 'B010'), (22, 'B011'),
(23, 'O002'), (23, 'B013'), (23, 'B016'), (23, 'B019'),
(24, 'O005'), (24, 'B001'), (24, 'B006'), (24, 'B007'), (24, 'B013'), (24, 'B014'),
(25, 'O001'), (25, 'B001'), (25, 'B002'), (25, 'B013'),
(26, 'O006'), (26, 'B014'), (26, 'B017'), (26, 'B032'),
(27, 'O007'), (27, 'B015'), (27, 'B025'), (27, 'B028'),
(28, 'O001'), (28, 'B001'), (28, 'B006'), (28, 'B007'), (28, 'B022');

INSERT INTO Mantenimiento_Vehiculo (cod_mantenimiento, matricula) VALUES
(2, '5678DFG'),
(3, '1023STW'), (3, '3045XYA'), (3, '5067BCD'),
(5, '7890GHJ'),
(7, '5566RST'), (7, '2233CDF'), (7, '8899PQR'),
(8, '9900YZB'),
(9,  '3421BCP'), (9,  '5678DFG'),
(10, '1023STW'), (10, '3045XYA'), (10, '5067BCD'),
(12, '3421BCP'), (12, '5678DFG'), (12, '7890GHJ'),
(13, '1023STW'), (13, '3045XYA'), (13, '5067BCD'),
(14, '7788VWX'), (14, '9900YZB'), (14, '2233CDF'), (14, '7089EFG'), (14, '5678TVX'),
(15, '4455GHK'), (15, '6677LMN'), (15, '8899PQR'),
(16, '5566RST'), (16, '2233CDF'), (16, '8899PQR'), (16, '1234LMN'),
(17, '3421BCP'), (17, '5678DFG'), (17, '1122KLM'),
(19, '1023STW'), (19, '3045XYA'), (19, '5067BCD'), (19, '3456PQS'),
(20, '3421BCP'), (20, '5678DFG'), (20, '7890GHJ'), (20, '7788VWX'), (20, '9900YZB'),
(22, '5566RST'), (22, '2233CDF'), (22, '8899PQR'), (22, '1234LMN'), (22, '9012HJK'),
(23, '7890GHJ'),
(24, '5566RST'), (24, '2233CDF'), (24, '8899PQR'),
(26, '4455GHK'),
(28, '5566RST'), (28, '2233CDF'), (28, '8899PQR'), (28, '1234LMN');

INSERT INTO Mantenimiento_Material (cod_mantenimiento, cod_material) VALUES
(1, 10), (1, 11), (1, 12),
(2,  6), (2,  7), (2,  8), (2,  9),
(4, 26),
(6, 16),
(7, 24), (7, 25),
(9,  10), (9,  11), (9,  12),
(11, 26),
(12, 10), (12, 11), (12, 12),
(13,  6), (13,  7), (13,  8), (13,  9),
(14, 16),
(16, 24), (16, 25),
(18, 27),
(21, 10), (21, 11), (21, 12),
(24, 24), (24, 25),
(28, 24), (28, 25);

/* =======================
   34. INFRAESTRUCTURAS_AGUA
    -- Hidrantes: 728 registros | Bocas de riego: 13.800 registros
    -- Total: 14.528 registros
   ======================= */

SET autocommit = 0;

INSERT INTO `Infraestructuras_Agua` (`codigo`, `tipo`, `denominacion`, `municipio`, `provincia`, `latitud`, `longitud`, `estado`) VALUES
('BR-10000', 'BOCA_RIEGO', 'Boca Riego 12', '050', 'TERUEL', 40.739751, -1.379699, 'ACTIVO'),
('BR-10093', 'BOCA_RIEGO', 'Boca Riego 1', '051', 'TERUEL', 40.810990, -0.879678, 'ACTIVO'),
('BR-10236', 'BOCA_RIEGO', 'Boca Riego 1', '056', 'TERUEL', 40.900453, -1.080170, 'ACTIVO'),
('BR-10308', 'BOCA_RIEGO', 'Boca Riego 4', '061', 'TERUEL', 40.679230, -0.818400, 'ACTIVO'),
('BR-10335', 'BOCA_RIEGO', 'Boca Riego 1', '065', 'TERUEL', 40.509800, -1.200373, 'ACTIVO'),
('BR-10506', 'BOCA_RIEGO', 'Boca Riego 1', '077', 'TERUEL', 40.430192, -0.320288, 'ACTIVO'),
('BR-10607', 'BOCA_RIEGO', 'Boca Riego 1', '085', 'TERUEL', 40.961390, -1.099860, 'ACTIVO'),
('BR-10951', 'BOCA_RIEGO', 'Boca Riego 1', '109', 'TERUEL', 40.780237, -0.538593, 'ACTIVO'),
('BR-10994', 'BOCA_RIEGO', 'Boca Riego 1', '112', 'TERUEL', 40.690073, -1.709360, 'ACTIVO'),
('BR-11022', 'BOCA_RIEGO', 'Boca Riego 1', '116', 'TERUEL', 40.549635, -1.571160, 'ACTIVO'),
('BR-11083', 'BOCA_RIEGO', 'Boca Riego 1', '119', 'TERUEL', 40.750917, -1.009920, 'ACTIVO'),
('BR-11106', 'BOCA_RIEGO', 'Boca Riego 1', '120', 'TERUEL', 40.471760, -1.161540, 'ACTIVO'),
('BR-11275', 'BOCA_RIEGO', 'Boca Riego 1', '138', 'TERUEL', 41.131850, -0.620940, 'ACTIVO'),
('BR-11296', 'BOCA_RIEGO', 'Boca Riego 1', '141', 'TERUEL', 40.588430, -0.730260, 'ACTIVO'),
('BR-11367', 'BOCA_RIEGO', 'Boca Riego 1', '145', 'TERUEL', 40.390290, -0.560130, 'ACTIVO'),
('BR-11443', 'BOCA_RIEGO', 'Boca Riego 1', '149', 'TERUEL', 40.709200, -1.129810, 'ACTIVO'),
('BR-11463', 'BOCA_RIEGO', 'Boca Riego 1', '153', 'TERUEL', 40.819902, -1.770264, 'ACTIVO'),
('BR-11646', 'BOCA_RIEGO', 'Boca Riego 1', '164', 'TERUEL', 40.649760, -0.960304, 'ACTIVO'),
('BR-11694', 'BOCA_RIEGO', 'Boca Riego 1', '169', 'TERUEL', 40.530017, -0.880400, 'ACTIVO'),
('BR-11857', 'BOCA_RIEGO', 'Boca Riego 1', '180', 'TERUEL', 40.368700, -0.698170, 'ACTIVO'),
('BR-11933', 'BOCA_RIEGO', 'Boca Riego 1', '216', 'TERUEL', 40.488990, -1.212112, 'ACTIVO'),
('BR-11980', 'BOCA_RIEGO', 'Boca Riego 1', '189', 'TERUEL', 40.799990, -1.439090, 'ACTIVO'),
('BR-12188', 'BOCA_RIEGO', 'Boca Riego 1', '200', 'TERUEL', 40.571570, -1.319550, 'ACTIVO'),
('BR-12282', 'BOCA_RIEGO', 'Boca Riego 1', '206', 'TERUEL', 40.410880, -0.659980, 'ACTIVO'),
('BR-12296', 'BOCA_RIEGO', 'Boca Riego 1', '207', 'TERUEL', 40.971320, -1.609810, 'ACTIVO'),
('BR-12315', 'BOCA_RIEGO', 'Boca Riego 1', '210', 'TERUEL', 40.345513, -1.107277, 'ACTIVO'),
('BR-12346', 'BOCA_RIEGO', 'Boca Riego 1', '239', 'TERUEL', 40.311300, -1.019740, 'ACTIVO'),
('BR-12431', 'BOCA_RIEGO', 'Boca Riego 1', '217', 'TERUEL', 40.809500, -1.521890, 'ACTIVO'),
('BR-12453', 'BOCA_RIEGO', 'Boca Riego 1', '219', 'TERUEL', 40.522460, -0.985735, 'ACTIVO'),
('BR-12475', 'BOCA_RIEGO', 'Boca Riego 1', '222', 'TERUEL', 40.608550, -0.330850, 'ACTIVO'),
('BR-12552', 'BOCA_RIEGO', 'Boca Riego 1', '232', 'TERUEL', 40.288690, -1.341880, 'ACTIVO'),
('BR-12686', 'BOCA_RIEGO', 'Boca Riego 1', '234', 'TERUEL', 40.950040, -0.510175, 'ACTIVO'),
('BR-12829', 'BOCA_RIEGO', 'Boca Riego 1', '247', 'TERUEL', 40.618440, -1.280850, 'ACTIVO'),
('BR-12901', 'BOCA_RIEGO', 'Boca Riego 1', '251', 'TERUEL', 40.759440, -0.780315, 'ACTIVO'),
('BR-12943', 'BOCA_RIEGO', 'Boca Riego 1', '258', 'TERUEL', 40.509830, -0.401560, 'ACTIVO'),
('BR-12950', 'BOCA_RIEGO', 'Boca Riego 1', '256', 'TERUEL', 40.909720, -1.819540, 'ACTIVO'),
('BR-13011', 'BOCA_RIEGO', 'Boca Riego 1', '263', 'TERUEL', 40.381620, -1.559610, 'ACTIVO'),
('BR-13147', 'BOCA_RIEGO', 'Boca Riego 20', '009', 'TERUEL', 40.688723, -1.248897, 'ACTIVO'),
('BR-13217', 'BOCA_RIEGO', 'Boca Riego 18', '033', 'TERUEL', 40.701880, -0.608290, 'ACTIVO'),
('BR-13645', 'BOCA_RIEGO', 'Boca Riego 1', '245', 'TERUEL', 40.218870, -1.449980, 'ACTIVO'),
('BR-14138', 'BOCA_RIEGO', 'Boca Riego 1', '005', 'ZARAGOZA', 41.391090, -1.649990, 'ACTIVO'),
('BR-14179', 'BOCA_RIEGO', 'Boca Riego 1', '008', 'ZARAGOZA', 41.510479, -1.589635, 'ACTIVO'),
('BR-14389', 'BOCA_RIEGO', 'Boca Riego 1', '010', 'ZARAGOZA', 41.559130, -0.610810, 'ACTIVO'),
('BR-14431', 'BOCA_RIEGO', 'Boca Riego 1', '013', 'ZARAGOZA', 41.470155, -0.509705, 'ACTIVO'),
('BR-14471', 'BOCA_RIEGO', 'Boca Riego 1', '017', 'ZARAGOZA', 41.449642, -2.120207, 'ACTIVO'),
('BR-14481', 'BOCA_RIEGO', 'Boca Riego 52', '018', 'ZARAGOZA', 41.318210, -1.811400, 'ACTIVO'),
('BR-14640', 'BOCA_RIEGO', 'Boca Riego 1', '019', 'ZARAGOZA', 41.271100, -1.591830, 'ACTIVO'),
('BR-14647', 'BOCA_RIEGO', 'Boca Riego 1', '020', 'ZARAGOZA', 41.760970, -0.520360, 'ACTIVO'),
('BR-14753', 'BOCA_RIEGO', 'Boca Riego 2', '025', 'ZARAGOZA', 41.660625, -1.320650, 'ACTIVO'),
('BR-14800', 'BOCA_RIEGO', 'Boca Riego 14', '027', 'ZARAGOZA', 41.719770, -1.118560, 'ACTIVO'),
('BR-14862', 'BOCA_RIEGO', 'Boca Riego 1', '028', 'ZARAGOZA', 41.580980, -1.649180, 'ACTIVO'),
('BR-14926', 'BOCA_RIEGO', 'Boca Riego 8', '033', 'ZARAGOZA', 41.408680, -1.029080, 'ACTIVO'),
('BR-14927', 'BOCA_RIEGO', 'Boca Riego 2', '034', 'ZARAGOZA', 41.221220, -1.460170, 'ACTIVO'),
('BR-14990', 'BOCA_RIEGO', 'Boca Riego 1', '037', 'ZARAGOZA', 41.551250, -1.820460, 'ACTIVO'),
('BR-15082', 'BOCA_RIEGO', 'Boca Riego 4', '043', 'ZARAGOZA', 41.700240, -0.979577, 'ACTIVO'),
('BR-15202', 'BOCA_RIEGO', 'Boca Riego 8', '053', 'ZARAGOZA', 41.490800, -1.710205, 'ACTIVO'),
('BR-15211', 'BOCA_RIEGO', 'Boca Riego 2', '055', 'ZARAGOZA', 41.620458, -1.549373, 'ACTIVO'),
('BR-15272', 'BOCA_RIEGO', 'Boca Riego 2', '052', 'ZARAGOZA', 41.380360, -0.868520, 'ACTIVO'),
('BR-15339', 'BOCA_RIEGO', 'Boca Riego 1', '056', 'ZARAGOZA', 41.460195, -0.829845, 'ACTIVO'),
('BR-15347', 'BOCA_RIEGO', 'Boca Riego 20', '057', 'ZARAGOZA', 41.530385, -0.359885, 'ACTIVO'),
('BR-15493', 'BOCA_RIEGO', 'Boca Riego 1', '062', 'ZARAGOZA', 41.919923, -0.869628, 'ACTIVO'),
('BR-15506', 'BOCA_RIEGO', 'Boca Riego 2', '063', 'ZARAGOZA', 41.328570, -1.160160, 'ACTIVO'),
('BR-15512', 'BOCA_RIEGO', 'Boca Riego 1', '064', 'ZARAGOZA', 41.258530, -1.279880, 'ACTIVO'),
('BR-15533', 'BOCA_RIEGO', 'Boca Riego 1', '065', 'ZARAGOZA', 41.381600, -2.009290, 'ACTIVO'),
('BR-15543', 'BOCA_RIEGO', 'Boca Riego 100', '067', 'ZARAGOZA', 41.680004, -1.969665, 'ACTIVO'),
('BR-15544', 'BOCA_RIEGO', 'Boca Riego 2', '066', 'ZARAGOZA', 41.115523, -1.574060, 'ACTIVO'),
('BR-15781', 'BOCA_RIEGO', 'Boca Riego 27', '074', 'ZARAGOZA', 41.500710, -0.269120, 'ACTIVO'),
('BR-15932', 'BOCA_RIEGO', 'Boca Riego 1', '076', 'ZARAGOZA', 41.980510, -0.588390, 'ACTIVO'),
('BR-15945', 'BOCA_RIEGO', 'Boca Riego 1', '078', 'ZARAGOZA', 41.480175, -2.070220, 'ACTIVO'),
('BR-16153', 'BOCA_RIEGO', 'Boca Riego 1', '094', 'ZARAGOZA', 41.649813, -0.280790, 'ACTIVO'),
('BR-16235', 'BOCA_RIEGO', 'Boca Riego 1', '095', 'ZARAGOZA', 41.790740, -0.359286, 'ACTIVO'),
('BR-16604', 'BOCA_RIEGO', 'Boca Riego 15', '099', 'ZARAGOZA', 41.871017, -1.209610, 'ACTIVO'),
('BR-16798', 'BOCA_RIEGO', 'Boca Riego 1', '104', 'ZARAGOZA', 41.568080, -0.941390, 'ACTIVO'),
('BR-16804', 'BOCA_RIEGO', 'Boca Riego 1', '107', 'ZARAGOZA', 41.609856, -0.799913, 'ACTIVO'),
('BR-16914', 'BOCA_RIEGO', 'Boca Riego 1', '111', 'ZARAGOZA', 41.418010, -1.370200, 'ACTIVO'),
('BR-17003', 'BOCA_RIEGO', 'Boca Riego 1', '115', 'ZARAGOZA', 41.709655, -1.490000, 'ACTIVO'),
('BR-17058', 'BOCA_RIEGO', 'Boca Riego 1', '117', 'ZARAGOZA', 41.620810, -1.190180, 'ACTIVO'),
('BR-17077', 'BOCA_RIEGO', 'Boca Riego 13', '132', 'ZARAGOZA', 41.310950, -1.720040, 'ACTIVO'),
('BR-17179', 'BOCA_RIEGO', 'Boca Riego 1', '123', 'ZARAGOZA', 41.820750, -1.538300, 'ACTIVO'),
('BR-17189', 'BOCA_RIEGO', 'Boca Riego 1', '124', 'ZARAGOZA', 41.350895, -1.318885, 'ACTIVO'),
('BR-17269', 'BOCA_RIEGO', 'Boca Riego 1', '128', 'ZARAGOZA', 41.289700, -1.619820, 'ACTIVO'),
('BR-17332', 'BOCA_RIEGO', 'Boca Riego 1', '133', 'ZARAGOZA', 41.638660, -1.730770, 'ACTIVO'),
('BR-17340', 'BOCA_RIEGO', 'Boca Riego 1', '136', 'ZARAGOZA', 41.521000, -1.079720, 'ACTIVO'),
('BR-17385', 'BOCA_RIEGO', 'Boca Riego 1', '137', 'ZARAGOZA', 41.888880, -0.400045, 'ACTIVO'),
('BR-17414', 'BOCA_RIEGO', 'Boca Riego 1', '140', 'ZARAGOZA', 41.429150, -1.831500, 'ACTIVO'),
('BR-17457', 'BOCA_RIEGO', 'Boca Riego 1', '146', 'ZARAGOZA', 41.691260, -0.709600, 'ACTIVO'),
('BR-17481', 'BOCA_RIEGO', 'Boca Riego 33', '147', 'ZARAGOZA', 41.299070, -0.950975, 'ACTIVO'),
('BR-17543', 'BOCA_RIEGO', 'Boca Riego 1', '148', 'ZARAGOZA', 41.729290, -0.221000, 'ACTIVO'),
('BR-17608', 'BOCA_RIEGO', 'Boca Riego 1', '151', 'ZARAGOZA', 41.850258, -0.619860, 'ACTIVO'),
('BR-17682', 'BOCA_RIEGO', 'Boca Riego 1', '153', 'ZARAGOZA', 41.461380, -1.551030, 'ACTIVO'),
('BR-17760', 'BOCA_RIEGO', 'Boca Riego 1', '155', 'ZARAGOZA', 41.540360, -1.289900, 'ACTIVO'),
('BR-17786', 'BOCA_RIEGO', 'Boca Riego 2', '157', 'ZARAGOZA', 41.499580, -1.420760, 'ACTIVO'),
('BR-17881', 'BOCA_RIEGO', 'Boca Riego 2', '160', 'ZARAGOZA', 41.409527, -1.690298, 'ACTIVO'),
('BR-17936', 'BOCA_RIEGO', 'Boca Riego 1', '162', 'ZARAGOZA', 41.571085, -2.129885, 'ACTIVO'),
('BR-17964', 'BOCA_RIEGO', 'Boca Riego 1', '163', 'ZARAGOZA', 41.580620, -1.380067, 'ACTIVO'),
('BR-18095', 'BOCA_RIEGO', 'Boca Riego 2', '169', 'ZARAGOZA', 41.950505, -1.679970, 'ACTIVO'),
('BR-18118', 'BOCA_RIEGO', 'Boca Riego 6', '173', 'ZARAGOZA', 41.368270, -1.500230, 'ACTIVO'),
('BR-18171', 'BOCA_RIEGO', 'Boca Riego 2', '175', 'ZARAGOZA', 41.508597, -0.690893, 'ACTIVO'),
('BR-18202', 'BOCA_RIEGO', 'Boca Riego 1', '176', 'ZARAGOZA', 41.628735, -0.459430, 'ACTIVO'),
('BR-18226', 'BOCA_RIEGO', 'Boca Riego 2', '177', 'ZARAGOZA', 41.858375, -1.019015, 'ACTIVO'),
('BR-18333', 'BOCA_RIEGO', 'Boca Riego 1', '182', 'ZARAGOZA', 41.479710, -0.910390, 'ACTIVO'),
('BR-18608', 'BOCA_RIEGO', 'Boca Riego 1', '190', 'ZARAGOZA', 41.341880, -1.428560, 'ACTIVO'),
('BR-18763', 'BOCA_RIEGO', 'Boca Riego 1', '197', 'ZARAGOZA', 41.358050, -0.739120, 'ACTIVO'),
('BR-18840', 'BOCA_RIEGO', 'Boca Riego 35', '203', 'ZARAGOZA', 41.810093, -0.829924, 'ACTIVO'),
('BR-18896', 'BOCA_RIEGO', 'Boca Riego 1', '204', 'ZARAGOZA', 41.779560, -1.319675, 'ACTIVO'),
('BR-18990', 'BOCA_RIEGO', 'Boca Riego 1', '206', 'ZARAGOZA', 41.649170, -0.889320, 'ACTIVO'),
('BR-19087', 'BOCA_RIEGO', 'Boca Riego 1', '209', 'ZARAGOZA', 41.589917, -0.549687, 'ACTIVO'),
('BR-19230', 'BOCA_RIEGO', 'Boca Riego 5', '218', 'ZARAGOZA', 41.489717, -0.430587, 'ACTIVO'),
('BR-19287', 'BOCA_RIEGO', 'Boca Riego 2', '219', 'ZARAGOZA', 41.648639, -0.889039, 'ACTIVO'),
('BR-19377', 'BOCA_RIEGO', 'Boca Riego 12', '223', 'ZARAGOZA', 41.519360, -0.931380, 'ACTIVO'),
('BR-19633', 'BOCA_RIEGO', 'Boca Riego 1', '232', 'ZARAGOZA', 41.411147, -1.009358, 'ACTIVO'),
('BR-19683', 'BOCA_RIEGO', 'Boca Riego 1', '235', 'ZARAGOZA', 41.550760, -0.749670, 'ACTIVO'),
('BR-19725', 'BOCA_RIEGO', 'Boca Riego 2', '240', 'ZARAGOZA', 41.469830, -0.350555, 'ACTIVO'),
('BR-19754', 'BOCA_RIEGO', 'Boca Riego 1', '236', 'ZARAGOZA', 41.840260, -0.181130, 'ACTIVO'),
('BR-19897', 'BOCA_RIEGO', 'Boca Riego 1', '247', 'ZARAGOZA', 41.751280, -0.648140, 'ACTIVO'),
('BR-20057', 'BOCA_RIEGO', 'Boca Riego 3', '251', 'ZARAGOZA', 41.570179, -0.699982, 'ACTIVO'),
('BR-20415', 'BOCA_RIEGO', 'Boca Riego 2', '262', 'ZARAGOZA', 41.808910, -0.390840, 'ACTIVO'),
('BR-20560', 'BOCA_RIEGO', 'Boca Riego 3', '268', 'ZARAGOZA', 41.320260, -2.090907, 'ACTIVO'),
('BR-20602', 'BOCA_RIEGO', 'Boca Riego 1', '272', 'ZARAGOZA', 41.239688, -1.859949, 'ACTIVO'),
('BR-20864', 'BOCA_RIEGO', 'Boca Riego 2', '284', 'ZARAGOZA', 41.909320, -1.340444, 'ACTIVO'),
('BR-20936', 'BOCA_RIEGO', 'Boca Riego 1', '288', 'ZARAGOZA', 41.770173, -0.870887, 'ACTIVO'),
('BR-20949', 'BOCA_RIEGO', 'Boca Riego 5', '290', 'ZARAGOZA', 41.738750, -1.061515, 'ACTIVO'),
('BR-21062', 'BOCA_RIEGO', 'Boca Riego 1', '296', 'ZARAGOZA', 41.490140, -1.220900, 'ACTIVO'),
('BR-21096', 'BOCA_RIEGO', 'Boca Riego 9', '298', 'ZARAGOZA', 41.530767, -0.839918, 'ACTIVO'),
('BR-21288', 'BOCA_RIEGO', 'Boca Riego 1', '902', 'ZARAGOZA', 41.688740, -0.781790, 'ACTIVO'),
('BR-21337', 'BOCA_RIEGO', 'Boca Riego 1', '903', 'ZARAGOZA', 41.720450, -0.749990, 'ACTIVO'),
('BR-22014', 'BOCA_RIEGO', 'Boca Riego 1', '185', 'ZARAGOZA', 41.971980, -1.179880, 'ACTIVO'),
('BR-9102', 'BOCA_RIEGO', 'Boca Riego 1', '006', 'TERUEL', 40.918620, -1.360810, 'ACTIVO'),
('BR-9222', 'BOCA_RIEGO', 'Boca Riego 1', '003', 'TERUEL', 40.543255, -0.723365, 'ACTIVO'),
('BR-9267', 'BOCA_RIEGO', 'Boca Riego 1', '005', 'TERUEL', 40.366080, -1.389840, 'ACTIVO'),
('BR-9459', 'BOCA_RIEGO', 'Boca Riego 1', '054', 'TERUEL', 40.338815, -0.970560, 'ACTIVO'),
('BR-9494', 'BOCA_RIEGO', 'Boca Riego 1', '016', 'TERUEL', 40.548540, -0.680190, 'ACTIVO'),
('BR-9578', 'BOCA_RIEGO', 'Boca Riego 1', '018', 'TERUEL', 40.501776, -1.485251, 'ACTIVO'),
('BR-9583', 'BOCA_RIEGO', 'Boca Riego 1', '019', 'TERUEL', 40.720003, -1.550043, 'ACTIVO'),
('BR-9632', 'BOCA_RIEGO', 'Boca Riego 1', '023', 'TERUEL', 40.621940, -0.521610, 'ACTIVO'),
('BR-9643', 'BOCA_RIEGO', 'Boca Riego 1', '025', 'TERUEL', 40.439713, -0.419935, 'ACTIVO'),
('BR-9751', 'BOCA_RIEGO', 'Boca Riego 1', '032', 'TERUEL', 40.931100, -1.510230, 'ACTIVO'),
('BR-9792', 'BOCA_RIEGO', 'Boca Riego 1', '034', 'TERUEL', 40.321390, -1.331330, 'ACTIVO'),
('BR-9800', 'BOCA_RIEGO', 'Boca Riego 1', '035', 'TERUEL', 40.869940, -1.231150, 'ACTIVO'),
('BR-9807', 'BOCA_RIEGO', 'Boca Riego 1', '036', 'TERUEL', 40.629600, -1.481770, 'ACTIVO'),
('BR-9836', 'BOCA_RIEGO', 'Boca Riego 1', '039', 'TERUEL', 40.619520, -1.158060, 'ACTIVO'),
('BR-9878', 'BOCA_RIEGO', 'Boca Riego 1', '042', 'TERUEL', 40.779060, -1.668860, 'ACTIVO'),
('BR-9940', 'BOCA_RIEGO', 'Boca Riego 1', '046', 'TERUEL', 40.559820, -1.030310, 'ACTIVO'),
('BR-9960', 'BOCA_RIEGO', 'Boca Riego 1', '048', 'TERUEL', 41.081307, -1.418943, 'ACTIVO'),
('BR-9969', 'BOCA_RIEGO', 'Boca Riego 1', '049', 'TERUEL', 40.860170, -0.979010, 'ACTIVO'),
('HI-1000', 'HIDRANTE', 'Hidrante 1', '057', 'ZARAGOZA', 41.531490, -0.361860, 'ACTIVO'),
('HI-1001', 'HIDRANTE', 'Hidrante 2', '057', 'ZARAGOZA', 41.528270, -0.359480, 'ACTIVO'),
('HI-1002', 'HIDRANTE', 'Hidrante 3', '057', 'ZARAGOZA', 41.531680, -0.358010, 'ACTIVO'),
('HI-1003', 'HIDRANTE', 'Hidrante 4', '057', 'ZARAGOZA', 41.530990, -0.360260, 'ACTIVO'),
('HI-1004', 'HIDRANTE', 'Hidrante 5', '057', 'ZARAGOZA', 41.528390, -0.359470, 'ACTIVO'),
('HI-1005', 'HIDRANTE', 'Hidrante 6', '057', 'ZARAGOZA', 41.531490, -0.360230, 'ACTIVO'),
('HI-1006', 'HIDRANTE', 'Hidrante 1', '062', 'ZARAGOZA', 41.920780, -0.868390, 'ACTIVO'),
('HI-1007', 'HIDRANTE', 'Hidrante 2', '062', 'ZARAGOZA', 41.918180, -0.868820, 'ACTIVO'),
('HI-1008', 'HIDRANTE', 'Hidrante 3', '062', 'ZARAGOZA', 41.919170, -0.870500, 'ACTIVO'),
('HI-1009', 'HIDRANTE', 'Hidrante 4', '062', 'ZARAGOZA', 41.918580, -0.869880, 'ACTIVO'),
('HI-1010', 'HIDRANTE', 'Hidrante 5', '062', 'ZARAGOZA', 41.920260, -0.868830, 'ACTIVO'),
('HI-1011', 'HIDRANTE', 'Hidrante 6', '062', 'ZARAGOZA', 41.918680, -0.871680, 'ACTIVO'),
('HI-1012', 'HIDRANTE', 'Hidrante 7', '062', 'ZARAGOZA', 41.921480, -0.869520, 'ACTIVO'),
('HI-1013', 'HIDRANTE', 'Hidrante 8', '062', 'ZARAGOZA', 41.918960, -0.868350, 'ACTIVO'),
('HI-1015', 'HIDRANTE', 'Hidrante 1', '064', 'ZARAGOZA', 41.259020, -1.280980, 'ACTIVO'),
('HI-1016', 'HIDRANTE', 'Hidrante 2', '064', 'ZARAGOZA', 41.258040, -1.278780, 'ACTIVO'),
('HI-1018', 'HIDRANTE', 'Hidrante 1', '066', 'ZARAGOZA', 41.114630, -1.574230, 'ACTIVO'),
('HI-1019', 'HIDRANTE', 'Hidrante 1', '066', 'ZARAGOZA', 41.115380, -1.573650, 'ACTIVO'),
('HI-1020', 'HIDRANTE', 'Hidrante 2', '066', 'ZARAGOZA', 41.116560, -1.574300, 'ACTIVO'),
('HI-1021', 'HIDRANTE', 'Hidrante 1', '067', 'ZARAGOZA', 41.679000, -1.968620, 'ACTIVO'),
('HI-1022', 'HIDRANTE', 'Hidrante 2', '067', 'ZARAGOZA', 41.678800, -1.970460, 'ACTIVO'),
('HI-1023', 'HIDRANTE', 'Hidrante 3', '067', 'ZARAGOZA', 41.679930, -1.971050, 'ACTIVO'),
('HI-1024', 'HIDRANTE', 'Hidrante 4', '067', 'ZARAGOZA', 41.680290, -1.969700, 'ACTIVO'),
('HI-1025', 'HIDRANTE', 'Hidrante 5', '067', 'ZARAGOZA', 41.681970, -1.970820, 'ACTIVO'),
('HI-1026', 'HIDRANTE', 'Hidrante 6', '067', 'ZARAGOZA', 41.681910, -1.969370, 'ACTIVO'),
('HI-1027', 'HIDRANTE', 'Hidrante 7', '067', 'ZARAGOZA', 41.679100, -1.969740, 'ACTIVO'),
('HI-1028', 'HIDRANTE', 'Hidrante 8', '067', 'ZARAGOZA', 41.680740, -1.969020, 'ACTIVO'),
('HI-1029', 'HIDRANTE', 'Hidrante 9', '067', 'ZARAGOZA', 41.678200, -1.969570, 'ACTIVO'),
('HI-1030', 'HIDRANTE', 'Hidrante 10', '067', 'ZARAGOZA', 41.679990, -1.968380, 'ACTIVO'),
('HI-1031', 'HIDRANTE', 'Hidrante 11', '067', 'ZARAGOZA', 41.679140, -1.968800, 'ACTIVO'),
('HI-1032', 'HIDRANTE', 'Hidrante 12', '067', 'ZARAGOZA', 41.680430, -1.970590, 'ACTIVO'),
('HI-1033', 'HIDRANTE', 'Hidrante 13', '067', 'ZARAGOZA', 41.680550, -1.969520, 'ACTIVO'),
('HI-1036', 'HIDRANTE', 'Hidrante 1', '078', 'ZARAGOZA', 41.480590, -2.070760, 'ACTIVO'),
('HI-1037', 'HIDRANTE', 'Hidrante 2', '078', 'ZARAGOZA', 41.479760, -2.069680, 'ACTIVO'),
('HI-1038', 'HIDRANTE', 'Hidrante 1', '094', 'ZARAGOZA', 41.650930, -0.281640, 'ACTIVO'),
('HI-1039', 'HIDRANTE', 'Hidrante 2', '094', 'ZARAGOZA', 41.649180, -0.279010, 'ACTIVO'),
('HI-1040', 'HIDRANTE', 'Hidrante 3', '094', 'ZARAGOZA', 41.648700, -0.281470, 'ACTIVO'),
('HI-1041', 'HIDRANTE', 'Hidrante 1', '095', 'ZARAGOZA', 41.790160, -0.358110, 'ACTIVO'),
('HI-1042', 'HIDRANTE', 'Hidrante 2', '095', 'ZARAGOZA', 41.790120, -0.358350, 'ACTIVO'),
('HI-1043', 'HIDRANTE', 'Hidrante 3', '095', 'ZARAGOZA', 41.791320, -0.360970, 'ACTIVO'),
('HI-1044', 'HIDRANTE', 'Hidrante 4', '095', 'ZARAGOZA', 41.790800, -0.358930, 'ACTIVO'),
('HI-1045', 'HIDRANTE', 'Hidrante 5', '095', 'ZARAGOZA', 41.791300, -0.360070, 'ACTIVO'),
('HI-1046', 'HIDRANTE', 'Hidrante 1', '099', 'ZARAGOZA', 41.870640, -1.208650, 'ACTIVO'),
('HI-1047', 'HIDRANTE', 'Hidrante 2', '099', 'ZARAGOZA', 41.870610, -1.208980, 'ACTIVO'),
('HI-1048', 'HIDRANTE', 'Hidrante 3', '099', 'ZARAGOZA', 41.871800, -1.211200, 'ACTIVO'),
('HI-1050', 'HIDRANTE', 'Hidrante 1', '107', 'ZARAGOZA', 41.608500, -0.799320, 'ACTIVO'),
('HI-1052', 'HIDRANTE', 'Hidrante 1', '240', 'ZARAGOZA', 41.468670, -0.349570, 'ACTIVO'),
('HI-1053', 'HIDRANTE', 'Hidrante 2', '240', 'ZARAGOZA', 41.470990, -0.351540, 'ACTIVO'),
('HI-1055', 'HIDRANTE', 'Hidrante 2', '251', 'ZARAGOZA', 41.568430, -0.701900, 'ACTIVO'),
('HI-1056', 'HIDRANTE', 'Hidrante 4', '251', 'ZARAGOZA', 41.569250, -0.699290, 'ACTIVO'),
('HI-1057', 'HIDRANTE', 'Hidrante 5', '251', 'ZARAGOZA', 41.571830, -0.700410, 'ACTIVO'),
('HI-1058', 'HIDRANTE', 'Hidrante 10', '251', 'ZARAGOZA', 41.570860, -0.701700, 'ACTIVO'),
('HI-1059', 'HIDRANTE', 'Hidrante 11', '251', 'ZARAGOZA', 41.570760, -0.699490, 'ACTIVO'),
('HI-1060', 'HIDRANTE', 'Hidrante 12', '251', 'ZARAGOZA', 41.568410, -0.698910, 'ACTIVO'),
('HI-1061', 'HIDRANTE', 'Hidrante 13', '251', 'ZARAGOZA', 41.571400, -0.699600, 'ACTIVO'),
('HI-1062', 'HIDRANTE', 'Hidrante 14', '251', 'ZARAGOZA', 41.568480, -0.698060, 'ACTIVO'),
('HI-1063', 'HIDRANTE', 'Hidrante 15', '251', 'ZARAGOZA', 41.571130, -0.700610, 'ACTIVO'),
('HI-1064', 'HIDRANTE', 'Hidrante 16', '251', 'ZARAGOZA', 41.569710, -0.700520, 'ACTIVO'),
('HI-1065', 'HIDRANTE', 'Hidrante 17', '251', 'ZARAGOZA', 41.570020, -0.700640, 'ACTIVO'),
('HI-1066', 'HIDRANTE', 'Hidrante 18', '251', 'ZARAGOZA', 41.571400, -0.698710, 'ACTIVO'),
('HI-1067', 'HIDRANTE', 'Hidrante 19', '251', 'ZARAGOZA', 41.568420, -0.698160, 'ACTIVO'),
('HI-1068', 'HIDRANTE', 'Hidrante 20', '251', 'ZARAGOZA', 41.570540, -0.698690, 'ACTIVO'),
('HI-1069', 'HIDRANTE', 'Hidrante 21', '251', 'ZARAGOZA', 41.570830, -0.700260, 'ACTIVO'),
('HI-1070', 'HIDRANTE', 'Hidrante 2', '107', 'ZARAGOZA', 41.610940, -0.798140, 'ACTIVO'),
('HI-1071', 'HIDRANTE', 'Hidrante 7', '251', 'ZARAGOZA', 41.569080, -0.698770, 'ACTIVO'),
('HI-1072', 'HIDRANTE', 'Hidrante 3', '251', 'ZARAGOZA', 41.570150, -0.700070, 'ACTIVO'),
('HI-1073', 'HIDRANTE', 'Hidrante 3', '107', 'ZARAGOZA', 41.609740, -0.799080, 'ACTIVO'),
('HI-1074', 'HIDRANTE', 'Hidrante 4', '107', 'ZARAGOZA', 41.609070, -0.798590, 'ACTIVO'),
('HI-1075', 'HIDRANTE', 'Hidrante 5', '107', 'ZARAGOZA', 41.611320, -0.801650, 'ACTIVO'),
('HI-1076', 'HIDRANTE', 'Hidrante 1', '251', 'ZARAGOZA', 41.571530, -0.701020, 'ACTIVO'),
('HI-1077', 'HIDRANTE', 'Hidrante 1', '268', 'ZARAGOZA', 41.319860, -2.089560, 'ACTIVO'),
('HI-1078', 'HIDRANTE', 'Hidrante 2', '268', 'ZARAGOZA', 41.319520, -2.091890, 'ACTIVO'),
('HI-1079', 'HIDRANTE', 'Hidrante 3', '268', 'ZARAGOZA', 41.321400, -2.091270, 'ACTIVO'),
('HI-1080', 'HIDRANTE', 'Hidrante 1', '272', 'ZARAGOZA', 41.238850, -1.858810, 'ACTIVO'),
('HI-1081', 'HIDRANTE', 'Hidrante 2', '272', 'ZARAGOZA', 41.239360, -1.858480, 'ACTIVO'),
('HI-1082', 'HIDRANTE', 'Hidrante 3', '272', 'ZARAGOZA', 41.240800, -1.860890, 'ACTIVO'),
('HI-1083', 'HIDRANTE', 'Hidrante 5', '272', 'ZARAGOZA', 41.238040, -1.858210, 'ACTIVO'),
('HI-1084', 'HIDRANTE', 'Hidrante 6', '272', 'ZARAGOZA', 41.238340, -1.859120, 'ACTIVO'),
('HI-1085', 'HIDRANTE', 'Hidrante 7', '272', 'ZARAGOZA', 41.239950, -1.858970, 'ACTIVO'),
('HI-1086', 'HIDRANTE', 'Hidrante 8', '272', 'ZARAGOZA', 41.240760, -1.859420, 'ACTIVO'),
('HI-1087', 'HIDRANTE', 'Hidrante 9', '272', 'ZARAGOZA', 41.239960, -1.858830, 'ACTIVO'),
('HI-1088', 'HIDRANTE', 'Hidrante 10', '272', 'ZARAGOZA', 41.238370, -1.861110, 'ACTIVO'),
('HI-1089', 'HIDRANTE', 'Hidrante 12', '272', 'ZARAGOZA', 41.240770, -1.860780, 'ACTIVO'),
('HI-1090', 'HIDRANTE', 'Hidrante 13', '272', 'ZARAGOZA', 41.240330, -1.860110, 'ACTIVO'),
('HI-1091', 'HIDRANTE', 'Hidrante 14', '272', 'ZARAGOZA', 41.240120, -1.860300, 'ACTIVO'),
('HI-1092', 'HIDRANTE', 'Hidrante 15', '272', 'ZARAGOZA', 41.240980, -1.860680, 'ACTIVO'),
('HI-1093', 'HIDRANTE', 'Hidrante 16', '272', 'ZARAGOZA', 41.240810, -1.860920, 'ACTIVO'),
('HI-1094', 'HIDRANTE', 'Hidrante 1', '284', 'ZARAGOZA', 41.909010, -1.341520, 'ACTIVO'),
('HI-1095', 'HIDRANTE', 'Hidrante 2', '284', 'ZARAGOZA', 41.908770, -1.341520, 'ACTIVO'),
('HI-1096', 'HIDRANTE', 'Hidrante 3', '284', 'ZARAGOZA', 41.910140, -1.338950, 'ACTIVO'),
('HI-1097', 'HIDRANTE', 'Hidrante 4', '284', 'ZARAGOZA', 41.908740, -1.341130, 'ACTIVO'),
('HI-1098', 'HIDRANTE', 'Hidrante 5', '284', 'ZARAGOZA', 41.909940, -1.339100, 'ACTIVO'),
('HI-1099', 'HIDRANTE', 'Hidrante 1', '288', 'ZARAGOZA', 41.771910, -0.869900, 'ACTIVO'),
('HI-1100', 'HIDRANTE', 'Hidrante 2', '288', 'ZARAGOZA', 41.769130, -0.871600, 'ACTIVO'),
('HI-1101', 'HIDRANTE', 'Hidrante 1', '290', 'ZARAGOZA', 41.738780, -1.061090, 'ACTIVO'),
('HI-1102', 'HIDRANTE', 'Hidrante 2', '290', 'ZARAGOZA', 41.738720, -1.061940, 'ACTIVO'),
('HI-1104', 'HIDRANTE', 'Hidrante 1', '298', 'ZARAGOZA', 41.531900, -0.839790, 'ACTIVO'),
('HI-1105', 'HIDRANTE', 'Hidrante 2', '298', 'ZARAGOZA', 41.530790, -0.841490, 'ACTIVO'),
('HI-1106', 'HIDRANTE', 'Hidrante 3', '298', 'ZARAGOZA', 41.531470, -0.840040, 'ACTIVO'),
('HI-1107', 'HIDRANTE', 'Hidrante 4', '298', 'ZARAGOZA', 41.531490, -0.839700, 'ACTIVO'),
('HI-1108', 'HIDRANTE', 'Hidrante 6', '298', 'ZARAGOZA', 41.529880, -0.840240, 'ACTIVO'),
('HI-1110', 'HIDRANTE', 'Hidrante 1', '903', 'ZARAGOZA', 41.721760, -0.750090, 'ACTIVO'),
('HI-1111', 'HIDRANTE', 'Hidrante 2', '903', 'ZARAGOZA', 41.721290, -0.750400, 'ACTIVO'),
('HI-1112', 'HIDRANTE', 'Hidrante 3', '903', 'ZARAGOZA', 41.718300, -0.749480, 'ACTIVO'),
('HI-1114', 'HIDRANTE', 'Hidrante 1114', '020', 'ZARAGOZA', 41.760250, -0.520780, 'ACTIVO'),
('HI-1115', 'HIDRANTE', 'Hidrante 1115', '020', 'ZARAGOZA', 41.761980, -0.521530, 'ACTIVO'),
('HI-1116', 'HIDRANTE', 'Hidrante 1116', '020', 'ZARAGOZA', 41.761060, -0.519570, 'ACTIVO'),
('HI-1117', 'HIDRANTE', 'Hidrante 1117', '025', 'ZARAGOZA', 41.661160, -1.321100, 'ACTIVO'),
('HI-1118', 'HIDRANTE', 'Hidrante 1118', '025', 'ZARAGOZA', 41.660090, -1.320200, 'ACTIVO'),
('HI-1120', 'HIDRANTE', 'Hidrante 1120', '034', 'ZARAGOZA', 41.221960, -1.460780, 'ACTIVO'),
('HI-1121', 'HIDRANTE', 'Hidrante 1121', '034', 'ZARAGOZA', 41.220480, -1.459560, 'ACTIVO'),
('HI-1122', 'HIDRANTE', 'Hidrante 6', '107', 'ZARAGOZA', 41.610960, -0.798210, 'ACTIVO'),
('HI-1123', 'HIDRANTE', 'Hidrante 7', '107', 'ZARAGOZA', 41.608830, -0.801160, 'ACTIVO'),
('HI-1124', 'HIDRANTE', 'Hidrante 8', '107', 'ZARAGOZA', 41.610640, -0.801370, 'ACTIVO'),
('HI-1125', 'HIDRANTE', 'Hidrante 9', '107', 'ZARAGOZA', 41.608700, -0.801700, 'ACTIVO'),
('HI-1127', 'HIDRANTE', 'Hidrante 1', '115', 'ZARAGOZA', 41.710380, -1.490830, 'ACTIVO'),
('HI-1128', 'HIDRANTE', 'Hidrante 2', '115', 'ZARAGOZA', 41.708930, -1.489170, 'ACTIVO'),
('HI-1131', 'HIDRANTE', 'Hidrante 1', '124', 'ZARAGOZA', 41.351150, -1.319500, 'ACTIVO'),
('HI-1132', 'HIDRANTE', 'Hidrante 2', '124', 'ZARAGOZA', 41.350640, -1.318270, 'ACTIVO'),
('HI-1134', 'HIDRANTE', 'Hidrante 1', '132', 'ZARAGOZA', 41.310590, -1.718370, 'ACTIVO'),
('HI-1135', 'HIDRANTE', 'Hidrante 1', '132', 'ZARAGOZA', 41.311310, -1.721710, 'ACTIVO'),
('HI-1139', 'HIDRANTE', 'Hidrante 1', '146', 'ZARAGOZA', 41.690750, -0.709200, 'ACTIVO'),
('HI-1140', 'HIDRANTE', 'Hidrante 2', '146', 'ZARAGOZA', 41.691770, -0.710000, 'ACTIVO'),
('HI-1141', 'HIDRANTE', 'Hidrante 1', '147', 'ZARAGOZA', 41.299980, -0.951680, 'ACTIVO'),
('HI-1142', 'HIDRANTE', 'Hidrante 2', '147', 'ZARAGOZA', 41.298160, -0.950270, 'ACTIVO'),
('HI-1144', 'HIDRANTE', 'Hidrante 1', '151', 'ZARAGOZA', 41.848370, -0.618150, 'ACTIVO'),
('HI-1145', 'HIDRANTE', 'Hidrante 2', '151', 'ZARAGOZA', 41.851340, -0.619700, 'ACTIVO'),
('HI-1146', 'HIDRANTE', 'Hidrante 3', '151', 'ZARAGOZA', 41.851800, -0.618000, 'ACTIVO'),
('HI-1147', 'HIDRANTE', 'Hidrante 4', '151', 'ZARAGOZA', 41.850690, -0.620920, 'ACTIVO'),
('HI-1148', 'HIDRANTE', 'Hidrante 5', '151', 'ZARAGOZA', 41.848170, -0.621930, 'ACTIVO'),
('HI-1149', 'HIDRANTE', 'Hidrante 6', '151', 'ZARAGOZA', 41.851680, -0.618550, 'ACTIVO'),
('HI-1150', 'HIDRANTE', 'Hidrante 7', '151', 'ZARAGOZA', 41.850300, -0.619710, 'ACTIVO'),
('HI-1151', 'HIDRANTE', 'Hidrante 8', '151', 'ZARAGOZA', 41.850840, -0.620330, 'ACTIVO'),
('HI-1152', 'HIDRANTE', 'Hidrante 9', '151', 'ZARAGOZA', 41.848460, -0.621920, 'ACTIVO'),
('HI-1153', 'HIDRANTE', 'Hidrante 10', '151', 'ZARAGOZA', 41.849300, -0.618790, 'ACTIVO'),
('HI-1154', 'HIDRANTE', 'Hidrante 11', '151', 'ZARAGOZA', 41.850470, -0.618670, 'ACTIVO'),
('HI-1155', 'HIDRANTE', 'Hidrante 12', '151', 'ZARAGOZA', 41.851680, -0.621650, 'ACTIVO'),
('HI-1159', 'HIDRANTE', 'Hidrante 1', '160', 'ZARAGOZA', 41.409360, -1.690670, 'ACTIVO'),
('HI-1160', 'HIDRANTE', 'Hidrante 2', '160', 'ZARAGOZA', 41.408670, -1.689960, 'ACTIVO'),
('HI-1161', 'HIDRANTE', 'Hidrante 3', '160', 'ZARAGOZA', 41.408460, -1.689960, 'ACTIVO'),
('HI-1162', 'HIDRANTE', 'Hidrante 4', '160', 'ZARAGOZA', 41.411620, -1.690600, 'ACTIVO'),
('HI-1163', 'HIDRANTE', 'Hidrante 1', '162', 'ZARAGOZA', 41.570910, -2.128720, 'ACTIVO'),
('HI-1164', 'HIDRANTE', 'Hidrante 2', '162', 'ZARAGOZA', 41.571260, -2.131050, 'ACTIVO'),
('HI-1165', 'HIDRANTE', 'Hidrante 1', '163', 'ZARAGOZA', 41.578590, -1.381210, 'ACTIVO'),
('HI-1166', 'HIDRANTE', 'Hidrante 2', '163', 'ZARAGOZA', 41.580410, -1.378960, 'ACTIVO'),
('HI-1167', 'HIDRANTE', 'Hidrante 3', '163', 'ZARAGOZA', 41.580620, -1.381290, 'ACTIVO'),
('HI-1168', 'HIDRANTE', 'Hidrante 4', '163', 'ZARAGOZA', 41.581090, -1.380020, 'ACTIVO'),
('HI-1169', 'HIDRANTE', 'Hidrante 5', '163', 'ZARAGOZA', 41.581990, -1.379960, 'ACTIVO'),
('HI-1170', 'HIDRANTE', 'Hidrante 6', '163', 'ZARAGOZA', 41.581020, -1.378960, 'ACTIVO'),
('HI-1171', 'HIDRANTE', 'Hidrante 1', '167', 'ZARAGOZA', 41.669800, -1.608300, 'ACTIVO'),
('HI-1172', 'HIDRANTE', 'Hidrante 2', '167', 'ZARAGOZA', 41.670260, -1.609460, 'ACTIVO'),
('HI-1173', 'HIDRANTE', 'Hidrante 1', '169', 'ZARAGOZA', 41.950500, -1.678540, 'ACTIVO'),
('HI-1174', 'HIDRANTE', 'Hidrante 2', '169', 'ZARAGOZA', 41.950510, -1.681400, 'ACTIVO'),
('HI-1176', 'HIDRANTE', 'Hidrante 1', '175', 'ZARAGOZA', 41.509210, -0.690900, 'ACTIVO'),
('HI-1177', 'HIDRANTE', 'Hidrante 2', '175', 'ZARAGOZA', 41.508220, -0.689970, 'ACTIVO'),
('HI-1178', 'HIDRANTE', 'Hidrante 3', '175', 'ZARAGOZA', 41.508360, -0.691810, 'ACTIVO'),
('HI-1179', 'HIDRANTE', 'Hidrante 1', '176', 'ZARAGOZA', 41.629240, -0.460190, 'ACTIVO'),
('HI-1180', 'HIDRANTE', 'Hidrante 2', '176', 'ZARAGOZA', 41.628230, -0.458670, 'ACTIVO'),
('HI-1181', 'HIDRANTE', 'Hidrante 1', '177', 'ZARAGOZA', 41.858310, -1.018540, 'ACTIVO'),
('HI-1182', 'HIDRANTE', 'Hidrante 2', '177', 'ZARAGOZA', 41.858440, -1.019490, 'ACTIVO'),
('HI-1183', 'HIDRANTE', 'Hidrante 1', '182', 'ZARAGOZA', 41.481170, -0.910310, 'ACTIVO'),
('HI-1184', 'HIDRANTE', 'Hidrante 2', '182', 'ZARAGOZA', 41.478250, -0.910470, 'ACTIVO'),
('HI-1188', 'HIDRANTE', 'Hidrante 1', '203', 'ZARAGOZA', 41.810730, -0.829850, 'ACTIVO'),
('HI-1189', 'HIDRANTE', 'Hidrante 2', '203', 'ZARAGOZA', 41.809070, -0.829440, 'ACTIVO'),
('HI-1190', 'HIDRANTE', 'Hidrante 3', '203', 'ZARAGOZA', 41.808450, -0.830260, 'ACTIVO'),
('HI-1191', 'HIDRANTE', 'Hidrante 4', '203', 'ZARAGOZA', 41.809810, -0.828180, 'ACTIVO'),
('HI-1192', 'HIDRANTE', 'Hidrante 5', '203', 'ZARAGOZA', 41.811500, -0.830950, 'ACTIVO'),
('HI-1193', 'HIDRANTE', 'Hidrante 6', '203', 'ZARAGOZA', 41.810000, -0.831290, 'ACTIVO'),
('HI-1194', 'HIDRANTE', 'Hidrante 7', '203', 'ZARAGOZA', 41.811650, -0.828520, 'ACTIVO'),
('HI-1195', 'HIDRANTE', 'Hidrante 8', '203', 'ZARAGOZA', 41.809190, -0.829440, 'ACTIVO'),
('HI-1196', 'HIDRANTE', 'Hidrante 9', '203', 'ZARAGOZA', 41.810440, -0.831390, 'ACTIVO'),
('HI-1197', 'HIDRANTE', 'Hidrante 1', '204', 'ZARAGOZA', 41.781050, -1.319840, 'ACTIVO'),
('HI-1198', 'HIDRANTE', 'Hidrante 2', '204', 'ZARAGOZA', 41.781110, -1.319880, 'ACTIVO'),
('HI-1199', 'HIDRANTE', 'Hidrante 3', '204', 'ZARAGOZA', 41.778000, -1.320700, 'ACTIVO'),
('HI-1200', 'HIDRANTE', 'Hidrante 4', '204', 'ZARAGOZA', 41.778080, -1.318280, 'ACTIVO'),
('HI-1201', 'HIDRANTE', 'Hidrante 1', '206', 'ZARAGOZA', 41.650310, -0.887770, 'ACTIVO'),
('HI-1202', 'HIDRANTE', 'Hidrante 2', '206', 'ZARAGOZA', 41.648030, -0.890870, 'ACTIVO'),
('HI-1203', 'HIDRANTE', 'Hidrante 1', '209', 'ZARAGOZA', 41.591510, -0.548210, 'ACTIVO'),
('HI-1204', 'HIDRANTE', 'Hidrante 2', '209', 'ZARAGOZA', 41.588280, -0.548960, 'ACTIVO'),
('HI-1205', 'HIDRANTE', 'Hidrante 3', '209', 'ZARAGOZA', 41.591060, -0.551490, 'ACTIVO'),
('HI-1206', 'HIDRANTE', 'Hidrante 1', '209', 'ZARAGOZA', 41.589900, -0.549800, 'ACTIVO'),
('HI-1207', 'HIDRANTE', 'Hidrante 2', '209', 'ZARAGOZA', 41.589060, -0.548510, 'ACTIVO'),
('HI-1208', 'HIDRANTE', 'Hidrante 3', '209', 'ZARAGOZA', 41.589690, -0.551150, 'ACTIVO'),
('HI-1209', 'HIDRANTE', 'Hidrante 1', '218', 'ZARAGOZA', 41.488370, -0.431610, 'ACTIVO'),
('HI-1210', 'HIDRANTE', 'Hidrante 2', '218', 'ZARAGOZA', 41.488800, -0.430750, 'ACTIVO'),
('HI-1211', 'HIDRANTE', 'Hidrante 3', '218', 'ZARAGOZA', 41.491980, -0.429400, 'ACTIVO'),
('HI-1212', 'HIDRANTE', 'Hidrante 1', '219', 'ZARAGOZA', 41.647140, -0.889160, 'ACTIVO'),
('HI-1213', 'HIDRANTE', 'Hidrante 2', '219', 'ZARAGOZA', 41.648960, -0.888180, 'ACTIVO'),
('HI-1214', 'HIDRANTE', 'Hidrante 3', '219', 'ZARAGOZA', 41.647230, -0.888890, 'ACTIVO'),
('HI-1215', 'HIDRANTE', 'Hidrante 4', '219', 'ZARAGOZA', 41.649400, -0.888920, 'ACTIVO'),
('HI-1216', 'HIDRANTE', 'Hidrante 5', '219', 'ZARAGOZA', 41.647680, -0.888740, 'ACTIVO'),
('HI-1217', 'HIDRANTE', 'Hidrante 6', '219', 'ZARAGOZA', 41.650040, -0.891070, 'ACTIVO'),
('HI-1218', 'HIDRANTE', 'Hidrante 7', '219', 'ZARAGOZA', 41.650020, -0.888310, 'ACTIVO'),
('HI-1220', 'HIDRANTE', 'Hidrante 1', '232', 'ZARAGOZA', 41.411830, -1.010650, 'ACTIVO'),
('HI-1221', 'HIDRANTE', 'Hidrante 2', '232', 'ZARAGOZA', 41.411390, -1.009590, 'ACTIVO'),
('HI-1222', 'HIDRANTE', 'Hidrante 3', '232', 'ZARAGOZA', 41.411230, -1.009080, 'ACTIVO'),
('HI-1223', 'HIDRANTE', 'Hidrante 4', '232', 'ZARAGOZA', 41.410140, -1.008110, 'ACTIVO'),
('HI-1224', 'HIDRANTE', 'Hidrante 1', '235', 'ZARAGOZA', 41.549510, -0.749790, 'ACTIVO'),
('HI-1225', 'HIDRANTE', 'Hidrante 2', '235', 'ZARAGOZA', 41.551320, -0.749530, 'ACTIVO'),
('HI-1226', 'HIDRANTE', 'Hidrante 3', '235', 'ZARAGOZA', 41.551450, -0.749690, 'ACTIVO'),
('HI-1227', 'HIDRANTE', 'Hidrante 22', '251', 'ZARAGOZA', 41.570820, -0.701820, 'ACTIVO'),
('HI-1229', 'HIDRANTE', 'Hidrante 4', '272', 'ZARAGOZA', 41.238320, -1.861070, 'ACTIVO'),
('HI-1230', 'HIDRANTE', 'Hidrante 11', '272', 'ZARAGOZA', 41.238400, -1.860890, 'ACTIVO'),
('HI-1231', 'HIDRANTE', 'Hidrante 17', '272', 'ZARAGOZA', 41.240540, -1.860540, 'ACTIVO'),
('HI-1232', 'HIDRANTE', 'Hidrante 3', '288', 'ZARAGOZA', 41.769480, -0.871160, 'ACTIVO'),
('HI-1233', 'HIDRANTE', 'Hidrante 5', '298', 'ZARAGOZA', 41.529070, -0.838250, 'ACTIVO'),
('HI-1234', 'HIDRANTE', 'Hidrante 1234', '020', 'ZARAGOZA', 41.760590, -0.519560, 'ACTIVO'),
('HI-1236', 'HIDRANTE', 'Hidrante 1', '251', 'ZARAGOZA', 41.568650, -0.700480, 'ACTIVO'),
('HI-1237', 'HIDRANTE', 'Hidrante 1237', '251', 'ZARAGOZA', 41.571960, -0.699440, 'ACTIVO'),
('HI-1238', 'HIDRANTE', 'Hidrante 1238', '251', 'ZARAGOZA', 41.570230, -0.699260, 'ACTIVO'),
('HI-1239', 'HIDRANTE', 'Hidrante 1239', '251', 'ZARAGOZA', 41.571370, -0.698900, 'ACTIVO'),
('HI-1240', 'HIDRANTE', 'Hidrante 1240', '251', 'ZARAGOZA', 41.568920, -0.701870, 'ACTIVO'),
('HI-1241', 'HIDRANTE', 'Hidrante 1241', '251', 'ZARAGOZA', 41.569260, -0.700930, 'ACTIVO'),
('HI-1242', 'HIDRANTE', 'Hidrante 1242', '251', 'ZARAGOZA', 41.568840, -0.698230, 'ACTIVO'),
('HI-1243', 'HIDRANTE', 'Hidrante 1243', '251', 'ZARAGOZA', 41.571510, -0.700740, 'ACTIVO'),
('HI-1244', 'HIDRANTE', 'Hidrante 1244', '251', 'ZARAGOZA', 41.570620, -0.700420, 'ACTIVO'),
('HI-1245', 'HIDRANTE', 'Hidrante 1245', '251', 'ZARAGOZA', 41.571660, -0.700160, 'ACTIVO'),
('HI-1246', 'HIDRANTE', 'Hidrante 1246', '251', 'ZARAGOZA', 41.569060, -0.701010, 'ACTIVO'),
('HI-1247', 'HIDRANTE', 'Hidrante 1247', '251', 'ZARAGOZA', 41.570250, -0.700950, 'ACTIVO'),
('HI-1248', 'HIDRANTE', 'Hidrante 1248', '251', 'ZARAGOZA', 41.570340, -0.698410, 'ACTIVO'),
('HI-1249', 'HIDRANTE', 'Hidrante 1249', '137', 'ZARAGOZA', 41.889600, -0.401120, 'ACTIVO'),
('HI-1250', 'HIDRANTE', 'Hidrante 1250', '137', 'ZARAGOZA', 41.888160, -0.398970, 'ACTIVO'),
('HI-1251', 'HIDRANTE', 'Hidrante 1251', '062', 'ZARAGOZA', 41.919880, -0.869390, 'ACTIVO'),
('HI-1252', 'HIDRANTE', 'Hidrante 1252', '062', 'ZARAGOZA', 41.921660, -0.871270, 'ACTIVO'),
('HI-1253', 'HIDRANTE', 'Hidrante 1253', '062', 'ZARAGOZA', 41.920340, -0.869460, 'ACTIVO'),
('HI-1254', 'HIDRANTE', 'Hidrante 1254', '062', 'ZARAGOZA', 41.919970, -0.871640, 'ACTIVO'),
('HI-1255', 'HIDRANTE', 'Hidrante 1255', '062', 'ZARAGOZA', 41.919390, -0.870670, 'ACTIVO'),
('HI-1256', 'HIDRANTE', 'Hidrante 1256', '062', 'ZARAGOZA', 41.920680, -0.868570, 'ACTIVO'),
('HI-1257', 'HIDRANTE', 'Hidrante 1257', '062', 'ZARAGOZA', 41.919320, -0.869230, 'ACTIVO'),
('HI-1258', 'HIDRANTE', 'Hidrante 1258', '062', 'ZARAGOZA', 41.919150, -0.868220, 'ACTIVO'),
('HI-1259', 'HIDRANTE', 'Hidrante 1259', '062', 'ZARAGOZA', 41.921250, -0.869800, 'ACTIVO'),
('HI-1260', 'HIDRANTE', 'Hidrante 1260', '062', 'ZARAGOZA', 41.919820, -0.870740, 'ACTIVO'),
('HI-1261', 'HIDRANTE', 'Hidrante 1261', '062', 'ZARAGOZA', 41.919290, -0.868120, 'ACTIVO'),
('HI-1262', 'HIDRANTE', 'Hidrante 1262', '062', 'ZARAGOZA', 41.919620, -0.869940, 'ACTIVO'),
('HI-1263', 'HIDRANTE', 'Hidrante 1263', '062', 'ZARAGOZA', 41.921950, -0.869370, 'ACTIVO'),
('HI-1264', 'HIDRANTE', 'Hidrante 1264', '062', 'ZARAGOZA', 41.920170, -0.870350, 'ACTIVO'),
('HI-1265', 'HIDRANTE', 'Hidrante 1265', '062', 'ZARAGOZA', 41.918750, -0.870550, 'ACTIVO'),
('HI-1266', 'HIDRANTE', 'Hidrante 1266', '062', 'ZARAGOZA', 41.921030, -0.869500, 'ACTIVO'),
('HI-1267', 'HIDRANTE', 'Hidrante 1267', '062', 'ZARAGOZA', 41.921040, -0.871190, 'ACTIVO'),
('HI-1268', 'HIDRANTE', 'Hidrante 1268', '062', 'ZARAGOZA', 41.920200, -0.868290, 'ACTIVO'),
('HI-1269', 'HIDRANTE', 'Hidrante 1269', '062', 'ZARAGOZA', 41.919750, -0.869210, 'ACTIVO'),
('HI-1270', 'HIDRANTE', 'Hidrante 1270', '062', 'ZARAGOZA', 41.918490, -0.868110, 'ACTIVO'),
('HI-1271', 'HIDRANTE', 'Hidrante 1271', '094', 'ZARAGOZA', 41.650440, -0.281040, 'ACTIVO'),
('HI-291', 'HIDRANTE', 'Hidrante 4', '018', 'TERUEL', 40.501750, -1.484930, 'ACTIVO'),
('HI-292', 'HIDRANTE', 'Hidrante 5', '018', 'TERUEL', 40.500480, -1.486100, 'ACTIVO'),
('HI-293', 'HIDRANTE', 'Hidrante 6', '018', 'TERUEL', 40.501350, -1.484650, 'ACTIVO'),
('HI-294', 'HIDRANTE', 'Hidrante 7', '018', 'TERUEL', 40.500920, -1.486120, 'ACTIVO'),
('HI-295', 'HIDRANTE', 'Hidrante 8', '018', 'TERUEL', 40.500280, -1.484480, 'ACTIVO'),
('HI-296', 'HIDRANTE', 'Hidrante 1', '019', 'TERUEL', 40.718920, -1.548380, 'ACTIVO'),
('HI-297', 'HIDRANTE', 'Hidrante 2', '019', 'TERUEL', 40.721440, -1.551720, 'ACTIVO'),
('HI-298', 'HIDRANTE', 'Hidrante 3', '019', 'TERUEL', 40.718950, -1.549320, 'ACTIVO'),
('HI-299', 'HIDRANTE', 'Hidrante 4', '019', 'TERUEL', 40.718860, -1.551470, 'ACTIVO'),
('HI-300', 'HIDRANTE', 'Hidrante 5', '019', 'TERUEL', 40.721740, -1.549720, 'ACTIVO'),
('HI-301', 'HIDRANTE', 'Hidrante 6', '019', 'TERUEL', 40.719890, -1.548860, 'ACTIVO'),
('HI-302', 'HIDRANTE', 'Hidrante 7', '019', 'TERUEL', 40.721230, -1.551240, 'ACTIVO'),
('HI-303', 'HIDRANTE', 'Hidrante 8', '019', 'TERUEL', 40.718390, -1.550280, 'ACTIVO'),
('HI-304', 'HIDRANTE', 'Hidrante 9', '019', 'TERUEL', 40.719690, -1.550130, 'ACTIVO'),
('HI-305', 'HIDRANTE', 'Hidrante 10', '019', 'TERUEL', 40.720920, -1.549310, 'ACTIVO'),
('HI-307', 'HIDRANTE', 'Hidrante 1', '025', 'TERUEL', 40.439610, -0.420640, 'ACTIVO'),
('HI-308', 'HIDRANTE', 'Hidrante 2', '025', 'TERUEL', 40.441450, -0.421010, 'ACTIVO'),
('HI-309', 'HIDRANTE', 'Hidrante 3', '025', 'TERUEL', 40.438760, -0.420210, 'ACTIVO'),
('HI-310', 'HIDRANTE', 'Hidrante 4', '025', 'TERUEL', 40.439690, -0.420890, 'ACTIVO'),
('HI-311', 'HIDRANTE', 'Hidrante 5', '025', 'TERUEL', 40.439000, -0.418310, 'ACTIVO'),
('HI-312', 'HIDRANTE', 'Hidrante 6', '025', 'TERUEL', 40.439770, -0.418550, 'ACTIVO'),
('HI-313', 'HIDRANTE', 'Hidrante 1', '032', 'TERUEL', 40.930200, -1.511800, 'ACTIVO'),
('HI-314', 'HIDRANTE', 'Hidrante 2', '032', 'TERUEL', 40.932000, -1.508660, 'ACTIVO'),
('HI-322', 'HIDRANTE', 'Hidrante 1', '048', 'TERUEL', 41.081830, -1.418020, 'ACTIVO'),
('HI-323', 'HIDRANTE', 'Hidrante 2', '048', 'TERUEL', 41.080220, -1.419130, 'ACTIVO'),
('HI-325', 'HIDRANTE', 'Hidrante 3', '048', 'TERUEL', 41.081870, -1.419680, 'ACTIVO'),
('HI-327', 'HIDRANTE', 'Hidrante 1', '050', 'TERUEL', 40.738230, -1.379660, 'ACTIVO'),
('HI-328', 'HIDRANTE', 'Hidrante 2', '050', 'TERUEL', 40.740010, -1.378590, 'ACTIVO'),
('HI-329', 'HIDRANTE', 'Hidrante 3', '050', 'TERUEL', 40.738630, -1.378160, 'ACTIVO'),
('HI-330', 'HIDRANTE', 'Hidrante 4', '050', 'TERUEL', 40.738320, -1.381260, 'ACTIVO'),
('HI-331', 'HIDRANTE', 'Hidrante 5', '050', 'TERUEL', 40.740380, -1.379300, 'ACTIVO'),
('HI-332', 'HIDRANTE', 'Hidrante 6', '050', 'TERUEL', 40.738940, -1.381520, 'ACTIVO'),
('HI-333', 'HIDRANTE', 'Hidrante 1', '050', 'TERUEL', 40.741560, -1.381020, 'ACTIVO'),
('HI-334', 'HIDRANTE', 'Hidrante 2', '050', 'TERUEL', 40.740380, -1.379520, 'ACTIVO'),
('HI-335', 'HIDRANTE', 'Hidrante 3', '050', 'TERUEL', 40.739680, -1.379670, 'ACTIVO'),
('HI-336', 'HIDRANTE', 'Hidrante 4', '050', 'TERUEL', 40.740090, -1.378260, 'ACTIVO'),
('HI-337', 'HIDRANTE', 'Hidrante 5', '050', 'TERUEL', 40.738820, -1.379140, 'ACTIVO'),
('HI-338', 'HIDRANTE', 'Hidrante 6', '050', 'TERUEL', 40.738950, -1.380420, 'ACTIVO'),
('HI-339', 'HIDRANTE', 'Hidrante 7', '050', 'TERUEL', 40.740690, -1.380800, 'ACTIVO'),
('HI-340', 'HIDRANTE', 'Hidrante 8', '050', 'TERUEL', 40.739260, -1.378990, 'ACTIVO'),
('HI-341', 'HIDRANTE', 'Hidrante 9', '050', 'TERUEL', 40.738290, -1.380170, 'ACTIVO'),
('HI-342', 'HIDRANTE', 'Hidrante 10', '050', 'TERUEL', 40.741990, -1.378020, 'ACTIVO'),
('HI-343', 'HIDRANTE', 'Hidrante 11', '050', 'TERUEL', 40.738290, -1.381150, 'ACTIVO'),
('HI-344', 'HIDRANTE', 'Hidrante 12', '050', 'TERUEL', 40.741520, -1.378480, 'ACTIVO'),
('HI-346', 'HIDRANTE', 'Hidrante 14', '050', 'TERUEL', 40.739480, -1.381370, 'ACTIVO'),
('HI-347', 'HIDRANTE', 'Hidrante 1', '051', 'TERUEL', 40.811330, -0.879190, 'ACTIVO'),
('HI-348', 'HIDRANTE', 'Hidrante 2', '051', 'TERUEL', 40.810450, -0.878050, 'ACTIVO'),
('HI-349', 'HIDRANTE', 'Hidrante 3', '051', 'TERUEL', 40.810620, -0.881970, 'ACTIVO'),
('HI-350', 'HIDRANTE', 'Hidrante 4', '051', 'TERUEL', 40.811270, -0.880800, 'ACTIVO'),
('HI-351', 'HIDRANTE', 'Hidrante 5', '051', 'TERUEL', 40.810650, -0.878240, 'ACTIVO'),
('HI-352', 'HIDRANTE', 'Hidrante 6', '051', 'TERUEL', 40.811620, -0.879820, 'ACTIVO'),
('HI-353', 'HIDRANTE', 'Hidrante 1', '054', 'TERUEL', 40.338540, -0.971540, 'ACTIVO'),
('HI-354', 'HIDRANTE', 'Hidrante 2', '054', 'TERUEL', 40.339090, -0.969580, 'ACTIVO'),
('HI-355', 'HIDRANTE', 'Hidrante 1', '056', 'TERUEL', 40.900870, -1.081190, 'ACTIVO'),
('HI-356', 'HIDRANTE', 'Hidrante 2', '056', 'TERUEL', 40.900540, -1.080940, 'ACTIVO'),
('HI-357', 'HIDRANTE', 'Hidrante 1', '056', 'TERUEL', 40.899950, -1.078380, 'ACTIVO'),
('HI-358', 'HIDRANTE', 'Hidrante 1', '065', 'TERUEL', 40.511380, -1.201630, 'ACTIVO'),
('HI-359', 'HIDRANTE', 'Hidrante 2', '065', 'TERUEL', 40.509690, -1.200890, 'ACTIVO'),
('HI-360', 'HIDRANTE', 'Hidrante 3', '065', 'TERUEL', 40.508010, -1.198920, 'ACTIVO'),
('HI-361', 'HIDRANTE', 'Hidrante 4', '065', 'TERUEL', 40.510550, -1.200950, 'ACTIVO'),
('HI-362', 'HIDRANTE', 'Hidrante 5', '065', 'TERUEL', 40.510960, -1.199790, 'ACTIVO'),
('HI-363', 'HIDRANTE', 'Hidrante 6', '065', 'TERUEL', 40.509710, -1.201960, 'ACTIVO'),
('HI-364', 'HIDRANTE', 'Hidrante 7', '065', 'TERUEL', 40.508300, -1.198470, 'ACTIVO'),
('HI-365', 'HIDRANTE', 'Hidrante 1', '077', 'TERUEL', 40.431340, -0.319670, 'ACTIVO'),
('HI-366', 'HIDRANTE', 'Hidrante 2', '077', 'TERUEL', 40.428590, -0.321490, 'ACTIVO'),
('HI-368', 'HIDRANTE', 'Hidrante 1', '085', 'TERUEL', 40.961180, -1.098560, 'ACTIVO'),
('HI-369', 'HIDRANTE', 'Hidrante 1', '085', 'TERUEL', 40.961600, -1.101160, 'ACTIVO'),
('HI-370', 'HIDRANTE', 'Hidrante 1', '101', 'TERUEL', 40.889000, -1.381590, 'ACTIVO'),
('HI-371', 'HIDRANTE', 'Hidrante 1', '102', 'TERUEL', 40.481120, -0.548460, 'ACTIVO'),
('HI-372', 'HIDRANTE', 'Hidrante 1', '109', 'TERUEL', 40.779630, -0.539520, 'ACTIVO'),
('HI-373', 'HIDRANTE', 'Hidrante 2', '109', 'TERUEL', 40.778620, -0.538280, 'ACTIVO'),
('HI-374', 'HIDRANTE', 'Hidrante 3', '109', 'TERUEL', 40.781460, -0.538100, 'ACTIVO'),
('HI-375', 'HIDRANTE', 'Hidrante 4', '109', 'TERUEL', 40.781240, -0.538470, 'ACTIVO'),
('HI-376', 'HIDRANTE', 'Hidrante 1', '111', 'TERUEL', 40.318100, -0.809050, 'ACTIVO'),
('HI-377', 'HIDRANTE', 'Hidrante 2', '111', 'TERUEL', 40.319330, -0.808280, 'ACTIVO'),
('HI-378', 'HIDRANTE', 'Hidrante 3', '111', 'TERUEL', 40.321210, -0.808540, 'ACTIVO'),
('HI-379', 'HIDRANTE', 'Hidrante 4', '111', 'TERUEL', 40.321240, -0.810930, 'ACTIVO'),
('HI-380', 'HIDRANTE', 'Hidrante 5', '111', 'TERUEL', 40.321150, -0.811570, 'ACTIVO'),
('HI-381', 'HIDRANTE', 'Hidrante 1', '112', 'TERUEL', 40.691490, -1.708570, 'ACTIVO'),
('HI-382', 'HIDRANTE', 'Hidrante 2', '112', 'TERUEL', 40.688890, -1.708730, 'ACTIVO'),
('HI-383', 'HIDRANTE', 'Hidrante 3', '112', 'TERUEL', 40.689840, -1.710780, 'ACTIVO'),
('HI-384', 'HIDRANTE', 'Hidrante 1', '116', 'TERUEL', 40.551180, -1.571090, 'ACTIVO'),
('HI-385', 'HIDRANTE', 'Hidrante 2', '116', 'TERUEL', 40.548090, -1.571230, 'ACTIVO'),
('HI-386', 'HIDRANTE', 'Hidrante 1', '119', 'TERUEL', 40.749310, -1.008540, 'ACTIVO'),
('HI-387', 'HIDRANTE', 'Hidrante 2', '119', 'TERUEL', 40.751870, -1.010880, 'ACTIVO'),
('HI-388', 'HIDRANTE', 'Hidrante 3', '119', 'TERUEL', 40.750570, -1.010400, 'ACTIVO'),
('HI-389', 'HIDRANTE', 'Hidrante 4', '119', 'TERUEL', 40.751920, -1.009860, 'ACTIVO'),
('HI-391', 'HIDRANTE', 'Hidrante 1', '133', 'TERUEL', 41.031880, -0.861290, 'ACTIVO'),
('HI-394', 'HIDRANTE', 'Hidrante 1', '145', 'TERUEL', 40.390910, -0.560750, 'ACTIVO'),
('HI-395', 'HIDRANTE', 'Hidrante 2', '145', 'TERUEL', 40.390420, -0.559950, 'ACTIVO'),
('HI-396', 'HIDRANTE', 'Hidrante 3', '145', 'TERUEL', 40.389540, -0.559690, 'ACTIVO'),
('HI-397', 'HIDRANTE', 'Hidrante 1', '150', 'TERUEL', 40.939020, -0.759160, 'ACTIVO'),
('HI-398', 'HIDRANTE', 'Hidrante 2', '150', 'TERUEL', 40.938010, -0.758300, 'ACTIVO'),
('HI-399', 'HIDRANTE', 'Hidrante 3', '150', 'TERUEL', 40.940150, -0.759120, 'ACTIVO'),
('HI-400', 'HIDRANTE', 'Hidrante 4', '150', 'TERUEL', 40.940970, -0.759320, 'ACTIVO'),
('HI-401', 'HIDRANTE', 'Hidrante 5', '150', 'TERUEL', 40.939460, -0.761720, 'ACTIVO'),
('HI-402', 'HIDRANTE', 'Hidrante 1', '153', 'TERUEL', 40.820660, -1.770680, 'ACTIVO'),
('HI-403', 'HIDRANTE', 'Hidrante 2', '153', 'TERUEL', 40.819260, -1.768610, 'ACTIVO'),
('HI-404', 'HIDRANTE', 'Hidrante 3', '077', 'TERUEL', 40.430880, -0.320800, 'ACTIVO'),
('HI-405', 'HIDRANTE', 'Hidrante 4', '077', 'TERUEL', 40.429240, -0.320370, 'ACTIVO'),
('HI-406', 'HIDRANTE', 'Hidrante 5', '077', 'TERUEL', 40.429610, -0.320820, 'ACTIVO'),
('HI-407', 'HIDRANTE', 'Hidrante 6', '077', 'TERUEL', 40.428510, -0.320320, 'ACTIVO'),
('HI-408', 'HIDRANTE', 'Hidrante 7', '077', 'TERUEL', 40.431760, -0.319290, 'ACTIVO'),
('HI-409', 'HIDRANTE', 'Hidrante 8', '077', 'TERUEL', 40.431610, -0.319540, 'ACTIVO'),
('HI-411', 'HIDRANTE', 'Hidrante 3', '153', 'TERUEL', 40.818000, -1.770850, 'ACTIVO'),
('HI-412', 'HIDRANTE', 'Hidrante 4', '153', 'TERUEL', 40.819720, -1.769680, 'ACTIVO'),
('HI-413', 'HIDRANTE', 'Hidrante 5', '153', 'TERUEL', 40.820620, -1.770140, 'ACTIVO'),
('HI-414', 'HIDRANTE', 'Hidrante 6', '153', 'TERUEL', 40.819770, -1.771150, 'ACTIVO'),
('HI-415', 'HIDRANTE', 'Hidrante 7', '153', 'TERUEL', 40.819890, -1.768400, 'ACTIVO'),
('HI-416', 'HIDRANTE', 'Hidrante 8', '153', 'TERUEL', 40.821180, -1.771320, 'ACTIVO'),
('HI-417', 'HIDRANTE', 'Hidrante 9', '153', 'TERUEL', 40.818340, -1.769940, 'ACTIVO'),
('HI-418', 'HIDRANTE', 'Hidrante 10', '153', 'TERUEL', 40.820530, -1.770660, 'ACTIVO'),
('HI-419', 'HIDRANTE', 'Hidrante 11', '153', 'TERUEL', 40.821270, -1.769000, 'ACTIVO'),
('HI-420', 'HIDRANTE', 'Hidrante 12', '153', 'TERUEL', 40.820690, -1.771100, 'ACTIVO'),
('HI-421', 'HIDRANTE', 'Hidrante 13', '153', 'TERUEL', 40.818800, -1.771900, 'ACTIVO'),
('HI-422', 'HIDRANTE', 'Hidrante 1', '164', 'TERUEL', 40.648980, -0.960100, 'ACTIVO'),
('HI-423', 'HIDRANTE', 'Hidrante 2', '164', 'TERUEL', 40.651400, -0.961710, 'ACTIVO'),
('HI-424', 'HIDRANTE', 'Hidrante 3', '164', 'TERUEL', 40.649660, -0.959480, 'ACTIVO'),
('HI-425', 'HIDRANTE', 'Hidrante 4', '164', 'TERUEL', 40.648780, -0.959210, 'ACTIVO'),
('HI-426', 'HIDRANTE', 'Hidrante 5', '164', 'TERUEL', 40.649980, -0.961020, 'ACTIVO'),
('HI-427', 'HIDRANTE', 'Hidrante 1', '169', 'TERUEL', 40.530620, -0.881980, 'ACTIVO'),
('HI-428', 'HIDRANTE', 'Hidrante 2', '169', 'TERUEL', 40.531000, -0.878920, 'ACTIVO'),
('HI-429', 'HIDRANTE', 'Hidrante 1', '169', 'TERUEL', 40.528430, -0.880300, 'ACTIVO'),
('HI-431', 'HIDRANTE', 'Hidrante 1', '189', 'TERUEL', 40.800070, -1.441800, 'ACTIVO'),
('HI-432', 'HIDRANTE', 'Hidrante 2', '189', 'TERUEL', 40.799000, -1.438610, 'ACTIVO'),
('HI-433', 'HIDRANTE', 'Hidrante 3', '189', 'TERUEL', 40.799830, -1.438790, 'ACTIVO'),
('HI-434', 'HIDRANTE', 'Hidrante 4', '189', 'TERUEL', 40.800670, -1.438050, 'ACTIVO'),
('HI-435', 'HIDRANTE', 'Hidrante 5', '189', 'TERUEL', 40.800380, -1.438200, 'ACTIVO'),
('HI-439', 'HIDRANTE', 'Hidrante 1', '208', 'TERUEL', 40.661590, -1.359030, 'ACTIVO'),
('HI-440', 'HIDRANTE', 'Hidrante 1', '216', 'TERUEL', 40.488900, -1.212960, 'ACTIVO'),
('HI-441', 'HIDRANTE', 'Hidrante 1', '216', 'TERUEL', 40.487990, -1.211450, 'ACTIVO'),
('HI-442', 'HIDRANTE', 'Hidrante 2', '216', 'TERUEL', 40.490060, -1.211910, 'ACTIVO'),
('HI-443', 'HIDRANTE', 'Hidrante 3', '216', 'TERUEL', 40.489510, -1.212900, 'ACTIVO'),
('HI-444', 'HIDRANTE', 'Hidrante 1', '210', 'TERUEL', 40.343910, -1.107360, 'ACTIVO'),
('HI-445', 'HIDRANTE', 'Hidrante 2', '210', 'TERUEL', 40.344690, -1.107220, 'ACTIVO'),
('HI-446', 'HIDRANTE', 'Hidrante 3', '210', 'TERUEL', 40.345760, -1.107950, 'ACTIVO'),
('HI-447', 'HIDRANTE', 'Hidrante 4', '210', 'TERUEL', 40.344530, -1.105720, 'ACTIVO'),
('HI-448', 'HIDRANTE', 'Hidrante 5', '210', 'TERUEL', 40.346430, -1.108240, 'ACTIVO'),
('HI-449', 'HIDRANTE', 'Hidrante 6', '210', 'TERUEL', 40.345230, -1.106330, 'ACTIVO'),
('HI-450', 'HIDRANTE', 'Hidrante 7', '210', 'TERUEL', 40.346160, -1.108400, 'ACTIVO'),
('HI-451', 'HIDRANTE', 'Hidrante 8', '210', 'TERUEL', 40.344700, -1.107610, 'ACTIVO'),
('HI-452', 'HIDRANTE', 'Hidrante 9', '210', 'TERUEL', 40.346550, -1.105790, 'ACTIVO'),
('HI-453', 'HIDRANTE', 'Hidrante 10', '210', 'TERUEL', 40.347170, -1.108150, 'ACTIVO'),
('HI-456', 'HIDRANTE', 'Hidrante 4', '216', 'TERUEL', 40.487110, -1.213200, 'ACTIVO'),
('HI-457', 'HIDRANTE', 'Hidrante 5', '216', 'TERUEL', 40.490420, -1.211540, 'ACTIVO'),
('HI-458', 'HIDRANTE', 'Hidrante 6', '216', 'TERUEL', 40.489030, -1.212150, 'ACTIVO'),
('HI-459', 'HIDRANTE', 'Hidrante 7', '216', 'TERUEL', 40.489220, -1.210830, 'ACTIVO'),
('HI-460', 'HIDRANTE', 'Hidrante 8', '216', 'TERUEL', 40.490580, -1.212200, 'ACTIVO'),
('HI-461', 'HIDRANTE', 'Hidrante 9', '216', 'TERUEL', 40.490240, -1.211390, 'ACTIVO'),
('HI-462', 'HIDRANTE', 'Hidrante 10', '216', 'TERUEL', 40.488290, -1.212100, 'ACTIVO'),
('HI-463', 'HIDRANTE', 'Hidrante 11', '216', 'TERUEL', 40.487600, -1.213750, 'ACTIVO'),
('HI-464', 'HIDRANTE', 'Hidrante 12', '216', 'TERUEL', 40.487410, -1.210400, 'ACTIVO'),
('HI-465', 'HIDRANTE', 'Hidrante 13', '216', 'TERUEL', 40.488370, -1.211140, 'ACTIVO'),
('HI-466', 'HIDRANTE', 'Hidrante 14', '216', 'TERUEL', 40.489020, -1.213310, 'ACTIVO'),
('HI-467', 'HIDRANTE', 'Hidrante 15', '216', 'TERUEL', 40.487990, -1.212250, 'ACTIVO'),
('HI-468', 'HIDRANTE', 'Hidrante 16', '216', 'TERUEL', 40.488760, -1.211910, 'ACTIVO'),
('HI-469', 'HIDRANTE', 'Hidrante 17', '216', 'TERUEL', 40.487630, -1.212510, 'ACTIVO'),
('HI-470', 'HIDRANTE', 'Hidrante 18', '216', 'TERUEL', 40.488130, -1.212360, 'ACTIVO'),
('HI-471', 'HIDRANTE', 'Hidrante 19', '216', 'TERUEL', 40.488350, -1.211610, 'ACTIVO'),
('HI-472', 'HIDRANTE', 'Hidrante 20', '216', 'TERUEL', 40.490160, -1.211410, 'ACTIVO'),
('HI-473', 'HIDRANTE', 'Hidrante 21', '216', 'TERUEL', 40.487260, -1.213620, 'ACTIVO'),
('HI-474', 'HIDRANTE', 'Hidrante 22', '216', 'TERUEL', 40.489710, -1.212860, 'ACTIVO'),
('HI-475', 'HIDRANTE', 'Hidrante 23', '216', 'TERUEL', 40.489890, -1.211370, 'ACTIVO'),
('HI-476', 'HIDRANTE', 'Hidrante 24', '216', 'TERUEL', 40.490630, -1.210510, 'ACTIVO'),
('HI-477', 'HIDRANTE', 'Hidrante 25', '216', 'TERUEL', 40.488330, -1.211670, 'ACTIVO'),
('HI-478', 'HIDRANTE', 'Hidrante 26', '216', 'TERUEL', 40.487570, -1.212600, 'ACTIVO'),
('HI-479', 'HIDRANTE', 'Hidrante 27', '216', 'TERUEL', 40.490870, -1.211210, 'ACTIVO'),
('HI-480', 'HIDRANTE', 'Hidrante 28', '216', 'TERUEL', 40.488570, -1.211620, 'ACTIVO'),
('HI-481', 'HIDRANTE', 'Hidrante 29', '216', 'TERUEL', 40.490750, -1.212760, 'ACTIVO'),
('HI-482', 'HIDRANTE', 'Hidrante 30', '216', 'TERUEL', 40.488510, -1.210830, 'ACTIVO'),
('HI-483', 'HIDRANTE', 'Hidrante 31', '216', 'TERUEL', 40.490250, -1.211320, 'ACTIVO'),
('HI-484', 'HIDRANTE', 'Hidrante 32', '216', 'TERUEL', 40.490320, -1.211040, 'ACTIVO'),
('HI-485', 'HIDRANTE', 'Hidrante 33', '216', 'TERUEL', 40.489740, -1.211890, 'ACTIVO'),
('HI-486', 'HIDRANTE', 'Hidrante 34', '216', 'TERUEL', 40.489580, -1.212310, 'ACTIVO'),
('HI-487', 'HIDRANTE', 'Hidrante 35', '216', 'TERUEL', 40.488450, -1.212550, 'ACTIVO');
INSERT INTO `Infraestructuras_Agua` (`codigo`, `tipo`, `denominacion`, `municipio`, `provincia`, `latitud`, `longitud`, `estado`) VALUES
('HI-488', 'HIDRANTE', 'Hidrante 36', '216', 'TERUEL', 40.487720, -1.213140, 'ACTIVO'),
('HI-489', 'HIDRANTE', 'Hidrante 37', '216', 'TERUEL', 40.490790, -1.212050, 'ACTIVO'),
('HI-490', 'HIDRANTE', 'Hidrante 38', '216', 'TERUEL', 40.487910, -1.213450, 'ACTIVO'),
('HI-491', 'HIDRANTE', 'Hidrante 39', '216', 'TERUEL', 40.487310, -1.210620, 'ACTIVO'),
('HI-492', 'HIDRANTE', 'Hidrante 40', '216', 'TERUEL', 40.487400, -1.210920, 'ACTIVO'),
('HI-493', 'HIDRANTE', 'Hidrante 41', '216', 'TERUEL', 40.490340, -1.210470, 'ACTIVO'),
('HI-494', 'HIDRANTE', 'Hidrante 42', '216', 'TERUEL', 40.487150, -1.212650, 'ACTIVO'),
('HI-495', 'HIDRANTE', 'Hidrante 43', '216', 'TERUEL', 40.490070, -1.213480, 'ACTIVO'),
('HI-496', 'HIDRANTE', 'Hidrante 44', '216', 'TERUEL', 40.488510, -1.213350, 'ACTIVO'),
('HI-497', 'HIDRANTE', 'Hidrante 45', '216', 'TERUEL', 40.490330, -1.210920, 'ACTIVO'),
('HI-498', 'HIDRANTE', 'Hidrante 46', '216', 'TERUEL', 40.490240, -1.213340, 'ACTIVO'),
('HI-499', 'HIDRANTE', 'Hidrante 47', '216', 'TERUEL', 40.488750, -1.212360, 'ACTIVO'),
('HI-500', 'HIDRANTE', 'Hidrante 48', '216', 'TERUEL', 40.489710, -1.213050, 'ACTIVO'),
('HI-501', 'HIDRANTE', 'Hidrante 49', '216', 'TERUEL', 40.488780, -1.212860, 'ACTIVO'),
('HI-502', 'HIDRANTE', 'Hidrante 50', '216', 'TERUEL', 40.489990, -1.212200, 'ACTIVO'),
('HI-503', 'HIDRANTE', 'Hidrante 51', '216', 'TERUEL', 40.489140, -1.212760, 'ACTIVO'),
('HI-504', 'HIDRANTE', 'Hidrante 52', '216', 'TERUEL', 40.490230, -1.212120, 'ACTIVO'),
('HI-505', 'HIDRANTE', 'Hidrante 53', '216', 'TERUEL', 40.490340, -1.212530, 'ACTIVO'),
('HI-506', 'HIDRANTE', 'Hidrante 54', '216', 'TERUEL', 40.490790, -1.210060, 'ACTIVO'),
('HI-507', 'HIDRANTE', 'Hidrante 55', '216', 'TERUEL', 40.488850, -1.212870, 'ACTIVO'),
('HI-508', 'HIDRANTE', 'Hidrante 56', '216', 'TERUEL', 40.488530, -1.211890, 'ACTIVO'),
('HI-509', 'HIDRANTE', 'Hidrante 57', '216', 'TERUEL', 40.490870, -1.210730, 'ACTIVO'),
('HI-510', 'HIDRANTE', 'Hidrante 58', '216', 'TERUEL', 40.490210, -1.213450, 'ACTIVO'),
('HI-511', 'HIDRANTE', 'Hidrante 59', '216', 'TERUEL', 40.488000, -1.211440, 'ACTIVO'),
('HI-512', 'HIDRANTE', 'Hidrante 60', '216', 'TERUEL', 40.490500, -1.211780, 'ACTIVO'),
('HI-513', 'HIDRANTE', 'Hidrante 61', '216', 'TERUEL', 40.487410, -1.210620, 'ACTIVO'),
('HI-514', 'HIDRANTE', 'Hidrante 62', '216', 'TERUEL', 40.490400, -1.212860, 'ACTIVO'),
('HI-515', 'HIDRANTE', 'Hidrante 63', '216', 'TERUEL', 40.490050, -1.212910, 'ACTIVO'),
('HI-516', 'HIDRANTE', 'Hidrante 64', '216', 'TERUEL', 40.490620, -1.213410, 'ACTIVO'),
('HI-517', 'HIDRANTE', 'Hidrante 65', '216', 'TERUEL', 40.488750, -1.210210, 'ACTIVO'),
('HI-518', 'HIDRANTE', 'Hidrante 66', '216', 'TERUEL', 40.487890, -1.212200, 'ACTIVO'),
('HI-519', 'HIDRANTE', 'Hidrante 67', '216', 'TERUEL', 40.488400, -1.213890, 'ACTIVO'),
('HI-520', 'HIDRANTE', 'Hidrante 68', '216', 'TERUEL', 40.487210, -1.211990, 'ACTIVO'),
('HI-521', 'HIDRANTE', 'Hidrante 69', '216', 'TERUEL', 40.487940, -1.210020, 'ACTIVO'),
('HI-523', 'HIDRANTE', 'Hidrante 1', '219', 'TERUEL', 40.523020, -0.985640, 'ACTIVO'),
('HI-524', 'HIDRANTE', 'Hidrante 2', '219', 'TERUEL', 40.521900, -0.985830, 'ACTIVO'),
('HI-526', 'HIDRANTE', 'Hidrante 1', '234', 'TERUEL', 40.951320, -0.509220, 'ACTIVO'),
('HI-527', 'HIDRANTE', 'Hidrante 2', '234', 'TERUEL', 40.948560, -0.509180, 'ACTIVO'),
('HI-528', 'HIDRANTE', 'Hidrante 3', '234', 'TERUEL', 40.949790, -0.511980, 'ACTIVO'),
('HI-529', 'HIDRANTE', 'Hidrante 4', '234', 'TERUEL', 40.948320, -0.510980, 'ACTIVO'),
('HI-530', 'HIDRANTE', 'Hidrante 5', '234', 'TERUEL', 40.951340, -0.509800, 'ACTIVO'),
('HI-531', 'HIDRANTE', 'Hidrante 6', '234', 'TERUEL', 40.950910, -0.509890, 'ACTIVO'),
('HI-533', 'HIDRANTE', 'Hidrante 1', '251', 'TERUEL', 40.759200, -0.781810, 'ACTIVO'),
('HI-534', 'HIDRANTE', 'Hidrante 2', '251', 'TERUEL', 40.759680, -0.778820, 'ACTIVO'),
('HI-537', 'HIDRANTE', 'Hidrante 70', '216', 'TERUEL', 40.487070, -1.211940, 'ACTIVO'),
('HI-538', 'HIDRANTE', 'Hidrante 71', '216', 'TERUEL', 40.487970, -1.213430, 'ACTIVO'),
('HI-540', 'HIDRANTE', 'Hidrante 72', '216', 'TERUEL', 40.487960, -1.212330, 'ACTIVO'),
('HI-541', 'HIDRANTE', 'Hidrante 73', '216', 'TERUEL', 40.489660, -1.213660, 'ACTIVO'),
('HI-542', 'HIDRANTE', 'Hidrante 74', '216', 'TERUEL', 40.490900, -1.213730, 'ACTIVO'),
('HI-543', 'HIDRANTE', 'Hidrante 75', '216', 'TERUEL', 40.489100, -1.211970, 'ACTIVO'),
('HI-544', 'HIDRANTE', 'Hidrante 76', '216', 'TERUEL', 40.490950, -1.211780, 'ACTIVO'),
('HI-545', 'HIDRANTE', 'Hidrante 77', '216', 'TERUEL', 40.488560, -1.212120, 'ACTIVO'),
('HI-546', 'HIDRANTE', 'Hidrante 78', '216', 'TERUEL', 40.489540, -1.210080, 'ACTIVO'),
('HI-547', 'HIDRANTE', 'Hidrante 79', '216', 'TERUEL', 40.488010, -1.213940, 'ACTIVO'),
('HI-548', 'HIDRANTE', 'Hidrante 80', '216', 'TERUEL', 40.490150, -1.212620, 'ACTIVO'),
('HI-549', 'HIDRANTE', 'Hidrante 81', '216', 'TERUEL', 40.489930, -1.211490, 'ACTIVO'),
('HI-550', 'HIDRANTE', 'Hidrante 82', '216', 'TERUEL', 40.490090, -1.211060, 'ACTIVO'),
('HI-551', 'HIDRANTE', 'Hidrante 83', '216', 'TERUEL', 40.488330, -1.213820, 'ACTIVO'),
('HI-552', 'HIDRANTE', 'Hidrante 84', '216', 'TERUEL', 40.489180, -1.210750, 'ACTIVO'),
('HI-553', 'HIDRANTE', 'Hidrante 85', '216', 'TERUEL', 40.487700, -1.210880, 'ACTIVO'),
('HI-554', 'HIDRANTE', 'Hidrante 86', '216', 'TERUEL', 40.488860, -1.211220, 'ACTIVO'),
('HI-555', 'HIDRANTE', 'Hidrante 87', '216', 'TERUEL', 40.489530, -1.210750, 'ACTIVO'),
('HI-556', 'HIDRANTE', 'Hidrante 88', '216', 'TERUEL', 40.487250, -1.210900, 'ACTIVO'),
('HI-557', 'HIDRANTE', 'Hidrante 89', '216', 'TERUEL', 40.488830, -1.212830, 'ACTIVO'),
('HI-558', 'HIDRANTE', 'Hidrante 90', '216', 'TERUEL', 40.487180, -1.213200, 'ACTIVO'),
('HI-559', 'HIDRANTE', 'Hidrante 91', '216', 'TERUEL', 40.487170, -1.210270, 'ACTIVO'),
('HI-560', 'HIDRANTE', 'Hidrante 92', '216', 'TERUEL', 40.489060, -1.210040, 'ACTIVO'),
('HI-561', 'HIDRANTE', 'Hidrante 93', '216', 'TERUEL', 40.490230, -1.211010, 'ACTIVO'),
('HI-562', 'HIDRANTE', 'Hidrante 94', '216', 'TERUEL', 40.488350, -1.213540, 'ACTIVO'),
('HI-563', 'HIDRANTE', 'Hidrante 95', '216', 'TERUEL', 40.490850, -1.213440, 'ACTIVO'),
('HI-564', 'HIDRANTE', 'Hidrante 96', '216', 'TERUEL', 40.490870, -1.210560, 'ACTIVO'),
('HI-565', 'HIDRANTE', 'Hidrante 97', '216', 'TERUEL', 40.489900, -1.210080, 'ACTIVO'),
('HI-566', 'HIDRANTE', 'Hidrante 98', '216', 'TERUEL', 40.490870, -1.210780, 'ACTIVO'),
('HI-567', 'HIDRANTE', 'Hidrante 99', '216', 'TERUEL', 40.488460, -1.210840, 'ACTIVO'),
('HI-568', 'HIDRANTE', 'Hidrante 100', '216', 'TERUEL', 40.487060, -1.211850, 'ACTIVO'),
('HI-569', 'HIDRANTE', 'Hidrante 101', '216', 'TERUEL', 40.488820, -1.211310, 'ACTIVO'),
('HI-570', 'HIDRANTE', 'Hidrante 102', '216', 'TERUEL', 40.489690, -1.211660, 'ACTIVO'),
('HI-571', 'HIDRANTE', 'Hidrante 103', '216', 'TERUEL', 40.490290, -1.210240, 'ACTIVO'),
('HI-572', 'HIDRANTE', 'Hidrante 104', '216', 'TERUEL', 40.487430, -1.213060, 'ACTIVO'),
('HI-573', 'HIDRANTE', 'Hidrante 105', '216', 'TERUEL', 40.487100, -1.210460, 'ACTIVO'),
('HI-574', 'HIDRANTE', 'Hidrante 106', '216', 'TERUEL', 40.489250, -1.210340, 'ACTIVO'),
('HI-575', 'HIDRANTE', 'Hidrante 107', '216', 'TERUEL', 40.487890, -1.213750, 'ACTIVO'),
('HI-576', 'HIDRANTE', 'Hidrante 1', '003', 'TERUEL', 40.544300, -0.722360, 'ACTIVO'),
('HI-577', 'HIDRANTE', 'Hidrante 2', '003', 'TERUEL', 40.542210, -0.724370, 'ACTIVO'),
('HI-578', 'HIDRANTE', 'Hidrante 1', '009', 'TERUEL', 40.688560, -1.248210, 'ACTIVO'),
('HI-579', 'HIDRANTE', 'Hidrante 2', '009', 'TERUEL', 40.689220, -1.250030, 'ACTIVO'),
('HI-580', 'HIDRANTE', 'Hidrante 3', '009', 'TERUEL', 40.688390, -1.248450, 'ACTIVO'),
('HI-582', 'HIDRANTE', 'Hidrante 1', '018', 'TERUEL', 40.502680, -1.484030, 'ACTIVO'),
('HI-583', 'HIDRANTE', 'Hidrante 2', '018', 'TERUEL', 40.503780, -1.485320, 'ACTIVO'),
('HI-584', 'HIDRANTE', 'Hidrante 3', '018', 'TERUEL', 40.502970, -1.486380, 'ACTIVO'),
('HI-585', 'HIDRANTE', 'Hidrante 108', '216', 'TERUEL', 40.488660, -1.213600, 'ACTIVO'),
('HI-586', 'HIDRANTE', 'Hidrante 109', '216', 'TERUEL', 40.488960, -1.212370, 'ACTIVO'),
('HI-587', 'HIDRANTE', 'Hidrante 110', '216', 'TERUEL', 40.490810, -1.213870, 'ACTIVO'),
('HI-588', 'HIDRANTE', 'Hidrante 111', '216', 'TERUEL', 40.488480, -1.212230, 'ACTIVO'),
('HI-589', 'HIDRANTE', 'Hidrante 112', '216', 'TERUEL', 40.490800, -1.210580, 'ACTIVO'),
('HI-590', 'HIDRANTE', 'Hidrante 113', '216', 'TERUEL', 40.487400, -1.211260, 'ACTIVO'),
('HI-591', 'HIDRANTE', 'Hidrante 114', '216', 'TERUEL', 40.489180, -1.210090, 'ACTIVO'),
('HI-592', 'HIDRANTE', 'Hidrante 115', '216', 'TERUEL', 40.488430, -1.212410, 'ACTIVO'),
('HI-593', 'HIDRANTE', 'Hidrante 116', '216', 'TERUEL', 40.487760, -1.213510, 'ACTIVO'),
('HI-594', 'HIDRANTE', 'Hidrante 1', '216', 'TERUEL', 40.490390, -1.212180, 'ACTIVO'),
('HI-595', 'HIDRANTE', 'Hidrante 1', '216', 'TERUEL', 40.489650, -1.211430, 'ACTIVO'),
('HI-596', 'HIDRANTE', 'Hidrante 117', '216', 'TERUEL', 40.489390, -1.213910, 'ACTIVO'),
('HI-597', 'HIDRANTE', 'Hidrante 118', '216', 'TERUEL', 40.490150, -1.213030, 'ACTIVO'),
('HI-598', 'HIDRANTE', 'Hidrante 119', '216', 'TERUEL', 40.487500, -1.211740, 'ACTIVO'),
('HI-599', 'HIDRANTE', 'Hidrante 120', '216', 'TERUEL', 40.487270, -1.210940, 'ACTIVO'),
('HI-600', 'HIDRANTE', 'Hidrante 121', '216', 'TERUEL', 40.487830, -1.213140, 'ACTIVO'),
('HI-601', 'HIDRANTE', 'Hidrante 122', '216', 'TERUEL', 40.490480, -1.212690, 'ACTIVO'),
('HI-602', 'HIDRANTE', 'Hidrante 123', '216', 'TERUEL', 40.487590, -1.210400, 'ACTIVO'),
('HI-603', 'HIDRANTE', 'Hidrante 124', '216', 'TERUEL', 40.487010, -1.210570, 'ACTIVO'),
('HI-604', 'HIDRANTE', 'Hidrante 125', '216', 'TERUEL', 40.487580, -1.213480, 'ACTIVO'),
('HI-605', 'HIDRANTE', 'Hidrante 126', '216', 'TERUEL', 40.488000, -1.213300, 'ACTIVO'),
('HI-606', 'HIDRANTE', 'Hidrante 127', '216', 'TERUEL', 40.489640, -1.213900, 'ACTIVO'),
('HI-607', 'HIDRANTE', 'Hidrante 128', '216', 'TERUEL', 40.487060, -1.210840, 'ACTIVO'),
('HI-608', 'HIDRANTE', 'Hidrante 129', '216', 'TERUEL', 40.487950, -1.212700, 'ACTIVO'),
('HI-609', 'HIDRANTE', 'Hidrante 130', '216', 'TERUEL', 40.487700, -1.213790, 'ACTIVO'),
('HI-610', 'HIDRANTE', 'Hidrante 131', '216', 'TERUEL', 40.489970, -1.211900, 'ACTIVO'),
('HI-611', 'HIDRANTE', 'Hidrante 132', '216', 'TERUEL', 40.489980, -1.212100, 'ACTIVO'),
('HI-612', 'HIDRANTE', 'Hidrante 133', '216', 'TERUEL', 40.490110, -1.211950, 'ACTIVO'),
('HI-613', 'HIDRANTE', 'Hidrante 134', '216', 'TERUEL', 40.487440, -1.211980, 'ACTIVO'),
('HI-614', 'HIDRANTE', 'Hidrante 135', '216', 'TERUEL', 40.490780, -1.213830, 'ACTIVO'),
('HI-615', 'HIDRANTE', 'Hidrante 136', '216', 'TERUEL', 40.490130, -1.210530, 'ACTIVO'),
('HI-616', 'HIDRANTE', 'Hidrante 137', '216', 'TERUEL', 40.489090, -1.212170, 'ACTIVO'),
('HI-617', 'HIDRANTE', 'Hidrante 138', '216', 'TERUEL', 40.490860, -1.213760, 'ACTIVO'),
('HI-618', 'HIDRANTE', 'Hidrante 139', '216', 'TERUEL', 40.488920, -1.212390, 'ACTIVO'),
('HI-619', 'HIDRANTE', 'Hidrante 140', '216', 'TERUEL', 40.489740, -1.212040, 'ACTIVO'),
('HI-620', 'HIDRANTE', 'Hidrante 141', '216', 'TERUEL', 40.490640, -1.213710, 'ACTIVO'),
('HI-621', 'HIDRANTE', 'Hidrante 142', '216', 'TERUEL', 40.487320, -1.211570, 'ACTIVO'),
('HI-622', 'HIDRANTE', 'Hidrante 143', '216', 'TERUEL', 40.487260, -1.212900, 'ACTIVO'),
('HI-623', 'HIDRANTE', 'Hidrante 144', '216', 'TERUEL', 40.489530, -1.211810, 'ACTIVO'),
('HI-624', 'HIDRANTE', 'Hidrante 145', '216', 'TERUEL', 40.488300, -1.210020, 'ACTIVO'),
('HI-625', 'HIDRANTE', 'Hidrante 146', '216', 'TERUEL', 40.489120, -1.212190, 'ACTIVO'),
('HI-626', 'HIDRANTE', 'Hidrante 147', '216', 'TERUEL', 40.489420, -1.213600, 'ACTIVO'),
('HI-627', 'HIDRANTE', 'Hidrante 148', '216', 'TERUEL', 40.489810, -1.210590, 'ACTIVO'),
('HI-628', 'HIDRANTE', 'Hidrante 149', '216', 'TERUEL', 40.489600, -1.210920, 'ACTIVO'),
('HI-629', 'HIDRANTE', 'Hidrante 150', '216', 'TERUEL', 40.489880, -1.213140, 'ACTIVO'),
('HI-630', 'HIDRANTE', 'Hidrante 151', '216', 'TERUEL', 40.488810, -1.213090, 'ACTIVO'),
('HI-631', 'HIDRANTE', 'Hidrante 152', '216', 'TERUEL', 40.488360, -1.212190, 'ACTIVO'),
('HI-632', 'HIDRANTE', 'Hidrante 153', '216', 'TERUEL', 40.488660, -1.213620, 'ACTIVO'),
('HI-633', 'HIDRANTE', 'Hidrante 154', '216', 'TERUEL', 40.488710, -1.211340, 'ACTIVO'),
('HI-634', 'HIDRANTE', 'Hidrante 155', '216', 'TERUEL', 40.488500, -1.213390, 'ACTIVO'),
('HI-635', 'HIDRANTE', 'Hidrante 156', '216', 'TERUEL', 40.490690, -1.213730, 'ACTIVO'),
('HI-636', 'HIDRANTE', 'Hidrante 157', '216', 'TERUEL', 40.490330, -1.213630, 'ACTIVO'),
('HI-637', 'HIDRANTE', 'Hidrante 158', '216', 'TERUEL', 40.487390, -1.211040, 'ACTIVO'),
('HI-638', 'HIDRANTE', 'Hidrante 159', '216', 'TERUEL', 40.490250, -1.211770, 'ACTIVO'),
('HI-639', 'HIDRANTE', 'Hidrante 160', '216', 'TERUEL', 40.489350, -1.211750, 'ACTIVO'),
('HI-640', 'HIDRANTE', 'Hidrante 161', '216', 'TERUEL', 40.488320, -1.213510, 'ACTIVO'),
('HI-641', 'HIDRANTE', 'Hidrante 162', '216', 'TERUEL', 40.488410, -1.211340, 'ACTIVO'),
('HI-642', 'HIDRANTE', 'Hidrante 163', '216', 'TERUEL', 40.490000, -1.210530, 'ACTIVO'),
('HI-643', 'HIDRANTE', 'Hidrante 164', '216', 'TERUEL', 40.489880, -1.210130, 'ACTIVO'),
('HI-644', 'HIDRANTE', 'Hidrante 165', '216', 'TERUEL', 40.489400, -1.212590, 'ACTIVO'),
('HI-645', 'HIDRANTE', 'Hidrante 166', '216', 'TERUEL', 40.489310, -1.213150, 'ACTIVO'),
('HI-646', 'HIDRANTE', 'Hidrante 167', '216', 'TERUEL', 40.489630, -1.213100, 'ACTIVO'),
('HI-647', 'HIDRANTE', 'Hidrante 168', '216', 'TERUEL', 40.487430, -1.210620, 'ACTIVO'),
('HI-648', 'HIDRANTE', 'Hidrante 169', '216', 'TERUEL', 40.488470, -1.210950, 'ACTIVO'),
('HI-649', 'HIDRANTE', 'Hidrante 170', '216', 'TERUEL', 40.489300, -1.210770, 'ACTIVO'),
('HI-650', 'HIDRANTE', 'Hidrante 171', '216', 'TERUEL', 40.490380, -1.210100, 'ACTIVO'),
('HI-651', 'HIDRANTE', 'Hidrante 172', '216', 'TERUEL', 40.490270, -1.211550, 'ACTIVO'),
('HI-652', 'HIDRANTE', 'Hidrante 173', '216', 'TERUEL', 40.489570, -1.213890, 'ACTIVO'),
('HI-653', 'HIDRANTE', 'Hidrante 174', '216', 'TERUEL', 40.490720, -1.210680, 'ACTIVO'),
('HI-654', 'HIDRANTE', 'Hidrante 175', '216', 'TERUEL', 40.488070, -1.213280, 'ACTIVO'),
('HI-655', 'HIDRANTE', 'Hidrante 176', '216', 'TERUEL', 40.489810, -1.212760, 'ACTIVO'),
('HI-656', 'HIDRANTE', 'Hidrante 177', '216', 'TERUEL', 40.488360, -1.213980, 'ACTIVO'),
('HI-657', 'HIDRANTE', 'Hidrante 178', '216', 'TERUEL', 40.490480, -1.211730, 'ACTIVO'),
('HI-658', 'HIDRANTE', 'Hidrante 179', '216', 'TERUEL', 40.488600, -1.213430, 'ACTIVO'),
('HI-659', 'HIDRANTE', 'Hidrante 180', '216', 'TERUEL', 40.489530, -1.213880, 'ACTIVO'),
('HI-660', 'HIDRANTE', 'Hidrante 181', '216', 'TERUEL', 40.489980, -1.213140, 'ACTIVO'),
('HI-661', 'HIDRANTE', 'Hidrante 182', '216', 'TERUEL', 40.488680, -1.212640, 'ACTIVO'),
('HI-662', 'HIDRANTE', 'Hidrante 183', '216', 'TERUEL', 40.488480, -1.211110, 'ACTIVO'),
('HI-663', 'HIDRANTE', 'Hidrante 184', '216', 'TERUEL', 40.490110, -1.211730, 'ACTIVO'),
('HI-664', 'HIDRANTE', 'Hidrante 185', '216', 'TERUEL', 40.487340, -1.213790, 'ACTIVO'),
('HI-665', 'HIDRANTE', 'Hidrante 186', '216', 'TERUEL', 40.487630, -1.211530, 'ACTIVO'),
('HI-666', 'HIDRANTE', 'Hidrante 187', '216', 'TERUEL', 40.489700, -1.212910, 'ACTIVO'),
('HI-667', 'HIDRANTE', 'Hidrante 188', '216', 'TERUEL', 40.489650, -1.212060, 'ACTIVO'),
('HI-668', 'HIDRANTE', 'Hidrante 189', '216', 'TERUEL', 40.488770, -1.212910, 'ACTIVO'),
('HI-669', 'HIDRANTE', 'Hidrante 190', '216', 'TERUEL', 40.490020, -1.213540, 'ACTIVO'),
('HI-670', 'HIDRANTE', 'Hidrante 191', '216', 'TERUEL', 40.488720, -1.212870, 'ACTIVO'),
('HI-671', 'HIDRANTE', 'Hidrante 192', '216', 'TERUEL', 40.489710, -1.212050, 'ACTIVO'),
('HI-672', 'HIDRANTE', 'Hidrante 193', '216', 'TERUEL', 40.489670, -1.213820, 'ACTIVO'),
('HI-673', 'HIDRANTE', 'Hidrante 194', '216', 'TERUEL', 40.488580, -1.211600, 'ACTIVO'),
('HI-674', 'HIDRANTE', 'Hidrante 195', '216', 'TERUEL', 40.487030, -1.212790, 'ACTIVO'),
('HI-675', 'HIDRANTE', 'Hidrante 196', '216', 'TERUEL', 40.487840, -1.213450, 'ACTIVO'),
('HI-676', 'HIDRANTE', 'Hidrante 197', '216', 'TERUEL', 40.488020, -1.212690, 'ACTIVO'),
('HI-677', 'HIDRANTE', 'Hidrante 198', '216', 'TERUEL', 40.487030, -1.211010, 'ACTIVO'),
('HI-678', 'HIDRANTE', 'Hidrante 199', '216', 'TERUEL', 40.487700, -1.212480, 'ACTIVO'),
('HI-679', 'HIDRANTE', 'Hidrante 200', '216', 'TERUEL', 40.489810, -1.212000, 'ACTIVO'),
('HI-680', 'HIDRANTE', 'Hidrante 201', '216', 'TERUEL', 40.490330, -1.210780, 'ACTIVO'),
('HI-681', 'HIDRANTE', 'Hidrante 202', '216', 'TERUEL', 40.487290, -1.210550, 'ACTIVO'),
('HI-682', 'HIDRANTE', 'Hidrante 203', '216', 'TERUEL', 40.488660, -1.213170, 'ACTIVO'),
('HI-683', 'HIDRANTE', 'Hidrante 204', '216', 'TERUEL', 40.488680, -1.210380, 'ACTIVO'),
('HI-684', 'HIDRANTE', 'Hidrante 205', '216', 'TERUEL', 40.489340, -1.211220, 'ACTIVO'),
('HI-685', 'HIDRANTE', 'Hidrante 206', '216', 'TERUEL', 40.490430, -1.210940, 'ACTIVO'),
('HI-686', 'HIDRANTE', 'Hidrante 207', '216', 'TERUEL', 40.488520, -1.213980, 'ACTIVO'),
('HI-687', 'HIDRANTE', 'Hidrante 208', '216', 'TERUEL', 40.488410, -1.210990, 'ACTIVO'),
('HI-688', 'HIDRANTE', 'Hidrante 209', '216', 'TERUEL', 40.490410, -1.210190, 'ACTIVO'),
('HI-689', 'HIDRANTE', 'Hidrante 210', '216', 'TERUEL', 40.488680, -1.211010, 'ACTIVO'),
('HI-690', 'HIDRANTE', 'Hidrante 211', '216', 'TERUEL', 40.489180, -1.211590, 'ACTIVO'),
('HI-691', 'HIDRANTE', 'Hidrante 212', '216', 'TERUEL', 40.487880, -1.213120, 'ACTIVO'),
('HI-692', 'HIDRANTE', 'Hidrante 213', '216', 'TERUEL', 40.488740, -1.213880, 'ACTIVO'),
('HI-693', 'HIDRANTE', 'Hidrante 214', '216', 'TERUEL', 40.488340, -1.211280, 'ACTIVO'),
('HI-694', 'HIDRANTE', 'Hidrante 215', '216', 'TERUEL', 40.488620, -1.213340, 'ACTIVO'),
('HI-695', 'HIDRANTE', 'Hidrante 216', '216', 'TERUEL', 40.488870, -1.213490, 'ACTIVO'),
('HI-696', 'HIDRANTE', 'Hidrante 217', '216', 'TERUEL', 40.489490, -1.213890, 'ACTIVO'),
('HI-697', 'HIDRANTE', 'Hidrante 218', '216', 'TERUEL', 40.488580, -1.211740, 'ACTIVO'),
('HI-698', 'HIDRANTE', 'Hidrante 219', '216', 'TERUEL', 40.487110, -1.211430, 'ACTIVO'),
('HI-699', 'HIDRANTE', 'Hidrante 220', '216', 'TERUEL', 40.487540, -1.212150, 'ACTIVO'),
('HI-700', 'HIDRANTE', 'Hidrante 221', '216', 'TERUEL', 40.487200, -1.212480, 'ACTIVO'),
('HI-701', 'HIDRANTE', 'Hidrante 222', '216', 'TERUEL', 40.487850, -1.212690, 'ACTIVO'),
('HI-702', 'HIDRANTE', 'Hidrante 223', '216', 'TERUEL', 40.490040, -1.212480, 'ACTIVO'),
('HI-703', 'HIDRANTE', 'Hidrante 224', '216', 'TERUEL', 40.490010, -1.210670, 'ACTIVO'),
('HI-704', 'HIDRANTE', 'Hidrante 225', '216', 'TERUEL', 40.488010, -1.213670, 'ACTIVO'),
('HI-706', 'HIDRANTE', 'Hidrante 1', '239', 'TERUEL', 40.312000, -1.020600, 'ACTIVO'),
('HI-707', 'HIDRANTE', 'Hidrante 2', '239', 'TERUEL', 40.310600, -1.018880, 'ACTIVO'),
('HI-961', 'HIDRANTE', 'Hidrante 961', '017', 'ZARAGOZA', 41.448630, -2.119800, 'ACTIVO'),
('HI-962', 'HIDRANTE', 'Hidrante 1', '005', 'ZARAGOZA', 41.390210, -1.651630, 'ACTIVO'),
('HI-963', 'HIDRANTE', 'Hidrante 2', '005', 'ZARAGOZA', 41.391970, -1.648350, 'ACTIVO'),
('HI-964', 'HIDRANTE', 'Hidrante 1', '008', 'ZARAGOZA', 41.509850, -1.591530, 'ACTIVO'),
('HI-965', 'HIDRANTE', 'Hidrante 2', '008', 'ZARAGOZA', 41.511330, -1.590010, 'ACTIVO'),
('HI-966', 'HIDRANTE', 'Hidrante 3', '008', 'ZARAGOZA', 41.510870, -1.589960, 'ACTIVO'),
('HI-967', 'HIDRANTE', 'Hidrante 4', '008', 'ZARAGOZA', 41.509090, -1.588660, 'ACTIVO'),
('HI-968', 'HIDRANTE', 'Hidrante 5', '008', 'ZARAGOZA', 41.511920, -1.591030, 'ACTIVO'),
('HI-969', 'HIDRANTE', 'Hidrante 6', '008', 'ZARAGOZA', 41.510210, -1.590470, 'ACTIVO'),
('HI-970', 'HIDRANTE', 'Hidrante 7', '008', 'ZARAGOZA', 41.511690, -1.589970, 'ACTIVO'),
('HI-971', 'HIDRANTE', 'Hidrante 8', '008', 'ZARAGOZA', 41.511520, -1.588540, 'ACTIVO'),
('HI-972', 'HIDRANTE', 'Hidrante 9', '008', 'ZARAGOZA', 41.509100, -1.588840, 'ACTIVO'),
('HI-973', 'HIDRANTE', 'Hidrante 10', '008', 'ZARAGOZA', 41.509660, -1.588260, 'ACTIVO'),
('HI-974', 'HIDRANTE', 'Hidrante 11', '008', 'ZARAGOZA', 41.510030, -1.588720, 'ACTIVO'),
('HI-976', 'HIDRANTE', 'Hidrante 1', '013', 'ZARAGOZA', 41.470350, -0.508000, 'ACTIVO'),
('HI-977', 'HIDRANTE', 'Hidrante 2', '013', 'ZARAGOZA', 41.469960, -0.511410, 'ACTIVO'),
('HI-978', 'HIDRANTE', 'Hidrante 1', '017', 'ZARAGOZA', 41.450150, -2.120620, 'ACTIVO'),
('HI-979', 'HIDRANTE', 'Hidrante 2', '017', 'ZARAGOZA', 41.450210, -2.119830, 'ACTIVO'),
('HI-980', 'HIDRANTE', 'Hidrante 3', '017', 'ZARAGOZA', 41.449820, -2.120710, 'ACTIVO'),
('HI-981', 'HIDRANTE', 'Hidrante 4', '017', 'ZARAGOZA', 41.448750, -2.119210, 'ACTIVO'),
('HI-982', 'HIDRANTE', 'Hidrante 5', '017', 'ZARAGOZA', 41.450290, -2.121070, 'ACTIVO'),
('HI-986', 'HIDRANTE', 'Hidrante 1', '043', 'ZARAGOZA', 41.700650, -0.978720, 'ACTIVO'),
('HI-987', 'HIDRANTE', 'Hidrante 2', '043', 'ZARAGOZA', 41.701920, -0.980020, 'ACTIVO'),
('HI-988', 'HIDRANTE', 'Hidrante 3', '043', 'ZARAGOZA', 41.698150, -0.979990, 'ACTIVO'),
('HI-990', 'HIDRANTE', 'Hidrante 1', '053', 'ZARAGOZA', 41.491500, -1.710240, 'ACTIVO'),
('HI-991', 'HIDRANTE', 'Hidrante 2', '053', 'ZARAGOZA', 41.490100, -1.710170, 'ACTIVO'),
('HI-992', 'HIDRANTE', 'Hidrante 1', '055', 'ZARAGOZA', 41.620890, -1.550360, 'ACTIVO'),
('HI-993', 'HIDRANTE', 'Hidrante 2', '055', 'ZARAGOZA', 41.620620, -1.551380, 'ACTIVO'),
('HI-994', 'HIDRANTE', 'Hidrante 3', '055', 'ZARAGOZA', 41.619880, -1.548120, 'ACTIVO'),
('HI-995', 'HIDRANTE', 'Hidrante 4', '055', 'ZARAGOZA', 41.619350, -1.549230, 'ACTIVO'),
('HI-996', 'HIDRANTE', 'Hidrante 5', '055', 'ZARAGOZA', 41.620600, -1.548590, 'ACTIVO'),
('HI-997', 'HIDRANTE', 'Hidrante 1', '055', 'ZARAGOZA', 41.621410, -1.548560, 'ACTIVO'),
('HI-998', 'HIDRANTE', 'Hidrante 1', '056', 'ZARAGOZA', 41.459520, -0.830730, 'ACTIVO'),
('HI-999', 'HIDRANTE', 'Hidrante 2', '056', 'ZARAGOZA', 41.460870, -0.828960, 'ACTIVO'),
('TE-3211', 'BOCA_RIEGO', 'dsada', 'SAMPERR', 'TERUEL', 41.188392, -0.386137, 'ACTIVO'),
('TE-32111', 'BOCA_RIEGO', 'dsada', 'SAMPER', 'TERUEL', 41.188392, -0.386137, 'ACTIVO'),
('TE-32112', 'BOCA_RIEGO', 'dsada', 'SAMPERR', 'TERUEL', 41.188392, -0.386137, 'ACTIVO');

COMMIT;

SET autocommit = 1;
SET FOREIGN_KEY_CHECKS = 1;