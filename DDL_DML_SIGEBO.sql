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
    FOREIGN KEY (id_almacen, id_instalacion) REFERENCES Almacen_Instalacion(id_almacen, id_instalacion)
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
    id_registro INT AUTO_INCREMENT,
    matricula VARCHAR(15),
    f_recogida TIMESTAMP NOT NULL,
    f_entrega TIMESTAMP NOT NULL,
    km_inicio INT NOT NULL,
    km_fin INT NOT NULL,
    PRIMARY KEY (id_registro, matricula),
    CHECK (km_fin >= km_inicio),
    CHECK (f_entrega >= f_recogida),
    FOREIGN KEY (matricula) REFERENCES Vehiculo(matricula)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   21. SALIDA_PERSONA
   ======================= */
CREATE TABLE Salida_Persona (
    id_registro INT,
    matricula VARCHAR(15),
    id_bombero VARCHAR(4),
    fecha TIMESTAMP NOT NULL,
    PRIMARY KEY (id_registro, matricula, id_bombero),
    FOREIGN KEY (id_registro, matricula) REFERENCES Salida(id_registro, matricula)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_bombero) REFERENCES Persona(id_bombero)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   22. CARNET
   ======================= */
CREATE TABLE Carnet (
    id_carnet INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    categoria VARCHAR(20) NOT NULL,
    duracion_meses INT NOT NULL,
    CHECK (duracion_meses > 0)
);

/* =======================
   23. CARNET_PERSONA
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
   24. AVISO
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
   25. PERSONA_RECIBE_AVISO
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
   26. GUARDIA
   ======================= */
CREATE TABLE Guardia (
    id_guardia INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    h_inicio TIME NOT NULL,
    h_fin TIME NOT NULL,
    notas TEXT,
    CHECK (h_fin > h_inicio)
);

/* =======================
   27. PERSONA_HACE_GUARDIA
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
   28. MERITO
   ======================= */
CREATE TABLE Merito (
    id_merito INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL
);

/* =======================
   29. PERSONA_TIENE_MERITO
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
   30. VEHICULO_CARGA_MATERIAL
   ======================= */
CREATE TABLE Vehiculo_Carga_Material (
    id_material INT,
    matricula VARCHAR(15),
    nserie VARCHAR(50),
    unidades INT,
    PRIMARY KEY (id_material, matricula),
    CHECK (unidades > 0),
    FOREIGN KEY (id_material) REFERENCES Material(id_material),
    FOREIGN KEY (matricula) REFERENCES Vehiculo(matricula)
);

/* =======================
   31. INCIDENCIA
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
   32. MOTIVO
   ======================= */
CREATE TABLE Motivo (
    cod_motivo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    dias INT NOT NULL
);

/* =======================
   33. PERMISO
   ======================= */
