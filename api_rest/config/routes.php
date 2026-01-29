<?php

declare(strict_types=1);

//++++++++++++++++++++++++++++++ AUTENTICACIÓN / USUARIOS ++++++++++++++++++++++++++++++
$router->protectedSession('POST', '/auth/login', 'Controllers\\AuthController@login', []);
$router->protectedSession('POST', '/auth/logout', 'Controllers\\AuthController@logout', [1,2,3,4,5]);
$router->protectedSession('PATCH', '/auth/activar-cuenta', 'Controllers\\AuthController@activateAccount', []);
$router->protectedSession('PATCH', '/auth/recuperar-contrasena', 'Controllers\\AuthController@recoverPassword', []);
$router->protectedSession('PATCH', '/auth/cambiar-contrasena', 'Controllers\\AuthController@changePassword', [1,2,3,4,5]);
$router->protectedSession('GET', '/auth/me', 'Controllers\\AuthController@me', [1,2,3,4,5]);


//++++++++++++++++++++++++++++++ PERSONA ++++++++++++++++++++++++++++++
$router->get('/personas', 'Controllers\\PersonaController@index');
$router->protectedSession('GET', '/personas/{n_funcionario}', 'Controllers\\PersonaController@show', [1,2,3,4,5]);
$router->protectedSession('POST', '/personas', 'Controllers\\PersonaController@store', [4,5]);
$router->protectedSession('PATCH', '/personas/{n_funcionario}', 'Controllers\\PersonaController@update', [4,5]);
$router->protectedSession('DELETE', '/personas/{n_funcionario}', 'Controllers\\PersonaController@delete', [5]);

// ROL PERSONA
$router->protectedSession('GET', '/personas/{n_funcionario}/roles', 'Controllers\\PersonaController@getRol', [4,5]);
$router->protectedSession('POST', '/personas/{n_funcionario}/roles', 'Controllers\\PersonaController@setRol', [5]);

// MATERIAL PERSONA
$router->protectedSession('GET', '/personas/{n_funcionario}/material', 'Controllers\\PersonaController@getMaterial', [1,2,3,4,5]);
$router->protectedSession('POST', '/personas/{n_funcionario}/material', 'Controllers\\PersonaController@setMaterial', [4,5]);
$router->protectedSession('DELETE', '/personas/{n_funcionario}/material/{id_material}', 'Controllers\\PersonaController@deleteMaterial', [4,5]);

// CARNET PERSONA
$router->protectedSession('GET', '/personas/{n_funcionario}/carnets', 'Controllers\\PersonaController@getCarnet', [1,2,3,4,5]);
$router->protectedSession('POST', '/personas/{n_funcionario}/carnets', 'Controllers\\PersonaController@setCarnet', [4,5]);
$router->protectedSession('DELETE', '/personas/{n_funcionario}/carnets', 'Controllers\\PersonaController@deleteCarnet', [4,5]);

// MERITO PERSONA
$router->protectedSession('GET', '/personas/{n_funcionario}/meritos', 'Controllers\\PersonaController@getMerito', [1,2,3,4,5]);
$router->protectedSession('POST', '/personas/{n_funcionario}/meritos', 'Controllers\\PersonaController@setMerito', [4,5]);
$router->protectedSession('DELETE', '/personas/{n_funcionario}/meritos', 'Controllers\\PersonaController@deleteMerito', [4,5]);

// FORMACIÓN PERSONA
$router->protectedSession('GET', '/personas/{n_funcionario}/ediciones', 'Controllers\\PersonaController@getFormacion', [1,2,3,4,5]);
$router->protectedSession('POST', '/personas/{n_funcionario}/ediciones', 'Controllers\\PersonaController@setFormacion', [4,5]);
$router->protectedSession('DELETE', '/personas/{n_funcionario}/ediciones/{id_formacion}/{id_edicion}', 'Controllers\\PersonaController@deleteFormacion', [4,5]);

// TURNOS REFUERZO PERSONA
$router->protectedSession('GET', '/personas/{n_funcionario}/turnos', 'Controllers\\PersonaController@getTurnos', [1,2,3]);
$router->protectedSession('POST', '/personas/{n_funcionario}/turnos', 'Controllers\\PersonaController@setTurnos', [3,4,5]);
$router->protectedSession('DELETE', '/personas/{n_funcionario}/turnos', 'Controllers\\PersonaController@deleteTurnos', [3,4,5]);

