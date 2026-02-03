<?php
declare(strict_types=1);

namespace Services;

use Models\AlmacenModel;
use Models\MaterialModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class AlmacenService
{
        private AlmacenModel $model;
    public function __construct()
    {
        $this->model = new AlmacenModel();
    }


    public function getAllAlmacenes(): array
    {
        try {
            return $this->model->all();
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }


    public function getAlmacenById(int $id): array
    {
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        try {
            $almacen = $this->model->find($id);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$almacen) {
            throw new \Exception("ALmacen no encontrada", 404);
        }

        return $almacen;
    }


    public function createAlmacen(array $input, int $id_instalacion): array
    {
        $data = Validator::validate($input, [
            'planta'           => 'required|string|max:100',
            'nombre'          => 'required|string|max:100'
        ]);

        try {
            $id = $this->model->create($data);
            $this->model->asociarConInstalacion($id, $id_instalacion);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$id) {
            throw new \Exception("No se pudo crear el almacén");
        }

        return ['id' => $id];
    }


    public function updateAlmacen(int $id, array $input): array
    {
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        $data = Validator::validate($input, [
            'planta'           => 'required|string|max:100',
            'nombre'          => 'required|string|max:100'
        ]);


        try {
            $result = $this->model->update($id, $data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            $exists = $this->model->find($id);

            if (!$exists) {
                throw new \Exception("Almacén no encontrado", 404);
            }

            return [
                'status' => 'no_changes',
                'message' => 'No hubo cambios en los datos del almacén'
            ];
        }

        if ($result === -1) {
            throw new \Exception("No se pudo actualizar el almacén: conflicto con restricciones", 409);
        }

        return [
            'status' => 'updated',
            'message' => 'Almacén actualizado correctamente'
        ];
    }

    
    public function deleteAlmacen(int $id_almacen, int $id_instalacion): void
    {
        // Validar ID
        Validator::validate(['id_almacen' => $id_almacen, 'id_instalacion' => $id_instalacion], [
            'id_almacen' => 'required|int|min:1',
            'id_instalacion' => 'required|int|min:1'
        ]);

        try {
            $result = $this->model->delete($id_almacen, $id_instalacion);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            // No existe el registro
            throw new \Exception("Almacén no encontrado", 404);
        }

        if ($result === -1) {
            // Conflicto por FK u otra restricción
            throw new \Exception("No se puede eliminar el almacén: el registro está en uso", 409);
        }

        // Eliminación exitosa → no retorna nada
    }
    // GET /almacenes/{id_almacen}/material
    public function getMaterialesEnAlmacen(int $id_almacen): array
    {
        $materialModel = new MaterialModel();

        try {
            return $materialModel->getByAlmacenId($id_almacen);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    // POST /almacenes/{id_almacen}/material
    public function addMaterialToAlmacen(int $id_almacen, int $id_material): void
    {
        // Validar IDs
        Validator::validate(['id_almacen' => $id_almacen, 'id_material' => $id_material], [
            'id_almacen' => 'required|int|min:1',
            'id_material' => 'required|int|min:1'
        ]);

        try {
            $this->model->asociarMaterial($id_almacen, $id_material);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }
    // PUT /almacenes/{id_almacen}/material/{id_material}'
    public function updateMaterialInAlmacen(int $id_almacen, int $id_material, array $data): void
    {
        // Validar IDs
        Validator::validate(['id_almacen' => $id_almacen, 'id_material' => $id_material], [
            'id_almacen' => 'required|int|min:1',
            'id_material' => 'required|int|min:1'
        ]);

        // Validar datos (ejemplo: cantidad)
        Validator::validate($data, [
            'cantidad' => 'required|int|min:0'
        ]);

        try {
            $this->model->actualizarMaterialEnAlmacen($id_almacen, $id_material, $data['cantidad']);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }
    // DELETE /almacenes/{id_almacen}/material/{id_material}'
    public function removeMaterialFromAlmacen(int $id_almacen, int $id_material): void
    {
        // Validar IDs
        Validator::validate(['id_almacen' => $id_almacen, 'id_material' => $id_material], [
            'id_almacen' => 'required|int|min:1',
            'id_material' => 'required|int|min:1'
        ]);

        try {
            $this->model->desasociarMaterial($id_almacen, $id_material);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }
    // GET /almacenes/{id_almacen}/materiales
    public function getAllMateriales(): array
    {
        try {
            return $this->model->all();
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

}