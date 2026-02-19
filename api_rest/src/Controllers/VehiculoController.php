<?php
declare(strict_types=1);

namespace Controllers;

use Core\Request;
use Core\Response;
use Validation\ValidationException;
use Throwable;
use Services\VehiculoService;

class VehiculoController
{
    private VehiculoService $service;

    public function __construct()
    {
        $this->service = new VehiculoService();
    }

    // ========== MÉTODOS PARA VEHÍCULOS ==========

    // GET, /vehiculos
    public function index(Request $req, Response $res): void
    {
        try {
            // Obtener todos los parámetros de la URL
            $params = $req->params();
            
            // Si viene el parámetro 'material', filtrar por material
            if (isset($params['material'])) {
                $id_material = (int)$params['material'];
                $vehiculos = $this->service->getVehiculosByMaterial($id_material);
            } else {
                // Si no viene filtro, devolver todos
                $vehiculos = $this->service->getAllVehiculos();
            }
            
            $res->status(200)->json($vehiculos);
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    // POST, /vehiculos
    public function store(Request $req, Response $res): void
    {
        try {
            $data = $req->json();
            $this->service->createVehiculo($data);
            $res->status(201)->json(['message' => 'Vehículo creado correctamente']);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
            return;
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    // GET, /vehiculos/{matricula}
    public function show(Request $req, Response $res, string $matricula): void
    {
        try {
            $vehiculo = $this->service->getVehiculoByMatricula($matricula);
            $res->status(200)->json($vehiculo);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
            return;
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }
    
    // PUT, /vehiculos/{matricula}
    public function update(Request $req, Response $res, string $matricula): void
    {
        try {
            $data = $req->json();
            $this->service->updateVehiculo($matricula, $data);
            $res->status(200)->json(['message' => 'Vehículo actualizado correctamente']);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
            return;
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }
    
    // DELETE, /vehiculos/{matricula}
    public function delete(Request $req, Response $res, string $matricula): void
    {
        try {
            $this->service->deleteVehiculo($matricula);
            $res->status(200)->json(['message' => 'Vehículo eliminado correctamente']);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
            return;
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }

    // ========== MATERIAL CARGADO EN VEHÍCULOS ==========
    
    // GET, /vehiculos/{matricula}/materiales
    public function getMaterial(Request $req, Response $res, string $matricula): void
    {
        try {
            $materiales = $this->service->getMaterialesVehiculo($matricula);
            $res->status(200)->json($materiales);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
            return;
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }
    
    // POST, /vehiculos/{matricula}/materiales
    public function setMaterial(Request $req, Response $res, string $matricula, int $id_material): void
    {
        try {
            $data = $req->json();

            $this->service->addMaterialToVehiculo($matricula, $id_material, $data);

            $res->status(201)->json([
                'message' => 'Material añadido al vehículo correctamente',
                'id_material' => $id_material
            ]);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }
    
    // PUT, /vehiculos/{matricula}/materiales/{id_material}
    public function updateMaterial(Request $req, Response $res, string $matricula, int $id_material): void
    {
        try {
            $data = $req->json();
            $this->service->updateMaterialOfVehiculo($matricula, $id_material, $data);
            $res->status(200)->json(['message' => 'Material del vehículo actualizado correctamente']);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
            return;
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }
    
    // DELETE, /vehiculos/{matricula}/materiales/{id_material}
    public function deleteMaterial(Request $req, Response $res, string $matricula, int $id_material): void
    {
        try {
            $this->service->deleteMaterialFromVehiculo($matricula, $id_material);
            $res->status(200)->json(['message' => 'Material eliminado del vehículo correctamente']);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
            return;
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }

    // ========== INSTALACIÓN DE VEHÍCULOS ==========
    
    // GET, /vehiculos/{matricula}/instalacion
    public function getInstalacion(Request $req, Response $res, string $matricula): void
    {
        try {
            $instalacion = $this->service->getInstalacionOfVehiculo($matricula);
            if ($instalacion === null) {
                $res->status(404)->json(['message' => 'El vehículo no tiene instalación asignada']);
                return;
            }
            $res->status(200)->json($instalacion);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
            return;
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }
    
    // POST, /vehiculos/{matricula}/instalacion
    public function setInstalacion(Request $req, Response $res, string $matricula): void
    {
        try {
            $data = $req->json();
            
            if (!isset($data['id_instalacion'])) {
                $res->status(400)->json(['error' => 'El campo id_instalacion es requerido']);
                return;
            }
            
            $this->service->setInstalacionForVehiculo($matricula, (int)$data['id_instalacion']);
            $res->status(201)->json(['message' => 'Instalación asignada al vehículo correctamente']);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
            return;
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }
    
    // DELETE, /vehiculos/{matricula}/instalacion
    public function deleteInstalacion(Request $req, Response $res, string $matricula): void
    {
        try {
            $this->service->deleteInstalacionFromVehiculo($matricula);
            $res->status(200)->json(['message' => 'Instalación eliminada del vehículo correctamente']);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
            return;
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }
}
?>