// GUARDIAS PERSONA
$router->protectedSession('GET', '/personas/{n_funcionario}/guardias', 'Controllers\\PersonaController@getGuardias', [1,2,3]);
$router->protectedSession('POST', '/personas/{n_funcionario}/guardias', 'Controllers\\PersonaController@setGuardias', [2,3,4]);
$router->protectedSession('DELETE', '/personas/{n_funcionario}/guardias', 'Controllers\\PersonaController@deleteGuardias', [2,3,4]);


//++++++++++++++++++++++++++++++ FORMACIONES ++++++++++++++++++++++++++++++
$router->protectedSession('GET', '/formaciones', 'Controllers\\FormacionController@index', [1,2,3,4,5]);
$router->protectedSession('POST', '/formaciones', 'Controllers\\FormacionController@store', [4,5]);
$router->protectedSession('GET', '/formaciones/{id_formacion}', 'Controllers\\FormacionController@show', [1,2,3,4,5]);
$router->protectedSession('PUT', '/formaciones/{id_formacion}', 'Controllers\\FormacionController@update', [4,5]);
$router->protectedSession('DELETE', '/formaciones/{id_formacion}', 'Controllers\\FormacionController@delete', [5]);


//++++++++++++++++++++++++++++++ EDICIONES ++++++++++++++++++++++++++++++
$router->protectedSession('GET', '/formaciones/{id_formacion}/ediciones', 'Controllers\\EdicionController@index', [1,2,3,4,5]);
$router->protectedSession('POST', '/formaciones/{id_formacion}/ediciones', 'Controllers\\EdicionController@store', [4,5]);
$router->protectedSession('PUT', '/formaciones/{id_formacion}/ediciones/{id_edicion}', 'Controllers\\EdicionController@update', [4,5]);
$router->protectedSession('DELETE', '/formaciones/{id_formacion}/ediciones/{id_edicion}', 'Controllers\\EdicionController@delete', [5]);
$router->protectedSession('GET', '/formaciones/{id_formacion}/ediciones/{id_edicion}/personas', 'Controllers\\EdicionController@personas', [1,2,3,4,5]);


//++++++++++++++++++++++++++++++ TURNOS DE REFUERZO ++++++++++++++++++++++++++++++
$router->protectedSession('GET', '/turnos-refuerzo', 'Controllers\\TurnoController@index', [1,2,3,4,5]);
$router->protectedSession('POST', '/turnos-refuerzo', 'Controllers\\TurnoController@store', [4,5]);
$router->protectedSession('GET', '/turnos-refuerzo/{id_turno}', 'Controllers\\TurnoController@show', [1,2,3,4,5]);
$router->protectedSession('PUT', '/turnos-refuerzo/{id_turno}', 'Controllers\\TurnoController@update', [4,5]);
$router->protectedSession('DELETE', '/turnos-refuerzo/{id_turno}', 'Controllers\\TurnoController@delete', [5]);


//++++++++++++++++++++++++++++++ ROLES ++++++++++++++++++++++++++++++
$router->protectedSession('GET', '/roles', 'Controllers\\RolController@index', [4,5]);
$router->protectedSession('POST', '/roles', 'Controllers\\RolController@store', [5]);
$router->protectedSession('PUT', '/roles/{id_rol}', 'Controllers\\RolController@update', [5]);
$router->protectedSession('DELETE', '/roles/{id_rol}', 'Controllers\\RolController@delete', [5]);


//++++++++++++++++++++++++++++++ EMERGENCIAS ++++++++++++++++++++++++++++++
$router->protectedSession('GET', '/emergencias', 'Controllers\\EmergenciaController@index', [1,2,3,4,5]);
$router->protectedSession('POST', '/emergencias', 'Controllers\\EmergenciaController@store', [3,4,5]);
$router->protectedSession('GET', '/emergencias/{id_emergencia}', 'Controllers\\EmergenciaController@show', [1,2,3,4,5]);
$router->protectedSession('PUT', '/emergencias/{id_emergencia}', 'Controllers\\EmergenciaController@update', [4,5]);

// TIPO EMERGENCIA
$router->protectedSession('GET', '/emergencias', 'Controllers\\EmergenciaController@getTipo', [1,2,3,4,5]);
$router->protectedSession('POST', '/emergencias', 'Controllers\\EmergenciaController@setTipo', [3,4,5]);
$router->protectedSession('PUT', '/emergencias/{id_emergencia}', 'Controllers\\EmergenciaController@updateTipo', [4,5]);
$router->protectedSession('DELETE', '/emergencias/{id_emergencia}', 'Controllers\\EmergenciaController@deleteTipo', [5]);

