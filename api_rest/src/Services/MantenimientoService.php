<?php
declare(strict_types=1);

namespace Services;

use Models\MantenimientoModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class MantenimientoService
{
    private MantenimientoModel $model;

    public function __construct()
    {
        $this->model = new MantenimientoModel();
    }

    public function getAllMantenimientos(): array
    {
        try {
            return $this->model->all();
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function getMantenimientoById(int $id): array
    {
        $m = $this->model->find($id);
        if (!$m) {
            throw new \Exception("Mantenimiento no encontrado", 404);
        }
        return $m;
    }

    public function createMantenimiento(array $input): array
    {
        $data = Validator::validate($input, [
            'id_bombero'  => 'required|string|min:1',
            'estado'      => 'required|string|in:ABIERTO,REALIZADO',
            'f_inicio'    => 'required|date',
            'f_fin'       => 'date',
            'descripcion' => 'string',
        ]);
        try {
            $id = $this->model->create($data);
            return $this->model->find($id);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function updateMantenimiento(int $id, array $input): array
    {
        $data = Validator::validate($input, [
            'id_bombero'  => 'required|string|min:1',
            'estado'      => 'required|string|in:ABIERTO,REALIZADO',
            'f_inicio'    => 'required|date',
            'f_fin'       => 'date',
            'descripcion' => 'string',
        ]);
        try {
            $affected = $this->model->update($id, $data);
            if ($affected === 0) {
                $existing = $this->model->find($id);
                if (!$existing) throw new \Exception("Mantenimiento no encontrado", 404);
            }
            return $this->model->find($id);
        } catch (\Exception $e) {
            throw $e;
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function patchMantenimiento(int $id, array $input): array
    {
        $existing = $this->model->find($id);
        if (!$existing) throw new \Exception("Mantenimiento no encontrado", 404);

        $data = Validator::validate($input, [
            'id_bombero'  => 'string|min:1',
            'estado'      => 'string|in:ABIERTO,REALIZADO',
            'f_inicio'    => 'date',
            'f_fin'       => 'date',
            'descripcion' => 'string',
        ]);
        try {
            $this->model->update($id, array_merge($existing, $data));
            return $this->model->find($id);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function deleteMantenimiento(int $id): void
    {
        if (!$this->model->find($id)) throw new \Exception("Mantenimiento no encontrado", 404);
        try {
            // Eliminar relaciones FK antes de borrar el padre
            $this->model->deleteRelaciones($id);
            $this->model->delete($id);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    // VEHICULOS
    public function getVehiculos(int $cod): array
    {
        $this->getMantenimientoById($cod);
        return $this->model->getVehiculos($cod);
    }
    public function addVehiculo(int $cod, string $matricula): void
    {
        $this->getMantenimientoById($cod);
        try { $this->model->addVehiculo($cod, $matricula); }
        catch (Throwable $e) { throw new \Exception("Error al asignar vehiculo: " . $e->getMessage(), 500); }
    }
    public function removeVehiculo(int $cod, string $matricula): void
    {
        $this->getMantenimientoById($cod);
        if ($this->model->removeVehiculo($cod, $matricula) === 0)
            throw new \Exception("El vehiculo no esta asignado a este mantenimiento", 404);
    }

    // MATERIALES
    public function getMateriales(int $cod): array
    {
        $this->getMantenimientoById($cod);
        return $this->model->getMateriales($cod);
    }
    public function addMaterial(int $cod, int $cod_material): void
    {
        $this->getMantenimientoById($cod);
        try { $this->model->addMaterial($cod, $cod_material); }
        catch (Throwable $e) { throw new \Exception("Error al asignar material: " . $e->getMessage(), 500); }
    }
    public function removeMaterial(int $cod, int $cod_material): void
    {
        $this->getMantenimientoById($cod);
        if ($this->model->removeMaterial($cod, $cod_material) === 0)
            throw new \Exception("El material no esta asignado a este mantenimiento", 404);
    }

    // PERSONAS
    public function getPersonas(int $cod): array
    {
        $this->getMantenimientoById($cod);
        return $this->model->getPersonas($cod);
    }
    public function addPersona(int $cod, string $id_bombero): void
    {
        $this->getMantenimientoById($cod);
        try { $this->model->addPersona($cod, $id_bombero); }
        catch (Throwable $e) { throw new \Exception("Error al asignar persona: " . $e->getMessage(), 500); }
    }
    public function removePersona(int $cod, string $id_bombero): void
    {
        $this->getMantenimientoById($cod);
        if ($this->model->removePersona($cod, $id_bombero) === 0)
            throw new \Exception("La persona no esta asignada a este mantenimiento", 404);
    }
}