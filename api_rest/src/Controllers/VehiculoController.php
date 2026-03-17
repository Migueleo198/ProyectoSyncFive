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

    // ========== VEHÍCULOS ==========

    // GET /vehiculos
    public function index(Request $req, Response $res): void
    {
        try {
            $vehiculos = $this->service->getAllVehiculos();
            $res->status(200)->json($vehiculos, "Listado de vehículos obtenido correctamente");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), 500);
        }
    }

    // POST /vehiculos
    public function store(Request $req, Response $res): void
    {
        try {
            $this->service->createVehiculo($req->json());
            $res->status(201)->json([], 'Vehículo creado correctamente');
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $res->errorJson($e->getMessage(), (int)($e->getCode()) ?: 500);
        }
    }

    // GET /vehiculos/{matricula}
    public function show(Request $req, Response $res, string $matricula): void
    {
        try {
            $vehiculo = $this->service->getVehiculoByMatricula($matricula);
            $res->status(200)->json($vehiculo);
        } catch (Throwable $e) {
            $code = (int)$e->getCode();
            $res->errorJson($e->getMessage(), ($code >= 400 && $code < 600) ? $code : 500);
        }
    }

    // PUT /vehiculos/{matricula}
    public function update(Request $req, Response $res, string $matricula): void
    {
        try {
            $this->service->updateVehiculo($matricula, $req->json());
            $res->status(200)->json([], 'Vehículo actualizado correctamente');
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = (int)$e->getCode();
            $res->errorJson($e->getMessage(), ($code >= 400 && $code < 600) ? $code : 500);
        }
    }

    // DELETE /vehiculos/{matricula}
    public function delete(Request $req, Response $res, string $matricula): void
    {
        try {
            $this->service->deleteVehiculo($matricula);
            $res->status(200)->json([], 'Vehículo eliminado correctamente');
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = (int)$e->getCode();
            $res->errorJson($e->getMessage(), ($code >= 400 && $code < 600) ? $code : 500);
        }
    }

    // ========== MATERIAL EN VEHÍCULO ==========

    // GET /vehiculos/{matricula}/materiales
    public function getMaterial(Request $req, Response $res, string $matricula): void
    {
        try {
            $materiales = $this->service->getMaterialesVehiculo($matricula);
            $res->status(200)->json($materiales);
        } catch (Throwable $e) {
            $code = (int)$e->getCode();
            $res->errorJson($e->getMessage(), ($code >= 400 && $code < 600) ? $code : 500);
        }
    }

    /**
     * POST /vehiculos/{matricula}/materiales/{id_material}
     * Body: { unidades } O { nserie }
     * El id_material viene en la URL y también puede venir en el body desde el frontend.
     * Lo tomamos del body porque el frontend envía { id_material, unidades/nserie }.
     */
    public function setMaterial(Request $req, Response $res, string $matricula, string $id_material): void
    {
        try {
            $input = $req->json();
            // Asegurar que id_material está en el input (puede venir de la URL o del body)
            if (!isset($input['id_material'])) {
                $input['id_material'] = (int) $id_material;
            }

            $result = $this->service->addMaterialToVehiculo($matricula, $input);

            $res->status(201)->json($result, 'Material añadido al vehículo correctamente');
        } catch (ValidationException $e) {
            $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
        } catch (Throwable $e) {
            $code = (int)$e->getCode();
            $res->errorJson($e->getMessage(), ($code >= 400 && $code < 600) ? $code : 500);
        }
    }

    // DELETE /vehiculos/{matricula}/materiales/{id_material}
    public function deleteMaterial(Request $req, Response $res, string $matricula, string $id_material): void
    {
        try {
            $this->service->deleteMaterialFromVehiculo($matricula, (int) $id_material);
            $res->status(200)->json([], 'Material eliminado del vehículo correctamente');
        } catch (Throwable $e) {
            $code = (int)$e->getCode();
            $res->errorJson($e->getMessage(), ($code >= 400 && $code < 600) ? $code : 500);
        }
    }

    // ========== INSTALACIÓN ==========

    // GET /vehiculos/{matricula}/instalacion
    public function getInstalacion(Request $req, Response $res, string $matricula): void
    {
        try {
            $instalacion = $this->service->getInstalacionOfVehiculo($matricula);
            if ($instalacion === null) {
                $res->status(404)->json([], 'El vehículo no tiene instalación asignada');
                return;
            }
            $res->status(200)->json($instalacion);
        } catch (Throwable $e) {
            $code = (int)$e->getCode();
            $res->errorJson($e->getMessage(), ($code >= 400 && $code < 600) ? $code : 500);
        }
    }

    // POST /vehiculos/{matricula}/instalacion
    public function setInstalacion(Request $req, Response $res, string $matricula): void
    {
        try {
            $data = $req->json();
            if (!isset($data['id_instalacion'])) {
                $res->status(400)->json([], 'El campo id_instalacion es requerido');
                return;
            }
            $this->service->setInstalacionForVehiculo($matricula, (int) $data['id_instalacion']);
            $res->status(201)->json([], 'Instalación asignada al vehículo correctamente');
        } catch (Throwable $e) {
            $code = (int)$e->getCode();
            $res->errorJson($e->getMessage(), ($code >= 400 && $code < 600) ? $code : 500);
        }
    }

    // DELETE /vehiculos/{matricula}/instalacion
    public function deleteInstalacion(Request $req, Response $res, string $matricula): void
    {
        try {
            $this->service->deleteInstalacionFromVehiculo($matricula);
            $res->status(200)->json([], 'Instalación eliminada del vehículo correctamente');
        } catch (Throwable $e) {
            $code = (int)$e->getCode();
            $res->errorJson($e->getMessage(), ($code >= 400 && $code < 600) ? $code : 500);
        }
    }
}
?>