<?php

use App\Helpers\ResponseFormatter;
use App\Http\Middleware\ApiRateLimiter;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware
            ->web([
                \Illuminate\Http\Middleware\HandleCors::class,
            ])
            ->api([
                \Illuminate\Http\Middleware\HandleCors::class,
                EnsureFrontendRequestsAreStateful::class,
                'throttle:api',
                SubstituteBindings::class,
            ])
            ->group('api', [
                EnsureFrontendRequestsAreStateful::class,
                'throttle:api',
                SubstituteBindings::class,
            ])
            ->alias([
                'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
                'api.rate.limit' => ApiRateLimiter::class,
            ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->renderable(function (Throwable $e, $request) {
            if ($request->expectsJson()) {
                $statusCode = 500;
                
                if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpException) {
                    $statusCode = $e->getStatusCode();
                } elseif ($e instanceof \Illuminate\Validation\ValidationException) {
                    $statusCode = 422;
                } elseif ($e instanceof \Illuminate\Auth\AuthenticationException) {
                    $statusCode = 401;
                } elseif ($e instanceof \Illuminate\Auth\Access\AuthorizationException) {
                    $statusCode = 403;
                }
                
                return ResponseFormatter::error(
                    'Server Error',
                    [[
                        'field' => null,
                        'tag' => 'exception',
                        'message' => config('app.debug') ? $e->getMessage() : 'Something went wrong.'
                    ]],
                    $statusCode
                );
            }
        });
    })
    ->create();
