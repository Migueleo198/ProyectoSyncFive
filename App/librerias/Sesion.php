<?php
    
    class Sesion{

        public static function crearSesion($usuarioSesion) {
            $sessionTime = TMP_SESION;                  // 1 año de duración
            session_set_cookie_params($sessionTime);
            session_start();
            session_regenerate_id();                            // Para crear un id de sesion distinto al antiguo
            $_SESSION["usuarioSesion"] = $usuarioSesion;
            
        }


        public static function iniciarSesion(&$datos = []) {
            session_start();
            if (isset($_SESSION["usuarioSesion"])){
                $datos['usuarioSesion'] = $_SESSION["usuarioSesion"];       // pasamos por referencia los datos de la sesion
            } else {
                session_destroy();
                redireccionar('/login');
            }
        }


        public static function sesionCreada(&$datos = []) {         // si no necesitamos datos de respuesta, le damos un valor por defecto
            session_start();
            if (isset($_SESSION["usuarioSesion"])){
                $datos['usuarioSesion'] = $_SESSION["usuarioSesion"];       // pasamos por referencia los datos de la sesion
                return true;
            } else {
                return false;
            }
        }


        public static function cerrarSesion() {        
            // session_start();                    // no seria necesaria esta linea, pero por asegurarnos en futuros usos
            setcookie(session_name(), '', time() -3600, "/");
            session_unset();
            session_destroy();
            $_SESSION = array();
        }
    }

