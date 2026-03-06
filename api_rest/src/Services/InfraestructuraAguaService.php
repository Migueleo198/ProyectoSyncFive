<?php
declare(strict_types=1);

namespace Services;

use Models\InfraestructuraAguaModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class InfraestructuraAguaService
{
    private InfraestructuraAguaModel $model;

    public function __construct()
    {
        $this->model = new InfraestructuraAguaModel();
    }


    // ============================================================
    // CONSULTAS
    // ============================================================

    public function getAllInfraestructuras(array $filtros = []): array
    {
        try {
            return $this->model->all($filtros);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function getInfraestructuraById(int $id): array
    {
        Validator::validate(['id' => $id], ['id' => 'required|int|min:1']);

        try {
            $item = $this->model->find($id);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$item) {
            throw new \Exception("Infraestructura no encontrada", 404);
        }

        return $item;
    }


    // ============================================================
    // ESCRITURA
    // ============================================================

    public function createInfraestructura(array $input): array
    {
        $data = Validator::validate($input, [
            'codigo'       => 'required|string|max:50',
            'tipo'         => 'required|string|max:20',
            'denominacion' => 'string|max:150',
            'municipio'    => 'required|string|max:100',
            'provincia'    => 'required|string|max:20',
            'latitud'      => 'required',
            'longitud'     => 'required',
            'estado'       => 'string|max:20',
        ]);

        try {
            $id = $this->model->create($data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$id) {
            throw new \Exception("No se pudo crear la infraestructura");
        }

        return ['id' => $id];
    }

    public function updateInfraestructura(int $id, array $input): array
    {
        Validator::validate(['id' => $id], ['id' => 'required|int|min:1']);

        $data = Validator::validate($input, [
            'codigo'       => 'required|string|max:50',
            'tipo'         => 'required|string|max:20',
            'denominacion' => 'string|max:150',
            'municipio'    => 'required|string|max:100',
            'provincia'    => 'required|string|max:20',
            'latitud'      => 'required',
            'longitud'     => 'required',
            'estado'       => 'required|string|max:20',
        ]);

        try {
            $result = $this->model->update($id, $data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            $exists = $this->model->find($id);
            if (!$exists) throw new \Exception("Infraestructura no encontrada", 404);

            return ['status' => 'no_changes', 'message' => 'No hubo cambios en la infraestructura'];
        }

        return ['status' => 'updated', 'message' => 'Infraestructura actualizada correctamente'];
    }

    public function deleteInfraestructura(int $id): void
    {
        Validator::validate(['id' => $id], ['id' => 'required|int|min:1']);

        try {
            $result = $this->model->delete($id);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) throw new \Exception("Infraestructura no encontrada", 404);
    }
}