// VEHÍCULOS EN EMERGENCIA
$router->protectedSession('GET', '/emergencias/vehiculos', 'Controllers\\EmergenciaController@getVehiculo', [1,2,3,4,5]);
$router->protectedSession('POST', '/emergencias/{id_emergencia}/vehiculos', 'Controllers\\EmergenciaController@setVehiculo', [3,4,5]);
$router->protectedSession('DELETE', '/emergencias/{id_emergencia}/vehiculos/{matricula}', 'Controllers\\EmergenciaController@deleteVehiculo', [3,4,5]);

// PERSONAL EN VEHÍCULO
$router->protectedSession('GET', '/emergencias/vehiculos/{matricula}/personas', 'Controllers\\EmergenciaController@getPersonal', [1,2,3]);
$router->protectedSession('POST', '/emergencias/{id_emergencia}/vehiculos/{matricula}/personas', 'Controllers\\EmergenciaController@setPersonal', [3,4,5]);
$router->protectedSession('DELETE', '/emergencias/{id_emergencia}/vehiculos/{matricula}/personas/{n_funcionario}', 'Controllers\\EmergenciaController@deletePersonal', [3,4,5]);


//++++++++++++++++++++++++++++++ VEHÍCULOS ++++++++++++++++++++++++++++++
$router->protectedSession('GET', '/vehiculos', 'Controllers\\VehiculoController@index', [1,2,3,4,5]);
$router->protectedSession('POST', '/vehiculos', 'Controllers\\VehiculoController@store', [4,5]);
$router->protectedSession('GET', '/vehiculos/{matricula}', 'Controllers\\VehiculoController@show', [1,2,3,4,5]);
$router->protectedSession('PUT', '/vehiculos/{matricula}', 'Controllers\\VehiculoController@update', [4,5]);
$router->protectedSession('DELETE', '/vehiculos/{matricula}', 'Controllers\\VehiculoController@delete', [5]);

// MATERIAL CARGADO EN VEHÍCULOS
$router->protectedSession('GET', '/vehiculos/{matricula}/materiales', 'Controllers\\VehiculoController@getMaterial', [1,2,3,4,5]);
$router->protectedSession('POST', '/vehiculos/{matricula}/materiales', 'Controllers\\VehiculoController@setMaterial', [4,5]);
$router->protectedSession('PUT', '/vehiculos/{matricula}/materiales/{id_material}', 'Controllers\\VehiculoController@updateMaterial', [4,5]);
$router->protectedSession('DELETE', '/vehiculos/{matricula}/materiales/{id_material}', 'Controllers\\VehiculoController@deleteMaterial', [4,5]);

// INSTALACIÓN DE VEHÍCULOS
$router->protectedSession('GET', '/vehiculos/{matricula}/instalacion', 'Controllers\\VehiculoController@getInstalacion', [1,2,3,4,5]);
$router->protectedSession('POST', '/vehiculos/{matricula}/instalacion', 'Controllers\\VehiculoController@setInstalacion', [4,5]);
$router->protectedSession('DELETE', '/vehiculos/{matricula}/instalacion', 'Controllers\\VehiculoController@deleteInstalacion', [4,5]);


//++++++++++++++++++++++++++++++ INSTALACIONES ++++++++++++++++++++++++++++++
$router->protectedSession('GET', '/instalaciones', 'Controllers\\InstalacionController@index', [1,2,3,4,5]);
$router->protectedSession('POST', '/instalaciones', 'Controllers\\InstalacionController@store', [4,5]);
$router->protectedSession('GET', '/instalaciones/{id_instalacion}', 'Controllers\\InstalacionController@show', [1,2,3,4,5]);
$router->protectedSession('PUT', '/instalaciones/{id_instalacion}', 'Controllers\\InstalacionController@update', [4,5]);
$router->protectedSession('DELETE', '/instalaciones/{id_instalacion}', 'Controllers\\InstalacionController@delete', [5]);


//++++++++++++++++++++++++++++++ ALMACENES ++++++++++++++++++++++++++++++
$router->protectedSession('GET', '/instalaciones/{id_instalacion}/almacenes', 'Controllers\\AlmacenController@index', [1,2,3,4,5]);
$router->protectedSession('POST', '/instalaciones/{id_instalacion}/almacenes', 'Controllers\\AlmacenController@store', [4,5]);
$router->protectedSession('PUT', '/instalaciones/{id_instalacion}/almacenes/{id_almacen}', 'Controllers\\AlmacenController@update', [4,5]);
$router->protectedSession('DELETE', '/instalaciones/{id_instalacion}/almacenes/{id_almacen}', 'Controllers\\AlmacenController@delete', [5]);

