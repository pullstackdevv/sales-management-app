<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EnsureModulePermission
{
    /**
     * Handle an incoming request.
     *
     * This middleware infers the required module permission from the CMS path
     * and denies access (403) if the authenticated user lacks that permission.
     *
     * Expected permission keys (coarse-grained):
     *   dashboard, orders, products, customers, stock, vouchers, expenses, reports, settings
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only guard CMS area
        if (!$request->is('cms/*')) {
            return $next($request);
        }

        $user = Auth::user();
        if (!$user) {
            // Let existing auth middleware handle unauthenticated, but be safe
            return response('Unauthorized', 401);
        }

        $required = $this->inferModulePermission($request);
        if (!$required) {
            // No module mapping -> allow
            return $next($request);
        }

        if ($this->userHasPermission($user, $required)) {
            return $next($request);
        }

        // Render a friendly Inertia 403 page
        return Inertia::render('Errors/Forbidden')
            ->toResponse($request)
            ->setStatusCode(403);
    }

    /**
     * Infer module permission key from the CMS path.
     */
    protected function inferModulePermission(Request $request): ?string
    {
        // Path after cms/
        $path = ltrim(preg_replace('#^cms/#', '', $request->path()), '/');
        $first = strtolower(explode('/', $path)[0] ?? '');

        // Whitelist: allow login/logout/dashboard without checks if desired
        if (in_array($first, ['', 'logout', 'login'])) {
            return null;
        }

        // Map primary segment to module permission key
        $map = [
            'dashboard'      => 'dashboard',
            'order'          => 'orders',
            'orders'         => 'orders',
            'product'        => 'products',
            'products'       => 'products',
            'customer'       => 'customers',
            'customers'      => 'customers',
            'stock-opname'   => 'stock',
            'voucher'        => 'vouchers',
            'vouchers'       => 'vouchers',
            'expense'        => 'expenses',
            'report'         => 'reports',
            'reports'        => 'reports',
            'settings'       => 'settings',
        ];

        return $map[$first] ?? null;
    }

    /**
     * Check if user has the given permission key using available APIs.
     */
    protected function userHasPermission($user, string $permission): bool
    {
        // Admin shortcut if available
        if (method_exists($user, 'hasRole') && $user->hasRole('admin')) {
            return true;
        }

        if (method_exists($user, 'hasPermission')) {
            return (bool) $user->hasPermission($permission);
        }
        if (method_exists($user, 'hasAnyPermission')) {
            return (bool) $user->hasAnyPermission([$permission]);
        }

        // Fallback: property array on user (e.g., $user->permissions = ['orders', 'settings'])
        if (property_exists($user, 'permissions')) {
            $perms = $user->permissions;
            if (is_array($perms) && in_array($permission, $perms, true)) {
                return true;
            }
        }

        return false;
    }
}
