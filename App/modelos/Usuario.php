<?php

    class Usuario {
        private $db;

        public function __construct(){
            $this->db = new Base;
        }


        public function obtenerUsuarios($pagina = 0, $tam_pagina = 0){
            $registro_inicial = $pagina * $tam_pagina;
            if ($tam_pagina == 0){
                $this->db->query("SELECT * FROM usuarios");
                return $this->db->registros();
            } else {
                $this->db->query("SELECT * FROM usuarios LIMIT $registro_inicial, $tam_pagina");
                return (object) [
                    'datos' => $this->db->registros(),
                    'numPaginas' => ceil($this->obtenerNumUsuarios()/$tam_pagina),
                    'paginaActual' => $pagina
                ];
            }
        }


        public function obtenerNumUsuarios(){
            $this->db->query("SELECT * FROM usuarios");

            return $this->db->rowCount();
        }


    }
