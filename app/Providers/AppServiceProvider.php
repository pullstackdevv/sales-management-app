<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;
use Milon\Barcode\Facades\DNS1DFacade;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton('DNS1D', function ($app) {
            return new DNS1DFacade();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        date_default_timezone_set(config('app.timezone'));
        if (config('database.default') === 'mysql') {
            try {
                DB::statement("SET time_zone = '+07:00'");
            } catch (\Throwable $e) {
            }
        }
    }
}