// MATERIAL EN ALMACÉN
$router->protectedSession('GET', '/almacenes/{id_almacen}/material', 'Controllers\\AlmacenController@getMaterial', [1,2,3,4,5]);
$router->protectedSession('POST', '/almacenes/{id_almacen}/material', 'Controllers\\AlmacenController@setMaterial', [4,5]);
$router->protectedSession('PUT', '/almacenes/{id_almacen}/material/{id_material}', 'Controllers\\AlmacenController@updateMaterial', [4,5]);
$router->protectedSession('DELETE', '/almacenes/{id_almacen}/material/{id_material}', 'Controllers\\AlmacenController@deleteMaterial', [5]);


//++++++++++++++++++++++++++++++ CATEGORÍA ++++++++++++++++++++++++++++++
$router->protectedSession('GET', '/categorias', 'Controllers\\CategoriaController@index', [1,2,3,4,5]);
$router->protectedSession('POST', '/categorias', 'Controllers\\CategoriaController@store', [4,5]);
$router->protectedSession('DELETE', '/categorias/{id_categoria}', 'Controllers\\CategoriaController@delete', [5]);


//++++++++++++++++++++++++++++++ MATERIAL ++++++++++++++++++++++++++++++
$router->protectedSession('GET', '/materiales', 'Controllers\\MaterialController@index', [1,2,3,4,5]);
$router->protectedSession('POST', '/materiales', 'Controllers\\MaterialController@store', [4,5]);
$router->protectedSession('GET', '/materiales/{id_material}', 'Controllers\\MaterialController@show', [1,2,3,4,5]);
$router->protectedSession('PUT', '/materiales/{id_material}', 'Controllers\\MaterialController@update', [4,5]);
$router->protectedSession('DELETE', '/materiales/{id_material}', 'Controllers\\MaterialController@delete', [5]);


//++++++++++++++++++++++++++++++ MANTENIMIENTO ++++++++++++++++++++++++++++++
$router->protectedSession('GET', '/mantenimientos', 'Controllers\\MantenimientoController@index', [1,2,3,4,5]);
$router->protectedSession('POST', '/mantenimientos', 'Controllers\\MantenimientoController@store', [4,5]);
$router->protectedSession('PUT', '/mantenimientos/{cod_mantenimiento}', 'Controllers\\MantenimientoController@update', [4,5]);
$router->protectedSession('PATCH', '/mantenimientos/{cod_mantenimiento}', 'Controllers\\MantenimientoController@patch', [4,5]);
$router->protectedSession('DELETE', '/mantenimientos/{cod_mantenimiento}', 'Controllers\\MantenimientoController@delete', [5]);


//++++++++++++++++++++++++++++++ INCIDENCIAS ++++++++++++++++++++++++++++++
$router->protectedSession('GET', '/incidencias', 'Controllers\\IncidenciaController@index', [1,2,3,4,5]);
$router->protectedSession('POST', '/incidencias', 'Controllers\\IncidenciaController@store', [4,5]);
$router->protectedSession('PUT', '/incidencias/{cod_incidencia}', 'Controllers\\IncidenciaController@update', [4,5]);
$router->protectedSession('PATCH', '/incidencias/{cod_incidencia}', 'Controllers\\IncidenciaController@patch', [4,5]);
$router->protectedSession('DELETE', '/incidencias/{cod_incidencia}', 'Controllers\\IncidenciaController@delete', [5]);


//++++++++++++++++++++++++++++++ SALIDAS DE VEHÍCULOS ++++++++++++++++++++++++++++++
$router->protectedSession('GET', '/salidas', 'Controllers\\SalidaController@index', [1,2,3,4,5]);
$router->protectedSession('POST', '/salidas', 'Controllers\\SalidaController@store', [4,5]);
$router->protectedSession('PUT', '/salidas/{id_registro}', 'Controllers\\SalidaController@update', [4,5]);
$router->protectedSession('DELETE', '/salidas/{id_registro}', 'Controllers\\SalidaController@delete', [5]);

