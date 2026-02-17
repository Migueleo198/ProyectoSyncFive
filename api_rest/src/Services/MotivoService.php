<?php
declare(strict_types=1);

namespace Services;

use Models\MotivoModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

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

    public function getMotivoById(string $ID_Motivo): array
    {
        Validator::validate(['ID_Motivo' => $ID_Motivo], [
            'ID_Motivo' => 'required|string'
        ]);

        try {
            $motivo = $this->model->find($ID_Motivo);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos",
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
            'ID_Motivo' => 'required|string',
            'Nombre'    => 'required|string',
            'Dias'      => 'required|int|min:1'
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

        return ['ID_Motivo' => $id];
    }

    public function updateMotivo(string $ID_Motivo, array $input): array
    {
        Validator::validate(['ID_Motivo' => $ID_Motivo], [
            'ID_Motivo' => 'required|string'
        ]);

        $data = Validator::validate($input, [
            'Nombre' => 'string|min:1',
            'Dias'   => 'int|min:1'
        ]);

        if (empty($data)) {
            throw new ValidationException([
                'body' => ['No se enviaron campos para actualizar']
            ]);
        }

        try {
            $result = $this->model->update($ID_Motivo, $data);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos",
                500
            );
        }

        if ($result === 0) {
            if (!$this->model->find($ID_Motivo)) {
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

    public function deleteMotivo(string $ID_Motivo): void
    {
        Validator::validate(['ID_Motivo' => $ID_Motivo], [
            'ID_Motivo' => 'required|string'
        ]);

        try {
            $result = $this->model->delete($ID_Motivo);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos",
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
            'ID_Motivo'  => 'required|string',
            'Fecha'      => 'required|date'
        ]);

        // comprobar que el motivo existe
        if (!$this->model->find($data['ID_Motivo'])) {
            throw new \Exception("Motivo no encontrado", 404);
        }

        try {
            $ok = $this->model->assignToPermiso(
                $data['ID_Permiso'],
                $data['ID_Motivo'],
                $data['Fecha']
            );
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos",
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

    public function unassignMotivoFromPermiso(string $ID_Permiso, string $ID_Motivo): void
    {
        Validator::validate(
            ['ID_Permiso' => $ID_Permiso, 'ID_Motivo' => $ID_Motivo],
            [
                'ID_Permiso' => 'required|string',
                'ID_Motivo'  => 'required|string'
            ]
        );

        try {
            $result = $this->model->unassignFromPermiso($ID_Permiso, $ID_Motivo);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos",
                500
            );
        }

        if ($result === 0) {
            throw new \Exception("No existía esa asignación", 404);
        }
    }
}
