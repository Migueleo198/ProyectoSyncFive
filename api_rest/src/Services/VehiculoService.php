<?php
declare(strict_types=1);

namespace Services;

use Models\VehiculoModel;
use Models\InstalacionModel;
use Models\MaterialModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;
use PDOException;
use Core\DB;

class VehiculoService
{
    private VehiculoModel $model;
    private InstalacionModel $instalacionModel;
    private MaterialModel $materialModel;
    private DB $db;

    public function __construct()
    {
        $this->model            = new VehiculoModel();
        $this->instalacionModel = new InstalacionModel();
        $this->materialModel    = new MaterialModel();
        $this->db               = new DB();
    }

    // ========== VEHÍCULOS ==========

    public function getAllVehiculos(): array
    {
        return $this->model->all();
    }

    public function getVehiculosByMaterial(int $id_material): array
    {
        try {
            return $this->model->getVehiculosByMaterial($id_material);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function createVehiculo(array $input): int
    {
        $data = Validator::validate($input, [
            'matricula'      => 'required|string|max:15',
            'nombre'         => 'required|string|max:100',
            'marca'          => 'required|string|max:50',
            'modelo'         => 'required|string|max:50',
            'tipo'           => 'required|string|max:50',
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

    public function getVehiculoByMatricula(string $matricula): array
    {
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

    public function updateVehiculo(string $matricula, array $input): void
    {
        $data = Validator::validate($input, [
            'nombre'         => 'required|string|max:100',
            'marca'          => 'required|string|max:50',
            'modelo'         => 'required|string|max:50',
            'tipo'           => 'required|string|max:50',
            'disponibilidad' => 'required|int|in:0,1'
        ]);

        try {
            $vehiculo = $this->model->find($matricula);
            if (!$vehiculo) {
                throw new \Exception("Vehículo no encontrado", 404);
            }
            $this->model->update($matricula, $data);
        } catch (\Exception $e) {
            throw $e;
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function deleteVehiculo(string $matricula): void
    {
        try {
            $vehiculo = $this->model->find($matricula);
            if (!$vehiculo) {
                throw new \Exception("Vehículo no encontrado", 404);
            }
            $deletedRows = $this->model->delete($matricula);
            if ($deletedRows === 0) {
                throw new \Exception("No se pudo eliminar el vehículo", 500);
            }
        } catch (PDOException $e) {
            // Verificar si es una violación de clave foránea
            if ($e->getCode() === '23000' || strpos($e->getMessage(), 'foreign key constraint') !== false) {
                throw new \Exception("No se puede eliminar este vehículo porque hay emergencias o mantenimientos asociados", 409);
            }
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        } catch (\Exception $e) {
            throw $e;
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    // ========== MATERIAL EN VEHÍCULO (nuevo esquema) ==========

    public function getMaterialesVehiculo(string $matricula): array
    {
        try {
            $vehiculo = $this->model->find($matricula);
            if (!$vehiculo) {
                throw new \Exception("Vehículo no encontrado", 404);
            }
            return $this->model->getMateriales($matricula);
        } catch (\Exception $e) {
            throw $e;
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    /**
     * POST /vehiculos/{matricula}/materiales
     * Body: { id_material, unidades } O { id_material, nserie }
     */
    public function addMaterialToVehiculo(string $matricula, array $input): array
    {
        $data = Validator::validate($input, [
            'id_material' => 'required|int|min:1',
            'unidades'    => 'optional|int|min:1',
            'nserie'      => 'optional|string|max:50',
        ]);

        $vehiculo = $this->model->find($matricula);
        if (!$vehiculo) {
            throw new \Exception("Vehículo no encontrado", 404);
        }

        $material = $this->materialModel->find($data['id_material']);
        if (!$material) {
            throw new \Exception("Material no encontrado", 404);
        }

        $tieneUnidades = isset($data['unidades']);
        $tieneNserie   = isset($data['nserie']) && $data['nserie'] !== '';

        if (!$tieneUnidades && !$tieneNserie) {
            throw new \Exception("Debe especificar unidades o número de serie", 400);
        }
        if ($tieneUnidades && $tieneNserie) {
            throw new \Exception("No puede especificar unidades y número de serie a la vez", 400);
        }

        try {
            if ($tieneUnidades) {
                // Comprobar duplicado en unidades
                $existe = $this->model->getMaterialUnidades($matricula, $data['id_material']);
                if ($existe) {
                    throw new \Exception("Este material ya está asignado por unidades a este vehículo", 409);
                }
                $affected = $this->model->addMaterialUnidades($matricula, $data['id_material'], $data['unidades']);
            } else {
                $affected = $this->model->addMaterialSerie($matricula, $data['id_material'], $data['nserie']);
            }
        } catch (\Exception $e) {
            throw $e;
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($affected === 0) {
            throw new \Exception("No se pudo agregar el material al vehículo", 500);
        }

        return [
            'matricula'   => $matricula,
            'id_material' => $data['id_material'],
        ];
    }

    /**
     * DELETE /vehiculos/{matricula}/materiales/{id_material}
     * Busca en ambas tablas (unidades y serie) y elimina donde encuentre.
     */
    public function deleteMaterialFromVehiculo(string $matricula, int $id_material): void
    {
        try {
            $affected = $this->model->deleteMaterial($matricula, $id_material);
        } catch (PDOException $e) {
            // Verificar si es una violación de clave foránea
            if ($e->getCode() === '23000' || strpos($e->getMessage(), 'foreign key constraint') !== false) {
                throw new \Exception("No se puede eliminar el material del vehículo debido a una restricción", 409);
            }
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($affected === 0) {
            throw new \Exception("No existe la asignación del material en este vehículo", 404);
        }
    }

    // ========== INSTALACIÓN ==========

    public function getInstalacionOfVehiculo(string $matricula): ?array
    {
        try {
            return $this->model->getInstalacion($matricula);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function setInstalacionForVehiculo(string $matricula, int $id_instalacion): void
    {
        try {
            $result = $this->model->setInstalacion($matricula, $id_instalacion);
            if ($result === false || $result === 0) {
                throw new \Exception("No se pudo asignar la instalación al vehículo", 500);
            }
        } catch (\Exception $e) {
            throw $e;
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function deleteInstalacionFromVehiculo(string $matricula): void
    {
        try {
            $deletedRows = $this->model->deleteInstalacion($matricula);
            if ($deletedRows === 0) {
                throw new \Exception("Instalación no encontrada para el vehículo", 404);
            }
        } catch (PDOException $e) {
            // Verificar si es una violación de clave foránea
            if ($e->getCode() === '23000' || strpos($e->getMessage(), 'foreign key constraint') !== false) {
                throw new \Exception("No se puede eliminar la instalación del vehículo debido a una restricción", 409);
            }
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        } catch (\Exception $e) {
            throw $e;
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }
}
?>