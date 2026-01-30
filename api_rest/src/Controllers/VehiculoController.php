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

    // ========== CRUD VEHÍCULOS ==========

    /**
     * GET /vehiculos
     */
    public function index(Request $req, Response $res): void
    {
        try {
            $vehiculos = $this->service->getAllVehiculos();
            $res->status(200)->json($vehiculos);
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * GET /vehiculos/{matricula}
     */
    public function show(Request $req, Response $res, string $matricula): void
    {
        try {
            $vehiculo = $this->service->getVehiculoByMatricula($matricula);
            $res->status(200)->json($vehiculo);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $status = $e->getCode() === 404 ? 404 : 500;
            $res->errorJson($e->getMessage(), $status);
        }
    }

    /**
     * POST /vehiculos
     */
    public function store(Request $req, Response $res): void
    {
        try {
            $result = $this->service->createVehiculo($req->json());
            $res->status(201)->json([], $result['message']);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * PUT /vehiculos/{matricula}
     */
    public function update(Request $req, Response $res, string $matricula): void
    {
        try {
            $result = $this->service->updateVehiculo($matricula, $req->json());

            if ($result['status'] === 'no_changes') {
                $res->status(200)->json([], $result['message']);
                return;
            }

            $res->status(200)->json([], $result['message']);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() > 0 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * DELETE /vehiculos/{matricula}
     */
    public function destroy(Request $req, Response $res, string $matricula): void
    {
        try {
            $this->service->deleteVehiculo($matricula);
            $res->status(200)->json([], "Vehículo eliminado correctamente");
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    // ========== MATERIAL CARGADO EN VEHÍCULO ==========

    /**
     * GET /vehiculos/{matricula}/materiales
     */
    public function getMaterial(Request $req, Response $res, string $matricula): void
    {
        try {
            $material = $this->service->getMaterialEnVehiculo($matricula);
            $res->status(200)->json($material);
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * POST /vehiculos/{matricula}/materiales
     */
    public function setMaterial(Request $req, Response $res, string $matricula): void
    {
        try {
            $result = $this->service->addMaterialToVehiculo($matricula, $req->json());
            $res->status(201)->json([], $result['message']);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * PUT /vehiculos/{matricula}/materiales/{id_material}
     */
    public function updateMaterial(Request $req, Response $res, string $matricula, string $id_material): void
    {
        try {
            $result = $this->service->updateMaterialInVehiculo($matricula, (int) $id_material, $req->json());

            if ($result['status'] === 'no_changes') {
                $res->status(200)->json([], $result['message']);
                return;
            }

            $res->status(200)->json([], $result['message']);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() > 0 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * DELETE /vehiculos/{matricula}/materiales/{id_material}
     */
    public function deleteMaterial(Request $req, Response $res, string $matricula, string $id_material): void
    {
        try {
            $this->service->deleteMaterialFromVehiculo($matricula, (int) $id_material);
            $res->status(200)->json([], "Material eliminado del vehículo correctamente");
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    // ========== INSTALACIÓN DEL VEHÍCULO ==========

    /**
     * GET /vehiculos/{matricula}/instalacion
     */
    public function getInstalacion(Request $req, Response $res, string $matricula): void
    {
        try {
            $result = $this->service->getInstalacionDeVehiculo($matricula);
            $res->status(200)->json($result);
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * POST /vehiculos/{matricula}/instalacion
     */
    public function setInstalacion(Request $req, Response $res, string $matricula): void
    {
        try {
            $result = $this->service->setInstalacionToVehiculo($matricula, $req->json());

            if ($result['status'] === 'no_changes') {
                $res->status(200)->json([], $result['message']);
                return;
            }

            $res->status(200)->json([], $result['message']);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() > 0 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }

    /**
     * DELETE /vehiculos/{matricula}/instalacion
     */
    public function deleteInstalacion(Request $req, Response $res, string $matricula): void
    {
        try {
            $result = $this->service->removeInstalacionFromVehiculo($matricula);

            if ($result['status'] === 'no_changes') {
                $res->status(200)->json([], $result['message']);
                return;
            }

            $res->status(200)->json([], $result['message']);
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = $e->getCode() > 0 ? $e->getCode() : 500;
            $res->errorJson($e->getMessage(), $code);
        }
    }
}