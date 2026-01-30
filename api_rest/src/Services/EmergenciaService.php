<?php
declare(strict_types=1);

namespace Services;

use Models\EmergenciaModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class EmergenciaService
{
    private EmergenciaModel $model;

    public function __construct()
    {
        $this->model = new EmergenciaModel();
    }

    //================= Emergencias =====================

    public function getAllEmergencias(): array
    {
        try {
            return $this->model->all();
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function getEmergenciaById(int $id): array
    {
        Validator::validate(['id' => $id], ['id' => 'required|int|min:1']);

        try {
            $emergencia = $this->model->find($id);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$emergencia) {
            throw new \Exception("Emergencia no encontrada", 404);
        }

        return $emergencia;
    }

    public function createEmergencia(array $input): array
    {
        $data = Validator::validate($input, [
            'id_bombero'        => 'string|min:1',
            'descripcion'       => 'required|string|min:1',
            'estado'            => 'required|string|max:30',
            'direccion'         => 'required|string|min:1',
            'nombre_solicitante'=> 'string|min:1',
            'tlfn_solicitante'  => 'phone|min:1',
            'codigo_tipo'       => 'int|min:1'
        ]);
        try {
            $id = $this->model->create($data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$id) {
            throw new \Exception("No se pudo crear la emergencia");
        }

        return ['id' => $id];
    }

    public function updateEmergencia(int $id, array $input): array
    {
        Validator::validate(['id' => $id], ['id' => 'required|int|min:1']);

        $data = Validator::validate($input, [
            'id_bombero'        => 'string|min:1',
            'descripcion'       => 'required|string|min:1',
            'estado'            => 'required|string|max:30',
            'direccion'         => 'required|string|min:1',
            'nombre_solicitante'=> 'string|min:1',
            'tlfn_solicitante'  => 'phone|min:1',
            'codigo_tipo'       => 'int|min:1'
        ]);

        try {
            $result = $this->model->update($id, $data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            $exists = $this->model->find($id);
            if (!$exists) throw new \Exception("Emergencia no encontrada", 404);

            return ['status' => 'no_changes', 'message' => 'No hubo cambios en la emergencia'];
        }

        if ($result === -1) {
            throw new \Exception("No se pudo actualizar la emergencia: conflicto con restricciones", 409);
        }

        return ['status' => 'updated', 'message' => 'Emergencia actualizada correctamente'];
    }

  

    //================= Vehículos en emergencias =====================

    public function getAllVehiculos(): array
    {
        try {
            return $this->model->allVehiculos();
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function setVehiculoEmergencia(array $input): array
    {
        $data = Validator::validate($input, [
            'matricula' => 'required|string|max:10',
            'id_emergencia' => 'int|min:1',
            'f_salida' => 'datetime',
            'f_llegada' => 'datetime',
            'f_regreso' => 'datetime',
        ]);

        try {
            $id = $this->model->addVehiculo($data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        return ['id' => $id];
    }

    public function deleteVehiculoEmergencia(int $id): void
    {
        Validator::validate(['id' => $id], ['id' => 'required|int|min:1']);

        try {
            $result = $this->model->deleteVehiculo($id);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) throw new \Exception("Vehículo no encontrado", 404);
        if ($result === -1) throw new \Exception("No se puede eliminar: está en uso", 409);
    }

    //================= Personal en vehículos =====================

    public function getPersonalVehiculo(string $matricula): array
    {
        Validator::validate(['matricula' => $matricula], ['matricula' => 'required|string|max:10']);

        try {
            return $this->model->getPersonal($matricula);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function setPersonalVehiculo(string $matricula, array $input): array
    {
        Validator::validate(['matricula' => $matricula, 'n_funcionario' => $n_funcionario], [
            'matricula' => 'string|max:10',
            'n_funcionario' => 'int|min:1',
            'cargo'     => 'string|max:50'
        ]);

        try {
            $id = $this->model->addPersonal($matricula, $data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        return ['id' => $id];
    }

    public function deletePersonalVehiculo(string $matricula, int $n_funcionario): void
    {
        Validator::validate(['matricula' => $matricula, 'n_funcionario' => $n_funcionario], [
            'matricula' => 'string|max:10',
            'n_funcionario' => 'int|min:1',
            'cargo'     => 'string|max:50'
        ]);

        try {
            $result = $this->model->deletePersonal($matricula, $n_funcionario);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) throw new \Exception("Personal no encontrado en el vehículo", 404);
        if ($result === -1) throw new \Exception("No se puede eliminar: restricciones en la base de datos", 409);
    }
}
