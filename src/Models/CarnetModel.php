    /**
     * Asignar un carnet a una persona con fecha de obtención y vencimiento
     */
    public function assignToPerson(
        string $n_funcionario,
        string $id_carnet,
        string $f_obtencion,
        string $f_vencimiento
    ): bool {
        $this->db->query("
            INSERT INTO Persona_Carnet (
                n_funcionario,
                ID_Carnet,
                f_obtencion,
                f_vencimiento
            ) VALUES (
                :n_funcionario,
                :id_carnet,
                :f_obtencion,
                :f_vencimiento
            )
        ")
        ->bind(':n_funcionario', $n_funcionario)
        ->bind(':id_carnet', $id_carnet)
        ->bind(':f_obtencion', $f_obtencion)
        ->bind(':f_vencimiento', $f_vencimiento)
        ->execute();

        return $this->db->rowCount() > 0;
    }

    /**
     * Obtener todos los carnets asignados a una persona (con fechas)
     */
    public function getCarnetsByPerson(string $n_funcionario): array
    {
        return $this->db
            ->query("
                SELECT 
                    c.*,
                    pc.f_obtencion,
                    pc.f_vencimiento
                FROM Persona_Carnet pc
                INNER JOIN Carnet c 
                    ON c.ID_Carnet = pc.ID_Carnet
                WHERE pc.n_funcionario = :n_funcionario
                ORDER BY c.ID_Carnet ASC
            ")
            ->bind(':n_funcionario', $n_funcionario)
            ->fetchAll();
    }

    /**
     * Obtener todas las personas que tienen un carnet (con fechas)
     */
    public function getPersonsByCarnet(string $id_carnet): array
    {
        return $this->db
            ->query("
                SELECT 
                    p.*,
                    pc.f_obtencion,
                    pc.f_vencimiento
                FROM Persona_Carnet pc
                INNER JOIN Persona p 
                    ON p.n_funcionario = pc.n_funcionario
                WHERE pc.ID_Carnet = :id_carnet
                ORDER BY p.n_funcionario ASC
            ")
            ->bind(':id_carnet', $id_carnet)
            ->fetchAll();
    }

    /**
     * Actualizar fechas de obtención y vencimiento de un carnet de una persona
     */
    public function updatePersonCarnetDates(
        string $n_funcionario,
        string $id_carnet,
        array $data
    ): int {

        $this->db->query("
            UPDATE Persona_Carnet SET
                f_obtencion = :f_obtencion,
                f_vencimiento = :f_vencimiento
            WHERE n_funcionario = :n_funcionario
            AND ID_Carnet = :id_carnet
        ")
        ->bind(':n_funcionario', $n_funcionario)
        ->bind(':id_carnet', $id_carnet)
        ->bind(':f_obtencion', $data['f_obtencion'] ?? null)
        ->bind(':f_vencimiento', $data['f_vencimiento'] ?? null)
        ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }

    /**
     * Eliminar la asignación de un carnet a una persona
     */
    public function unassignFromPerson(string $n_funcionario, string $id_carnet): int
    {
        $this->db
            ->query("
                DELETE FROM Persona_Carnet
                WHERE n_funcionario = :n_funcionario
                AND ID_Carnet = :id_carnet
            ")
            ->bind(':n_funcionario', $n_funcionario)
            ->bind(':id_carnet', $id_carnet)
            ->execute();

        return $this->db
            ->query("SELECT ROW_COUNT() AS affected")
            ->fetch()['affected'];
    }
}
