<?php
declare(strict_types=1);

namespace Services;

use Models\AlmacenModel;
use Models\AlmacenMaterialModel;
use Models\InstalacionModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class AlmacenService
{
    private AlmacenModel $model;
    private ?AlmacenMaterialModel $materialModel = null;
    private ?InstalacionModel $instalacionModel = null;

    public function __construct()
    {
        $this->model = new AlmacenModel();
    }

    // ========== HELPER METHODS ==========
    
    private function getMaterialModel(): AlmacenMaterialModel
    {
        if ($this->materialModel === null) {
            if (!class_exists('Models\\AlmacenMaterialModel')) {
                throw new \Exception(
                    "Funcionalidad de material no disponible. " .
                    "AlmacenMaterialModel no encontrado.", 
                    503
                );
            }
            $this->materialModel = new AlmacenMaterialModel();
        }
        return $this->materialModel;
    }

    private function getInstalacionModel(): InstalacionModel
    {
        if ($this->instalacionModel === null) {
            if (!class_exists('Models\\InstalacionModel')) {
                throw new \Exception(
                    "Funcionalidad de instalaciones no disponible. " .
                    "InstalacionModel no encontrado.", 
                    503
                );
            }
            $this->instalacionModel = new InstalacionModel();
        }
        return $this->instalacionModel;
    }

    // ========== ALMACENES DE UNA INSTALACIÓN ==========

    public function getAlmacenesByInstalacion(int $id_instalacion): array
    {
        Validator::validate(['id_instalacion' => $id_instalacion], [
            'id_instalacion' => 'required|int|min:1'
        ]);

        try {
            // Validar instalación solo si el modelo existe
            try {
                $instalacion = $this->getInstalacionModel()->find($id_instalacion);
                if (!$instalacion) {
                    throw new \Exception("Instalación no encontrada", 404);
                }
            } catch (\Exception $e) {
                // Si no puede validar, continuamos igual (depende de tus reglas)
                // throw new \Exception("No se puede validar instalación: " . $e->getMessage(), 503);
            }

            return $this->model->findByInstalacion($id_instalacion);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function createAlmacenEnInstalacion(int $id_instalacion, array $input): array
    {
        Validator::validate(['id_instalacion' => $id_instalacion], [
            'id_instalacion' => 'required|int|min:1'
        ]);

        try {
            // Verificar que la instalación existe
            $instalacion = $this->getInstalacionModel()->find($id_instalacion);
            if (!$instalacion) {
                throw new \Exception("Instalación no encontrada", 404);
            }
        } catch (\Exception $e) {
            throw new \Exception("No se puede verificar instalación: " . $e->getMessage(), 503);
        }

        $data = Validator::validate($input, [
            'planta' => 'required|int',
            'nombre' => 'required|string|min:2|max:100'
        ]);

        try {
            // Crear el almacén
            $id_almacen = $this->model->create($data);
            
            if (!$id_almacen) {
                throw new \Exception("No se pudo crear el almacén");
            }

            // Asociarlo con la instalación
            $asociado = $this->model->asociarConInstalacion($id_almacen, $id_instalacion);
            
            if (!$asociado) {
                throw new \Exception("No se pudo asociar el almacén con la instalación");
            }

            return ['id_almacen' => $id_almacen];
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function updateAlmacenEnInstalacion(int $id_instalacion, int $id_almacen, array $input): array
    {
        Validator::validate([
            'id_instalacion' => $id_instalacion,
            'id_almacen' => $id_almacen
        ], [
            'id_instalacion' => 'required|int|min:1',
            'id_almacen' => 'required|int|min:1'
        ]);

        // Verificar que la asociación existe
        if (!$this->model->existeAsociacion($id_almacen, $id_instalacion)) {
            throw new \Exception("Almacén no encontrado en esta instalación", 404);
        }

        $data = Validator::validate($input, [
            'planta' => 'required|int',
            'nombre' => 'required|string|min:2|max:100'
        ]);

        try {
            $result = $this->model->update($id_almacen, $data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
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

    public function deleteAlmacenDeInstalacion(int $id_instalacion, int $id_almacen): void
    {
        Validator::validate([
            'id_instalacion' => $id_instalacion,
            'id_almacen' => $id_almacen
        ], [
            'id_instalacion' => 'required|int|min:1',
            'id_almacen' => 'required|int|min:1'
        ]);

        // Verificar que la asociación existe
        if (!$this->model->existeAsociacion($id_almacen, $id_instalacion)) {
            throw new \Exception("Almacén no encontrado en esta instalación", 404);
        }

        try {
            // Primero desasociar de esta instalación
            $this->model->desasociarDeInstalacion($id_almacen, $id_instalacion);
            
            // Verificar si el almacén está asociado a otras instalaciones
            $otros = $this->model->countInstalacionesAsociadas($id_almacen);
            
            // Si no está asociado a ninguna instalación, eliminar el almacén
            if ($otros == 0) {
                $result = $this->model->delete($id_almacen);
                
                if ($result === 0) {
                    throw new \Exception("Almacén no encontrado", 404);
                }
                
                if ($result === -1) {
                    throw new \Exception("No se puede eliminar el almacén: contiene material almacenado", 409);
                }
            }
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    // ========== MATERIAL EN ALMACÉN ==========

    public function getMaterialEnAlmacen(int $id_almacen): array
    {
        Validator::validate(['id_almacen' => $id_almacen], [
            'id_almacen' => 'required|int|min:1'
        ]);

        // Verificar que el almacén existe
        $almacen = $this->model->find($id_almacen);
        if (!$almacen) {
            throw new \Exception("Almacén no encontrado", 404);
        }

        try {
            return $this->getMaterialModel()->findByAlmacen($id_almacen);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function addMaterialToAlmacen(int $id_almacen, array $input): array
    {
        Validator::validate(['id_almacen' => $id_almacen], [
            'id_almacen' => 'required|int|min:1'
        ]);

        // Verificar que el almacén existe
        $almacen = $this->model->find($id_almacen);
        if (!$almacen) {
            throw new \Exception("Almacén no encontrado", 404);
        }

        $data = Validator::validate($input, [
            'id_instalacion' => 'required|int|min:1',
            'id_material'    => 'required|int|min:1',
            'n_serie'        => 'int|min:1',
            'unidades'       => 'required|int|min:1'
        ]);

        // Verificar que la instalación existe
        try {
            $instalacion = $this->getInstalacionModel()->find($data['id_instalacion']);
            if (!$instalacion) {
                throw new \Exception("Instalación no encontrada", 404);
            }
        } catch (\Exception $e) {
            throw new \Exception("No se puede verificar instalación: " . $e->getMessage(), 503);
        }

        // Verificar que la asociación almacén-instalación existe
        if (!$this->model->existeAsociacion($id_almacen, $data['id_instalacion'])) {
            throw new \Exception("El almacén no está asociado a esta instalación", 400);
        }

        // Verificar que el material existe
        try {
            if (!$this->getMaterialModel()->existeMaterial($data['id_material'])) {
                throw new \Exception("Material no encontrado", 404);
            }
        } catch (\Exception $e) {
            throw new \Exception("No se puede verificar material: " . $e->getMessage(), 503);
        }

        try {
            // Verificar si ya existe este material en el almacén
            $existente = $this->getMaterialModel()->findOne($id_almacen, $data['id_instalacion'], $data['id_material']);
            
            if ($existente) {
                throw new \Exception("Este material ya existe en el almacén", 409);
            }

            $creado = $this->getMaterialModel()->create($id_almacen, $data['id_instalacion'], $data);
            
            if (!$creado) {
                throw new \Exception("No se pudo añadir el material al almacén");
            }

            return ['message' => 'Material añadido al almacén correctamente'];
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function updateMaterialInAlmacen(int $id_almacen, int $id_material, array $input): array
    {
        Validator::validate([
            'id_almacen' => $id_almacen,
            'id_material' => $id_material
        ], [
            'id_almacen' => 'required|int|min:1',
            'id_material' => 'required|int|min:1'
        ]);

        $data = Validator::validate($input, [
            'id_instalacion' => 'required|int|min:1',
            'n_serie'        => 'int|min:1',
            'unidades'       => 'required|int|min:1'
        ]);

        // Verificar que la asociación almacén-instalación existe
        if (!$this->model->existeAsociacion($id_almacen, $data['id_instalacion'])) {
            throw new \Exception("El almacén no está asociado a esta instalación", 400);
        }

        try {
            $result = $this->getMaterialModel()->update($id_almacen, $data['id_instalacion'], $id_material, $data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            // Verificar si existe el registro
            $existente = $this->getMaterialModel()->findOne($id_almacen, $data['id_instalacion'], $id_material);
            
            if (!$existente) {
                throw new \Exception("Material no encontrado en el almacén", 404);
            }

            return [
                'status' => 'no_changes',
                'message' => 'No hubo cambios en los datos del material'
            ];
        }

        return [
            'status' => 'updated',
            'message' => 'Material actualizado correctamente'
        ];
    }

    public function deleteMaterialFromAlmacen(int $id_almacen, int $id_material, int $id_instalacion): void
    {
        Validator::validate([
            'id_almacen' => $id_almacen,
            'id_material' => $id_material,
            'id_instalacion' => $id_instalacion
        ], [
            'id_almacen' => 'required|int|min:1',
            'id_material' => 'required|int|min:1',
            'id_instalacion' => 'required|int|min:1'
        ]);

        // Verificar que la asociación almacén-instalación existe
        if (!$this->model->existeAsociacion($id_almacen, $id_instalacion)) {
            throw new \Exception("El almacén no está asociado a esta instalación", 400);
        }

        try {
            $result = $this->getMaterialModel()->delete($id_almacen, $id_instalacion, $id_material);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            throw new \Exception("Material no encontrado en el almacén", 404);
        }
    }
}
?>