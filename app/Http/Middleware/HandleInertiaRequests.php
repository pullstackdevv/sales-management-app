<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        
        // Load roles with permissions for authenticated user
        if ($user) {
            $user->load(['roles' => function ($query) {
                $query->with('permissions:id,name');
            }]);
            
            // Transform roles to include permission names as array
            $user->roles->each(function ($role) {
                $role->permissions = $role->permissions->pluck('name')->toArray();
            });
        }
        
        return [
            ...parent::share($request),
            // Authenticated user data
            'auth' => [
                'user' => $user,
            ],

            // Flash message support
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error' => fn() => $request->session()->get('error'),
            ],
        ];
    }

    public function redirectTo(Request $request)
    {
        Log::info('test');
    }
}
