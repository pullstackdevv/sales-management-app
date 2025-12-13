<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
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
        //
    }
}
