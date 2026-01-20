<?php
declare(strict_types=1);
/////////////////////////////////////////////////////////////////////////////////////////////////////// HABRÁ QUE VER COMO HACER LAS RESTRICCIONES
// config/routes.php

//+++++++++++++++++++++ PLANTILLA CRUD ++++++++++++++++++++++
//--------------------- (RELACIONES) ---------------------
// GET listar conjunto @index
// $router->get('/incidencias', 'Controllers\\IncidenciaController@index');

// GET listar uno @show
// $router->get('/incidencias/{id}', 'Controllers\\IncidenciaController@show');

// POST crear @store
// $router->post('/incidencias', 'Controllers\\IncidenciaController@store');

// PUT editar @update
// $router->put('/incidencias/{id}', 'Controllers\\IncidenciaController@update');

// PATCH editar campo @update{Campo}
// $router->patch('/incidencias/{id}','Controllers\\IncidenciaController@update{Campo}'); 

// DELETE eliminar @destroy
// $router->delete('/incidencias/{id}', 'Controllers\\IncidenciaController@destroy');



//+++++++++++++++++++++ PERSONA ++++++++++++++++++++++
$router->get('/personas', 'Controllers\\PersonasController@index');
$router->get('/personas/{n_funcionario}', 'Controllers\\PersonasController@show');
$router->post('/personas', 'Controllers\\PersonasController@store');
$router->put('/personas/{n_funcionario}', 'Controllers\\PersonasController@update');
$router->delete('/personas/{n_funcionario}', 'Controllers\\PersonasController@destroy');

//--------------------- AUTENTIFICACION/USUARIOS ---------------------

//--------------------- ROL PERSONA ---------------------

//--------------------- MATERIAL PERSONA ---------------------

//--------------------- CARNET PERSONA ---------------------

//--------------------- MERITO PERSONA ---------------------

//--------------------- FORMACION PERSONA ---------------------

//--------------------- TURNOS REFUERZO PERSONA ---------------------

//--------------------- GUARDIAS PERSONA ---------------------



//+++++++++++++++++++++ FORMACIONES Y EDICIONES ++++++++++++++++++++++



//+++++++++++++++++++++ TURNOS DE REFUERZO ++++++++++++++++++++++



//+++++++++++++++++++++ ROLES ++++++++++++++++++++++



//+++++++++++++++++++++ TIPO ++++++++++++++++++++++



//+++++++++++++++++++++ EMERGENCIA ++++++++++++++++++++++
$router->get('/emergencias', 'Controllers\\EmergenciasController@index');
$router->get('/emergencias/{id_emergencia}', 'Controllers\\EmergenciasController@show');
$router->post('/emergencias', 'Controllers\\EmergenciasController@store');
$router->put('/emergencias/{id_emergencia}', 'Controllers\\EmergenciasController@update');
$router->delete('/emergencias/{id_emergencia}', 'Controllers\\EmergenciasController@destroy');

//--------------------- VEHICULOS EN EMERGENCIA ---------------------
$router->get('/emergencias/vehiculos', 'Controllers\\EmergenciasController@indexVehiculos');
$router->post('/emergencias/{id_emergencia}/vehiculos', 'Controllers\\EmergenciasController@storeVehiculo');
$router->delete('/emergencias/{id_emergencia}/vehiculos/{matricula}', 'Controllers\\EmergenciasController@destroyVehiculo');

//--------------------- PERSONAL EN VEHICULO ---------------------
$router->get('/emergencias/{id_emergencia}/vehiculos/{matricula}/personas', 'Controllers\\EmergenciasController@indexVehiculoPersona');
$router->post('/emergencias/{id_emergencia}/vehiculos/{matricula}/personas', 'Controllers\\EmergenciasController@storeVehiculoPersona');
$router->delete('/emergencias/{id_emergencia}/vehiculos/{matricula}/personas/{n_funcionario}', 'Controllers\\EmergenciasController@destroyVehiculoPersona');



//+++++++++++++++++++++ VEHICULOS ++++++++++++++++++++++

//--------------------- MATERIAL CARGADO EN VEHICULO ---------------------

//--------------------- INSTALACION A LA QUE PERTENECE VEHICULO ---------------------



//+++++++++++++++++++++ INSTALACIONES Y ALMACENES ++++++++++++++++++++++



//+++++++++++++++++++++ CATEGORIA ++++++++++++++++++++++
$router->get('/categorias', 'Controllers\\CategoriasController@index');
$router->post('/categorias', 'Controllers\\CategoriasController@store');
$router->delete('/categorias/{id_categorias}', 'Controllers\\CategoriasController@destroy');



//+++++++++++++++++++++ MATERIAL ++++++++++++++++++++++
$router->get('/materiales', 'Controllers\\MaterialesController@index');
$router->get('/materiales/{id_emergencia}', 'Controllers\\MaterialesController@show');
$router->post('/materiales', 'Controllers\\MaterialesController@store');
$router->put('/materiales/{id_emergencia}', 'Controllers\\MaterialesController@update');
$router->delete('/materiales/{id_emergencia}', 'Controllers\\MaterialesController@destroy');

//--------------------- MATERIAL EN ALMACEN ---------------------



//+++++++++++++++++++++ MANTENIMIENTO ++++++++++++++++++++++



//+++++++++++++++++++++ INCIDENCIAS ++++++++++++++++++++++



//+++++++++++++++++++++ SALIDAS DE VEHICULOS ++++++++++++++++++++++
$router->get('/salidas', 'Controllers\\SalidasController@index');
$router->post('/salidas', 'Controllers\\SalidasController@store');
$router->put('/salidas/{id_registro}', 'Controllers\\SalidasController@update');
$router->delete('/salidas/{id_registro}', 'Controllers\\SalidasController@destroy');

//--------------------- PERSONA EN SALIDA ---------------------
$router->get('/salidas/{id_registro}/personas', 'Controllers\\SalidasController@indexPersonas');
$router->post('/salidas/{id_registro}/personas', 'Controllers\\SalidasController@storePersona');
$router->delete('/salidas/{id_registro}/personas/{n_funcionario}', 'Controllers\\SalidasController@destroyPersona');



//+++++++++++++++++++++ AVISOS ++++++++++++++++++++++

//--------------------- DESTINATARIOS ---------------------

//--------------------- REMITENTE ---------------------



//+++++++++++++++++++++ CARNETS ++++++++++++++++++++++



//+++++++++++++++++++++ GUARDIAS ++++++++++++++++++++++



//+++++++++++++++++++++ PERMISOS ++++++++++++++++++++++



//+++++++++++++++++++++ MOTIVOS DE PERMISO ++++++++++++++++++++++











