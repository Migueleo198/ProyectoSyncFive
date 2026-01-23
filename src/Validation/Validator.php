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

}
