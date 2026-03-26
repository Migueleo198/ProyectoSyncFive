<?php
declare(strict_types=1);

namespace Services;

use Models\MantenimientoModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;
use PDOException;

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
        if (!$m) throw new \Exception("Mantenimiento no encontrado", 404);
        return $m;
    }

    public function createMantenimiento(array $input): array
    {
        $this->rejectCreateOnlyFields($input);

        $data = Validator::validate($input, [
            'id_bombero'  => 'required|string|min:1',
            'estado'      => 'string|in:ABIERTO,REALIZADO',
            'f_inicio'    => 'required|date',
            'descripcion' => 'string',
            'tipo_recurso'=> 'required|string|in:vehiculo,material',
            'matricula'   => 'string|min:1',
            'id_material' => 'int|min:1',
        ]);
        $data['estado'] = 'ABIERTO';
        $this->validateCreateResource($data);
        $this->validateEstadoYFechas($data);

        try {
            $id = $this->model->createWithRelation($data);
            return $this->model->find($id);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    private function rejectCreateOnlyFields(array $input): void
    {
        $errors = [];

        if (array_key_exists('f_fin', $input) || array_key_exists('fecha_fin', $input)) {
            $errors['f_fin'][] = 'La fecha de fin no se admite al crear un mantenimiento.';
        }

        if (!empty($errors)) {
            throw new ValidationException($errors);
        }
    }

    private function validateCreateResource(array $data): void
    {
        $tipo = $data['tipo_recurso'] ?? null;

        if ($tipo === 'vehiculo' && empty($data['matricula'])) {
            throw new ValidationException([
                'matricula' => ['Debe seleccionar un vehiculo para el mantenimiento.']
            ]);
        }

        if ($tipo === 'material' && empty($data['id_material'])) {
            throw new ValidationException([
                'id_material' => ['Debe seleccionar un material para el mantenimiento.']
            ]);
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
        $this->validateEstadoYFechas($data);

        try {
            $this->model->update($id, $data);
            $existing = $this->model->find($id);
            if (!$existing) throw new \Exception("Mantenimiento no encontrado", 404);
            return $existing;
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
        $patchData = array_intersect_key($data, $input);
        $mergedData = array_merge($existing, $patchData);
        $this->validateEstadoYFechas($mergedData);

        try {
            $this->model->update($id, $mergedData);
            return $this->model->find($id);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    private function validateEstadoYFechas(array $data): void
    {
        $estado = $data['estado'] ?? null;
        $fechaInicio = $data['f_inicio'] ?? null;
        $fechaFin = $data['f_fin'] ?? null;

        if ($estado !== 'REALIZADO' && !empty($fechaFin)) {
            throw new ValidationException([
                'estado' => ['La fecha de fin solo puede informarse cuando el mantenimiento esta en estado REALIZADO.']
            ]);
        }

        if ($estado === 'REALIZADO' && empty($fechaFin)) {
            throw new ValidationException([
                'f_fin' => ['Antes de marcar el mantenimiento como REALIZADO, debes añadir la fecha de fin.']
            ]);
        }

        if (!empty($fechaInicio) && !empty($fechaFin) && strtotime($fechaFin) < strtotime($fechaInicio)) {
            throw new ValidationException([
                'f_fin' => ['La fecha de fin debe ser igual o posterior a la fecha de inicio.']
            ]);
        }
    }

    public function deleteMantenimiento(int $id): void
    {
        if (!$this->model->find($id)) throw new \Exception("Mantenimiento no encontrado", 404);
        try {
            $this->model->deleteRelaciones($id);
            $this->model->delete($id);
        } catch (PDOException $e) {
            // Verificar si es una violación de clave foránea
            if ($e->getCode() === '23000' || strpos($e->getMessage(), 'foreign key constraint') !== false) {
                throw new \Exception("No se puede eliminar este mantenimiento debido a restricciones en la base de datos", 409);
            }
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    // VEHICULOS
    public function addVehiculo(int $cod, string $matricula): void
    {
        $this->getMantenimientoById($cod);
        try { $this->model->addVehiculo($cod, $matricula); }
        catch (Throwable $e) { throw new \Exception("Error al asignar vehiculo: " . $e->getMessage(), 500); }
    }

    public function removeVehiculo(int $cod, string $matricula): void
    {
        $this->getMantenimientoById($cod);
        if (!$this->model->hasVehiculo($cod, $matricula)) {
            throw new \Exception('El vehiculo indicado no esta asignado a este mantenimiento.', 404);
        }
        $this->ensureCanRemoveLastResource($cod, 'vehiculo');
        try { $this->model->removeVehiculo($cod, $matricula); }
        catch (Throwable $e) { throw new \Exception("Error al eliminar vehiculo: " . $e->getMessage(), 500); }
    }

    // MATERIALES
    public function addMaterial(int $cod, int $id_material): void
    {
        $this->getMantenimientoById($cod);
        try { $this->model->addMaterial($cod, $id_material); }
        catch (Throwable $e) { throw new \Exception("Error al asignar material: " . $e->getMessage(), 500); }
    }

    public function removeMaterial(int $cod, int $id_material): void
    {
        $this->getMantenimientoById($cod);
        if (!$this->model->hasMaterial($cod, $id_material)) {
            throw new \Exception('El material indicado no esta asignado a este mantenimiento.', 404);
        }
        $this->ensureCanRemoveLastResource($cod, 'material');
        try { $this->model->removeMaterial($cod, $id_material); }
        catch (Throwable $e) { throw new \Exception("Error al eliminar material: " . $e->getMessage(), 500); }
    }

    private function ensureCanRemoveLastResource(int $cod, string $tipo): void
    {
        $vehiculos = $this->model->countVehiculos($cod);
        $materiales = $this->model->countMateriales($cod);
        $totalRecursos = $vehiculos + $materiales;

        if ($totalRecursos <= 1) {
            $nombreRecurso = $tipo === 'vehiculo' ? 'vehiculo' : 'material';

            throw new \Exception(
                'No se puede desasignar el ultimo ' . $nombreRecurso . ' de un mantenimiento. Anade antes otro recurso o elimina el mantenimiento completo.',
                409
            );
        }
    }
}