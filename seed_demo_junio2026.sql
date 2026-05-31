-- =============================================================
-- SEED DEMO — datos alrededor de 2026-05-31 / junio 2026
-- Solo INSERT, nunca borra ni modifica datos existentes.
-- =============================================================

-- =============================================================
-- 1. GUARDIAS — finales de mayo y junio 2026
-- =============================================================

INSERT INTO Guardia (fecha, h_inicio, h_fin, notas) VALUES
('2026-05-18', '08:00:00', '20:00:00', 'Guardia ordinaria mayo. Protocolo alerta forestal nivel 1 activo por altas temperaturas.');
SET @g1 = LAST_INSERT_ID();

INSERT INTO Guardia (fecha, h_inicio, h_fin, notas) VALUES
('2026-05-18', '20:00:00', '08:00:00', 'Guardia noche 18-19 mayo. Alerta forestal nivel 1.');
SET @g2 = LAST_INSERT_ID();

INSERT INTO Guardia (fecha, h_inicio, h_fin, notas) VALUES
('2026-05-25', '08:00:00', '20:00:00', 'Guardia ordinaria mayo. Revisión de material prevista a las 10:00.');
SET @g3 = LAST_INSERT_ID();

INSERT INTO Guardia (fecha, h_inicio, h_fin, notas) VALUES
('2026-06-01', '08:00:00', '20:00:00', 'Guardia ordinaria junio. Inicio de temporada alta de incendios forestales.');
SET @g4 = LAST_INSERT_ID();

INSERT INTO Guardia (fecha, h_inicio, h_fin, notas) VALUES
('2026-06-01', '20:00:00', '08:00:00', 'Guardia noche 1-2 junio.');
SET @g5 = LAST_INSERT_ID();

INSERT INTO Guardia (fecha, h_inicio, h_fin, notas) VALUES
('2026-06-08', '08:00:00', '20:00:00', 'Guardia ordinaria junio. Alerta por viento fuerte en la Ibérica.');
SET @g6 = LAST_INSERT_ID();

INSERT INTO Guardia (fecha, h_inicio, h_fin, notas) VALUES
('2026-06-15', '08:00:00', '20:00:00', 'Guardia ordinaria junio.');
SET @g7 = LAST_INSERT_ID();

-- =============================================================
-- 2. PERSONA_HACE_GUARDIA — asignaciones para cada guardia
-- =============================================================

INSERT INTO Persona_Hace_Guardia (id_bombero, id_guardia, cargo) VALUES
('M001', @g1, 'OFICIAL1'),
('J001', @g1, 'OFICIAL2'),
('O002', @g1, 'CONDUCTOR1'),
('B001', @g1, 'BOMBERO1'),
('B004', @g1, 'BOMBERO2'),
('B008', @g1, 'BOMBERO3');

INSERT INTO Persona_Hace_Guardia (id_bombero, id_guardia, cargo) VALUES
('J002', @g2, 'OFICIAL2'),
('O004', @g2, 'CONDUCTOR1'),
('B002', @g2, 'BOMBERO1'),
('B006', @g2, 'BOMBERO2'),
('B011', @g2, 'BOMBERO3');

INSERT INTO Persona_Hace_Guardia (id_bombero, id_guardia, cargo) VALUES
('M002', @g3, 'OFICIAL1'),
('J003', @g3, 'OFICIAL2'),
('O001', @g3, 'CONDUCTOR1'),
('B003', @g3, 'BOMBERO1'),
('B007', @g3, 'BOMBERO2'),
('B013', @g3, 'BOMBERO3');

INSERT INTO Persona_Hace_Guardia (id_bombero, id_guardia, cargo) VALUES
('M001', @g4, 'OFICIAL1'),
('J001', @g4, 'OFICIAL2'),
('O003', @g4, 'CONDUCTOR1'),
('B005', @g4, 'BOMBERO1'),
('B009', @g4, 'BOMBERO2'),
('B014', @g4, 'BOMBERO3');

INSERT INTO Persona_Hace_Guardia (id_bombero, id_guardia, cargo) VALUES
('J004', @g5, 'OFICIAL2'),
('O005', @g5, 'CONDUCTOR1'),
('B010', @g5, 'BOMBERO1'),
('B015', @g5, 'BOMBERO2'),
('B016', @g5, 'BOMBERO3');

INSERT INTO Persona_Hace_Guardia (id_bombero, id_guardia, cargo) VALUES
('M003', @g6, 'OFICIAL1'),
('J002', @g6, 'OFICIAL2'),
('O006', @g6, 'CONDUCTOR1'),
('B001', @g6, 'BOMBERO1'),
('B003', @g6, 'BOMBERO2'),
('B012', @g6, 'BOMBERO3');

