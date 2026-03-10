<?php
declare(strict_types=1);

namespace Services;

use Models\CuadranteModel;

class CuadranteService
{
    private CuadranteModel $model;

    public function __construct()
    {
        $this->model = new CuadranteModel();
    }

    public function getGuardiasByBombero(string $id_bombero): array
    {
        if (empty($id_bombero)) {
            throw new \Exception("El id_bombero es obligatorio", 400);
        }
        return $this->model->getGuardiasByBombero($id_bombero);
    }

    public function getRefuerzosByBombero(string $id_bombero): array
    {
        if (empty($id_bombero)) {
            throw new \Exception("El id_bombero es obligatorio", 400);
        }
        return $this->model->getRefuerzosByBombero($id_bombero);
    }

    public function getAllGuardias(): array
    {
        return $this->model->getAllGuardias();
    }

    public function getAllRefuerzos(): array
    {
        return $this->model->getAllRefuerzos();
    }
}