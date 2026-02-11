<?php
declare(strict_types=1);

namespace Services;

use Models\VehiculoModel;
use Models\InstalacionModel;
use Models\MaterialModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;
use Core\DB;

class VehiculoService
{
    private VehiculoModel $model;
    private InstalacionModel $instalacionModel;
    private MaterialModel $materialModel;
    private DB $db;
    
    public function __construct()
    {
        $this->model = new VehiculoModel();
        $this->instalacionModel = new InstalacionModel();
        $this->materialModel = new MaterialModel();
        $this->db = new DB();
    }

    // GET, /vehiculos
    public function getAllVehiculos(): array
    {
        return $this->model->all();
    }
    
    // POST, /vehiculos
    public function createVehiculo(array $input): int
    {
        $data = Validator::validate($input, [
            'matricula' => 'required|string|max:15',
            'nombre'     => 'required|string|max:100',
            'marca'     => 'required|string|max:50',
            'modelo'    => 'required|string|max:50',
            'tipo'      => 'required|string|max:50',
            'disponibilidad' => 'required|int|in:0,1'
        ]);

        try {
            $newId = $this->model->create($data);
            if ($newId === false) {
                throw new \Exception("No se pudo crear el vehículo", 500);
            }
            return $newId;
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }
    
    // GET, /vehiculos/{matricula}
    public function getVehiculoByMatricula(string $matricula): array
    {
        Validator::validate(['matricula' => $matricula], [
            'matricula' => 'required|string'
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
    
    // PUT, /vehiculos/{matricula}
    public function updateVehiculo(string $matricula, array $input): void
    {
        Validator::validate(['matricula' => $matricula], [
            'matricula' => 'required|string'
        ]);

        $data = Validator::validate($input, [
            'nombre'  => 'required|string|max:100',
            'marca'  => 'required|string|max:50',
            'modelo' => 'required|string|max:50',
            'tipo'   => 'required|string|max:50',
            'disponibilidad' => 'required|int|in:0,1'
        ]);

        try {
            // Primero verificar si el vehículo existe
            $vehiculo = $this->model->find($matricula);
            if (!$vehiculo) {
                throw new \Exception("Vehículo no encontrado", 404);
            }
            
            // Actualizar el vehículo
            $this->model->update($matricula, $data);
            
        } catch (Throwable $e) {
            if ($e->getCode() !== 0) {
                throw $e;
            }
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }
    
    // DELETE, /vehiculos/{matricula}
    public function deleteVehiculo(string $matricula): void
    {
        Validator::validate(['matricula' => $matricula], [
            'matricula' => 'required|string'
        ]);

        try {
            // Primero verificar si el vehículo existe
            $vehiculo = $this->model->find($matricula);
            if (!$vehiculo) {
                throw new \Exception("Vehículo no encontrado", 404);
            }
            
            // Eliminar el vehículo
            $deletedRows = $this->model->delete($matricula);
            if ($deletedRows === 0) {
                throw new \Exception("No se pudo eliminar el vehículo", 500);
            }
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    // MATERIAL CARGADO EN VEHÍCULOS
    // GET, /vehiculos/{matricula}/materiales
    public function getMaterialesVehiculo(string $matricula): array
    {
        Validator::validate(['matricula' => $matricula], [
            'matricula' => 'required|string'
        ]);

        try {
            $materiales = $this->materialModel->getByVehiculo($matricula);
            return $materiales;
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }
    
    // POST, /vehiculos/{matricula}/materiales
    public function addMaterialToVehiculo(string $matricula, int $id_material, array $input): void
    {
        Validator::validate(
            ['matricula' => $matricula, 'id_material' => $id_material],
            [
                'matricula'   => 'required|string|max:15',
                'id_material' => 'required|int|min:1'
            ]
        );

        $data = Validator::validate($input, [
            'nserie'        => 'string|max:50',
            'unidades'      => 'int|min:1'
        ]);

        // Convertir string a int si es necesario
        if (isset($data['unidades'])) {
            $data['unidades'] = (int)$data['unidades'];
        }

        // Regla de negocio
        $hasNserie   = !empty($data['nserie']);
        $hasUnidades = !empty($data['unidades']);

        if ($hasNserie === $hasUnidades) {
            throw new ValidationException([
                'material' => 'Debe indicar exactamente uno: nserie o unidades'
            ]);
        }

        $ok = $this->materialModel->createForVehiculo(
            $matricula,
            $id_material,
            $data
        );

        if ($ok === false) {
            throw new \Exception("No se pudo agregar el material al vehículo", 500);
        }
    }
    
    // PUT, /vehiculos/{matricula}/materiales/{id_material}
    public function updateMaterialOfVehiculo(string $matricula, int $id_material, array $input): void
    {
        Validator::validate(['matricula' => $matricula, 'id_material' => $id_material], [
            'matricula' => 'required|string',
            'id_material' => 'required|int'
        ]);

        $data = Validator::validate($input, [
            'unidades'    => 'required|int|min:1', 
            'nserie'      => 'string|max:50'
        ]);

        try {
            $updatedRows = $this->materialModel->updateForVehiculo($matricula, $id_material, $data);
            if ($updatedRows === 0) {
                throw new \Exception("Material no encontrado para el vehículo", 404);
            }
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    // DELETE, /vehiculos/{matricula}/materiales/{id_material}
    public function deleteMaterialFromVehiculo(string $matricula, int $id_material): void
    {
        Validator::validate(['matricula' => $matricula], [
            'matricula' => 'required|string'
        ]);

        try {
            $deletedRows = $this->materialModel->deleteForVehiculo($matricula, $id_material);
            if ($deletedRows === 0) {
                throw new \Exception("Material no encontrado para el vehículo", 404);
            }
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    // INSTALACIÓN DE VEHÍCULOS
    // GET, /vehiculos/{matricula}/instalacion
    public function getInstalacionOfVehiculo(string $matricula): ?array
    {
        Validator::validate(['matricula' => $matricula], [
            'matricula' => 'required|string'
        ]);

        try {
            $instalacion = $this->model->getInstalacion($matricula);
            return $instalacion;
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }
    
    // POST, /vehiculos/{matricula}/instalacion
    public function setInstalacionForVehiculo(string $matricula, int $id_instalacion): void
    {
        Validator::validate(['matricula' => $matricula], [
            'matricula' => 'required|string'
        ]);

        try {
            $result = $this->model->setInstalacion($matricula, $id_instalacion);
            if ($result === false) {
                throw new \Exception("No se pudo asignar la instalación al vehículo", 500);
            }
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }
    
    // DELETE, /vehiculos/{matricula}/instalacion
    public function deleteInstalacionFromVehiculo(string $matricula): void
    {
        Validator::validate(['matricula' => $matricula], [
            'matricula' => 'required|string'
        ]);

        try {
            $deletedRows = $this->model->deleteInstalacion($matricula);
            if ($deletedRows === 0) {
                throw new \Exception("Instalación no encontrada para el vehículo", 404);
            }
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }
}