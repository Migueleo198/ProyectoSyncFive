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

    // GET, /mantenimientos
    public function getAllMantenimientos(): array
    {
        try {
            return $this->model->all();
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    // POST, /mantenimientos
    public function createMantenimiento(array $input): array
    {
        $data = Validator::validate($input, [
            'id_bombero' => 'required|string|min:1',      
            'estado' => 'required|string|in:ABIERTO,REALIZADO',  
            'f_inicio' => 'required|date',            
            'f_fin' => 'nullable|date',              
            'descripcion' => 'nullable|string'        
        ]);

        try {
            $id = $this->model->create($data);
            return $this->model->find($id);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    // PUT, /mantenimientos/{cod_mantenimiento}'
    public function updateMantenimiento(int $id, array $input): array
    {
        $data = Validator::validate($input, [
            'id_bombero' => 'required|string|min:1',      
            'estado' => 'required|string|in:ABIERTO,REALIZADO',  
            'f_inicio' => 'required|date',            
            'f_fin' => 'nullable|date',              
            'descripcion' => 'nullable|string'        
        ]);

        try {
            $updated = $this->model->update($id, $data);
            if ($updated === 0) {
                throw new \Exception("Mantenimiento no encontrado", 404);
            }
            return $this->model->find($id);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    // PATCH, /mantenimientos/{cod_mantenimiento}'
    public function patchMantenimiento(int $id, array $input): array
    {
        $data = Validator::validate($input, [
            'id_bombero' => 'nullable|string|min:1',      
            'estado' => 'nullable|string|in:ABIERTO,REALIZADO',  
            'f_inicio' => 'nullable|date',            
            'f_fin' => 'nullable|date',              
            'descripcion' => 'nullable|string'        
        ]);

        try {
            $existing = $this->model->find($id);
            if (!$existing) {
                throw new \Exception("Mantenimiento no encontrado", 404);
            }
            $updatedData = array_merge($existing, $data);
            $this->model->update($id, $updatedData);
            return $this->model->find($id);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }

    // DELETE, /mantenimientos/{cod_mantenimiento}'
    public function deleteMantenimiento(int $id): void
    {
        try {
            $existing = $this->model->find($id);
            if (!$existing) {
                throw new \Exception("Mantenimiento no encontrado", 404);
            }
            $this->model->delete($id);
        } catch (Throwable $e) {
            throw new \Exception("Error interno en la base de datos: " . $e->getMessage(), 500);
        }
    }
}