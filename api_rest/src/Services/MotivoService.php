<?php
declare(strict_types=1);

namespace Services;

use Models\MotivoModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;
use PDOException;

class MotivoService
{
    private MotivoModel $model;

    public function __construct()
    {
        $this->model = new MotivoModel();
    }

    /* =======================
       CRUD DE MOTIVO
       ======================= */

    public function getAllMotivos(): array
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

    public function getMotivoById(string $cod_motivo): array
    {
        Validator::validate(['cod_motivo' => $cod_motivo], [
            'cod_motivo' => 'required|string'
        ]);

        try {
            $motivo = $this->model->find($cod_motivo);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if (!$motivo) {
            throw new \Exception("Motivo no encontrado", 404);
        }

        return $motivo;
    }

    public function createMotivo(array $input): array
    {
        $data = Validator::validate($input, [
            'nombre' => 'required|string',  // ← era ID_Motivo, Nombre, Dias
            'dias'   => 'required|int|min:1'
        ]);

        try {
            $id = $this->model->create($data);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos",
                500
            );
        }

        if (!$id) {
            throw new \Exception("No se pudo crear el motivo", 500);
        }

        return ['cod_motivo' => $id];
    }

    public function updateMotivo(string $cod_motivo, array $input): array
    {
        Validator::validate(['cod_motivo' => $cod_motivo], [
            'cod_motivo' => 'required|string'
        ]);

        $data = Validator::validate($input, [
            'nombre' => 'string|min:1',
            'dias'   => 'int|min:1'
        ]);

        if (empty($data)) {
            throw new ValidationException([
                'body' => ['No se enviaron campos para actualizar']
            ]);
        }

        try {
            $result = $this->model->update($cod_motivo, $data);
        } catch (Throwable $e) {
                throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500); // ← añade . $e->getMessage()
            throw new \Exception(
                "Error interno en la base de datos",
                500
            );
        }

        if ($result === 0) {
            if (!$this->model->find($cod_motivo)) {
                throw new \Exception("Motivo no encontrado", 404);
            }

            return [
                'status'  => 'no_changes',
                'message' => 'No hubo cambios en el motivo'
            ];
        }

        return [
            'status'  => 'updated',
            'message' => 'Motivo actualizado correctamente'
        ];
    }

    public function deleteMotivo(string $cod_motivo): void
    {
        Validator::validate(['cod_motivo' => $cod_motivo], [
            'cod_motivo' => 'required|string'
        ]);

        try {
            $result = $this->model->delete($cod_motivo);
        } catch (PDOException $e) {
            // Verificar si es una violación de clave foránea
            if ($e->getCode() === '23000' || strpos($e->getMessage(), 'foreign key constraint') !== false) {
                throw new \Exception("No se puede eliminar este motivo porque hay permisos que lo utilizan", 409);
            }
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            throw new \Exception("Motivo no encontrado", 404);
        }
    }

    /* =======================
       PERMISO ↔ MOTIVO
       ======================= */

    public function assignMotivoToPermiso(array $input): array
    {
        $data = Validator::validate($input, [
            'ID_Permiso' => 'required|string',
            'cod_motivo'  => 'required|string',
            'Fecha'      => 'required|date'
        ]);

        // comprobar que el motivo existe
        if (!$this->model->find($data['cod_motivo'])) {
            throw new \Exception("Motivo no encontrado", 404);
        }

        try {
            $ok = $this->model->assignToPermiso(
                $data['ID_Permiso'],
                $data['cod_motivo'],
                $data['Fecha']
            );
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if (!$ok) {
            throw new \Exception("No se pudo asignar el motivo al permiso", 500);
        }

        return ['message' => 'Motivo asignado al permiso correctamente'];
    }

    public function getMotivosByPermiso(string $ID_Permiso): array
    {
        Validator::validate(['ID_Permiso' => $ID_Permiso], [
            'ID_Permiso' => 'required|string'
        ]);

        try {
            return $this->model->getMotivosByPermiso($ID_Permiso);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos",
                500
            );
        }
    }

    public function unassignMotivoFromPermiso(string $ID_Permiso, string $cod_motivo): void
    {
        Validator::validate(
            ['ID_Permiso' => $ID_Permiso, 'cod_motivo' => $cod_motivo],
            [
                'ID_Permiso' => 'required|string',
                'cod_motivo'  => 'required|string'
            ]
        );

        try {
            $result = $this->model->unassignFromPermiso($ID_Permiso, $cod_motivo);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            throw new \Exception("No existía esa asignación", 404);
        }
    }
}
