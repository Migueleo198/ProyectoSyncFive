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

/* Trigger para asignar id_edicion automáticamente */
DELIMITER $$

CREATE TRIGGER trg_edicion_before_insert
BEFORE INSERT ON Edicion
FOR EACH ROW
BEGIN
    IF NEW.id_edicion IS NULL THEN
        SET NEW.id_edicion = (
            SELECT COALESCE(MAX(id_edicion), 0) + 1
            FROM Edicion
            WHERE id_formacion = NEW.id_formacion
        );
    END IF;
END$$

DELIMITER ;


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
    id_almacen INT AUTO_INCREMENT PRIMARY KEY,
    planta INT NOT NULL,
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE Almacen_Instalacion (
    id_almacen INT,
    id_instalacion INT,
    PRIMARY KEY (id_almacen, id_instalacion),
    FOREIGN KEY (id_almacen) REFERENCES Almacen(id_almacen)
        ON UPDATE CASCADE ON DELETE RESTRICT,
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

SET FOREIGN_KEY_CHECKS = 0;

/* 1. FORMACION */
INSERT INTO Formacion (nombre, descripcion) VALUES
('Primeros Auxilios', 'Atención básica en emergencias'),
('Conducción de Vehículos de Emergencia', 'Uso seguro de vehículos'),
('Rescate en Altura', 'Técnicas de rescate vertical');

/* 2. EDICION */
INSERT INTO Edicion VALUES
(1, 1, '2024-01-10', '2024-01-20', 40),
(2, 1, '2024-03-01', '2024-03-10', 30),
(1, 2, '2024-02-05', '2024-02-15', 25);

/* 3. TURNO_REFUERZO */
INSERT INTO Turno_refuerzo (f_inicio, f_fin, horas) VALUES
('2024-06-01 08:00:00','2024-06-01 20:00:00',12),
('2024-06-02 20:00:00','2024-06-03 08:00:00',12);

/* 4. ROL */
INSERT INTO Rol (nombre, descripcion) VALUES
('BOMBERO','Bombero operativo'),
('OFICIAL','Oficial de guardia'),
('INSPECTOR','Inspector del cuerpo');

/* 5. TIPO_EMERGENCIA */
INSERT INTO Tipo_emergencia (nombre, grupo) VALUES
('Incendio Urbano','Incendios'),
('Accidente Tráfico','Rescate'),
('Inundación','Catástrofes');

/* 6. CATEGORIA */
INSERT INTO Categoria (nombre, inventariable) VALUES
('Protección', TRUE),
('Herramientas', TRUE);

/* 7. MATERIAL */
INSERT INTO Material (id_categoria, nombre, descripcion, estado) VALUES
(1,'Casco','Casco ignífugo','ALTA'),
(2,'Manguera','Manguera de alta presión','ALTA');

/* 8. LOCALIDAD */
INSERT INTO Localidad VALUES
('Sevilla','Sevilla'),
('Dos Hermanas','Sevilla');

/* 9. INSTALACION */
INSERT INTO Instalacion (nombre, direccion, telefono, correo, localidad) VALUES
('Parque Central','Av. Principal 1','600111222','central@bomberos.es','Sevilla'),
('Parque Sur','Calle Sur 5','600333444','sur@bomberos.es','Dos Hermanas');

/* 10. ALMACEN */
INSERT INTO Almacen (planta, nombre) VALUES
(0,'Almacén Principal'),
(1,'Almacén Secundario');

/* ALMACEN_INSTALACION */
INSERT INTO Almacen_Instalacion VALUES
(1,1),
(2,2);

/* 11. ALMACEN_MATERIAL */
INSERT INTO Almacen_material VALUES
(1,1,1,1001,10),
(2,2,2,2001,5);

/* 12. VEHICULO */
INSERT INTO Vehiculo VALUES
('SE-1234-B','Camión Alpha',1,'MAN','TGS','Camión',1,37.389,-5.984),
('SE-5678-C','Ambulancia Beta',2,'Mercedes','Sprinter','Ambulancia',1,NULL,NULL);

/* 13. PERSONA */
INSERT INTO Persona VALUES
('B001','FUNC-001','12345678A','juan@bomberos.es','600000001','2015-01-10',NULL,NULL,NULL,
 'Juan','Pérez','1990-05-10','600999999','C/ Real 1','Sevilla',1,1,'juanp','hash1',NULL,NULL,NULL,NULL,NULL),
('B002','FUNC-002','87654321B','ana@bomberos.es','600000002','2018-03-15',NULL,NULL,NULL,
 'Ana','García','1992-08-20','600888888','C/ Sur 3','Dos Hermanas',2,1,'anag','hash2',NULL,NULL,NULL,NULL,NULL);

/* 14. PERSONA_MATERIAL */
INSERT INTO Persona_Material VALUES
('B001',1,'CAS-001'),
('B002',2,'MAN-002');

/* 15. EMERGENCIA */
INSERT INTO Emergencia (id_bombero,fecha,descripcion,estado,direccion,nombre_solicitante,tlf_solicitante,codigo_tipo) VALUES
('B001','2024-06-05 14:00:00','Incendio en vivienda','ACTIVA','C/ Fuego 10','Pedro López','611222333',1);

/* 16. EMERGENCIA_VEHICULO */
INSERT INTO Emergencia_Vehiculo VALUES
('SE-1234-B',1,'2024-06-05 14:10:00','2024-06-05 14:25:00',NULL);

/* 17. EMERGENCIA_VEHICULO_PERSONA */
INSERT INTO Emergencia_Vehiculo_Persona VALUES
('B001','SE-1234-B',1,'Conductor');

/* 18. PERSONA_EDICION */
INSERT INTO Persona_Edicion VALUES
(1,1,'B001'),
(1,2,'B002');

/* 19. PERSONA_TURNO */
INSERT INTO Persona_Turno VALUES
(1,'B001'),
(2,'B002');

/* 20. SALIDA */
INSERT INTO Salida VALUES
(1,'SE-1234-B','2024-06-05 13:50:00','2024-06-05 18:00:00',12000,12050);

/* 21. SALIDA_PERSONA */
INSERT INTO Salida_Persona VALUES
(1,'SE-1234-B','B001','2024-06-05 13:50:00');

/* 22. CARNET */
INSERT INTO Carnet (nombre, categoria, duracion_meses) VALUES
('Carnet B', 'B', 240),
('Carnet C', 'C', 240);


/* 23. CARNET_PERSONA */
INSERT INTO Carnet_Persona (id_bombero, id_carnet, f_obtencion, f_vencimiento) VALUES
('B001', 1, '2010-01-01', '2030-01-01');

/* 24. AVISO */
INSERT INTO Aviso (asunto,mensaje,fecha,remitente) VALUES
('Guardia','Recuerda tu turno','2024-06-01 10:00:00','B002');

/* 25. PERSONA_RECIBE_AVISO */
INSERT INTO Persona_Recibe_Aviso VALUES
(1,'B001');

/* 26. GUARDIA */
INSERT INTO Guardia (fecha,h_inicio,h_fin,notas) VALUES
('2024-06-10','08:00','20:00','Guardia completa');

/* 27. PERSONA_HACE_GUARDIA */
INSERT INTO Persona_Hace_Guardia VALUES
('B001',1,'Jefe de Guardia');

/* 28. MERITO */
INSERT INTO Merito (nombre,descripcion) VALUES
('Medalla al Mérito','Actuación destacada');

/* 29. PERSONA_TIENE_MERITO */
INSERT INTO Persona_Tiene_Merito VALUES
('B001',1);

/* 30. VEHICULO_CARGA_MATERIAL */
INSERT INTO Vehiculo_Carga_Material VALUES
(2,'SE-1234-B','MAN-002',2);

/* 31. INCIDENCIA */
INSERT INTO Incidencia (id_material,id_bombero,matricula,fecha,asunto,estado,tipo) VALUES
(2,'B001','SE-1234-B','2024-06-06','Manguera dañada','ABIERTA','Material');

/* 32. MOTIVO */
INSERT INTO Motivo (nombre,dias) VALUES
('Vacaciones',5);

/* 33. PERMISO */
INSERT INTO Permiso (cod_motivo,fecha,h_inicio,h_fin,estado,descripcion) VALUES
(1,'2024-07-01',NULL,NULL,'ACEPTADO','Vacaciones verano');

/* 34. MANTENIMIENTO */
INSERT INTO Mantenimiento (id_bombero,estado,f_inicio,f_fin,descripcion) VALUES
('B002','ABIERTO','2024-06-07',NULL,'Revisión vehículo');

/* MANTENIMIENTO_PERSONA */
INSERT INTO Mantenimiento_Persona VALUES
(1,'B002');

/* MANTENIMIENTO_VEHICULO */
INSERT INTO Mantenimiento_Vehiculo VALUES
(1,'SE-1234-B');

/* MANTENIMIENTO_MATERIAL */
INSERT INTO Mantenimiento_Material VALUES
(1,2);

SET FOREIGN_KEY_CHECKS = 1;

