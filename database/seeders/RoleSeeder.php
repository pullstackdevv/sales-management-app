<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'owner',
                'description' => 'Akses penuh ke semua fitur sistem',
                'permissions' => ['*'], // All permissions
                'is_active' => true,
                'is_system' => true
            ],
            [
                'name' => 'admin',
                'description' => 'Akses ke semua fitur kecuali management user',
                'permissions' => [
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
                    
                    // Settings (except user management)
                    'settings.general', 'settings.order', 'settings.product', 'settings.customer',
                    'settings.payment', 'settings.courier', 'settings.courier-rates', 'settings.origin',
                    'settings.template', 'settings.dashboard', 'settings.api'
                ],
                'is_active' => true,
                'is_system' => true
            ],
            [
                'name' => 'staff',
                'description' => 'Akses ke orders, products, dan customers',
                'permissions' => [
                    // Dashboard
                    'dashboard.view',
                    
                    // Orders
                    'orders.view', 'orders.create', 'orders.edit',
                    'orders.print', 'orders.invoice',
                    
                    // Products (view and edit only)
                    'products.view', 'products.edit',
                    'products.variants.view', 'products.variants.edit',
                    
                    // Customers
                    'customers.view', 'customers.create', 'customers.edit',
                    'customers.addresses.view', 'customers.addresses.create', 'customers.addresses.edit',
                    
                    // Reports (view only)
                    'reports.view', 'reports.sales', 'reports.user-performance',
                    
                    // Basic settings
                    'settings.general', 'settings.order', 'settings.customer'
                ],
                'is_active' => true,
                'is_system' => true
            ],
            [
                'name' => 'warehouse',
                'description' => 'Akses ke stock management dan products',
                'permissions' => [
                    // Dashboard
                    'dashboard.view',
                    
                    // Orders (view and edit only)
                    'orders.view', 'orders.edit',
                    
                    // Products
                    'products.view', 'products.create', 'products.edit', 'products.delete',
                    'products.variants.view', 'products.variants.create', 'products.variants.edit', 'products.variants.delete',
                    
                    // Stock Management (full access)
                    'stock.view', 'stock.create', 'stock.edit', 'stock.delete',
                    'stock-movements.view', 'stock-movements.create', 'stock-movements.edit', 'stock-movements.delete',
                    'stock-opnames.view', 'stock-opnames.create', 'stock-opnames.edit', 'stock-opnames.delete',
                    
                    // Reports (stock related)
                    'reports.view', 'reports.stock',
                    
                    // Settings (product and stock related)
                    'settings.product', 'settings.origin'
                ],
                'is_active' => true,
                'is_system' => true
            ]
        ];

        foreach ($roles as $roleData) {
            Role::updateOrCreate(
                ['name' => $roleData['name']],
                $roleData
            );
        }
    }
}