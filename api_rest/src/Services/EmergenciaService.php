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
            'tlf_solicitante'  => 'phone|min:1',
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
            'tlf_solicitante'  => 'phone|min:1',
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

    public function setVehiculoEmergencia(int $id_emergencia, array $input): array
    {
        Validator::validate(['id_emergencia' => $id_emergencia], ['id_emergencia' => 'required|int|min:1']);

        $data = Validator::validate($input, [
            'matricula' => 'required|string|max:10',
            'f_salida' => 'datetime',
            'f_llegada' => 'datetime',
            'f_regreso' => 'datetime',
        ]);

        try {
            $id = $this->model->addVehiculo($data, $id_emergencia);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        return ['id' => $id];
    }

    public function deleteVehiculoEmergencia(int $id, string $matricula): void
    {
        Validator::validate(['id' => $id, 'matricula' => $matricula], [
            'id' => 'required|int|min:1',
            'matricula' => 'required|string|max:10'
        ]);

        try {
            $result = $this->model->deleteVehiculo($id, $matricula);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) throw new \Exception("Vehículo no encontrado", 404);
        if ($result === -1) throw new \Exception("No se puede eliminar: está en uso", 409);
    }

    //================= Personal en vehículos =====================

    public function getPersonalVehiculo(int $id_emergencia, string $matricula): array
    {
        Validator::validate(['id_emergencia' => $id_emergencia, 'matricula' => $matricula], [
            'id_emergencia' => 'required|int|min:1',
            'matricula' => 'required|string|max:10'
        ]);

        try {
            return $this->model->getPersonal($id_emergencia, $matricula);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function setPersonalVehiculo(int $id_emergencia, string $matricula, array $input): array
    {
        Validator::validate(['id_emergencia' => $id_emergencia, 'matricula' => $matricula], [
            'id_emergencia' => 'required|int|min:1',
            'matricula' => 'required|string|max:10'
        ]);

        $data = Validator::validate($input, [
            'id_bombero' => 'required|string|min:1',
            'cargo'     => 'required|string|max:50'
        ]);

        try {
            $id = $this->model->addPersonal($id_emergencia, $matricula, $data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        return ['id' => $id];
    }

    public function deletePersonalVehiculo(int $id_emergencia, string $matricula, string $id_bombero): void
    {
        Validator::validate(['id_emergencia' => $id_emergencia, 'matricula' => $matricula, 'id_bombero' => $id_bombero], [
            'id_emergencia' => 'required|int|min:1',
            'matricula' => 'required|string|max:10',
            'id_bombero' => 'required|string|min:1'
        ]); 

        try {
            $result = $this->model->deletePersonal($id_emergencia, $matricula, $id_bombero);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) throw new \Exception("Personal no encontrado en el vehículo", 404);
        if ($result === -1) throw new \Exception("No se puede eliminar: restricciones en la base de datos", 409);
    }
}
