<?php

namespace App\Helpers;

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
        return self::format([
            'status'  => 'fail',
            'message' => $message,
            'data'    => null,
            'errors'  => $errors,
        ], $statusCode);
    }

    public static function error(string $message = 'Server Error', array|object $errors = [], int $statusCode = 500)
    {
        return self::format([
            'status'  => 'error',
            'message' => $message,
            'data'    => null,
            'errors'  => $errors,
        ], $statusCode);
    }

    /**
     * Fungsi utama response formatter
     */
    private static function format(array $body, int $statusCode)
    {
        return response()->json($body, $statusCode);
    }
}