// PERSONA EN SALIDA
$router->protectedSession('POST', '/salidas/{id_registro}/persona', 'Controllers\\SalidaController@getPersona', [2,3,4,5]);
$router->protectedSession('DELETE', '/salidas/{id_registro}/persona/{n_funcionario}', 'Controllers\\SalidaController@deletePersona', [2,3,4,5]);


//++++++++++++++++++++++++++++++ AVISOS ++++++++++++++++++++++++++++++
$router->protectedSession('GET', '/avisos', 'Controllers\\AvisoController@index', [1,2,3,4,5]);
$router->protectedSession('POST', '/avisos', 'Controllers\\AvisoController@store', [2,3,4,5]);
$router->protectedSession('GET', '/avisos/{id_aviso}', 'Controllers\\AvisoController@show', [1,2,3,4,5]);
$router->protectedSession('DELETE', '/avisos/{id_aviso}', 'Controllers\\AvisoController@delete', [5]);

// DESTINATARIOS
$router->protectedSession('GET', '/avisos/{id_aviso}/destinatarios', 'Controllers\\AvisoController@getDestinatario', [1,2,3,4,5]);
$router->protectedSession('POST', '/avisos/{id_aviso}/destinatarios', 'Controllers\\AvisoDestinatarioController@setDestinatario', [2,3,4,5]);
$router->protectedSession('DELETE', '/avisos/{id_aviso}/destinatarios/{n_funcionario}', 'Controllers\\AvisoDestinatarioController@deleteDestinatario', [2,3,4,5]);

// REMITENTE
$router->protectedSession('GET', '/avisos/{id_aviso}/remitente', 'Controllers\\AvisoController@getRemitente', [1,2,3,4,5]);
$router->protectedSession('POST', '/avisos/{id_aviso}/remitente/{n_funcionario}', 'Controllers\\AvisoController@setRemitente', [2,3,4,5]);
$router->protectedSession('DELETE', '/avisos/{id_aviso}/remitente/{n_funcionario}', 'Controllers\\AvisoController@deleteRemitente', [2,3,4,5]);


//++++++++++++++++++++++++++++++ CARNETS ++++++++++++++++++++++++++++++
$router->protectedSession('GET', '/carnets', 'Controllers\\CarnetController@index', [1,2,3,4,5]);
$router->protectedSession('POST', '/carnets', 'Controllers\\CarnetController@store', [4,5]);
$router->protectedSession('DELETE', '/carnets/{id_carnet}', 'Controllers\\CarnetController@delete', [5]);


//++++++++++++++++++++++++++++++ MÉRITOS ++++++++++++++++++++++++++++++
$router->protectedSession('GET', '/meritos', 'Controllers\\MeritoController@index', [1,2,3,4,5]);
$router->protectedSession('POST', '/meritos', 'Controllers\\MeritoController@store', [4,5]);
$router->protectedSession('DELETE', '/meritos/{id_merito}', 'Controllers\\MeritoController@delete', [5]);


//++++++++++++++++++++++++++++++ GUARDIAS ++++++++++++++++++++++++++++++
$router->protectedSession('GET', '/guardias', 'Controllers\\GuardiaController@index', [1,2,3,4,5]);
$router->protectedSession('POST', '/guardias', 'Controllers\\GuardiaController@store', [4,5]);
$router->protectedSession('PUT', '/guardias/{id_guardia}', 'Controllers\\GuardiaController@update', [4,5]);
$router->protectedSession('DELETE', '/guardias/{id_guardia}', 'Controllers\\GuardiaController@delete', [5]);


//++++++++++++++++++++++++++++++ PERMISOS ++++++++++++++++++++++++++++++
$router->protectedSession('GET', '/permisos', 'Controllers\\PermisoController@index', [1,2,3,4,5]);
$router->protectedSession('POST', '/permisos', 'Controllers\\PermisoController@store', [1,2,3,4,5]);
$router->protectedSession('PUT', '/permisos/{id_permiso}', 'Controllers\\PermisoController@update', [4,5]);
$router->protectedSession('DELETE', '/permisos/{id_permiso}', 'Controllers\\PermisoController@delete', [5]);


//++++++++++++++++++++++++++++++ MOTIVOS DE PERMISO ++++++++++++++++++++++++++++++
$router->protectedSession('GET', '/motivos', 'Controllers\\MotivoController@index', [1,2,3,4,5]);
$router->protectedSession('POST', '/motivos', 'Controllers\\MotivoController@store', [4,5]);
$router->protectedSession('DELETE', '/motivos/{cod_motivo}', 'Controllers\\MotivoController@delete', [5]);
