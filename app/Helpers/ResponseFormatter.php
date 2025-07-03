<?php

namespace App\Helpers;

use Illuminate\Contracts\Support\MessageBag;
use Throwable;

class ResponseFormatter
{
    public static function success(string $message = 'Success', mixed $data = null, int $statusCode = 200)
    {
        return self::format([
            'status'  => 'success',
            'message' => $message,
            'data'    => $data,
            'errors'  => [],
        ], $statusCode);
    }

    public static function fail(string $message = 'Fail', array|object $errors = [], int $statusCode = 422)
    {
        if ($errors instanceof MessageBag || (!is_array($errors) && method_exists($errors, 'toArray'))) {
            $errors = self::formatValidationErrors($errors);
        }

        return self::format([
            'status' => 'fail',
            'message' => $message,
            'data' => null,
            'errors' => $errors,
        ], $statusCode);
    }

    public static function error(string $message = 'Server Error', array|object $errors = [], int $statusCode = 500)
    {
        if ($errors instanceof Throwable) {
            $errors = [
                [
                    'field' => 'exception',
                    'tag' => null,
                    'message' => config('app.debug') ?
                        $errors->getMessage() : 'Something went wrong.',
                ]
            ];
        }

        return self::format([
            'status'  => 'error',
            'message' => $message,
            'data'    => null,
            'errors'  => $errors,
        ], $statusCode);
    }

    private static function formatValidationErrors($errors): array
    {
        $formatted = [];

        foreach ($errors->toArray() as $field => $messages) {
            foreach ($messages as $msg) {
                $formatted[] = [
                    'field' => $field,
                    'tag' => self::extractRuleFromMessage($msg),
                    'message' => $msg,
                ];
            }
        }

        return $formatted;
    }

    private static function extractRuleFromMessage(string $message): string
    {
        $rules = [
            'required',
            'email',
            'max',
            'min',
            'string',
            'numeric',
            'unique',
            'confirmed'
        ];

        // check from messsage
        foreach ($rules as $rule) {
            if (str_contains(strtolower($message), $rule)) {
                return $rule;
            }
        }

        return 'invalid';
    }

    private static function format(array $body, int $statusCode)
    {
        return response()->json($body, $statusCode);
    }
}
