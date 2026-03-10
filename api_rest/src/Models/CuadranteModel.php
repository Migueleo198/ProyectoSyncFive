<?php
declare(strict_types=1);

namespace Models;

use Core\DB;

class CuadranteModel
{
    private DB $db;

    public function __construct()
    {
        $this->db = new DB();
    }

    public function getGuardiasByBombero(string $id_bombero): array
    {
        return $this->db
            ->query("
                SELECT g.*, phg.cargo
                FROM Guardia g
                INNER JOIN Persona_Hace_Guardia phg ON g.id_guardia = phg.id_guardia
                WHERE phg.id_bombero = :id_bombero
                ORDER BY g.fecha ASC
            ")
            ->bind(':id_bombero', $id_bombero)
            ->fetchAll();
    }

    public function getRefuerzosByBombero(string $id_bombero): array
    {
        return $this->db
            ->query("
                SELECT tr.*
                FROM Turno_refuerzo tr
                INNER JOIN Persona_Turno pt ON tr.id_turno_refuerzo = pt.id_turno
                WHERE pt.id_bombero = :id_bombero
                ORDER BY tr.f_inicio ASC
            ")
            ->bind(':id_bombero', $id_bombero)
            ->fetchAll();
    }

    public function getAllGuardias(): array
    {
        return $this->db
            ->query("
                SELECT g.*, phg.id_bombero, phg.cargo
                FROM Guardia g
                INNER JOIN Persona_Hace_Guardia phg ON g.id_guardia = phg.id_guardia
                ORDER BY g.fecha ASC
            ")
            ->fetchAll();
    }

    public function getAllRefuerzos(): array
    {
        return $this->db
            ->query("
                SELECT tr.*, pt.id_bombero
                FROM Turno_refuerzo tr
                INNER JOIN Persona_Turno pt ON tr.id_turno_refuerzo = pt.id_turno
                ORDER BY tr.f_inicio ASC
            ")
            ->fetchAll();
    }
}