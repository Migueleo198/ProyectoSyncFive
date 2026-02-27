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
    f_inicio TIMESTAMP NOT NULL,
    f_fin TIMESTAMP NOT NULL,
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
   11. ALMACEN_MATERIAL
   ======================= */
CREATE TABLE Almacen_material (
    id_almacen INT,
    id_instalacion INT,
    id_material INT,
    n_serie INT,
    unidades INT,
    PRIMARY KEY (id_almacen, id_instalacion, id_material),
    CHECK (unidades > 0),
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
    contrasenia VARCHAR(255),
    fecha_ult_inicio_sesion TIMESTAMP,
    token_activacion VARCHAR(64),
    fecha_exp_token_activacion TIMESTAMP,
    token_cambio_contrasenia VARCHAR(64),
    fecha_exp_cambio_contrasenia TIMESTAMP,
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
    fecha TIMESTAMP NOT NULL,
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
    f_salida TIMESTAMP NOT NULL,
    f_llegada TIMESTAMP,
    f_regreso TIMESTAMP,
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
    f_salida TIMESTAMP NOT NULL,
    f_regreso TIMESTAMP NOT NULL,
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
   21. CARNET
   ======================= */
CREATE TABLE Carnet (
    id_carnet INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    categoria VARCHAR(20) NOT NULL,
    duracion_meses INT NOT NULL,
    CHECK (duracion_meses > 0)
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
    fecha TIMESTAMP NOT NULL,
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
   29. VEHICULO_CARGA_MATERIAL
   ======================= */
CREATE TABLE Vehiculo_Carga_Material (
    id_material INT,
    matricula VARCHAR(15),
    nserie VARCHAR(50),
    unidades INT,
    PRIMARY KEY (id_material, matricula),
    CHECK (unidades IS NULL OR unidades > 0),
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
    id_bombero VARCHAR(4),           -- ← AÑADIR
    fecha DATE NOT NULL,
    h_inicio TIME,
    h_fin TIME,
    estado ENUM('ACEPTADO','REVISION','DENEGADO') NOT NULL,
    descripcion VARCHAR(255),
    FOREIGN KEY (cod_motivo) REFERENCES Motivo(cod_motivo)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_bombero) REFERENCES Persona(id_bombero)   -- ← AÑADIR
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
('Intervención en Incendios Urbanos', 'Tácticas de ataque interior y exterior en incendios de edificios residenciales e industriales');

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
(1, 8, '2024-03-04', '2024-03-15', 80);

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
('2025-08-14 08:00:00', '2025-08-14 20:00:00', 12);

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
-- 11. ALMACEN_MATERIAL
-- =======================================================
INSERT INTO Almacen_material (id_almacen, id_instalacion, id_material, n_serie, unidades) VALUES
-- Parque Zaragoza Centro - Almacén PB
(1, 1,  1, NULL, 15),  -- Cascos
(1, 1,  2, NULL, 15),  -- Trajes
(1, 1,  3, NULL, 30),  -- Guantes
(1, 1,  4, NULL, 15),  -- Botas
(1, 1,  5, NULL, 15),  -- Cinturones
(1, 1, 19, NULL, 10),  -- Hachas
(1, 1, 20, NULL,  8),  -- Barras Halligan
(1, 1, 22, NULL, 12),  -- Radios portátiles TETRA
-- Parque Zaragoza Centro - Almacén ERA
(2, 1, 10, 30001, 8),  -- ERA completos
(2, 1, 11, NULL, 20),  -- Botellas repuesto
(2, 1, 12, NULL, 10),  -- Máscaras panorámicas
-- Parque Zaragoza Centro - Almacén Hidráulico
(3, 1,  6, 60001, 3),  -- Cizallas
(3, 1,  7, 70001, 3),  -- Expansores
(3, 1,  8, 80001, 4),  -- Cilindros
(3, 1,  9, 90001, 2),  -- Motobombas
-- Parque Zaragoza Sur
(1, 2,  1, NULL, 12),
(1, 2,  2, NULL, 12),
(1, 2, 10, 30010, 6),
(2, 2, 24, NULL, 20),  -- Mochilas forestales
(2, 2, 25, NULL, 15),  -- Pulaskis
-- Parque Huesca
(1, 3,  1, NULL, 10),
(1, 3,  2, NULL, 10),
(1, 3, 26, NULL, 6),   -- Detectores gases
(2, 3, 10, 30020, 5),
-- Parque Teruel
(1, 4,  1, NULL,  8),
(1, 4,  2, NULL,  8),
(1, 4, 10, 30025, 4);

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
INSERT INTO Persona (
    id_bombero, n_funcionario, dni, correo, telefono,
    f_ingreso_diputacion, talla_superior, talla_inferior, talla_calzado,
    nombre, apellidos, f_nacimiento,
    telefono_emergencia, domicilio, localidad,
    id_rol, activo, nombre_usuario, contrasenia
) VALUES
-- INSPECTOR
('I001', 'DGA-2008-0001', '72345678Z', 'carlos.lopez.ruiz@aragon.es',      '976111222',
 '2008-03-01', 'L',  'L',  '43', 'Carlos',    'López Ruiz',         '1975-06-14',
 '629111222', 'Calle Goya, 12, 2ºA',        'Zaragoza', 5, 1, 'c.lopez.inspector',     '$2a$12$hfZ8QeM1TRKbM9OlSvXXbuE3dScFvdVFHqYZv9A.9Y4fqHNVB1D1G'),

('I002', 'DGA-2010-0002', '33456789R', 'marta.garcia.sans@aragon.es',      '974222333',
 '2010-05-15', 'M',  'M',  '38', 'Marta',     'García Sans',        '1978-11-22',
 '636222333', 'Plaza Navarra, 5, 3ºB',      'Huesca',   5, 1, 'm.garcia.inspector',    '$2a$12$hfZ8QeM1TRKbM9OlSvXXbuE3dScFvdVFHqYZv9A.9Y4fqHNVB1D1G'),

-- JEFE DE MANDO
('M001', 'DGA-2005-0010', '22567890F', 'pedro.sanchez.vidal@aragon.es',    '976333444',
 '2005-09-01', 'XL', 'XL', '45', 'Pedro',     'Sánchez Vidal',      '1971-03-05',
 '651333444', 'Paseo de la Independencia, 8, 1ºC', 'Zaragoza', 4, 1, 'p.sanchez.mando',        '$2a$12$hfZ8QeM1TRKbM9OlSvXXbuE3dScFvdVFHqYZv9A.9Y4fqHNVB1D1G'),

('M002', 'DGA-2007-0011', '44678901H', 'ana.fernandez.gil@aragon.es',      '978444555',
 '2007-01-10', 'M',  'M',  '39', 'Ana',       'Fernández Gil',      '1974-08-17',
 '662444555', 'Calle San Francisco, 3, 4ºD', 'Teruel',   4, 1, 'a.fernandez.mando',      '$2a$12$hfZ8QeM1TRKbM9OlSvXXbuE3dScFvdVFHqYZv9A.9Y4fqHNVB1D1G'),

-- JEFE DE INTERVENCION
('J001', 'DGA-2009-0020', '55789012B', 'luis.martinez.pardo@aragon.es',    '976555666',
 '2009-04-20', 'L',  'L',  '44', 'Luis',      'Martínez Pardo',     '1976-01-28',
 '671555666', 'Avenida Cesar Augusto, 15, 2ºA', 'Zaragoza', 3, 1, 'l.martinez.jinter',     '$2a$12$hfZ8QeM1TRKbM9OlSvXXbuE3dScFvdVFHqYZv9A.9Y4fqHNVB1D1G'),

('J002', 'DGA-2011-0021', '66890123W', 'elena.romero.blasco@aragon.es',    '974666777',
 '2011-02-14', 'S',  'S',  '37', 'Elena',     'Romero Blasco',      '1980-04-09',
 '683666777', 'Calle Ramón y Cajal, 7, 1ºB', 'Huesca',   3, 1, 'e.romero.jinter',       '$2a$12$hfZ8QeM1TRKbM9OlSvXXbuE3dScFvdVFHqYZv9A.9Y4fqHNVB1D1G'),

('J003', 'DGA-2012-0022', '77901234K', 'roberto.jimenez.luna@aragon.es',   '978777888',
 '2012-06-01', 'L',  'L',  '43', 'Roberto',   'Jiménez Luna',       '1979-09-15',
 '690777888', 'Plaza del Torico, 2, 3ºC',   'Teruel',   3, 1, 'r.jimenez.jinter',      '$2a$12$hfZ8QeM1TRKbM9OlSvXXbuE3dScFvdVFHqYZv9A.9Y4fqHNVB1D1G'),

-- OFICIALES
('O001', 'DGA-2013-0030', '88012345P', 'david.navarro.rico@aragon.es',     '976888999',
 '2013-03-11', 'L',  'L',  '44', 'David',     'Navarro Rico',       '1982-12-03',
 '605888999', 'Calle Miguel Servet, 22, 5ºA','Zaragoza', 2, 1, 'd.navarro.oficial',     '$2a$12$hfZ8QeM1TRKbM9OlSvXXbuE3dScFvdVFHqYZv9A.9Y4fqHNVB1D1G'),

('O002', 'DGA-2014-0031', '99123456X', 'laura.torres.molina@aragon.es',    '974900111',
 '2014-07-07', 'M',  'M',  '38', 'Laura',     'Torres Molina',      '1984-05-20',
 '617900111', 'Calle Padre Huesca, 11, 2ºD','Huesca',   2, 1, 'l.torres.oficial',      '$2a$12$hfZ8QeM1TRKbM9OlSvXXbuE3dScFvdVFHqYZv9A.9Y4fqHNVB1D1G'),

('O003', 'DGA-2015-0032', '10234567Q', 'miguel.delgado.pons@aragon.es',    '978100200',
 '2015-01-19', 'XL', 'L',  '46', 'Miguel',    'Delgado Pons',       '1983-07-11',
 '629100200', 'Avenida Aragón, 33, 1ºB',   'Teruel',   2, 1, 'm.delgado.oficial',     '$2a$12$hfZ8QeM1TRKbM9OlSvXXbuE3dScFvdVFHqYZv9A.9Y4fqHNVB1D1G'),

('O004', 'DGA-2016-0033', '20345678G', 'sofia.moreno.castillo@aragon.es',  '976200300',
 '2016-09-05', 'S',  'S',  '36', 'Sofía',     'Moreno Castillo',    '1986-02-28',
 '651200300', 'Plaza de España, 4, 4ºA',   'Zaragoza', 2, 1, 's.moreno.oficial',      '$2a$12$hfZ8QeM1TRKbM9OlSvXXbuE3dScFvdVFHqYZv9A.9Y4fqHNVB1D1G'),

-- BOMBEROS
('B001', 'DGA-2015-0100', '30456789M', 'juan.perez.herrero@aragon.es',     '976300400',
 '2015-06-15', 'L',  'L',  '43', 'Juan',      'Pérez Herrero',      '1985-05-10',
 '660300400', 'Calle Las Armas, 5, 3ºC',   'Zaragoza', 1, 1, 'j.perez.bombero',       '$2a$12$hfZ8QeM1TRKbM9OlSvXXbuE3dScFvdVFHqYZv9A.9Y4fqHNVB1D1G'),

('B002', 'DGA-2016-0101', '40567890C', 'maria.ruiz.espinosa@aragon.es',    '976400500',
 '2016-03-01', 'M',  'M',  '39', 'María',     'Ruiz Espinosa',      '1987-08-22',
 '672400500', 'Calle Predicadores, 8, 1ºA','Zaragoza', 1, 1, 'm.ruiz.bombero',        '$2a$12$hfZ8QeM1TRKbM9OlSvXXbuE3dScFvdVFHqYZv9A.9Y4fqHNVB1D1G'),

('B003', 'DGA-2017-0102', '50678901D', 'alberto.gonzalez.vera@aragon.es',  '976500600',
 '2017-09-18', 'XL', 'XL', '45', 'Alberto',   'González Vera',      '1988-03-14',
 '681500600', 'Avenida Goya, 40, 2ºB',     'Zaragoza', 1, 1, 'a.gonzalez.bombero',    '$2a$12$hfZ8QeM1TRKbM9OlSvXXbuE3dScFvdVFHqYZv9A.9Y4fqHNVB1D1G'),

('B004', 'DGA-2018-0103', '60789012V', 'paula.lopez.sainz@aragon.es',      '976600700',
 '2018-01-08', 'S',  'S',  '37', 'Paula',     'López Sainz',        '1990-11-05',
 '696600700', 'Calle Alfonso I, 16, 3ºD',  'Zaragoza', 1, 1, 'p.lopez.bombero',       '$2a$12$hfZ8QeM1TRKbM9OlSvXXbuE3dScFvdVFHqYZv9A.9Y4fqHNVB1D1G'),

('B005', 'DGA-2019-0104', '70890123N', 'sergio.martin.bravo@aragon.es',    '976700800',
 '2019-04-29', 'L',  'L',  '44', 'Sergio',    'Martín Bravo',       '1991-07-18',
 '617700800', 'Plaza San Pedro Nolasco, 3, 1ºA','Zaragoza', 1, 1, 's.martin.bombero',  '$2a$12$hfZ8QeM1TRKbM9OlSvXXbuE3dScFvdVFHqYZv9A.9Y4fqHNVB1D1G'),

('B006', 'DGA-2020-0105', '80901234J', 'carla.garcia.pla@aragon.es',       '974800900',
 '2020-02-17', 'M',  'M',  '38', 'Carla',     'García Pla',         '1992-01-30',
 '629800900', 'Calle Padre Huesca, 9, 2ºC','Huesca',   1, 1, 'c.garcia.bombero',      '$2a$12$hfZ8QeM1TRKbM9OlSvXXbuE3dScFvdVFHqYZv9A.9Y4fqHNVB1D1G'),

('B007', 'DGA-2021-0106', '91012345S', 'andres.fernandez.mora@aragon.es',  '974900100',
 '2021-09-01', 'L',  'L',  '43', 'Andrés',    'Fernández Mora',     '1993-05-07',
 '651900100', 'Avenida Martínez de Velasco, 14, 4ºB','Huesca', 1, 1, 'a.fernandez.bombero', '$2a$12$hfZ8QeM1TRKbM9OlSvXXbuE3dScFvdVFHqYZv9A.9Y4fqHNVB1D1G'),

('B008', 'DGA-2022-0107', '01123456T', 'irene.torres.valls@aragon.es',     '978900200',
 '2022-03-14', 'M',  'S',  '38', 'Irene',     'Torres Valls',       '1994-09-21',
 '662900200', 'Calle San Francisco, 7, 3ºA','Teruel',  1, 1, 'i.torres.bombero',      '$2a$12$hfZ8QeM1TRKbM9OlSvXXbuE3dScFvdVFHqYZv9A.9Y4fqHNVB1D1G'),

('B009', 'DGA-2022-0108', '11234567Z', 'victor.sanchez.abad@aragon.es',    '978100300',
 '2022-06-20', 'L',  'L',  '42', 'Víctor',    'Sánchez Abad',       '1993-12-15',
 '671100300', 'Avenida Sagunto, 55, 2ºB',  'Teruel',  1, 1, 'v.sanchez.bombero',     '$2a$12$hfZ8QeM1TRKbM9OlSvXXbuE3dScFvdVFHqYZv9A.9Y4fqHNVB1D1G'),

('B010', 'DGA-2023-0109', '21345678R', 'noelia.jimenez.lara@aragon.es',    '976200400',
 '2023-01-09', 'M',  'M',  '38', 'Noelia',    'Jiménez Lara',       '1995-03-28',
 '683200400', 'Calle Costa, 6, 1ºD',       'Zaragoza', 1, 1, 'n.jimenez.bombero',     '$2a$12$hfZ8QeM1TRKbM9OlSvXXbuE3dScFvdVFHqYZv9A.9Y4fqHNVB1D1G'),

('B011', 'DGA-2023-0110', '31456789F', 'oscar.morales.vera@aragon.es',     '976300500',
 '2023-05-22', 'XL', 'XL', '46', 'Óscar',     'Morales Vera',       '1994-06-11',
 '690300500', 'Paseo Echegaray y Caballero, 12, 5ºC','Zaragoza', 1, 1, 'o.morales.bombero', '$2a$12$hfZ8QeM1TRKbM9OlSvXXbuE3dScFvdVFHqYZv9A.9Y4fqHNVB1D1G'),

('B012', 'DGA-2024-0111', '41567890H', 'diana.ruiz.gascon@aragon.es',      '974400600',
 '2024-02-01', 'S',  'S',  '36', 'Diana',     'Ruiz Gascón',        '1996-10-04',
 '605400600', 'Calle Coso Alto, 3, 2ºA',   'Huesca',   1, 1, 'd.ruiz.bombero',        '$2a$12$hfZ8QeM1TRKbM9OlSvXXbuE3dScFvdVFHqYZv9A.9Y4fqHNVB1D1G'),

-- Bombero inactivo (baja)
('B099', 'DGA-2010-0099', '51678901B', 'marcos.ibarra.gil@aragon.es',      '976500700',
 '2010-11-03', 'L',  'L',  '44', 'Marcos',    'Ibarra Gil',         '1980-02-17',
 '617500700', 'Calle Zurita, 18, 4ºB',     'Zaragoza', 1, 0, 'm.ibarra.baja',         NULL);

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
('B012',  1, 'CASCO-HU-003'), ('B012',  2, 'TRAJE-HU-003'), ('B012', 10, 'ERA-HU-003');

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
('J002', '2025-12-01 14:00:00', 'Rescate de senderista con fractura de tobillo en zona de barrancos, Riglos. Colaboración con GRS.',                         'ACTIVA',  'Mallos de Riglos, barranc sur',    'Acompañante',       '695334411', 9);

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
('9012HJK', 15, '2025-12-01 14:09:00',  NULL,                  NULL);

-- =======================================================
-- 17. EMERGENCIA_VEHICULO_PERSONA
-- =======================================================
INSERT INTO Emergencia_Vehiculo_Persona (id_bombero, matricula, id_emergencia, cargo) VALUES
-- Emergencia 1 - Incendio vivienda
('I001', '1122KLM', 1, 'Mando incidente'),
('J001', '3421BCP', 1, 'Jefe de intervención'),
('B001', '3421BCP', 1, 'Bombero extinción'),
('B002', '3421BCP', 1, 'Bombero extinción'),
('O001', '5678DFG', 1, 'Oficial'),
('B003', '5678DFG', 1, 'Bombero extinción'),
('B004', '5678DFG', 1, 'Bombero extinción'),
-- Emergencia 2 - Accidente tráfico A-2
('J001', '3421BCP', 2, 'Jefe de intervención'),
('B001', '3421BCP', 2, 'Bombero rescate'),
('B002', '3421BCP', 2, 'Bombero rescate'),
('O001', '5678DFG', 2, 'Oficial'),
('B003', '5678DFG', 2, 'Bombero rescate'),
-- Emergencia 3 - Incendio forestal Huesca
('J002', '4455GHK', 3, 'Jefe de intervención'),
('B006', '4455GHK', 3, 'Bombero forestal'),
('B007', '8899PQR', 3, 'Bombero forestal'),
-- Emergencia 6 - Incendio nave industrial
('M001', '1122KLM', 6, 'Mando incidente'),
('J001', '3421BCP', 6, 'Jefe de intervención'),
('B001', '3421BCP', 6, 'Bombero extinción'),
('B005', '3421BCP', 6, 'Bombero extinción'),
('O004', '5678DFG', 6, 'Oficial'),
('B002', '5678DFG', 6, 'Bombero extinción'),
('O001', '7788VWX', 6, 'Oficial apoyo'),
('B010', '7788VWX', 6, 'Bombero extinción'),
-- Emergencia 14 - MMPP en AP-2 (activa)
('M001', '1122KLM', 14, 'Mando incidente MMPP'),
('J001', '3344NOP', 14, 'Jefe intervención MMPP'),
('B001', '3344NOP', 14, 'Especialista MMPP'),
('B005', '3344NOP', 14, 'Especialista MMPP'),
-- Emergencia 15 - Rescate montaña (activa)
('J002', '6677LMN', 15, 'Jefe de intervención rescate'),
('B006', '6677LMN', 15, 'Bombero rescate montaña'),
('B007', '9012HJK', 15, 'Bombero rescate montaña');

-- =======================================================
-- 18. PERSONA_EDICION
-- =======================================================
INSERT INTO Persona_Edicion (id_formacion, id_edicion, id_bombero) VALUES
-- Formación 1 - Incendios forestales ed.1
(1, 1, 'J001'), (1, 1, 'J002'), (1, 1, 'O001'), (1, 1, 'B001'), (1, 1, 'B002'),
(1, 1, 'B003'), (1, 1, 'B006'), (1, 1, 'B007'),
-- Formación 1 - Incendios forestales ed.2
(1, 2, 'B004'), (1, 2, 'B005'), (1, 2, 'B008'), (1, 2, 'B009'), (1, 2, 'B010'),
(1, 2, 'B011'), (1, 2, 'B012'),
-- Formación 2 - Rescate tráfico ed.1
(2, 1, 'J001'), (2, 1, 'O001'), (2, 1, 'B001'), (2, 1, 'B002'), (2, 1, 'B003'),
-- Formación 2 - Rescate tráfico ed.2
(2, 2, 'J003'), (2, 2, 'O003'), (2, 2, 'B008'), (2, 2, 'B009'),
-- Formación 3 - SVB ed.1
(3, 1, 'B001'), (3, 1, 'B002'), (3, 1, 'B003'), (3, 1, 'B004'), (3, 1, 'B005'),
(3, 1, 'B006'), (3, 1, 'B007'), (3, 1, 'B008'),
-- Formación 3 - SVB ed.2
(3, 2, 'B009'), (3, 2, 'B010'), (3, 2, 'B011'), (3, 2, 'B012'),
-- Formación 4 - Rescate montaña
(4, 1, 'J002'), (4, 1, 'B006'), (4, 1, 'B007'), (4, 1, 'B012'),
-- Formación 5 - MMPP
(5, 1, 'M001'), (5, 1, 'J001'), (5, 1, 'B001'), (5, 1, 'B005');

-- =======================================================
-- 19. PERSONA_TURNO
-- =======================================================
INSERT INTO Persona_Turno (id_turno, id_bombero) VALUES
-- Turno verano julio 2024
(1, 'B001'), (1, 'B002'), (1, 'B006'), (1, 'B007'),
(2, 'B003'), (2, 'B004'), (2, 'B008'), (2, 'B009'),
-- Navidad 2024
(3, 'B005'), (3, 'O001'), (3, 'B010'),
(4, 'B011'), (4, 'O002'), (4, 'B012'),
-- Verano 2025
(6, 'B001'), (6, 'B002'), (6, 'B006'),
(7, 'B003'), (7, 'B008'), (7, 'B010'),
(8, 'B004'), (8, 'B007'), (8, 'B009');

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
('3045XYA', 'O003', '2025-05-18 07:00:00', '2025-05-18 15:00:00', 12100, 12230);

-- =======================================================
-- 21. CARNET
-- =======================================================
INSERT INTO Carnet (nombre, categoria, duracion_meses) VALUES
('Permiso de Conducción B',   'B',   120),  -- Turismo/furgoneta <3.500 kg
('Permiso de Conducción C',   'C',   60),   -- Camiones >3.500 kg
('Permiso de Conducción C+E', 'C+E', 60),   -- Camión con remolque
('Permiso de Conducción D',   'D',   60),   -- Autobuses
('CAP Mercancías',            'CAP', 60),   -- Certificado Aptitud Profesional mercancías
('CAP Viajeros',              'CAP', 60),   -- Certificado Aptitud Profesional viajeros
('ADR Básico',                'ADR', 60),   -- Transporte mercancías peligrosas (básico)
('ADR Clase 1 y 7',           'ADR', 60),   -- Explosivos y radiactivos
('Patrón de Embarcación de Recreo','PER', 120),  -- Embarcaciones hasta 6 millas
('Grúa Torre',                'Operador', 36),   -- Operador de grúa torre
('Elevadora Telescópica',     'Operador', 36);   -- Plataforma elevadora telescópica

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
('B012', 1, '2021-06-15', '2041-06-15');

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
 '2025-02-10 08:00:00', 'O004');

-- =======================================================
-- 24. PERSONA_RECIBE_AVISO
-- =======================================================
INSERT INTO Persona_Recibe_Aviso (id_aviso, id_bombero) VALUES
-- Aviso 1 - Revisión EPI - todo el personal activo
(1,'I001'),(1,'I002'),(1,'M001'),(1,'M002'),(1,'J001'),(1,'J002'),(1,'J003'),
(1,'O001'),(1,'O002'),(1,'O003'),(1,'O004'),
(1,'B001'),(1,'B002'),(1,'B003'),(1,'B004'),(1,'B005'),
(1,'B006'),(1,'B007'),(1,'B008'),(1,'B009'),(1,'B010'),(1,'B011'),(1,'B012'),
-- Aviso 2 - Simulacro MMPP - personal Zaragoza
(2,'M001'),(2,'J001'),(2,'O001'),(2,'O004'),
(2,'B001'),(2,'B002'),(2,'B003'),(2,'B004'),(2,'B005'),(2,'B010'),(2,'B011'),
-- Aviso 3 - Cambio guardia - Zaragoza
(3,'J001'),(3,'O001'),(3,'O004'),(3,'B001'),(3,'B002'),(3,'B003'),
-- Aviso 4 - Formación SVB
(4,'B009'),(4,'B010'),(4,'B011'),(4,'B012'),
-- Aviso 5 - Mantenimiento
(5,'M001'),(5,'M002'),(5,'J001'),(5,'J002'),(5,'J003'),
-- Aviso 6 - Alerta meteorológica - todo el personal
(6,'I001'),(6,'I002'),(6,'M001'),(6,'M002'),(6,'J001'),(6,'J002'),(6,'J003'),
(6,'O001'),(6,'O002'),(6,'O003'),(6,'O004'),
(6,'B001'),(6,'B002'),(6,'B003'),(6,'B004'),(6,'B005'),
(6,'B006'),(6,'B007'),(6,'B008'),(6,'B009'),(6,'B010'),(6,'B011'),(6,'B012'),
-- Aviso 7 - Nuevos compañeros
(7,'J001'),(7,'O001'),(7,'O004'),(7,'B001'),(7,'B002'),(7,'B003'),
-- Aviso 8 - Vacaciones - todo el personal
(8,'I001'),(8,'I002'),(8,'M001'),(8,'M002'),(8,'J001'),(8,'J002'),(8,'J003'),
(8,'O001'),(8,'O002'),(8,'O003'),(8,'O004'),
(8,'B001'),(8,'B002'),(8,'B003'),(8,'B004'),(8,'B005'),
(8,'B006'),(8,'B007'),(8,'B008'),(8,'B009'),(8,'B010'),(8,'B011'),(8,'B012');

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
('2025-12-31', '20:00:00', '08:00:00', 'Guardia Nochevieja. Protocolo especial pirotecnia.');

-- =======================================================
-- 26. PERSONA_HACE_GUARDIA
-- =======================================================
INSERT INTO Persona_Hace_Guardia (id_bombero, id_guardia, cargo) VALUES
-- Guardia 1 - 6 enero mañana
('M001', 1, 'Mando de guardia'), ('J001', 1, 'Jefe intervención'),
('O001', 1, 'Oficial'),         ('B001', 1, 'Bombero'),
('B002', 1, 'Bombero'),         ('B003', 1, 'Bombero'),
-- Guardia 3 - 1 feb mañana
('J001', 3, 'Jefe intervención'), ('O004', 3, 'Oficial'),
('B004', 3, 'Bombero'),           ('B005', 3, 'Bombero'),
-- Guardia 6 - Semana Santa
('M001', 6, 'Mando de guardia'), ('J001', 6, 'Jefe intervención'),
('O001', 6, 'Oficial'),          ('B001', 6, 'Bombero'),
('B002', 6, 'Bombero'),          ('B010', 6, 'Bombero'),
-- Guardia 8 - 15 julio mañana (alerta forestal)
('M001', 8, 'Mando de guardia'), ('J001', 8, 'Jefe intervención'),
('J002', 8, 'Jefe intervención apoyo'), ('O001', 8, 'Oficial'),
('O002', 8, 'Oficial apoyo'),    ('B001', 8, 'Bombero'),
('B002', 8, 'Bombero'),          ('B006', 8, 'Bombero forestal'),
('B007', 8, 'Bombero forestal'),
-- Guardia 10 - 15 agosto (alerta máxima)
('M002', 10, 'Mando de guardia'), ('J003', 10, 'Jefe intervención'),
('O003', 10, 'Oficial'),          ('B008', 10, 'Bombero'),
('B009', 10, 'Bombero'),
-- Guardia 12 - Nochebuena
('J001', 12, 'Jefe intervención'), ('O004', 12, 'Oficial'),
('B003', 12, 'Bombero'),           ('B011', 12, 'Bombero'),
-- Guardia 13 - Nochevieja
('J001', 13, 'Jefe intervención'), ('O001', 13, 'Oficial'),
('B004', 13, 'Bombero'),           ('B012', 13, 'Bombero');

-- =======================================================
-- 27. MERITO
-- =======================================================
INSERT INTO Merito (nombre, descripcion) VALUES
('Cruz al Mérito de Protección Civil',        'Distinción otorgada por la Dirección General de Protección Civil y Emergencias por servicios destacados'),
('Medalla al Mérito del Cuerpo de Bomberos',  'Distinción interna del cuerpo por trayectoria profesional ejemplar'),
('Felicitación Pública por Actuación Destacada', 'Reconocimiento público por intervención de especial relevancia o riesgo'),
('10 años de servicio',                       'Reconocimiento por una década de servicio continuado en el cuerpo'),
('20 años de servicio',                       'Reconocimiento por dos décadas de servicio continuado en el cuerpo'),
('Rescate con riesgo para la propia vida',    'Reconocimiento específico por rescate de víctimas asumiendo riesgo extraordinario');

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
('B099', 4), ('B099', 5);

-- =======================================================
-- 29. VEHICULO_CARGA_MATERIAL
-- =======================================================
INSERT INTO Vehiculo_Carga_Material (id_material, matricula, nserie, unidades) VALUES
-- Autobomba ZC-01
(1,  '3421BCP', NULL, 4),   -- Cascos
(10, '3421BCP', 'ERA-VH-001', 4),  -- ERA
(22, '3421BCP', NULL, 4),   -- Radios TETRA
(26, '3421BCP', NULL, 2),   -- Detectores gases
(27, '3421BCP', 'TERMO-001', 1),  -- Cámara termográfica
-- Autobomba ZC-02
(1,  '5678DFG', NULL, 4),
(10, '5678DFG', 'ERA-VH-005', 4),
(6,  '5678DFG', 'CIZ-VH-001', 1),  -- Cizalla
(7,  '5678DFG', 'EXP-VH-001', 1),  -- Expansor
-- Autoescala ZC-03
(1,  '7890GHJ', NULL, 2),
(10, '7890GHJ', 'ERA-VH-009', 2),
(22, '7890GHJ', NULL, 2),
-- Vehículo mando ZC-04
(22, '1122KLM', NULL, 2),
(26, '1122KLM', NULL, 1),
-- Unidad MMPP ZC-05
(22, '3344NOP', NULL, 4),
(26, '3344NOP', NULL, 4),
(27, '3344NOP', 'TERMO-002', 1),
-- Autobomba forestal ZC-06
(1,  '5566RST', NULL, 2),
(24, '5566RST', NULL, 4),   -- Mochilas forestales
(25, '5566RST', NULL, 4),   -- Pulaskis
-- Parque Huesca
(1,  '4455GHK', NULL, 4),
(10, '4455GHK', 'ERA-VH-013', 4),
(22, '4455GHK', NULL, 4),
(24, '8899PQR', NULL, 4),
(25, '8899PQR', NULL, 4),
-- Parque Teruel
(1,  '1023STW', NULL, 3),
(10, '1023STW', 'ERA-VH-017', 3),
(22, '1023STW', NULL, 3);

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
(27, 'J002', '4455GHK', '2025-07-10', 'Cámara termográfica con imagen degradada en incendio forestal. Se solicita revisión del sensor.',                     'ABIERTA', 'Avería equipo');

-- =======================================================
-- 31. MOTIVO
-- =======================================================
INSERT INTO Motivo (nombre, dias) VALUES
('Asuntos propios',                     6),   -- 6 días al año según convenio DGA
('Enfermedad o accidente no laboral',   0),   -- Duración variable, IT
('Accidente laboral',                   0),   -- Duración variable, IT laboral
('Matrimonio o pareja de hecho',       15),
('Nacimiento o adopción de hijo',      16),   -- Según convenio colectivo
('Fallecimiento de familiar 1er grado', 3),
('Fallecimiento de familiar 2o grado',  2),
('Mudanza de domicilio',                1),
('Deber inexcusable de carácter público',0),  -- Juzgado, oposiciones, etc.
('Lactancia',                           0),   -- Reducción de jornada
('Permiso de formación oficial',        0),   -- Curso formación reconocido por DGA
('Conciliación familiar',               0);   -- A criterio de jefatura

-- =======================================================
-- 32. PERMISO
-- =======================================================
INSERT INTO Permiso (cod_motivo, id_bombero, fecha, h_inicio, h_fin, estado, descripcion) VALUES
(1,  'B001', '2025-02-14', '08:00:00', '20:00:00', 'ACEPTADO',  'Día de asuntos propios para gestión personal'),
(1,  'B003', '2025-03-28', '08:00:00', '20:00:00', 'ACEPTADO',  'Día de asuntos propios'),
(4,  'B004', '2025-04-05', NULL,       NULL,        'ACEPTADO',  'Permiso matrimonio. Boda civil el 5 de abril en Zaragoza'),
(5,  'O002', '2025-06-10', NULL,       NULL,        'ACEPTADO',  'Permiso nacimiento hijo. Parto el día 10 de junio'),
(6,  'B007', '2025-01-22', NULL,       NULL,        'ACEPTADO',  'Fallecimiento padre. Enterramiento el 22 de enero en Huesca'),
(1,  'B010', '2025-08-04', '08:00:00', '20:00:00', 'REVISION',  'Solicitud día de asuntos propios, pendiente confirmar cobertura guardia'),
(11, 'J002', '2025-09-15', '08:00:00', '20:00:00', 'ACEPTADO',  'Asistencia a curso de rescate en montaña GRS en Jaca'),
(1,  'B005', '2025-10-31', '08:00:00', '20:00:00', 'DENEGADO',  'Solicitud asuntos propios. Denegada por falta de cobertura mínima de guardia'),
(8,  'B002', '2025-11-08', '08:00:00', '20:00:00', 'ACEPTADO',  'Mudanza a nueva vivienda en Zaragoza'),
(1,  'B012', '2025-12-26', '08:00:00', '20:00:00', 'REVISION',  'Solicitud día libre después de Navidad. Pendiente revisión cuadrante');

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
('O002', 'ABIERTO',   '2025-11-10', NULL,          'Mantenimiento correctivo del vehículo BZS-02 (9900YZB). Avería en el sistema de bombeo de agua. Pendiente diagnóstico taller.');

INSERT INTO Mantenimiento_Persona (cod_mantenimiento, id_bombero) VALUES
(1, 'O001'), (1, 'B001'), (1, 'B002'),
(2, 'O001'), (2, 'B003'),
(3, 'O003'), (3, 'B008'), (3, 'B009'),
(4, 'O002'), (4, 'B006'),
(5, 'O001'), (5, 'B001'),
(6, 'O004'), (6, 'B004'), (6, 'B005'),
(7, 'O001'), (7, 'B001'), (7, 'B006'), (7, 'B007'),
(8, 'O002'), (8, 'B010');

INSERT INTO Mantenimiento_Vehiculo (cod_mantenimiento, matricula) VALUES
(2, '5678DFG'),
(3, '1023STW'), (3, '3045XYA'), (3, '5067BCD'),
(5, '7890GHJ'),
(7, '5566RST'), (7, '2233CDF'), (7, '8899PQR'),
(8, '9900YZB');

INSERT INTO Mantenimiento_Material (cod_mantenimiento, cod_material) VALUES
(1, 10), (1, 11), (1, 12),
(2,  6), (2,  7), (2,  8), (2,  9),
(4, 26),
(6, 16),
(7, 24), (7, 25);

SET FOREIGN_KEY_CHECKS = 1;

