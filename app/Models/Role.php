<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'permissions',
        'is_active',
        'is_system',
    ];

    protected $casts = [
        'permissions' => 'array',
        'is_active' => 'boolean',
        'is_system' => 'boolean',
    ];

    public function users()
    {
        return $this->hasMany(User::class, 'role_id');
    }

    /**
     * Check if role has a specific permission
     */
    public function hasPermission(string $permission): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $permissions = $this->permissions ?? [];
        
        // Owner has all permissions
        if (in_array('*', $permissions)) {
            return true;
        }

        // Check exact permission
        if (in_array($permission, $permissions)) {
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

    public function hasAnyPermission(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }
        return false;
    }

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