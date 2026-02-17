<?php
declare(strict_types=1);

namespace Services;

use Models\AvisoModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class AvisoService
{
    private AvisoModel $model;

    public function __construct()
    {
        $this->model = new AvisoModel();
    }

    // ===========================
    // Avisos
    // ===========================

    /**
     * Obtener todos los avisos
     */
    public function getAllAvisos(): array
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
     * Obtener un aviso por ID
     */
    public function getAvisoById(int $id): array
    {
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        try {
            $aviso = $this->model->find($id);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if (!$aviso) {
            throw new \Exception("Aviso no encontrado", 404);
        }

        return $aviso;
    }

    /**
     * Crear un aviso
     */
    public function createAviso(array $input): array
    {
        // Validación
        $data = Validator::validate($input, [
            'asunto'   => 'required|string|min:3|max:150',
            'mensaje'  => 'required|string|min:5',
            'fecha'    => 'required|datetime',
            'remitente'=> 'string|max:4' // FK opcional
        ]);

        try {
            $id = $this->model->create($data);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if (!$id) {
            throw new \Exception("No se pudo crear el aviso");
        }

        return ['id' => $id];
    }

    /**
     * Eliminar un aviso
     */
    public function deleteAviso(int $id): void
    {
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        try {
            $result = $this->model->delete($id);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            throw new \Exception("Aviso no encontrado", 404);
        }

        if ($result === -1) {
            throw new \Exception(
                "No se puede eliminar el aviso: el registro está en uso",
                409
            );
        }
    }

    // ===========================
    // Destinatarios
    // ===========================

    public function getDestinatarios(int $id_aviso): array
    {
        Validator::validate(['id_aviso' => $id_aviso], [
            'id_aviso' => 'required|int|min:1'
        ]);

        try {
            return $this->model->getDestinatarios($id_aviso);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function addDestinatario(int $id_aviso, string $id_bombero): void
    {
        Validator::validate([
            'id_aviso'   => $id_aviso,
            'id_bombero' => $id_bombero
        ], [
            'id_aviso'   => 'required|int|min:1',
            'id_bombero' => 'required|string|max:4'
        ]);

        try {
            $this->model->addDestinatario($id_aviso, $id_bombero);
        } catch (Throwable $e) {
            throw new \Exception("Error al agregar destinatario: " . $e->getMessage(), 500);
        }
    }

    public function removeDestinatario(int $id_aviso, string $id_bombero): void
    {
        Validator::validate([
            'id_aviso'   => $id_aviso,
            'id_bombero' => $id_bombero
        ], [
            'id_aviso'   => 'required|int|min:1',
            'id_bombero' => 'required|string|max:4'
        ]);

        try {
            $affected = $this->model->removeDestinatario($id_aviso, $id_bombero);
        } catch (Throwable $e) {
            throw new \Exception("Error al eliminar destinatario: " . $e->getMessage(), 500);
        }

        if ($affected === 0) {
            throw new \Exception("Destinatario no encontrado", 404);
        }
    }

    // ===========================
    // Remitente
    // ===========================

    public function getRemitente(int $id_aviso): ?array
    {
        Validator::validate(['id_aviso' => $id_aviso], [
            'id_aviso' => 'required|int|min:1'
        ]);

        try {
            return $this->model->getRemitente($id_aviso);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function setRemitente(int $id_aviso, string $id_bombero): void
    {
        Validator::validate([
            'id_aviso'   => $id_aviso,
            'id_bombero' => $id_bombero
        ], [
            'id_aviso'   => 'required|int|min:1',
            'id_bombero' => 'required|string|max:4'
        ]);

        try {
            $this->model->setRemitente($id_aviso, $id_bombero);
        } catch (Throwable $e) {
            throw new \Exception("Error al asignar remitente: " . $e->getMessage(), 500);
        }
    }

    public function removeRemitente(int $id_aviso): void
    {
        Validator::validate(['id_aviso' => $id_aviso], [
            'id_aviso' => 'required|int|min:1'
        ]);

        try {
            $this->model->removeRemitente($id_aviso);
        } catch (Throwable $e) {
            throw new \Exception("Error al eliminar remitente: " . $e->getMessage(), 500);
        }
    }

}
?>
