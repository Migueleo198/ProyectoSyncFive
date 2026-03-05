<?php
declare(strict_types=1);

namespace Services;

use Models\PersonaModel;
use Validation\Validator;
use Validation\ValidationException;
use Core\EmailService;
use Throwable;

class PersonaService
{
    private PersonaModel $model;
    private EmailService $mailer;

    public function __construct()
    {
        $this->model = new PersonaModel();
        $this->mailer = new EmailService();
    }

    /**
     * Obtener todas las personas
     */
    public function getAllPersonas(): array
    {
        try {
            return $this->model->all();
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }
    }

    /**
     * Obtener una persona por n_funcionario
     */
    public function getPersonaById(string $n_funcionario): array
    {
        Validator::validate(['n_funcionario' => $n_funcionario], [
            'n_funcionario' => 'required|string'
        ]);

        try {
            $persona = $this->model->find($n_funcionario);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if (!$persona) {
            throw new \Exception("Persona no encontrada", 404);
        }

        return $persona;
    }

    /**
     * Registrar un nuevo usuario y enviar email de activación
     */
    public function registerUser(array $data): array
    {
        Validator::validate($data, [
            'id_bombero'    => 'required|string|max:4',
            'n_funcionario' => 'required|string|max:17',
            'nombre'        => 'required|string|max:50',
            'apellidos'     => 'required|string|max:100',
            'correo'        => 'required|email|max:100',
            'nombre_usuario'=> 'required|string|max:30',
            'contrasenia'   => 'required|string|min:6|max:100',
        ]);

        // Hash de la contraseña
        $data['contrasenia'] = password_hash($data['contrasenia'], PASSWORD_DEFAULT);

        // Generar token de activación
        $data['token_activacion'] = bin2hex(random_bytes(32));
        $data['fecha_exp_token_activacion'] = (new \DateTimeImmutable('+24 hours'))->format('Y-m-d H:i:s');
        $data['activo'] = 0;

        $id_bombero = $this->model->create($data);

        if ($id_bombero === false) {
            throw new \Exception("No se pudo crear la persona", 500);
        }

        // Enviar email de activación
        $this->mailer->sendActivationEmail(
            $data['correo'],
            $data['nombre'],
            $data['token_activacion']
        );

        // Devolver token y datos principales
        return [
            'token_activacion' => $data['token_activacion'],
            'n_funcionario'    => $data['n_funcionario'],
            'id_bombero'       => $id_bombero,
        ];
    }

    /**
     * Activar cuenta mediante token
     */
    public function activateAccount(string $token): void
    {
        if (!$token) {
            throw new ValidationException(['token' => ['Token requerido']]);
        }

        $user = $this->model->findByActivationToken($token);

        if (!$user) {
            throw new \Exception("Token inválido", 404);
        }

        if (new \DateTimeImmutable($user['fecha_exp_token_activacion']) < new \DateTimeImmutable()) {
            throw new \Exception("Token expirado", 400);
        }

        if ((bool)$user['activo']) {
            throw new \Exception("La cuenta ya está activada", 400);
        }

        $this->model->activateUser($user['id_bombero']);
    }

    /**
     * Actualizar datos de persona
     */
    public function updatePersona(string $id_bombero, array $input): array  // ← string id_bombero
    {
        Validator::validate(['id_bombero' => $id_bombero], [
            'id_bombero' => 'required|string'  // ← id_bombero
        ]);

        $data = Validator::validate($input, [
            'talla_superior'        => 'string|min:1',
            'talla_inferior'        => 'string|min:1',
            'talla_calzado'         => 'int|min:30|max:50',
            'domicilio'             => 'string|min:5|max:255',
            'localidad'             => 'string|min:2|max:100',
            'correo'                => 'email',
            'telefono'              => 'int',
            'telefono_emergencia'   => 'int',
            'nombre_usuario'        => 'text|min:3|max:30',
            'activo'                => 'boolean'
        ]);

        if (empty($data)) {
            throw new ValidationException([
                'body' => ['No se enviaron campos para actualizar']
            ]);
        }

        try {
            $result = $this->model->update($id_bombero, $data);  // ← id_bombero
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            $exists = $this->model->find($id_bombero);  // ← id_bombero

            if (!$exists) {
                throw new \Exception("Persona no encontrada", 404);
            }

            return [
                'status'  => 'no_changes',
                'message' => 'No hubo cambios en la persona'
            ];
        }

        return [
            'status'  => 'updated',
            'message' => 'Persona actualizada correctamente'
        ];
    }

    /**
     * Actualizar únicamente los campos editables por el propio usuario.
     * Cualquier campo fuera de la whitelist es ignorado silenciosamente.
     */
    public function updateMe(string $id_bombero, array $input): array
    {
        // ── Whitelist: solo estos campos puede tocar el propio usuario ──
        $allowed = [
            'correo',
            'telefono',
            'telefono_emergencia',
            'talla_superior',
            'talla_inferior',
            'talla_calzado',
            'domicilio',
            'localidad',
            'nombre_usuario',
        ];

        // Filtrar: descartar cualquier campo que no esté en la whitelist
        $data = array_intersect_key($input, array_flip($allowed));

        if (empty($data)) {
            throw new ValidationException([
                'body' => ['No se enviaron campos editables']
            ]);
        }

        // Validar solo los campos presentes
        $rules = [
            'correo'              => 'email',
            'telefono'            => 'int',
            'telefono_emergencia' => 'int',
            'talla_superior'      => 'string|min:1',
            'talla_inferior'      => 'string|min:1',
            'talla_calzado'       => 'int|min:30|max:50',
            'domicilio'           => 'string|min:5|max:255',
            'localidad'           => 'string|min:2|max:100',
            'nombre_usuario'      => 'text|min:3|max:30',
        ];

        // Solo validar las reglas de los campos que realmente llegan
        $activeRules = array_intersect_key($rules, $data);
        Validator::validate($data, $activeRules);

        try {
            $result = $this->model->updatePartial($id_bombero, $data);
        } catch (\Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            $exists = $this->model->find($id_bombero);
            if (!$exists) {
                throw new \Exception("Persona no encontrada", 404);
            }
            return ['status' => 'no_changes', 'message' => 'No hubo cambios'];
        }

        return ['status' => 'updated', 'message' => 'Datos actualizados correctamente'];
    }

    /**
     * Eliminar una persona
     */
    public function deletePersona(string $n_funcionario): void
    {
        Validator::validate(['n_funcionario' => $n_funcionario], [
            'n_funcionario' => 'required|string'
        ]);

        try {
            $result = $this->model->delete($n_funcionario);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            throw new \Exception("Persona no encontrada", 404);
        }

        if ($result === -1) {
            throw new \Exception(
                "No se puede eliminar la persona: el registro está en uso",
                409
            );
        }
    }


    //+++++++++++++++ Persona material +++++++++++++++

    public function getMaterial(int $id_bombero): array
    {
        Validator::validate(['id_bombero' => $id_bombero], [
            'id_bombero' => 'required|int|min:1'
        ]);

        try {
            $material = $this->model->getMaterialByBombero($id_bombero);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        return $material;
    }

    public function setMaterial(string $id_bombero,int $id_material, string $nserie): void
    {
        Validator::validate(['id_bombero' => $id_bombero], [
            'id_bombero' => 'required|string'
        ]);
        Validator::validate(['id_material' => $id_material], [
            'id_material' => 'required|int|min:1'
        ]);
        Validator::validate(['nserie' => $nserie], [
            'nserie' => 'required|string|max:50'
        ]);
        try {
            $this->model->addMaterialToBombero($id_bombero,  $id_material, $nserie);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }
    }

    public function deleteMaterial(string $id_bombero, int $id_material): void
    {
        Validator::validate(['id_bombero' => $id_bombero], [
            'id_bombero' => 'required|string'
        ]);
        Validator::validate(['id_material' => $id_material], [
            'id_material' => 'required|int|min:1'
        ]);

        try {
            $result = $this->model->removeMaterialBombero($id_bombero, $id_material);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            throw new \Exception("Material no encontrado para la persona", 404);
        }
    }
    
    /**
     * Obtener todas las estadísticas del área personal en una sola llamada
     */
    public function getStats(string $id_bombero): array
    {
        // Verificar que la persona existe
        $persona = $this->model->find($id_bombero);
        if (!$persona) {
            throw new \Exception("Persona no encontrada", 404);
        }

        try {
            return $this->model->getStatsByBombero($id_bombero);
        } catch (\Throwable $e) {
            throw new \Exception("Error interno: " . $e->getMessage(), 500);
        }
    }

    /**
     * Validar, guardar en disco y actualizar foto de perfil
     */
    public function uploadFoto(string $id_bombero, ?array $file): string {
        // ── Si $file llegó vacío (PATCH multipart), parsearlo manualmente ──
        if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
            $file = $this->parseMultipartFile('foto');
        }

        // Verificar que la persona existe
        $persona = $this->model->find($id_bombero);
        if (!$persona) {
            throw new \Exception("Persona no encontrada", 404);
        }

        // Validar que se recibió un archivo sin errores
        if (!$file || ($file['error'] ?? -1) !== UPLOAD_ERR_OK) {
            throw new ValidationException(['foto' => ['No se recibió ningún archivo válido']]);
        }

        // Validar extensión
        $ext     = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png', 'webp'];
        if (!in_array($ext, $allowed)) {
            throw new ValidationException(['foto' => ['Formato no permitido. Usa JPG, JPEG, PNG o WEBP']]);
        }

        // Validar tamaño (máx. 2 MB)
        if ($file['size'] > 2 * 1024 * 1024) {
            throw new ValidationException(['foto' => ['El archivo no puede superar los 2 MB']]);
        }

        // Crear directorio si no existe
        $dir = STORAGE_DIR . '/fotos/';
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        // Eliminar foto anterior si existe
        if (!empty($persona['foto_perfil'])) {
            $anterior = $dir . $persona['foto_perfil'];
            if (file_exists($anterior)) {
                unlink($anterior);
            }
        }

        // Guardar el archivo en disco
        $filename = $id_bombero . '.' . $ext;
        $destino  = $dir . $filename;

        // Para archivos parseados manualmente usamos file_put_contents en vez de move_uploaded_file
        if (isset($file['tmp_name']) && is_uploaded_file($file['tmp_name'])) {
            // Subida normal via POST
            if (!move_uploaded_file($file['tmp_name'], $destino)) {
                throw new \Exception("Error al guardar el archivo en el servidor", 500);
            }
        } elseif (isset($file['content'])) {
            // Archivo parseado manualmente (PATCH multipart)
            if (file_put_contents($destino, $file['content']) === false) {
                throw new \Exception("Error al guardar el archivo en el servidor", 500);
            }
        } else {
            throw new \Exception("No se pudo procesar el archivo", 500);
        }

        // Persistir en base de datos
        try {
            $this->model->updateFoto($id_bombero, $filename);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        return $filename;
    }

    /**
     * Parsea manualmente un campo de archivo de un cuerpo multipart/form-data.
     * Necesario porque PHP solo rellena $_FILES automáticamente en peticiones POST.
     */
    private function parseMultipartFile(string $fieldName): ?array
    {
        $rawBody     = file_get_contents('php://input');
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        // Extraer el boundary del header Content-Type
        if (!preg_match('/boundary=(.+)$/i', $contentType, $matches)) {
            return null;
        }

        $boundary = '--' . trim($matches[1]);
        $parts    = explode($boundary, $rawBody);

        foreach ($parts as $part) {
            // Saltar partes vacías y el cierre "--"
            if (empty(trim($part)) || $part === "--\r\n") {
                continue;
            }

            // Separar cabeceras del cuerpo (doble CRLF)
            if (!str_contains($part, "\r\n\r\n")) {
                continue;
            }

            [$headers, $content] = explode("\r\n\r\n", $part, 2);

            // Buscar el campo correcto por nombre
            if (!str_contains($headers, "name=\"{$fieldName}\"")) {
                continue;
            }

            // Extraer nombre del fichero
            preg_match('/filename="([^"]+)"/i', $headers, $fnMatch);
            $filename = $fnMatch[1] ?? 'upload';

            // Quitar el \r\n final del contenido
            $content = rtrim($content, "\r\n");

            return [
                'name'    => $filename,
                'size'    => strlen($content),
                'error'   => UPLOAD_ERR_OK,
                'content' => $content,   // contenido binario listo para file_put_contents
            ];
        }

        return null;
    }
}