INSERT INTO Persona_Hace_Guardia (id_bombero, id_guardia, cargo) VALUES
('M004', @g7, 'OFICIAL1'),
('J005', @g7, 'OFICIAL2'),
('O007', @g7, 'CONDUCTOR1'),
('B002', @g7, 'BOMBERO1'),
('B006', @g7, 'BOMBERO2'),
('B019', @g7, 'BOMBERO3');

-- =============================================================
-- 3. TURNOS DE REFUERZO — mayo-junio 2026
-- =============================================================

INSERT INTO Turno_refuerzo (f_inicio, f_fin, horas) VALUES
('2026-05-23 08:00:00', '2026-05-23 20:00:00', 12);
SET @t1 = LAST_INSERT_ID();

INSERT INTO Turno_refuerzo (f_inicio, f_fin, horas) VALUES
('2026-05-30 08:00:00', '2026-05-30 20:00:00', 12);
SET @t2 = LAST_INSERT_ID();

INSERT INTO Turno_refuerzo (f_inicio, f_fin, horas) VALUES
('2026-06-06 08:00:00', '2026-06-06 20:00:00', 12);
SET @t3 = LAST_INSERT_ID();

-- =============================================================
-- 4. PERSONA_TURNO — asignaciones a los turnos de refuerzo
-- =============================================================

INSERT INTO Persona_Turno (id_turno, id_bombero) VALUES
(@t1, 'B017'), (@t1, 'B018'), (@t1, 'B020'), (@t1, 'O008');

INSERT INTO Persona_Turno (id_turno, id_bombero) VALUES
(@t2, 'B021'), (@t2, 'B022'), (@t2, 'B023'), (@t2, 'O001');

INSERT INTO Persona_Turno (id_turno, id_bombero) VALUES
(@t3, 'B024'), (@t3, 'B025'), (@t3, 'B026'), (@t3, 'O002');

-- =============================================================
-- 5. EMERGENCIAS — abril-mayo 2026
-- =============================================================

INSERT INTO Emergencia (id_bombero, fecha, descripcion, estado, direccion, nombre_solicitante, tlf_solicitante, codigo_tipo) VALUES
('J001', '2026-04-15 11:20:00',
 'Incendio en vivienda de planta baja. Origen probable en cocina. Dos ocupantes evacuados sin heridos. Extinción completada en 45 minutos.',
 'CERRADA', 'Calle San Vicente de Paúl, 8, Alcañiz', 'Vecina del bloque', '978334400', 1);
SET @e1 = LAST_INSERT_ID();

INSERT INTO Emergencia (id_bombero, fecha, descripcion, estado, direccion, nombre_solicitante, tlf_solicitante, codigo_tipo) VALUES
('J002', '2026-04-28 08:35:00',
 'Colisión entre turismo y furgoneta en la N-232. Un herido leve atrapado extraído con herramienta hidráulica. Coordinación con 061.',
 'CERRADA', 'N-232 Km 120, Alcañiz', 'Guardia Civil Tráfico', '062', 6);
SET @e2 = LAST_INSERT_ID();

INSERT INTO Emergencia (id_bombero, fecha, descripcion, estado, direccion, nombre_solicitante, tlf_solicitante, codigo_tipo) VALUES
('J003', '2026-05-10 19:45:00',
 'Fuga de gas en edificio de viviendas. Evacuación preventiva de cuatro plantas. Empresa distribuidora avisada. Sin heridos.',
 'CERRADA', 'Avenida Aragón, 34, Alcañiz', 'Portero del edificio', '978556677', 14);
SET @e3 = LAST_INSERT_ID();

INSERT INTO Emergencia (id_bombero, fecha, descripcion, estado, direccion, nombre_solicitante, tlf_solicitante, codigo_tipo) VALUES
('J001', '2026-05-22 15:10:00',
 'Incendio forestal en zona de matorral y pinar en las proximidades del casco urbano. Viento moderado del noroeste. Coordinación con agentes forestales de la DGA.',
 'ACTIVA', 'Paraje El Molino, Alcañiz', 'Agente Forestal DGA', '974233344', 4);
SET @e4 = LAST_INSERT_ID();

INSERT INTO Emergencia (id_bombero, fecha, descripcion, estado, direccion, nombre_solicitante, tlf_solicitante, codigo_tipo) VALUES
('J004', '2026-05-29 10:00:00',
 'Accidente laboral. Operario atrapado bajo maquinaria pesada en nave de fabricación. Rescate con equipos hidráulicos. Coordinado con 061 por posible fractura.',
 'ACTIVA', 'Polígono Industrial Valmuel, Nave 7, Alcañiz', 'Responsable seguridad', '978100200', 10);
