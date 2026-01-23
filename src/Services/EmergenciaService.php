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
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

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
            'n_funcionario'     => 'string|min:1',
            'descripcion'       => 'required|string|min:1',
            'estado'            => 'required|email|max:120',
            'direccion'         => 'required|int|min:1',
            'nombre_solicitante'=> 'string|min:1',
            'tlfn_solicitante'  => 'int|min:1',
            'codigo_tipo'       => 'int|min:1'
        ]);

        $data['password'] = password_hash($data['password'], PASSWORD_BCRYPT);

        try {
            $id = $this->model->create($data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$id) {
            throw new \Exception("No se pudo crear el profesor");
        }

        return ['id' => $id];
    }


    public function updateEmergencia(int $id, array $input): array
    {
        Validator::validate(['id' => $id], [
            'id' => 'required|int|min:1'
        ]);

        $data = Validator::validate($input, [
            'n_funcionario'     => 'string|min:1',
            'descripcion'       => 'required|string|min:1',
            'estado'            => 'required|email|max:120',
            'direccion'         => 'required|int|min:1',
            'nombre_solicitante'=> 'string|min:1',
            'tlfn_solicitante'  => 'int|min:1',
            'codigo_tipo'       => 'int|min:1'
        ]);

        if (isset($data['password'])) {
            $data['password'] = password_hash($data['password'], PASSWORD_BCRYPT);
        }

        try {
            $result = $this->model->update($id, $data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            $exists = $this->model->find($id);

            if (!$exists) {
                throw new \Exception("Emergencia no encontrada", 404);
            }

            return [
                'status' => 'no_changes',
                'message' => 'No hubo cambios en los datos de la emergencia'
            ];
        }

        if ($result === -1) {
            throw new \Exception("No se pudo actualizar la emergencia: conflicto con restricciones", 409);
        }

        return [
            'status' => 'updated',
            'message' => 'Emergencia actualizada correctamente'
        ];
    }



 //+++++++++++++++++++ Tipo de emergencia ++++++++++++++++++++++

    

    
}
