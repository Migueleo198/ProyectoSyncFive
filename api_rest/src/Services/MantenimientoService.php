<?php
declare(strict_types=1);

namespace Services;

use Models\MantenimientoModel;
use Models\PersonaModel;
use Models\VehiculoModel;
use Models\MaterialModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class MantenimientoService
{
    private MantenimientoModel $model;
    private PersonaModel $personaModel;
    private VehiculoModel $vehiculoModel;
    private MaterialModel $materialModel;

    public function __construct()
    {
        $this->model = new MantenimientoModel();
        $this->personaModel = new PersonaModel();
        $this->vehiculoModel = new VehiculoModel();
        $this->materialModel = new MaterialModel();
    }

    public function getAllMantenimientos(): array
    {
        try {
            return $this->model->all();
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function createMantenimiento(array $input): array
    {
        $data = Validator::validate($input, [
            'id_bombero'  => 'int|min:1',
            'estado'      => 'required|in:ABIERTO,REALIZADO',
            'f_inicio'    => 'required|date',
            'f_fin'       => 'date',
            'descripcion' => 'string'
        ]);

        // Verificar que el bombero existe (si se proporciona)
        if (isset($data['id_bombero'])) {
            $persona = $this->personaModel->find($data['id_bombero']);
            if (!$persona) {
                throw new \Exception("Bombero no encontrado", 404);
            }
        }

        try {
            $id = $this->model->create($data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$id) {
            throw new \Exception("No se pudo crear el mantenimiento");
        }

        return ['cod_mantenimiento' => $id];
    }

    public function updateMantenimiento(int $cod_mantenimiento, array $input): array
    {
        Validator::validate(['cod_mantenimiento' => $cod_mantenimiento], [
            'cod_mantenimiento' => 'required|int|min:1'
        ]);

        $data = Validator::validate($input, [
            'id_bombero'  => 'int|min:1',
            'estado'      => 'required|in:ABIERTO,REALIZADO',
            'f_inicio'    => 'required|date',
            'f_fin'       => 'date',
            'descripcion' => 'string'
        ]);

        // Verificar que el mantenimiento existe
        $mantenimiento = $this->model->find($cod_mantenimiento);
        if (!$mantenimiento) {
            throw new \Exception("Mantenimiento no encontrado", 404);
        }

        // Verificar que el bombero existe (si se proporciona)
        if (isset($data['id_bombero'])) {
            $persona = $this->personaModel->find($data['id_bombero']);
            if (!$persona) {
                throw new \Exception("Bombero no encontrado", 404);
            }
        }

        try {
            $result = $this->model->update($cod_mantenimiento, $data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            return [
                'status' => 'no_changes',
                'message' => 'No hubo cambios en los datos del mantenimiento'
            ];
        }

        return [
            'status' => 'updated',
            'message' => 'Mantenimiento actualizado correctamente'
        ];
    }

    public function patchMantenimiento(int $cod_mantenimiento, array $input): array
    {
        Validator::validate(['cod_mantenimiento' => $cod_mantenimiento], [
            'cod_mantenimiento' => 'required|int|min:1'
        ]);

        $data = Validator::validate($input, [
            'estado' => 'required|in:ABIERTO,REALIZADO'
        ]);

        // Verificar que el mantenimiento existe
        $mantenimiento = $this->model->find($cod_mantenimiento);
        if (!$mantenimiento) {
            throw new \Exception("Mantenimiento no encontrado", 404);
        }

        try {
            $result = $this->model->updateEstado($cod_mantenimiento, $data['estado']);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            return [
                'status' => 'no_changes',
                'message' => 'No hubo cambios en el estado del mantenimiento'
            ];
        }

        return [
            'status' => 'updated',
            'message' => 'Estado del mantenimiento actualizado correctamente'
        ];
    }

    public function deleteMantenimiento(int $cod_mantenimiento): void
    {
        Validator::validate(['cod_mantenimiento' => $cod_mantenimiento], [
            'cod_mantenimiento' => 'required|int|min:1'
        ]);

        // Verificar que el mantenimiento existe
        $mantenimiento = $this->model->find($cod_mantenimiento);
        if (!$mantenimiento) {
            throw new \Exception("Mantenimiento no encontrado", 404);
        }

        try {
            $result = $this->model->delete($cod_mantenimiento);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            throw new \Exception("Mantenimiento no encontrado", 404);
        }
    }

    // ========== RELACIONES ==========

    public function getPersonasEnMantenimiento(int $cod_mantenimiento): array
    {
        Validator::validate(['cod_mantenimiento' => $cod_mantenimiento], [
            'cod_mantenimiento' => 'required|int|min:1'
        ]);

        // Verificar que el mantenimiento existe
        $mantenimiento = $this->model->find($cod_mantenimiento);
        if (!$mantenimiento) {
            throw new \Exception("Mantenimiento no encontrado", 404);
        }

        try {
            return $this->model->getPersonas($cod_mantenimiento);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function addPersonaToMantenimiento(int $cod_mantenimiento, int $id_bombero): array
    {
        Validator::validate([
            'cod_mantenimiento' => $cod_mantenimiento,
            'id_bombero' => $id_bombero
        ], [
            'cod_mantenimiento' => 'required|int|min:1',
            'id_bombero' => 'required|int|min:1'
        ]);

        // Verificar que el mantenimiento existe
        $mantenimiento = $this->model->find($cod_mantenimiento);
        if (!$mantenimiento) {
            throw new \Exception("Mantenimiento no encontrado", 404);
        }

        // Verificar que el bombero existe
        $persona = $this->personaModel->find($id_bombero);
        if (!$persona) {
            throw new \Exception("Bombero no encontrado", 404);
        }

        try {
            $added = $this->model->addPersona($cod_mantenimiento, $id_bombero);
            
            if (!$added) {
                throw new \Exception("No se pudo añadir el bombero al mantenimiento");
            }

            return ['message' => 'Bombero añadido al mantenimiento correctamente'];
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function removePersonaFromMantenimiento(int $cod_mantenimiento, int $id_bombero): void
    {
        Validator::validate([
            'cod_mantenimiento' => $cod_mantenimiento,
            'id_bombero' => $id_bombero
        ], [
            'cod_mantenimiento' => 'required|int|min:1',
            'id_bombero' => 'required|int|min:1'
        ]);

        try {
            $result = $this->model->removePersona($cod_mantenimiento, $id_bombero);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            throw new \Exception("Bombero no encontrado en el mantenimiento", 404);
        }
    }

    // Métodos similares para vehículos y materiales...

    public function getVehiculosEnMantenimiento(int $cod_mantenimiento): array
    {
        Validator::validate(['cod_mantenimiento' => $cod_mantenimiento], [
            'cod_mantenimiento' => 'required|int|min:1'
        ]);

        $mantenimiento = $this->model->find($cod_mantenimiento);
        if (!$mantenimiento) {
            throw new \Exception("Mantenimiento no encontrado", 404);
        }

        try {
            return $this->model->getVehiculos($cod_mantenimiento);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function addVehiculoToMantenimiento(int $cod_mantenimiento, string $matricula): array
    {
        Validator::validate([
            'cod_mantenimiento' => $cod_mantenimiento,
            'matricula' => $matricula
        ], [
            'cod_mantenimiento' => 'required|int|min:1',
            'matricula' => 'required|string|min:1|max:15'
        ]);

        $mantenimiento = $this->model->find($cod_mantenimiento);
        if (!$mantenimiento) {
            throw new \Exception("Mantenimiento no encontrado", 404);
        }

        $vehiculo = $this->vehiculoModel->find($matricula);
        if (!$vehiculo) {
            throw new \Exception("Vehículo no encontrado", 404);
        }

        try {
            $added = $this->model->addVehiculo($cod_mantenimiento, $matricula);
            
            if (!$added) {
                throw new \Exception("No se pudo añadir el vehículo al mantenimiento");
            }

            return ['message' => 'Vehículo añadido al mantenimiento correctamente'];
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function removeVehiculoFromMantenimiento(int $cod_mantenimiento, string $matricula): void
    {
        Validator::validate([
            'cod_mantenimiento' => $cod_mantenimiento,
            'matricula' => $matricula
        ], [
            'cod_mantenimiento' => 'required|int|min:1',
            'matricula' => 'required|string|min:1|max:15'
        ]);

        try {
            $result = $this->model->removeVehiculo($cod_mantenimiento, $matricula);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            throw new \Exception("Vehículo no encontrado en el mantenimiento", 404);
        }
    }

    public function getMaterialesEnMantenimiento(int $cod_mantenimiento): array
    {
        Validator::validate(['cod_mantenimiento' => $cod_mantenimiento], [
            'cod_mantenimiento' => 'required|int|min:1'
        ]);

        $mantenimiento = $this->model->find($cod_mantenimiento);
        if (!$mantenimiento) {
            throw new \Exception("Mantenimiento no encontrado", 404);
        }

        try {
            return $this->model->getMateriales($cod_mantenimiento);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function addMaterialToMantenimiento(int $cod_mantenimiento, int $id_material): array
    {
        Validator::validate([
            'cod_mantenimiento' => $cod_mantenimiento,
            'id_material' => $id_material
        ], [
            'cod_mantenimiento' => 'required|int|min:1',
            'id_material' => 'required|int|min:1'
        ]);

        $mantenimiento = $this->model->find($cod_mantenimiento);
        if (!$mantenimiento) {
            throw new \Exception("Mantenimiento no encontrado", 404);
        }

        $material = $this->materialModel->find($id_material);
        if (!$material) {
            throw new \Exception("Material no encontrado", 404);
        }

        try {
            $added = $this->model->addMaterial($cod_mantenimiento, $id_material);
            
            if (!$added) {
                throw new \Exception("No se pudo añadir el material al mantenimiento");
            }

            return ['message' => 'Material añadido al mantenimiento correctamente'];
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function removeMaterialFromMantenimiento(int $cod_mantenimiento, int $id_material): void
    {
        Validator::validate([
            'cod_mantenimiento' => $cod_mantenimiento,
            'id_material' => $id_material
        ], [
            'cod_mantenimiento' => 'required|int|min:1',
            'id_material' => 'required|int|min:1'
        ]);

        try {
            $result = $this->model->removeMaterial($cod_mantenimiento, $id_material);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            throw new \Exception("Material no encontrado en el mantenimiento", 404);
        }
    }
}