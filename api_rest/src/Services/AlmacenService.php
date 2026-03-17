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
        $this->model         = new AlmacenModel();
        $this->materialModel = new MaterialModel();
    }

    // ========== ALMACENES ==========

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

    public function getAlmacenById(int $id_almacen, int $id_instalacion): array
    {
        try {
            $almacen = $this->model->find($id_almacen, $id_instalacion);
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
            $id = $this->model->create($data, $id_instalacion);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$id) {
            throw new \Exception("No se pudo crear el almacén", 500);
        }

        return ['id' => $id];
    }

    public function updateAlmacen(int $id_almacen, int $id_instalacion, array $input): array
    {
        $data = Validator::validate($input, [
            'planta' => 'required|string|max:100',
            'nombre' => 'required|string|max:100'
        ]);

        try {
            $result = $this->model->update($id_almacen, $id_instalacion, $data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            if (!$this->model->find($id_almacen, $id_instalacion)) {
                throw new \Exception("Almacén no encontrado", 404);
            }
            return ['status' => 'no_changes', 'message' => 'No hubo cambios en los datos del almacén'];
        }

        return ['status' => 'updated', 'message' => 'Almacén actualizado correctamente'];
    }

    public function deleteAlmacen(int $id_almacen, int $id_instalacion): void
    {
        try {
            $result = $this->model->delete($id_almacen, $id_instalacion);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) throw new \Exception("Almacén no encontrado", 404);
        if ($result === -1) throw new \Exception("No se puede eliminar el almacén: está en uso", 409);
    }

    // ========== MATERIAL EN ALMACÉN ==========

    public function getMaterialesEnAlmacen(int $id_almacen): array
    {
        try {
            if (!$this->model->findById($id_almacen)) {
                throw new \Exception("Almacén no encontrado", 404);
            }
            return $this->model->getMaterialesEnAlmacen($id_almacen);
        } catch (\Exception $e) {
            throw $e;
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    /**
     * POST /almacenes/{id_almacen}/material
     * Body: { id_instalacion, id_material, unidades } O { id_instalacion, id_material, n_serie }
     */
    public function setMaterialToAlmacen(int $id_almacen, array $input): array
    {
        $data = Validator::validate($input, [
            'id_instalacion' => 'required|int|min:1',
            'id_material'    => 'required|int|min:1',
            'unidades'       => 'optional|int|min:1',
            'n_serie'        => 'optional|string|max:50',
        ]);

        $tieneUnidades = isset($data['unidades']);
        $tieneNserie   = isset($data['n_serie']) && $data['n_serie'] !== '';

        if (!$tieneUnidades && !$tieneNserie) {
            throw new \Exception("Debe especificar unidades o número de serie", 400);
        }
        if ($tieneUnidades && $tieneNserie) {
            throw new \Exception("No puede especificar unidades y número de serie a la vez", 400);
        }

        if (!$this->model->almacenPerteneceAInstalacion($id_almacen, $data['id_instalacion'])) {
            throw new \Exception("El almacén no está asociado a esta instalación", 400);
        }

        if (!$this->materialModel->find($data['id_material'])) {
            throw new \Exception("Material no encontrado", 404);
        }

        try {
            if ($tieneUnidades) {
                $existe = $this->model->getMaterialUnidades($id_almacen, $data['id_instalacion'], $data['id_material']);
                if ($existe) {
                    throw new \Exception("Este material ya está asignado por unidades en este almacén. Use la edición para modificar las unidades.", 409);
                }
                $affected = $this->model->addMaterialUnidades(
                    $id_almacen, $data['id_instalacion'], $data['id_material'], $data['unidades']
                );
            } else {
                $affected = $this->model->addMaterialSerie(
                    $id_almacen, $data['id_instalacion'], $data['id_material'], $data['n_serie']
                );
            }

            if ($affected === 0) {
                throw new \Exception("No se pudo añadir el material al almacén", 500);
            }

            return [
                'id_almacen'     => $id_almacen,
                'id_instalacion' => $data['id_instalacion'],
                'id_material'    => $data['id_material'],
            ];
        } catch (\Exception $e) {
            throw $e;
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /almacenes/{id_almacen}/material/{id_material}
     * Solo actualiza unidades (no hay update de serie — se borra y se inserta).
     */
    public function updateMaterialInAlmacen(int $id_almacen, int $id_material, array $input): array
    {
        $data = Validator::validate($input, [
            'id_instalacion' => 'required|int|min:1',
            'unidades'       => 'required|int|min:1',
        ]);

        $existe = $this->model->getMaterialUnidades($id_almacen, $data['id_instalacion'], $id_material);
        if (!$existe) {
            throw new \Exception("Material no encontrado por unidades en este almacén/instalación", 404);
        }

        try {
            $affected = $this->model->updateMaterialUnidades(
                $id_almacen, $data['id_instalacion'], $id_material, $data['unidades']
            );
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($affected === 0) {
            return ['status' => 'no_changes', 'message' => 'No hubo cambios en los datos del material'];
        }

        return ['status' => 'updated', 'message' => 'Material actualizado correctamente en el almacén'];
    }

    /**
     * DELETE /almacenes/{id_almacen}/material/{id_material}
     * Busca en unidades y en serie, elimina donde encuentre.
     */
    public function deleteMaterialFromAlmacen(int $id_almacen, int $id_material): void
    {
        try {
            if (!$this->model->findById($id_almacen)) {
                throw new \Exception("Almacén no encontrado", 404);
            }

            $instalaciones = $this->model->getInstalacionesDeAlmacen($id_almacen);
            $eliminado = false;

            foreach ($instalaciones as $inst) {
                $id_instalacion = $inst['id_instalacion'];

                $affectedU = $this->model->deleteMaterialUnidades($id_almacen, $id_instalacion, $id_material);
                if ($affectedU > 0) { $eliminado = true; break; }

                $affectedS = $this->model->deleteMaterialSerie($id_almacen, $id_instalacion, $id_material);
                if ($affectedS > 0) { $eliminado = true; break; }
            }

            if (!$eliminado) {
                throw new \Exception("No existe la asignación del material en este almacén", 404);
            }
        } catch (\Exception $e) {
            throw $e;
        }
    }
}
?>