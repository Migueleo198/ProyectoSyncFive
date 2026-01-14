<?php

class Inicio extends Controlador {

    private $usuariosModel;

   
    public function __construct() {
      
        $this->usuariosModel = $this->modelo('Usuario');
    }

   
    public function index() {
        
        //$datos = $this->inicioModel->obtenerNumUsuarios(); 

        $this->vista('index');
    }

}
