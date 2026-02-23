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
    public function getGuardiaById(string $ID_Guardia): array
    {
        Validator::validate(['ID_Guardia' => $ID_Guardia], [
            'ID_Guardia' => 'required|string'
        ]);

        try {
            $guardia = $this->model->find($ID_Guardia);
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
            'id_guardia'     => 'required|string',
            'fecha'        => 'required|date',
            'h_inicio'          => 'required|int',
            'h_fin'          => 'required|int',
            'horas'      => 'int'
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

        return ['ID_Guardia' => $data['ID_Guardia']];
    }

    /**
     * Actualizar guardia
     */
    public function updateGuardia(string $ID_Guardia, array $input): array
    {
        Validator::validate(['ID_Guardia' => $ID_Guardia], [
            'ID_Guardia' => 'required|string'
        ]);

        $data = Validator::validate($input, [
            'ID_Guardia'     => 'required|string',
            'Fecha'        => 'required|date',
            'H_inicio'          => 'required|int',
            'H_fin'          => 'required|int',
            'horas'      => 'int'
        ]);

        if (empty($data)) {
            throw new ValidationException([
                'body' => ['No se enviaron campos para actualizar']
            ]);
        }

        try {
            $result = $this->model->update($ID_Guardia, $data);
        } catch (Throwable $e) {
            throw new \Exception(
                "Error interno en la base de datos: " . $e->getMessage(),
                500
            );
        }

        if ($result === 0) {
            $exists = $this->model->find($ID_Guardia);

            if (!$exists) {
                throw new \Exception("Guardia no encontrado", 404);
            }

            return [
                'status'  => 'no_changes',
                'message' => 'No hubo cambios en el guardia'
            ];
        }

        if ($result === -1) {
            throw new \Exception(
                "No se pudo actualizar el guardia: conflicto con restricciones",
                409
            );
        }

        return [
            'status'  => 'updated',
            'message' => 'Guardia actualizado correctamente'
        ];
    }

    /**
     * Eliminar un guardia
     */
    public function deleteGuardia(string $ID_Guardia): void
    {
        Validator::validate(['ID_Guardia' => $ID_Guardia], [
            'ID_Guardia' => 'required|string'
        ]);

        try {
            $result = $this->model->delete($ID_Guardia);
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
/*     public function getPersonsByGuardia(string $id_guardia): array
    {
        Validator::validate(['id_guardia' => $id_guardia], [
            'id_guardia' => 'required|string'
        ]);

        try {
            // Verificar que la guardia exista
            $exists = $this->model->find($id_guardia);

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
    } */
        /**
         * POST /Guardia/assign
         */
        public function assign(array $input): array
        {
            $data = Validator::validate($input, [
                'n_funcionario' => 'required|string',
                'id_guardia'    => 'required|string',
                'cargo'         => 'required|string'
            ]);

            try {
                // Verificar que la guardia exista
                $exists = $this->model->find($data['id_guardia']);

                if (!$exists) {
                    throw new \Exception("Guardia no encontrada", 404);
                }

                $result = $this->model->assign(
                    $data['n_funcionario'],
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
