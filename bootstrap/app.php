<?php

use App\Helpers\ResponseFormatter;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Routing\Middleware\ThrottleRequests;
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
            ->group('api', [
                EnsureFrontendRequestsAreStateful::class,
                ThrottleRequests::class . ':api',
                SubstituteBindings::class,
            ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->renderable(function (Throwable $e, $request) {
            if ($request->expectsJson()) {
                return ResponseFormatter::error(
                    'Server Error',
                    [[
                        'field' => null,
                        'tag' => 'exception',
                        'message' => config('app.debug') ? $e->getMessage() : 'Something went wrong.'
                    ]],
                    method_exists($e, 'getStatusCode') ?
                        $e->getStatusCode() : 500
                );
            }
        });
    })->create();
