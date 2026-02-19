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
    private MaterialModel $materialModel;
    
    public function __construct()
    {
        $this->model = new AlmacenModel();
        $this->materialModel = new MaterialModel();
    }

    // ========== MÉTODOS PARA ALMACENES ==========

    public function getAllAlmacenes(): array
    {
        try {
            return $this->model->all();
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function getAlmacenesByInstalacion(int $id_instalacion): array
    {
        try {
            return $this->model->findByInstalacion($id_instalacion);
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
            throw new \Exception("Almacén no encontrado", 404);
        }

        return $almacen;
    }

    public function createAlmacen(array $input, int $id_instalacion): array
    {
        $data = Validator::validate($input, [
            'planta' => 'required|string|max:100',
            'nombre' => 'required|string|max:100'
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
            'planta' => 'required|string|max:100',
            'nombre' => 'required|string|max:100'
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
        Validator::validate([
            'id_almacen' => $id_almacen, 
            'id_instalacion' => $id_instalacion
        ], [
            'id_almacen' => 'required|int|min:1',
            'id_instalacion' => 'required|int|min:1'
        ]);

        try {
            $result = $this->model->delete($id_almacen, $id_instalacion);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            throw new \Exception("Almacén no encontrado", 404);
        }

        if ($result === -1) {
            throw new \Exception("No se puede eliminar el almacén: el registro está en uso", 409);
        }
    }

    // ========== MÉTODOS PARA MATERIAL EN ALMACÉN ==========

    public function getMaterialesEnAlmacen(int $id_almacen): array
    {
        Validator::validate(['id_almacen' => $id_almacen], [
            'id_almacen' => 'required|int|min:1'
        ]);

        try {
            $almacen = $this->model->find($id_almacen);
            if (!$almacen) {
                throw new \Exception("Almacén no encontrado", 404);
            }

            return $this->model->getMaterialesEnAlmacen($id_almacen);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function setMaterialToAlmacen(int $id_almacen, array $input): array
    {
        $data = Validator::validate($input, [
            'id_instalacion' => 'required|int|min:1',
            'id_material' => 'required|int|min:1',
            'n_serie' => 'optional|int|min:1',
            'unidades' => 'required|int|min:1'
        ]);

        $almacen = $this->model->find($id_almacen);
        if (!$almacen) {
            throw new \Exception("Almacén no encontrado", 404);
        }

        if (!$this->model->almacenAsociadoAInstalacion($id_almacen, $data['id_instalacion'])) {
            throw new \Exception("El almacén no está asociado a esta instalación", 400);
        }

        $material = $this->materialModel->find($data['id_material']);
        if (!$material) {
            throw new \Exception("Material no encontrado", 404);
        }

        $materialExistente = $this->model->getMaterialEnAlmacen(
            $id_almacen, 
            $data['id_instalacion'], 
            $data['id_material']
        );
        
        if ($materialExistente) {
            throw new \Exception("El material ya existe en este almacén para esta instalación", 409);
        }

        if (isset($data['n_serie']) && $data['n_serie'] > 0) {
            if ($this->model->existeNserieEnAlmacen($id_almacen, $data['n_serie'])) {
                throw new \Exception("El número de serie ya existe en este almacén", 409);
            }
        }

        try {
            $affected = $this->model->addMaterialToAlmacen(
                $id_almacen,
                $data['id_instalacion'],
                $data['id_material'],
                $data['n_serie'] ?? null,
                $data['unidades']
            );

            if ($affected === 0) {
                throw new \Exception("No se pudo añadir el material al almacén", 500);
            }

            return [
                'id_almacen' => $id_almacen,
                'id_instalacion' => $data['id_instalacion'],
                'id_material' => $data['id_material']
            ];
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function updateMaterialInAlmacen(int $id_almacen, int $id_material, array $input): array
    {
        $data = Validator::validate($input, [
            'id_instalacion' => 'required|int|min:1',
            'n_serie' => 'optional|int|min:1',
            'unidades' => 'required|int|min:1'
        ]);

        $almacen = $this->model->find($id_almacen);
        if (!$almacen) {
            throw new \Exception("Almacén no encontrado", 404);
        }

        $materialEnAlmacen = $this->model->getMaterialEnAlmacen(
            $id_almacen, 
            $data['id_instalacion'], 
            $id_material
        );
        
        if (!$materialEnAlmacen) {
            throw new \Exception("Material no encontrado en este almacén para esta instalación", 404);
        }

        if (isset($data['n_serie']) && $data['n_serie'] > 0) {
            $nSerieActual = $materialEnAlmacen['n_serie'] ?? 0;
            if ($data['n_serie'] != $nSerieActual) {
                if ($this->model->existeNserieEnAlmacen($id_almacen, $data['n_serie'])) {
                    throw new \Exception("El número de serie ya existe en este almacén", 409);
                }
            }
        }

        try {
            $affected = $this->model->updateMaterialInAlmacen(
                $id_almacen,
                $data['id_instalacion'],
                $id_material,
                $data['n_serie'] ?? null,
                $data['unidades']
            );

            if ($affected === 0) {
                return [
                    'status' => 'no_changes',
                    'message' => 'No hubo cambios en los datos del material'
                ];
            }

            return [
                'status' => 'updated',
                'message' => 'Material actualizado correctamente en el almacén'
            ];
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function deleteMaterialFromAlmacen(int $id_almacen, int $id_material, array $input): void
    {
        $data = Validator::validate($input, [
            'id_instalacion' => 'required|int|min:1'
        ]);

        $almacen = $this->model->find($id_almacen);
        if (!$almacen) {
            throw new \Exception("Almacén no encontrado", 404);
        }

        $materialEnAlmacen = $this->model->getMaterialEnAlmacen(
            $id_almacen, 
            $data['id_instalacion'], 
            $id_material
        );
        
        if (!$materialEnAlmacen) {
            throw new \Exception("Material no encontrado en este almacén para esta instalación", 404);
        }

        try {
            $affected = $this->model->deleteMaterialFromAlmacen(
                $id_almacen,
                $data['id_instalacion'],
                $id_material
            );
            
            if ($affected === 0) {
                throw new \Exception("No se pudo eliminar el material del almacén", 500);
            }
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }
}
?>