CREATE TABLE Permiso (
    id_permiso INT AUTO_INCREMENT PRIMARY KEY,
    cod_motivo INT,
    fecha DATE NOT NULL,
    h_inicio TIME,
    h_fin TIME,
    estado ENUM('ACEPTADO','REVISION','DENEGADO') NOT NULL,
    descripcion VARCHAR(255),
    FOREIGN KEY (cod_motivo) REFERENCES Motivo(cod_motivo)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

/* =======================
   34. MANTENIMIENTO
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
   DATOS DE EJEMPLO
   ======================= */

/* =======================
   1. FORMACION
   ======================= */
INSERT INTO Formacion (nombre, descripcion)
VALUES ('Prevención Incendios', 'Curso básico de prevención de incendios');

/* =======================
   2. EDICION
   ======================= */
INSERT INTO Edicion (id_formacion, f_inicio, f_fin, horas)
VALUES (1, '2024-01-10', '2024-01-20', 40);

/* =======================
   3. TURNO_REFUERZO
   ======================= */
INSERT INTO Turno_refuerzo (f_inicio, f_fin, horas)
VALUES ('2024-02-01 08:00:00', '2024-02-01 16:00:00', 8);

/* =======================
   4. ROL (COMPLETA)
   ======================= */
INSERT INTO Rol (id_rol, nombre, descripcion) VALUES
(1, 'BOMBERO', 'Bombero operativo'),
(2, 'OFICIAL', 'Oficial de guardia'),
(3, 'JEFE DE INTERVENCIÓN', 'Jefe de intervención'),
(4, 'JEFE DE MANDO', 'Jefe de mando'),
(5, 'INSPECTOR', 'Inspector del cuerpo');

/* =======================
   5. TIPO_EMERGENCIA
   ======================= */
INSERT INTO Tipo_emergencia (nombre, grupo)
VALUES ('Incendio urbano', 'Incendios');

/* =======================
   6. CATEGORIA
   ======================= */
INSERT INTO Categoria (nombre, inventariable)
VALUES ('Protección personal', TRUE);

/* =======================
   7. MATERIAL
   ======================= */
INSERT INTO Material (id_categoria, nombre, descripcion, estado)
VALUES (1, 'Casco', 'Casco ignífugo', 'ALTA');

/* =======================
   8. LOCALIDAD
   ======================= */
INSERT INTO Localidad (localidad, provincia)
VALUES ('Almería', 'Almería');

/* =======================
   9. INSTALACION
   ======================= */
INSERT INTO Instalacion (nombre, direccion, telefono, correo, localidad)
VALUES ('Parque Central', 'Calle Fuego 1', '950000000', 'parque@bomberos.es', 'Almería');

/* =======================
   10. ALMACEN
   ======================= */
INSERT INTO Almacen (planta, nombre)
VALUES (0, 'Almacén Principal');

INSERT INTO Almacen_Instalacion (id_almacen, id_instalacion)
VALUES (1, 1);

/* =======================
   11. ALMACEN_MATERIAL
   ======================= */
INSERT INTO Almacen_material (id_almacen, id_instalacion, id_material, n_serie, unidades)
VALUES (1, 1, 1, 1001, 10);

/* =======================
   12. VEHICULO
   ======================= */
INSERT INTO Vehiculo
(matricula, nombre, id_instalacion, marca, modelo, tipo, disponibilidad)
VALUES
('1234ABC', 'Bomba 1', 1, 'Mercedes', 'Atego', 'Camión', 1);

/* =======================
   13. PERSONA (INSPECTOR id_rol = 5)
   ======================= */
INSERT INTO Persona (
    id_bombero, n_funcionario, dni, correo, telefono,
    f_ingreso_diputacion, nombre, apellidos, f_nacimiento,
    localidad, id_rol, activo, nombre_usuario, contrasenia
) VALUES (
    'B001', 'FUNC001', '12345678A', 'inspector@bomberos.es', '600000000',
    '2015-01-01', 'Juan', 'Pérez Inspector', '1985-05-10',
    'Almería', 5, 1, 'inspector1', 'hashpassword'
);

/* =======================
   14. PERSONA_MATERIAL
   ======================= */
INSERT INTO Persona_Material (id_bombero, id_material, nserie)
VALUES ('B001', 1, 'CASCO-001');

/* =======================
   15. EMERGENCIA
   ======================= */
INSERT INTO Emergencia (id_bombero, fecha, descripcion, estado, direccion, codigo_tipo)
VALUES ('B001', NOW(), 'Incendio en vivienda', 'ACTIVA', 'Calle Mayor 10', 1);

/* =======================
   16. EMERGENCIA_VEHICULO
   ======================= */
INSERT INTO Emergencia_Vehiculo (matricula, id_emergencia, f_salida)
VALUES ('1234ABC', 1, NOW());

/* =======================
   17. EMERGENCIA_VEHICULO_PERSONA
   ======================= */
INSERT INTO Emergencia_Vehiculo_Persona
(id_bombero, matricula, id_emergencia, cargo)
VALUES ('B001', '1234ABC', 1, 'Inspector');

/* =======================
   18. PERSONA_EDICION
   ======================= */
INSERT INTO Persona_Edicion (id_formacion, id_edicion, id_bombero)
VALUES (1, 1, 'B001');

/* =======================
   19. PERSONA_TURNO
   ======================= */
INSERT INTO Persona_Turno (id_turno, id_bombero)
VALUES (1, 'B001');

/* =======================
   20. SALIDA
   ======================= */
INSERT INTO Salida (matricula, f_recogida, f_entrega, km_inicio, km_fin)
VALUES ('1234ABC', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 10000, 10050);

/* =======================
   21. SALIDA_PERSONA
   ======================= */
INSERT INTO Salida_Persona (id_registro, matricula, id_bombero, fecha)
VALUES (1, '1234ABC', 'B001', NOW());

/* =======================
   22. CARNET
   ======================= */
INSERT INTO Carnet (nombre, categoria, duracion_meses)
VALUES ('Carnet C', 'Camión', 120);

/* =======================
   23. CARNET_PERSONA
   ======================= */
INSERT INTO Carnet_Persona (id_bombero, id_carnet, f_obtencion, f_vencimiento)
VALUES ('B001', 1, '2020-01-01', '2030-01-01');

/* =======================
   24. AVISO
   ======================= */
INSERT INTO Aviso (asunto, mensaje, fecha, remitente)
VALUES ('Aviso general', 'Revisión de material', NOW(), 'B001');

/* =======================
   25. PERSONA_RECIBE_AVISO
   ======================= */
INSERT INTO Persona_Recibe_Aviso (id_aviso, id_bombero)
VALUES (1, 'B001');

/* =======================
   26. GUARDIA
   ======================= */
INSERT INTO Guardia (fecha, h_inicio, h_fin)
VALUES ('2024-03-01', '08:00:00', '16:00:00');

/* =======================
   27. PERSONA_HACE_GUARDIA
   ======================= */
INSERT INTO Persona_Hace_Guardia (id_bombero, id_guardia, cargo)
VALUES ('B001', 1, 'Inspector');

/* =======================
   28. MERITO
   ======================= */
INSERT INTO Merito (nombre, descripcion)
VALUES ('Actuación destacada', 'Intervención ejemplar');

/* =======================
   29. PERSONA_TIENE_MERITO
   ======================= */
INSERT INTO Persona_Tiene_Merito (id_bombero, id_merito)
VALUES ('B001', 1);

/* =======================
   30. VEHICULO_CARGA_MATERIAL
   ======================= */
INSERT INTO Vehiculo_Carga_Material (id_material, matricula, nserie, unidades)
VALUES (1, '1234ABC', 'CASCO-001', 2);

/* =======================
   31. INCIDENCIA
   ======================= */
INSERT INTO Incidencia
(id_material, id_bombero, matricula, fecha, asunto, estado)
VALUES (1, 'B001', '1234ABC', CURDATE(), 'Casco dañado', 'ABIERTA');

/* =======================
   32. MOTIVO
   ======================= */
INSERT INTO Motivo (nombre, dias)
VALUES ('Asuntos propios', 2);

/* =======================
   33. PERMISO
   ======================= */
INSERT INTO Permiso (cod_motivo, fecha, estado)
VALUES (1, CURDATE(), 'REVISION');

/* =======================
   34. MANTENIMIENTO
   ======================= */
INSERT INTO Mantenimiento
(id_bombero, estado, f_inicio, descripcion)
VALUES ('B001', 'ABIERTO', CURDATE(), 'Revisión general');

INSERT INTO Mantenimiento_Persona (cod_mantenimiento, id_bombero)
VALUES (1, 'B001');

INSERT INTO Mantenimiento_Vehiculo (cod_mantenimiento, matricula)
VALUES (1, '1234ABC');

INSERT INTO Mantenimiento_Material (cod_mantenimiento, cod_material)
VALUES (1, 1);

/* =======================
   Función para obtener id_edicion automático
   ======================= */
DELIMITER $$

CREATE FUNCTION siguiente_id_edicion(p_id_formacion INT)
RETURNS INT
NOT DETERMINISTIC
BEGIN
    DECLARE v_id_edicion INT;
    
    SELECT COALESCE(MAX(id_edicion), 0) + 1
    INTO v_id_edicion
    FROM Edicion
    WHERE id_formacion = p_id_formacion;
    
    RETURN v_id_edicion;
END$$

DELIMITER ;
