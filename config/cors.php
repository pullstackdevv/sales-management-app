<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'broadcasting/auth'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://localhost:8001',
        'http://127.0.0.1:8001',
        'http://192.168.19.165:8000',
        'http://192.168.19.165:5173',
        'https://mystock.thebee.id',
    ],

    'allowed_origins_patterns' => [
        '/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:(8000|8001|5173)$/',
        '/^http:\/\/localhost:(8000|8001|5173)$/',
        '/^http:\/\/127\.0\.0\.1:(8000|8001|5173)$/',
    ],

    'allowed_headers' => [
        'Accept',
        'Authorization',
        'Content-Type',
        'X-Requested-With',
        'X-CSRF-TOKEN',
        'X-XSRF-TOKEN',
    ],

    'exposed_headers' => [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'Retry-After',
    ],

    'max_age' => 86400, // 24 hours

    'supports_credentials' => true,

];