SET @e5 = LAST_INSERT_ID();

-- =============================================================
-- 6. EMERGENCIA_VEHICULO — vehículos asignados
-- =============================================================

INSERT INTO Emergencia_Vehiculo (matricula, id_emergencia, f_salida, f_llegada, f_regreso) VALUES
('3421BCP', @e1, '2026-04-15 11:25:00', '2026-04-15 11:40:00', '2026-04-15 13:10:00'),
('5678DFG', @e1, '2026-04-15 11:25:00', '2026-04-15 11:42:00', '2026-04-15 13:20:00');

INSERT INTO Emergencia_Vehiculo (matricula, id_emergencia, f_salida, f_llegada, f_regreso) VALUES
('3421BCP', @e2, '2026-04-28 08:40:00', '2026-04-28 08:55:00', '2026-04-28 11:00:00');

INSERT INTO Emergencia_Vehiculo (matricula, id_emergencia, f_salida, f_llegada, f_regreso) VALUES
('5678DFG', @e3, '2026-05-10 19:50:00', '2026-05-10 20:05:00', '2026-05-10 22:30:00');

INSERT INTO Emergencia_Vehiculo (matricula, id_emergencia, f_salida, f_llegada, f_regreso) VALUES
('3421BCP', @e4, '2026-05-22 15:15:00', '2026-05-22 15:35:00', NULL),
('5678DFG', @e4, '2026-05-22 15:15:00', '2026-05-22 15:38:00', NULL);

INSERT INTO Emergencia_Vehiculo (matricula, id_emergencia, f_salida, f_llegada, f_regreso) VALUES
('3421BCP', @e5, '2026-05-29 10:05:00', '2026-05-29 10:20:00', NULL);

-- =============================================================
-- 7. AVISOS — abril-mayo 2026
-- =============================================================

INSERT INTO Aviso (asunto, mensaje, fecha, remitente) VALUES
('Inicio temporada alta forestal 2026',
 'Se comunica a todo el personal que a partir del 1 de junio se activa el protocolo de temporada alta de incendios forestales. El equipo de primera intervención debe mantener el material en estado de revisión máxima. Consultar el protocolo actualizado en el tablón.',
 '2026-04-28 09:00:00', 'M001');
SET @a1 = LAST_INSERT_ID();

INSERT INTO Aviso (asunto, mensaje, fecha, remitente) VALUES
('Simulacro extinción incendio forestal — 23 mayo',
 'El próximo 23 de mayo se realizará un simulacro de intervención en incendio forestal en el paraje El Molino. Es obligatoria la presencia del personal de guardia. El simulacro comenzará a las 09:00. Se ruega puntualidad.',
 '2026-05-05 10:00:00', 'I001');
SET @a2 = LAST_INSERT_ID();

INSERT INTO Aviso (asunto, mensaje, fecha, remitente) VALUES
('Alerta naranja forestal — fin de semana 30-31 mayo',
 'La AEMET ha emitido aviso naranja por temperaturas extremas y rachas de viento de hasta 60 km/h para el fin de semana del 30 y 31 de mayo. Se activa el protocolo de alerta forestal nivel 2. Todo el personal debe estar localizable.',
 '2026-05-28 16:30:00', 'M002');
SET @a3 = LAST_INSERT_ID();

-- =============================================================
-- 8. PERSONA_RECIBE_AVISO — destinatarios
-- =============================================================

-- Aviso 1: todo el parque
INSERT INTO Persona_Recibe_Aviso (id_aviso, id_bombero) VALUES
(@a1,'I001'),(@a1,'I002'),(@a1,'I003'),
(@a1,'M001'),(@a1,'M002'),(@a1,'M003'),(@a1,'M004'),
(@a1,'J001'),(@a1,'J002'),(@a1,'J003'),(@a1,'J004'),(@a1,'J005'),(@a1,'J006'),
(@a1,'O001'),(@a1,'O002'),(@a1,'O003'),(@a1,'O004'),(@a1,'O005'),
(@a1,'B001'),(@a1,'B002'),(@a1,'B003'),(@a1,'B004'),(@a1,'B005'),
(@a1,'B006'),(@a1,'B007'),(@a1,'B008'),(@a1,'B009'),(@a1,'B010');

-- Aviso 2: personal de guardia y mandos
INSERT INTO Persona_Recibe_Aviso (id_aviso, id_bombero) VALUES
(@a2,'M001'),(@a2,'M002'),(@a2,'J001'),(@a2,'J002'),(@a2,'J003'),
(@a2,'O001'),(@a2,'O002'),(@a2,'O003'),(@a2,'O004'),
(@a2,'B001'),(@a2,'B002'),(@a2,'B003'),(@a2,'B004'),(@a2,'B005');

