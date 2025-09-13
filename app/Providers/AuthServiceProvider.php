<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        // 'App\Models\Model' => 'App\Policies\ModelPolicy',
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        // Grant all abilities to admin role if the method exists on the User model
        Gate::before(function ($user, string $ability) {
            if (method_exists($user, 'hasRole') && $user->hasRole('admin')) {
                return true;
            }
            return null; // defer to the specific gate
        });

        $abilities = [
            // Settings
            'settings.view',

            // Customers
            'customers.view', 'customers.create', 'customers.edit',

            // Orders
            'orders.view', 'orders.create', 'orders.edit',

            // Products
            'products.view', 'products.create', 'products.edit',

            // Stock Opname
            'stock-opname.view', 'stock-opname.create', 'stock-opname.edit',
        ];

        foreach ($abilities as $ability) {
            Gate::define($ability, function ($user) use ($ability) {
                // Prefer dedicated permission APIs if present
                if (method_exists($user, 'hasPermission')) {
                    return $user->hasPermission($ability);
                }
                if (method_exists($user, 'hasAnyPermission')) {
                    return $user->hasAnyPermission([$ability]);
                }

                // Fallback: check array-like permissions property if available
                if (property_exists($user, 'permissions')) {
                    $perms = $user->permissions;
                    if (is_array($perms)) {
                        return in_array($ability, $perms, true);
                    }
                }

                return false;
            });
        }
    }
}
