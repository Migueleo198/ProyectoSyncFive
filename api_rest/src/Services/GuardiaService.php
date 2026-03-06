<?php
declare(strict_types=1);

namespace Services;

use Models\GuardiaModel;
use Validation\Validator;
use Validation\ValidationException;
use Throwable;

class GuardiaService
{
    private GuardiaModel $model;

    public function __construct()
    {
        $this->model = new GuardiaModel();
    }

    /**
     * Obtener todos los guardias
     */
    public function getAllGuardias(): array
    {
        try {
            return $this->model->all();
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }
    }

    /**
     * Obtener un guardia por su ID (string)
     */
    public function getGuardiaById(string $id_guardia): array
    {
        Validator::validate(['id_guardia' => $id_guardia], [
            'id_guardia' => 'required|string'
        ]);

        try {
            $guardia = $this->model->find($id_guardia);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if (!$guardia) {
            throw new \Exception("Guardia no encontrado", 404);
        }

        return $guardia;
    }

    /**
     * Crear un guardia
     */
public function createGuardia(array $input): array
{
    $data = Validator::validate($input, [
        'fecha'    => 'required|date',
        'h_inicio' => 'required|string',
        'h_fin'    => 'required|string',
        'notas'    => 'string'
    ]);

    try {
        $id = $this->model->create($data);
    } catch (Throwable $e) {
        throw new \Exception(
            "Error interno en la base de datos: " . $e->getMessage(),
            500
        );
    }

    if (!$id) {
        throw new \Exception("No se pudo crear la guardia");
    }

    return [
        'id_guardia' => $id,
        'fecha' => $data['fecha'],
        'h_inicio' => $data['h_inicio'],
        'h_fin' => $data['h_fin'],
        'notas' => $data['notas'] ?? null
    ];
}

    /**
     * Actualizar guardia
     */
    public function updateGuardia(string $id_guardia, array $input): array
    {
        // Validar solo que el ID exista como parámetro
        Validator::validate(['id_guardia' => $id_guardia], [
            'id_guardia' => 'required|string'
        ]);

        // Validar solo los campos que vienen en $input
        $data = Validator::validate($input, [
            'fecha'    => 'sometimes|date',
            'h_inicio' => 'sometimes|string',
            'h_fin'    => 'sometimes|string',
            'notas'    => 'sometimes|string'
        ]);

        if (empty($data)) {
            throw new ValidationException([
                'body' => ['No se enviaron campos para actualizar']
            ]);
        }

        try {
            $result = $this->model->update($id_guardia, $data);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            $exists = $this->model->find($id_guardia);

            if (!$exists) {
                throw new \Exception("Guardia no encontrada", 404);
            }

            return [
                'status'  => 'no_changes',
                'message' => 'No hubo cambios en la guardia'
            ];
        }

        if ($result === -1) {
            throw new \Exception(
                "No se pudo actualizar la guardia: conflicto con restricciones",
                409
            );
        }

        return [
            'status'  => 'updated',
            'message' => 'Guardia actualizada correctamente'
        ];
    }

    /**
     * Eliminar un guardia
     */
    public function deleteGuardia(int $id_guardia): void
    {
        Validator::validate(['id_guardia' => $id_guardia], [
            'id_guardia' => 'required|int'
        ]);

        try {
            $result = $this->model->delete($id_guardia);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            throw new \Exception("Guardia no encontrado", 404);
        }

        if ($result === -1) {
            throw new \Exception(
                "No se puede eliminar el guardia: el registro está en uso",
                409
            );
        }
    }
    /**
 * Obtener todas las personas asociadas a una guardia NO SE USA TODAVIA PARA UNA FURUTA EXPANSION
 */
    public function getPersonsByGuardia(int $id_guardia): array
    {
        Validator::validate(['id_guardia' => $id_guardia], [
            'id_guardia' => 'required|int'
        ]);

        try {
            // Verificar que la guardia exista
            $exists = $this->model->getPersonsByGuardia($id_guardia);

            if (!$exists) {
                throw new \Exception("Guardia no encontrada", 404);
            }

            return $this->model->getPersonsByGuardia($id_guardia);

        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }
    } 
        /**
         *  POST /Guardia/assign
         */
        public function assignGuardiaToPerson(array $input): array
        {
            $data = Validator::validate($input, [
                'id_bombero' => 'required|string',
                'id_guardia'    => 'required|string',
                'cargo' => 'required|string|in:BOMBERO1,BOMBERO2,BOMBERO3,BOMBERO4,OFICIAL1,OFICIAL2,CONDUCTOR1,CONDUCTOR2'            ]);

            try {
                // Verificar que la guardia exista
                $exists = $this->model->find($data['id_guardia']);

                if (!$exists) {
                    throw new \Exception("Guardia no encontrada", 404);
                }

                $result = $this->model->assign(
                    $data['id_bombero'],
                    $data['id_guardia'],
                    $data['cargo']
                );

            } catch (Throwable $e) {
                throw new \Exception(
                    "Error interno en la base de datos: " . $e->getMessage(),
                    500
                );
            }

            if (!$result) {
                throw new \Exception("No se pudo asignar la guardia", 409);
            }

            return [
                'status'  => 'assigned',
                'message' => 'Guardia asignada correctamente'
            ];
        }

        /**
         * DELETE /Guardia/unassign
         */
/*         public function unassign(Request $req, Response $res): void
        {
            try {
                $data = $req->json();
                $result = $this->service->unassignGuardiaFromPerson($data['n_funcionario'], $data['ID_Guardia']);
                $res->status(200)->json($result, $result['message']);
            } catch (ValidationException $e) {
                $res->status(422)->json(['errors' => $e->errors], "Errores de validación");
            } catch (Throwable $e) {
                $code = $e->getCode() >= 400 ? $e->getCode() : 500;
                $res->errorJson($e->getMessage(), $code);
            }
        } */

        }


?>
