<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Rate Limiter Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure the rate limiters for your application. Rate
    | limiters may be used to throttle requests to your application.
    |
    */

    'api' => [
        'max_attempts' => env('API_RATE_LIMIT_MAX_ATTEMPTS', 60),
        'decay_minutes' => env('API_RATE_LIMIT_DECAY_MINUTES', 1),
    ],

    'auth' => [
        'max_attempts' => env('AUTH_RATE_LIMIT_MAX_ATTEMPTS', 5),
        'decay_minutes' => env('AUTH_RATE_LIMIT_DECAY_MINUTES', 1),
    ],

    'guest' => [
        'max_attempts' => env('GUEST_RATE_LIMIT_MAX_ATTEMPTS', 30),
        'decay_minutes' => env('GUEST_RATE_LIMIT_DECAY_MINUTES', 1),
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiter Headers
    |--------------------------------------------------------------------------
    |
    | Configure which headers should be included in rate limit responses.
    |
    */

    'headers' => [
        'limit' => 'X-RateLimit-Limit',
        'remaining' => 'X-RateLimit-Remaining',
        'reset' => 'X-RateLimit-Reset',
        'retry_after' => 'Retry-After',
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiter Cache Store
    |--------------------------------------------------------------------------
    |
    | Specify which cache store should be used for rate limiting.
    | If null, the default cache store will be used.
    |
    */

    'cache_store' => env('RATE_LIMITER_CACHE_STORE', null),

];