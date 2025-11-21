<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Role;
use App\Models\Permission;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Creates default roles and assigns permissions using pivot tables.
     */
    public function run(): void
    {
        DB::beginTransaction();

        try {
            $this->command->info('Creating roles and assigning permissions...');

            $roles = [
                [
                    'name' => 'owner',
                    'description' => 'Akses penuh ke semua fitur sistem',
                    'permissions' => ['*'], // All permissions (wildcard)
                    'is_active' => true,
                    'is_system' => true
                ],
                [
                    'name' => 'admin',
                    'description' => 'Akses ke semua fitur kecuali management user dan role',
                    'permissions' => [
                        // Dashboard
                        'dashboard.view',
                        'dashboard.analytics',
                        
                        // Orders - Full access
                        'orders.view',
                        'orders.create',
                        'orders.edit',
                        'orders.delete',
                        'orders.update_status',
                        'orders.print',
                        'orders.export',
                        
                        // Products - Full access
                        'products.view',
                        'products.create',
                        'products.edit',
                        'products.delete',
                        'products.import',
                        'products.export',
                        'products.toggle_status',
                        'products.toggle_storefront',
                        'product_categories.view',
                        'product_categories.create',
                        'product_categories.edit',
                        'product_categories.delete',
                        
                        // Customers - Full access
                        'customers.view',
                        'customers.create',
                        'customers.edit',
                        'customers.delete',
                        'customers.toggle_status',
                        'customers.view_orders',
                        
                        // Stock - Full access
                        'stock.view',
                        'stock.create',
                        'stock.edit',
                        'stock.delete',
                        'stock.approve',
                        
                        // Vouchers - Full access
                        'vouchers.view',
                        'vouchers.create',
                        'vouchers.edit',
                        'vouchers.delete',
                        'vouchers.toggle_status',
                        
                        // Promotions - Full access
                        'promotions.view',
                        'promotions.create',
                        'promotions.edit',
                        'promotions.delete',
                        'promotions.toggle_status',
                        'promotions.toggle_storefront',
                        
                        // Expenses - Full access
                        'expenses.view',
                        'expenses.create',
                        'expenses.edit',
                        'expenses.delete',
                        
                        // Reports - Full access
                        'reports.view',
                        'reports.sales',
                        'reports.products',
                        'reports.customers',
                        'reports.stock',
                        'reports.export',
                        
                        // Settings - Limited (no user/role management)
                        'settings.view',
                        'settings.edit',
                        'payment_banks.view',
                        'payment_banks.create',
                        'payment_banks.edit',
                        'payment_banks.delete',
                        'couriers.view',
                        'couriers.create',
                        'couriers.edit',
                        'couriers.delete',
                        'sales_channels.view',
                        'sales_channels.create',
                        'sales_channels.edit',
                        'sales_channels.delete',
                    ],
                    'is_active' => true,
                    'is_system' => true
                ],
                [
                    'name' => 'staff',
                    'description' => 'Akses ke orders, products, dan customers (view & create only)',
                    'permissions' => [
                        // Dashboard
                        'dashboard.view',
                        
                        // Orders - View & Create only
                        'orders.view',
                        'orders.create',
                        'orders.print',
                        
                        // Products - View only
                        'products.view',
                        'product_categories.view',
                        
                        // Customers - View & Create
                        'customers.view',
                        'customers.create',
                        'customers.view_orders',
                        
                        // Reports - View only
                        'reports.view',
                        'reports.sales',
                        'reports.products',
                        'reports.customers',
                    ],
                    'is_active' => true,
                    'is_system' => true
                ],
            ];

            foreach ($roles as $roleData) {
                // Create or update role
                $role = Role::updateOrCreate(
                    ['name' => $roleData['name']],
                    [
                        'description' => $roleData['description'],
                        'is_active' => $roleData['is_active'],
                        'is_system' => $roleData['is_system'],
                    ]
                );

                // Assign permissions
                $permissions = $roleData['permissions'];
                
                if (in_array('*', $permissions)) {
                    // Owner gets all permissions
                    $allPermissions = Permission::all()->pluck('name')->toArray();
                    $role->syncPermissions($allPermissions);
                    $this->command->info("Role '{$role->name}' assigned ALL permissions (wildcard)");
                } else {
                    // Assign specific permissions
                    $role->syncPermissions($permissions);
                    $this->command->info("Role '{$role->name}' assigned " . count($permissions) . " permissions");
                }
            }

            DB::commit();
            $this->command->info('Roles and permissions assigned successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Role seeding failed: ' . $e->getMessage());
            throw $e;
        }
    }
}