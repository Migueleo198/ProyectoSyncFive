<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Services\PersonaService;
use Validation\ValidationException;
use Throwable;

class PersonaController
{
    private PersonaService $service;

    public function __construct()
    {
        $this->service = new PersonaService();
    }

    /**
     * GET /personas
     */
    public function index(Request $req, Response $res): void
    {
        try {
            $personas = $this->service->getAllPersonas();
            $res->status(200)->json($personas, "Listado de personas obtenido correctamente");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), 500);
        }
    }

    /**
     * GET /personas/{n_funcionario}
     */
    public function show(Request $req, Response $res, string $n_funcionario): void
    {
        try {
            // Ahora n_funcionario es estrictamente string
            $persona = $this->service->getPersonaById($n_funcionario);
            $res->status(200)->json($persona, "Persona encontrada");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * POST /personas
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $data = $req->json();

            // Ahora puede incluir ID_bombero (string)
            $result = $this->service->registerUser($data);

            $res->status(201)->json(
                [
                    'ID_bombero'    => $result['id_bombero'],    
                    'n_funcionario' => $result['n_funcionario'],
                    'token_activacion' => $result['token_activacion']
                ],
                "Persona creada correctamente"
            );

        } catch (ValidationException $e) {
            $res->status(422)->json(
                ['errors' => $e->errors],
                "Errores de validación"
            );
        } catch (Throwable $e) {
            $res->errorJson(app_debug() ? $e->getMessage() : "Error interno del servidor", 500);
        }
    }

    /**
     * PATCH /auth/activar-cuenta?token=...
     */
    public function activateAccount(Request $req, Response $res): void
    {
        try {
            $token = $req->getParam('token'); // Obtenemos el token de la query string

            if (!$token) {
                $res->status(422)->json(['token' => 'Token requerido'], "Token no proporcionado");
                return;
            }

            $this->service->activateAccount($token);

            $res->status(200)->json([], "Cuenta activada correctamente");
        } catch (\Validation\ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (\Throwable $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
            $res->errorJson(app_debug() ? $e->getMessage() : "Error interno del servidor", $code);
        }
    }


    /**
     * PATCH /personas/{n_funcionario}
     */
    public function update(Request $req, Response $res, string $n_funcionario): void
    {
        try {
            $data = $req->json();

            // Ya no se convierte a entero
            $result = $this->service->updatePersona($n_funcionario, $data);

            if ($result['status'] === 'no_changes') {
                $res->status(200)->json([], $result['message']);
                return;
            }

            $res->status(200)->json([], $result['message']);

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() > 0 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * PATCH /personas/{id_bombero}/me
     */
    public function updateMe(Request $req, Response $res, string $id_bombero): void
    {
        try {
            // Verificar que el usuario de sesión solo edita sus propios datos
            $sessionUser = \Core\Session::getUser();
            if (!$sessionUser || $sessionUser['id_bombero'] !== $id_bombero) {
                $res->errorJson("No autorizado para editar datos de otro usuario", 403);
                return;
            }

            $data   = $req->json();
            $result = $this->service->updateMe($id_bombero, $data);

            $res->status(200)->json([], $result['message']);

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * DELETE /personas/{n_funcionario}
     */
    public function delete(Request $req, Response $res, string $n_funcionario): void
    {
        try {
            // Ya no se convierte a entero
            $service = new \Services\PersonaService();
            $service->deletePersona($n_funcionario);

            $res->status(200)->json([], "Persona eliminada correctamente");

        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }


    //++++++++++++++++++++++++++ Persona material ++++++++++++++++++++++++++

    /**
     * GET /personas/{id_bombero}/material
     */

    public function getMaterial(Request $req, Response $res, int $id_bombero): void
    {
        try {
            $material = $this->service->getMaterial($id_bombero);
            $res->status(200)->json($material, "Material de la persona obtenido correctamente");
    
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
            return;
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }

    /**
     * SET /personas/{id_bombero}/material/{id_material}/{nserie}
     */

    public function setMaterial(Request $req, Response $res, int $id_bombero, int $id_material, string $nserie): void
    {
        try {
            $result = $this->service->setMaterial($id_bombero, $id_material, $nserie);

            $res->status(201)->json(
                ['ids' => $result['ids']],
                "Material asignado correctamente"
            );

        } catch (ValidationException $e) {
            $res->status(422)->json(
                ['errors' => $e->errors],
                "Errores de validación"
            );
            return;
        } catch (Throwable $e) {
            $res->errorJson(app_debug() ? $e->getMessage() : "Error interno del servidor", 500);
            return;
        }
    }  
    
    /**
     * DELETE /personas/{id_bombero}/material/{id_material}/
     */
    public function deleteMaterial(Request $req, Response $res, int $id_bombero, string $id_material): void
    {
        try {
            $this->service->deleteMaterial($id_bombero, $id_material);
            $res->status(200)->json([], "Material eliminado correctamente");
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
            return;
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status); 
        }
    }

    /**
     * GET /personas/{id_bombero}/stats
     * Devuelve todas las estadísticas del área personal en una sola llamada
     */
    public function getStats(Request $req, Response $res, string $id_bombero): void
    {
        try {
            $stats = $this->service->getStats($id_bombero);
            $res->status(200)->json($stats, "Estadísticas obtenidas correctamente");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * GET /storage/fotos/{filename}
     * Sirve la foto de perfil como recurso estático desde api_rest/storage/fotos/
     * Ruta pública: no requiere sesión.
     */
    public function servirFoto(Request $req, Response $res, string $filename): void
    {
        // Sanitizar: solo permitir nombre de archivo simple (sin rutas)
        $filename = basename($filename);

        // Validar extensión permitida
        $ext     = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png', 'webp'];
        if (!in_array($ext, $allowed)) {
            http_response_code(400);
            exit('Tipo de archivo no permitido');
        }

        $path = STORAGE_DIR . '/fotos/' . $filename;

        if (!file_exists($path)) {
            http_response_code(404);
            exit('Imagen no encontrada');
        }

        // Cabeceras correctas para la imagen
        $mimeTypes = [
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png'  => 'image/png',
            'webp' => 'image/webp',
        ];

        header('Content-Type: ' . $mimeTypes[$ext]);
        header('Content-Length: ' . filesize($path));
        header('Cache-Control: public, max-age=86400'); // caché 1 día
        readfile($path);
        exit;
    }

    /**
     * PATCH /personas/{id_bombero}/foto
     * Sube y actualiza la foto de perfil de la persona.
     */
    public function uploadFoto(Request $req, Response $res, string $id_bombero): void
    {
        try {
            $result = $this->service->uploadFoto($id_bombero, $_FILES['foto'] ?? null);
            $res->status(200)->json(['foto_perfil' => $result], "Foto de perfil actualizada correctamente");
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
}
?>