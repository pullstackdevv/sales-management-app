<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Collection;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'is_active',
        'is_system',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_system' => 'boolean',
    ];

    /**
     * Get the users that have this role.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_has_roles');
    }

    /**
     * Get the permissions for this role.
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_has_permissions');
    }

    /**
     * Check if role has a specific permission.
     */
    public function hasPermission(string $permission): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $permissions = $this->permissions()->pluck('name');
        
        // Owner has all permissions
        if ($permissions->contains('*')) {
            return true;
        }

        // Check exact permission
        if ($permissions->contains($permission)) {
            return true;
        }

        // Check wildcard permissions (e.g., 'orders.*' matches 'orders.view')
        foreach ($permissions as $perm) {
            if (str_ends_with($perm, '.*')) {
                $prefix = str_replace('.*', '', $perm);
                if (str_starts_with($permission, $prefix . '.')) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if role has any of the given permissions.
     */
    public function hasAnyPermission(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if role has all of the given permissions.
     */
    public function hasAllPermissions(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if (!$this->hasPermission($permission)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Assign permission(s) to role.
     */
    public function givePermissionTo(string|array|Permission $permissions): self
    {
        $permissions = is_array($permissions) ? $permissions : [$permissions];

        foreach ($permissions as $permission) {
            $permModel = $permission instanceof Permission 
                ? $permission 
                : Permission::where('name', $permission)->firstOrFail();
            $this->permissions()->syncWithoutDetaching($permModel);
        }

        return $this;
    }

    /**
     * Remove permission(s) from role.
     */
    public function revokePermissionTo(string|array|Permission $permissions): self
    {
        $permissions = is_array($permissions) ? $permissions : [$permissions];

        foreach ($permissions as $permission) {
            $permModel = $permission instanceof Permission 
                ? $permission 
                : Permission::where('name', $permission)->first();
            if ($permModel) {
                $this->permissions()->detach($permModel);
            }
        }

        return $this;
    }

    /**
     * Sync permissions (replace all existing permissions).
     */
    public function syncPermissions(array $permissions): self
    {
        $permissionIds = collect($permissions)->map(function ($permission) {
            return $permission instanceof Permission 
                ? $permission->id 
                : Permission::where('name', $permission)->firstOrFail()->id;
        });

        $this->permissions()->sync($permissionIds);

        return $this;
    }

    /**
     * Get all permission names for this role.
     */
    public function getPermissionNames(): array
    {
        return $this->permissions()->pluck('name')->toArray();
    }

    /**
     * Get all available permissions in the system
     */
    public static function getAllPermissions(): array
    {
        return [
            // Dashboard
            'dashboard.view',
            
            // Orders
            'orders.view', 'orders.create', 'orders.edit', 'orders.delete',
            'orders.print', 'orders.invoice', 'orders.shipping-label',
            
            // Products
            'products.view', 'products.create', 'products.edit', 'products.delete',
            'products.variants.view', 'products.variants.create', 'products.variants.edit', 'products.variants.delete',
            
            // Customers
            'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
            'customers.addresses.view', 'customers.addresses.create', 'customers.addresses.edit', 'customers.addresses.delete',
            
            // Stock Management
            'stock.view', 'stock.create', 'stock.edit', 'stock.delete',
            'stock-movements.view', 'stock-movements.create', 'stock-movements.edit', 'stock-movements.delete',
            'stock-opnames.view', 'stock-opnames.create', 'stock-opnames.edit', 'stock-opnames.delete',
            
            // Vouchers
            'vouchers.view', 'vouchers.create', 'vouchers.edit', 'vouchers.delete',
            
            // Expenses
            'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete',
            
            // Reports
            'reports.view', 'reports.sales', 'reports.stock', 'reports.user-performance', 'reports.payments',
            'reports.export', 'reports.analyzer',
            
            // Settings
            'settings.general', 'settings.order', 'settings.product', 'settings.customer',
            'settings.payment', 'settings.courier', 'settings.courier-rates', 'settings.origin',
            'settings.template', 'settings.dashboard', 'settings.api',
            'settings.users', 'settings.roles'
        ];
    }
}