-- Aviso 3: todo el parque
INSERT INTO Persona_Recibe_Aviso (id_aviso, id_bombero) VALUES
(@a3,'I001'),(@a3,'I002'),(@a3,'I003'),
(@a3,'M001'),(@a3,'M002'),(@a3,'M003'),(@a3,'M004'),
(@a3,'J001'),(@a3,'J002'),(@a3,'J003'),(@a3,'J004'),(@a3,'J005'),(@a3,'J006'),
(@a3,'O001'),(@a3,'O002'),(@a3,'O003'),(@a3,'O004'),(@a3,'O005'),
(@a3,'B001'),(@a3,'B002'),(@a3,'B003'),(@a3,'B004'),(@a3,'B005'),
(@a3,'B006'),(@a3,'B007'),(@a3,'B008'),(@a3,'B009'),(@a3,'B010');

-- =============================================================
-- SECCIÓN ESPECÍFICA: m.garcia.inspector (I002) — Área Personal
-- =============================================================

-- 9. CARNETS para I002
--    vigente, próximo a vencer y caducado para que el área personal muestre los tres estados
INSERT INTO Carnet_Persona (id_bombero, id_carnet, f_obtencion, f_vencimiento) VALUES
('I002', 1,  '2005-04-10', '2035-04-10'),   -- Permiso B         → vigente (30 años)
('I002', 7,  '2023-09-01', '2028-09-01'),   -- ADR Básico        → vigente
('I002', 10, '2024-05-20', '2027-05-20'),   -- Grúa Torre        → próximo a vencer (~1 año)
('I002', 2,  '2015-06-15', '2020-06-15');   -- Permiso C         → caducado

-- 10. MÉRITOS para I002
INSERT INTO Persona_Tiene_Merito (id_bombero, id_merito) VALUES
('I002', 4),   -- 10 años de servicio
('I002', 5),   -- 20 años de servicio
('I002', 2),   -- Medalla al Mérito del Cuerpo de Bomberos
('I002', 1);   -- Cruz al Mérito de Protección Civil

-- 11. GUARDIAS propias de I002 (próximas — aparecen en el widget "Próximas guardias")
INSERT INTO Guardia (fecha, h_inicio, h_fin, notas) VALUES
('2026-06-04', '08:00:00', '20:00:00', 'Guardia ordinaria junio. Turno con protocolo forestal nivel 1 activo.');
SET @gi1 = LAST_INSERT_ID();

INSERT INTO Guardia (fecha, h_inicio, h_fin, notas) VALUES
('2026-06-12', '08:00:00', '20:00:00', 'Guardia ordinaria junio.');
SET @gi2 = LAST_INSERT_ID();

INSERT INTO Persona_Hace_Guardia (id_bombero, id_guardia, cargo) VALUES
('I002', @gi1, 'OFICIAL1'),
('J003', @gi1, 'OFICIAL2'),
('O004', @gi1, 'CONDUCTOR1'),
('B003', @gi1, 'BOMBERO1'),
('B009', @gi1, 'BOMBERO2'),
('B017', @gi1, 'BOMBERO3');

INSERT INTO Persona_Hace_Guardia (id_bombero, id_guardia, cargo) VALUES
('I002', @gi2, 'OFICIAL1'),
('J005', @gi2, 'OFICIAL2'),
('O006', @gi2, 'CONDUCTOR1'),
('B005', @gi2, 'BOMBERO1'),
('B011', @gi2, 'BOMBERO2'),
('B020', @gi2, 'BOMBERO3');

-- 12. FORMACIONES PENDIENTES — inscripción en ediciones futuras
--     (id_formacion, id_edicion, id_bombero)
INSERT INTO Persona_Edicion (id_formacion, id_edicion, id_bombero) VALUES
(2,  3, 'I002'),   -- Rescate en Accidentes de Tráfico: 2026-06-01 al 2026-06-05
(13, 1, 'I002');   -- Rescate con Perros de Búsqueda: 2026-06-08 al 2026-06-12

-- 13. PERMISO de I002 — uno aceptado y uno en revisión
INSERT INTO Permiso (cod_motivo, id_bombero, fecha_solicitud, fecha_hora_inicio, fecha_hora_fin, estado, descripcion) VALUES
(1, 'I002', '2026-04-10 09:00:00', '2026-04-24 08:00:00', '2026-04-24 20:00:00', 'ACEPTADO',
 'Día de asuntos propios para gestión personal. Aprobado por jefatura.'),
(3, 'I002', '2026-05-20 10:30:00', '2026-07-14 00:00:00', '2026-07-25 23:59:59', 'REVISION',
 'Solicitud de vacaciones de verano. Pendiente de confirmación de cobertura de guardia.');
