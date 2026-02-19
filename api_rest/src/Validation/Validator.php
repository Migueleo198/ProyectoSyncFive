<?php
namespace Validation;

use Validation\ValidationException;

class Validator
{
    public static function validate(array $data, array $rules): array
    {
        $errors = [];
        $clean = [];

        foreach ($rules as $field => $ruleString) {

            $rulesArray = explode('|', $ruleString);
            $value = $data[$field] ?? null;

            $isRequired = in_array('required', $rulesArray, true);

            if (!$isRequired && $value === '') {
                $value = null;
            }

            foreach ($rulesArray as $rule) {

                if (str_contains($rule, ':')) {
                    [$ruleName, $param] = explode(':', $rule);
                } else {
                    $ruleName = $rule;
                    $param = null;
                }

                switch ($ruleName) {

                    case 'required':
                        if ($value === null || $value === '') {
                            $errors[$field][] = "El campo $field es obligatorio.";
                        }
                        break;

                    case 'string':
                        if ($value !== null && !is_string($value)) {
                            $errors[$field][] = "El campo $field debe ser texto.";
                        }
                        break;

                    case 'int':
                        if ($value !== null && !filter_var($value, FILTER_VALIDATE_INT) && $value !== 0) {
                            $errors[$field][] = "El campo $field debe ser un entero.";
                        }
                        break;

                    case 'boolean':
                        if (!in_array($value, [true, false, 0, 1, "0", "1", "true", "false"], true)) {
                            $errors[$field][] = "El campo $field debe ser booleano.";
                        }
                        break;

                    case 'email':
                        if ($value !== null && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                            $errors[$field][] = "El campo $field debe ser un email válido.";
                        }
                        break;

                    case 'min':

                        if ($value !== null) {
                            $isNumericField = in_array('int', $rulesArray) || in_array('float', $rulesArray);
                            
                            if ($isNumericField) {
                                if ((float)$value < (float)$param) {
                                    $errors[$field][] = "El campo $field debe ser mayor o igual a $param.";
                                }
                            } else {
                                if (strlen((string)$value) < (int)$param) {
                                    $errors[$field][] = "El campo $field debe tener mínimo $param caracteres.";
                                }
                            }
                        }
                        break;

                    case 'max':
                        if ($value !== null) {
                            $isNumericField = in_array('int', $rulesArray) || in_array('float', $rulesArray);
                            
                            if ($isNumericField) {
                                if ((float)$value > (float)$param) {
                                    $errors[$field][] = "El campo $field debe ser menor o igual a $param.";
                                }
                            } else {
                                if (strlen((string)$value) > (int)$param) {
                                    $errors[$field][] = "El campo $field debe tener máximo $param caracteres.";
                                }
                            }
                        }
                        break;

                    case 'dni':
                        if ($value !== null) {
                            if (!self::validateDNI($value)) {
                                $errors[$field][] = "El campo $field no es un DNI válido.";
                            }
                        }
                        break;
                    
                    case 'phone':
                        if ($value !== null) {
                            if (!self::validatePhone($value)) {
                                $errors[$field][] = "El campo $field debe ser un teléfono válido.";
                            }
                        }
                        break;

                    case 'date':
                        if ($value !== null) {
                            $d = date_create($value);
                            if (!$d || $d->format('Y-m-d') !== $value) {
                                $errors[$field][] = "El campo $field debe ser una fecha válida (Y-m-d).";
                            }
                        }
                        break;

                    case 'datetime':
                        if ($value !== null) {
                            $d = date_create($value);
                            if (!$d) {
                                $errors[$field][] = "El campo $field debe ser una fecha y hora válida.";
                            }
                        }
                        break;


                    case 'username':
                        if ($value !== null && !preg_match('/^[a-zA-Z0-9_]{4,50}$/', $value)) {
                            $errors[$field][] = "El campo $field no es un nombre de usuario válido.";
                        }
                        break;

                    case 'in':
                        if ($value !== null) {
                            $allowed = explode(',', $param);
                            if (!in_array((string)$value, $allowed, true)) {
                                $errors[$field][] = "El campo $field debe ser uno de: " . implode(', ', $allowed) . ".";
                            }
                        }
                        break;

                }
            }

            if (!isset($errors[$field])) {

                if (in_array('string', $rulesArray)) {
                    $value = self::sanitizeString($value);
                }

                if (in_array('int', $rulesArray)) {
                    $value = $value !== null ? (int)$value : null;
                }

                if (in_array('boolean', $rulesArray)) {
                    $value = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                }

                $clean[$field] = $value;
            }
        }

        if (!empty($errors)) {
            throw new ValidationException($errors);
        }

        return $clean;
    }


    private static function sanitizeString(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim($value);
        $value = strip_tags($value);

        $value = preg_replace('/[\x00-\x1F\x7F]/u', '', $value);

        return $value;
    }

    private static function validateDNI(string $dni): bool
    {
        $dni = strtoupper(trim($dni));

        if (!preg_match('/^[0-9]{8}[A-Z]$/', $dni)) {
            return false;
        }

        $letters = "TRWAGMYFPDXBNJZSQVHLCKE";
        $number = (int)substr($dni, 0, 8);
        $letter = $dni[8];

        return $letters[$number % 23] === $letter;
    }

    private static function validatePhone(string $phone): bool
    {
        // Elimina espacios, guiones y paréntesis
        $cleanPhone = preg_replace('/[\s\-\(\)]/', '', $phone);

        // Debe empezar opcionalmente con + seguido de 1 a 3 dígitos (código país)
        // y luego de 8 a 12 dígitos para el número local
        return preg_match('/^\+?[1-9]\d{1,3}\d{8,12}$/', $cleanPhone);
    }



}
