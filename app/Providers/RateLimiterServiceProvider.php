<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class RateLimiterServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();
    }

    /**
     * Configure the rate limiters for the application.
     */
    protected function configureRateLimiting(): void
    {
        // API Rate Limiter
        RateLimiter::for('api', function (Request $request) {
            $maxAttempts = config('rate-limiter.api.max_attempts', 60);
            $decayMinutes = config('rate-limiter.api.decay_minutes', 1);
            
            return $request->user()
                ? Limit::perMinute($maxAttempts)->by($request->user()->id)
                : Limit::perMinute($maxAttempts)->by($request->ip());
        });

        // Authentication Rate Limiter
        RateLimiter::for('auth', function (Request $request) {
            $maxAttempts = config('rate-limiter.auth.max_attempts', 5);
            $decayMinutes = config('rate-limiter.auth.decay_minutes', 1);
            
            return Limit::perMinutes($decayMinutes, $maxAttempts)->by(
                $request->email . '|' . $request->ip()
            );
        });

        // Guest Rate Limiter
        RateLimiter::for('guest', function (Request $request) {
            $maxAttempts = config('rate-limiter.guest.max_attempts', 30);
            $decayMinutes = config('rate-limiter.guest.decay_minutes', 1);
            
            return Limit::perMinutes($decayMinutes, $maxAttempts)->by($request->ip());
        });

        // Upload Rate Limiter
        RateLimiter::for('uploads', function (Request $request) {
            return $request->user()
                ? Limit::perMinute(10)->by($request->user()->id)
                : Limit::perMinute(2)->by($request->ip());
        });

        // Heavy Operations Rate Limiter
        RateLimiter::for('heavy', function (Request $request) {
            return $request->user()
                ? Limit::perMinute(5)->by($request->user()->id)
                : Limit::perMinute(1)->by($request->ip());
        });
    }
}