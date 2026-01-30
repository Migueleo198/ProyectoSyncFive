<?php
declare(strict_types=1);

namespace Services;

use Models\IncidenciaModel;
use Models\MaterialModel;
use Models\PersonaModel;
use Models\VehiculoModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class IncidenciaService
{
    private IncidenciaModel $model;
    private MaterialModel $materialModel;
    private PersonaModel $personaModel;
    private VehiculoModel $vehiculoModel;

    public function __construct()
    {
        $this->model = new IncidenciaModel();
        $this->materialModel = new MaterialModel();
        $this->personaModel = new PersonaModel();
        $this->vehiculoModel = new VehiculoModel();
    }

    public function getAllIncidencias(): array
    {
        try {
            return $this->model->all();
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    public function createIncidencia(array $input): array
    {
        $data = Validator::validate($input, [
            'id_material' => 'int|min:1',
            'id_bombero'  => 'int|min:1',
            'matricula'   => 'string|max:15',
            'fecha'       => 'required|date',
            'asunto'      => 'required|string|min:5|max:150',
            'estado'      => 'required|in:ABIERTA,CERRADA',
            'tipo'        => 'string|max:50'
        ]);

        // Validar que al menos un campo de relación esté presente
        if (empty($data['id_material']) && empty($data['id_bombero']) && empty($data['matricula'])) {
            throw new \Exception("Debe especificar al menos un material, bombero o vehículo", 400);
        }

        // Verificar que el material existe (si se proporciona)
        if (isset($data['id_material'])) {
            $material = $this->materialModel->find($data['id_material']);
            if (!$material) {
                throw new \Exception("Material no encontrado", 404);
            }
        }

        // Verificar que el bombero existe (si se proporciona)
        if (isset($data['id_bombero'])) {
            $persona = $this->personaModel->find($data['id_bombero']);
            if (!$persona) {
                throw new \Exception("Bombero no encontrado", 404);
            }
        }

        // Verificar que el vehículo existe (si se proporciona)
        if (isset($data['matricula'])) {
            $vehiculo = $this->vehiculoModel->find($data['matricula']);
            if (!$vehiculo) {
                throw new \Exception("Vehículo no encontrado", 404);
            }
        }

        try {
            $id = $this->model->create($data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if (!$id) {
            throw new \Exception("No se pudo crear la incidencia");
        }

        return ['cod_incidencia' => $id];
    }

    public function updateIncidencia(int $cod_incidencia, array $input): array
    {
        Validator::validate(['cod_incidencia' => $cod_incidencia], [
            'cod_incidencia' => 'required|int|min:1'
        ]);

        $data = Validator::validate($input, [
            'id_material' => 'int|min:1',
            'id_bombero'  => 'int|min:1',
            'matricula'   => 'string|max:15',
            'fecha'       => 'required|date',
            'asunto'      => 'required|string|min:5|max:150',
            'estado'      => 'required|in:ABIERTA,CERRADA',
            'tipo'        => 'string|max:50'
        ]);

        // Verificar que la incidencia existe
        $incidencia = $this->model->find($cod_incidencia);
        if (!$incidencia) {
            throw new \Exception("Incidencia no encontrada", 404);
        }

        // Verificar que el material existe (si se proporciona)
        if (isset($data['id_material'])) {
            $material = $this->materialModel->find($data['id_material']);
            if (!$material) {
                throw new \Exception("Material no encontrado", 404);
            }
        }

        // Verificar que el bombero existe (si se proporciona)
        if (isset($data['id_bombero'])) {
            $persona = $this->personaModel->find($data['id_bombero']);
            if (!$persona) {
                throw new \Exception("Bombero no encontrado", 404);
            }
        }

        // Verificar que el vehículo existe (si se proporciona)
        if (isset($data['matricula'])) {
            $vehiculo = $this->vehiculoModel->find($data['matricula']);
            if (!$vehiculo) {
                throw new \Exception("Vehículo no encontrado", 404);
            }
        }

        try {
            $result = $this->model->update($cod_incidencia, $data);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            return [
                'status' => 'no_changes',
                'message' => 'No hubo cambios en los datos de la incidencia'
            ];
        }

        return [
            'status' => 'updated',
            'message' => 'Incidencia actualizada correctamente'
        ];
    }

    public function patchIncidencia(int $cod_incidencia, array $input): array
    {
        Validator::validate(['cod_incidencia' => $cod_incidencia], [
            'cod_incidencia' => 'required|int|min:1'
        ]);

        $data = Validator::validate($input, [
            'estado' => 'required|in:ABIERTA,CERRADA'
        ]);

        // Verificar que la incidencia existe
        $incidencia = $this->model->find($cod_incidencia);
        if (!$incidencia) {
            throw new \Exception("Incidencia no encontrada", 404);
        }

        try {
            $result = $this->model->updateEstado($cod_incidencia, $data['estado']);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            return [
                'status' => 'no_changes',
                'message' => 'No hubo cambios en el estado de la incidencia'
            ];
        }

        return [
            'status' => 'updated',
            'message' => 'Estado de la incidencia actualizado correctamente'
        ];
    }

    public function deleteIncidencia(int $cod_incidencia): void
    {
        Validator::validate(['cod_incidencia' => $cod_incidencia], [
            'cod_incidencia' => 'required|int|min:1'
        ]);

        // Verificar que la incidencia existe
        $incidencia = $this->model->find($cod_incidencia);
        if (!$incidencia) {
            throw new \Exception("Incidencia no encontrada", 404);
        }

        try {
            $result = $this->model->delete($cod_incidencia);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }

        if ($result === 0) {
            throw new \Exception("Incidencia no encontrada", 404);
        }
    }
}