<?php
declare(strict_types=1);

namespace Services;

use Models\VehiculoModel;
use Models\InstalacionModel;
use Models\MaterialModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class VehiculoService
{
    private VehiculoModel $model;
    private InstalacionModel $instalacionModel;
    private MaterialModel $materialModel;

    public function __construct()
    {
        $this->model = new VehiculoModel();
        $this->instalacionModel = new InstalacionModel();
        $this->materialModel = new MaterialModel();
    }

    // ========== CRUD VEHÍCULOS ==========

    public function getAllVehiculos(): array
    {
        try {
            return $this->model->all();
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function getVehiculoByMatricula(string $matricula): array
    {
        Validator::validate(['matricula' => $matricula], [
            'matricula' => 'required|string|min:1|max:15'
        ]);

        try {
            $vehiculo = $this->model->find($matricula);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$vehiculo) {
            throw new \Exception("Vehículo no encontrado", 404);
        }

        return $vehiculo;
    }

    public function createVehiculo(array $input): array
    {
        $data = Validator::validate($input, [
            'matricula'      => 'required|string|min:1|max:15',
            'nombre'         => 'required|string|min:2|max:100',
            'id_instalacion' => 'int|min:1',
            'marca'          => 'required|string|min:2|max:50',
            'modelo'         => 'required|string|min:2|max:50',
            'tipo'           => 'required|string|min:2|max:50',
            'disponibilidad' => 'required|boolean'
        ]);

        // Verificar si la instalación existe (si se proporciona)
        if (isset($data['id_instalacion'])) {
            $instalacion = $this->instalacionModel->find($data['id_instalacion']);
            if (!$instalacion) {
                throw new \Exception("Instalación no encontrada", 404);
            }
        }

        try {
            $creado = $this->model->create($data);
            
            if (!$creado) {
                throw new \Exception("No se pudo crear el vehículo (¿matrícula duplicada?)", 409);
            }

            return ['message' => 'Vehículo creado correctamente'];
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function updateVehiculo(string $matricula, array $input): array
    {
        Validator::validate(['matricula' => $matricula], [
            'matricula' => 'required|string|min:1|max:15'
        ]);

        $data = Validator::validate($input, [
            'nombre'         => 'required|string|min:2|max:100',
            'id_instalacion' => 'int|min:1',
            'marca'          => 'required|string|min:2|max:50',
            'modelo'         => 'required|string|min:2|max:50',
            'tipo'           => 'required|string|min:2|max:50',
            'disponibilidad' => 'required|boolean',
            'ult_latitud'    => 'numeric',
            'ult_longitud'   => 'numeric'
        ]);

        // Verificar que el vehículo existe
        $vehiculo = $this->model->find($matricula);
        if (!$vehiculo) {
            throw new \Exception("Vehículo no encontrado", 404);
        }

        // Verificar si la instalación existe (si se proporciona)
        if (isset($data['id_instalacion'])) {
            $instalacion = $this->instalacionModel->find($data['id_instalacion']);
            if (!$instalacion) {
                throw new \Exception("Instalación no encontrada", 404);
            }
        }

        try {
            $result = $this->model->update($matricula, $data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            return [
                'status' => 'no_changes',
                'message' => 'No hubo cambios en los datos del vehículo'
            ];
        }

        return [
            'status' => 'updated',
            'message' => 'Vehículo actualizado correctamente'
        ];
    }

    public function deleteVehiculo(string $matricula): void
    {
        Validator::validate(['matricula' => $matricula], [
            'matricula' => 'required|string|min:1|max:15'
        ]);

        // Verificar que el vehículo existe
        $vehiculo = $this->model->find($matricula);
        if (!$vehiculo) {
            throw new \Exception("Vehículo no encontrado", 404);
        }

        try {
            $result = $this->model->delete($matricula);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            throw new \Exception("Vehículo no encontrado", 404);
        }

        if ($result === -1) {
            throw new \Exception("No se puede eliminar el vehículo: tiene material cargado o está en uso", 409);
        }
    }

    // ========== MATERIAL CARGADO EN VEHÍCULO ==========

    public function getMaterialEnVehiculo(string $matricula): array
    {
        Validator::validate(['matricula' => $matricula], [
            'matricula' => 'required|string|min:1|max:15'
        ]);

        // Verificar que el vehículo existe
        $vehiculo = $this->model->find($matricula);
        if (!$vehiculo) {
            throw new \Exception("Vehículo no encontrado", 404);
        }

        try {
            return $this->model->getMaterialEnVehiculo($matricula);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function addMaterialToVehiculo(string $matricula, array $input): array
    {
        Validator::validate(['matricula' => $matricula], [
            'matricula' => 'required|string|min:1|max:15'
        ]);

        $data = Validator::validate($input, [
            'id_material' => 'required|int|min:1',
            'nserie'      => 'string|max:50',
            'unidades'    => 'required|int|min:1'
        ]);

        // Verificar que el vehículo existe
        $vehiculo = $this->model->find($matricula);
        if (!$vehiculo) {
            throw new \Exception("Vehículo no encontrado", 404);
        }

        // Verificar que el material existe
        $material = $this->materialModel->find($data['id_material']);
        if (!$material) {
            throw new \Exception("Material no encontrado", 404);
        }

        $data['matricula'] = $matricula;

        try {
            // Verificar si ya existe este material en el vehículo
            $existente = $this->model->findMaterialEnVehiculo($matricula, $data['id_material']);
            
            if ($existente) {
                throw new \Exception("Este material ya está cargado en el vehículo", 409);
            }

            $creado = $this->model->addMaterial($data);
            
            if (!$creado) {
                throw new \Exception("No se pudo añadir el material al vehículo");
            }

            return ['message' => 'Material añadido al vehículo correctamente'];
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function updateMaterialInVehiculo(string $matricula, int $id_material, array $input): array
    {
        Validator::validate([
            'matricula' => $matricula,
            'id_material' => $id_material
        ], [
            'matricula' => 'required|string|min:1|max:15',
            'id_material' => 'required|int|min:1'
        ]);

        $data = Validator::validate($input, [
            'nserie'   => 'string|max:50',
            'unidades' => 'required|int|min:1'
        ]);

        try {
            $result = $this->model->updateMaterial($matricula, $id_material, $data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            // Verificar si existe el registro
            $existente = $this->model->findMaterialEnVehiculo($matricula, $id_material);
            
            if (!$existente) {
                throw new \Exception("Material no encontrado en el vehículo", 404);
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

    public function deleteMaterialFromVehiculo(string $matricula, int $id_material): void
    {
        Validator::validate([
            'matricula' => $matricula,
            'id_material' => $id_material
        ], [
            'matricula' => 'required|string|min:1|max:15',
            'id_material' => 'required|int|min:1'
        ]);

        try {
            $result = $this->model->deleteMaterial($matricula, $id_material);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            throw new \Exception("Material no encontrado en el vehículo", 404);
        }
    }

    // ========== INSTALACIÓN DEL VEHÍCULO ==========

    public function getInstalacionDeVehiculo(string $matricula): array
    {
        Validator::validate(['matricula' => $matricula], [
            'matricula' => 'required|string|min:1|max:15'
        ]);

        $vehiculo = $this->getVehiculoByMatricula($matricula);
        
        if (!$vehiculo['id_instalacion']) {
            return ['instalacion' => null];
        }

        // Obtener detalles de la instalación
        $instalacion = $this->instalacionModel->find($vehiculo['id_instalacion']);
        
        if (!$instalacion) {
            return ['instalacion' => null];
        }

        return ['instalacion' => $instalacion];
    }

    public function setInstalacionToVehiculo(string $matricula, array $input): array
    {
        Validator::validate(['matricula' => $matricula], [
            'matricula' => 'required|string|min:1|max:15'
        ]);

        $data = Validator::validate($input, [
            'id_instalacion' => 'required|int|min:1'
        ]);

        // Verificar que el vehículo existe
        $vehiculo = $this->model->find($matricula);
        if (!$vehiculo) {
            throw new \Exception("Vehículo no encontrado", 404);
        }

        // Verificar que la instalación existe
        $instalacion = $this->instalacionModel->find($data['id_instalacion']);
        if (!$instalacion) {
            throw new \Exception("Instalación no encontrada", 404);
        }

        try {
            $result = $this->model->setInstalacion($matricula, $data['id_instalacion']);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            // Verificar si ya tenía esa instalación
            if ($vehiculo['id_instalacion'] == $data['id_instalacion']) {
                return [
                    'status' => 'no_changes',
                    'message' => 'El vehículo ya estaba asignado a esta instalación'
                ];
            }
            
            throw new \Exception("No se pudo asignar el vehículo a la instalación");
        }

        return [
            'status' => 'updated',
            'message' => 'Vehículo asignado a la instalación correctamente'
        ];
    }

    public function removeInstalacionFromVehiculo(string $matricula): array
    {
        Validator::validate(['matricula' => $matricula], [
            'matricula' => 'required|string|min:1|max:15'
        ]);

        // Verificar que el vehículo existe
        $vehiculo = $this->model->find($matricula);
        if (!$vehiculo) {
            throw new \Exception("Vehículo no encontrado", 404);
        }

        // Verificar si ya no tiene instalación
        if (!$vehiculo['id_instalacion']) {
            return [
                'status' => 'no_changes',
                'message' => 'El vehículo ya no tenía instalación asignada'
            ];
        }

        try {
            $result = $this->model->removeInstalacion($matricula);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            throw new \Exception("No se pudo desasignar el vehículo de la instalación");
        }

        return [
            'status' => 'updated',
            'message' => 'Vehículo desasignado de la instalación correctamente'
        ];
    }
}