<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * This seeder creates all permissions for the application.
     * Permissions are organized by module with CRUD operations.
     */
    public function run(): void
    {
        DB::beginTransaction();

        try {
            $this->command->info('Creating permissions...');

            $permissions = $this->getPermissions();

            foreach ($permissions as $permission) {
                Permission::updateOrCreate(
                    ['name' => $permission['name']],
                    [
                        'display_name' => $permission['display_name'],
                        'description' => $permission['description'],
                        'module' => $permission['module'],
                    ]
                );
            }

            DB::commit();
            $this->command->info('Permissions created successfully! Total: ' . count($permissions));
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Permission seeding failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get all permissions organized by module.
     */
    protected function getPermissions(): array
    {
        return [
            // Dashboard
            ['name' => 'dashboard.view', 'display_name' => 'View Dashboard', 'description' => 'Can view dashboard', 'module' => 'dashboard'],
            ['name' => 'dashboard.analytics', 'display_name' => 'View Analytics', 'description' => 'Can view analytics data', 'module' => 'dashboard'],

            // Orders
            ['name' => 'orders.view', 'display_name' => 'View Orders', 'description' => 'Can view order list', 'module' => 'orders'],
            ['name' => 'orders.create', 'display_name' => 'Create Order', 'description' => 'Can create new order', 'module' => 'orders'],
            ['name' => 'orders.edit', 'display_name' => 'Edit Order', 'description' => 'Can edit order', 'module' => 'orders'],
            ['name' => 'orders.delete', 'display_name' => 'Delete Order', 'description' => 'Can delete order', 'module' => 'orders'],
            ['name' => 'orders.update_status', 'display_name' => 'Update Order Status', 'description' => 'Can update order status', 'module' => 'orders'],
            ['name' => 'orders.print', 'display_name' => 'Print Order', 'description' => 'Can print order invoice', 'module' => 'orders'],
            ['name' => 'orders.export', 'display_name' => 'Export Orders', 'description' => 'Can export order data', 'module' => 'orders'],

            // Products
            ['name' => 'products.view', 'display_name' => 'View Products', 'description' => 'Can view product list', 'module' => 'products'],
            ['name' => 'products.create', 'display_name' => 'Create Product', 'description' => 'Can create new product', 'module' => 'products'],
            ['name' => 'products.edit', 'display_name' => 'Edit Product', 'description' => 'Can edit product', 'module' => 'products'],
            ['name' => 'products.delete', 'display_name' => 'Delete Product', 'description' => 'Can delete product', 'module' => 'products'],
            ['name' => 'products.import', 'display_name' => 'Import Products', 'description' => 'Can import product data', 'module' => 'products'],
            ['name' => 'products.export', 'display_name' => 'Export Products', 'description' => 'Can export product data', 'module' => 'products'],
            ['name' => 'products.toggle_status', 'display_name' => 'Toggle Product Status', 'description' => 'Can activate/deactivate product', 'module' => 'products'],
            ['name' => 'products.toggle_storefront', 'display_name' => 'Toggle Storefront', 'description' => 'Can show/hide product in storefront', 'module' => 'products'],

            // Product Categories
            ['name' => 'product_categories.view', 'display_name' => 'View Categories', 'description' => 'Can view category list', 'module' => 'products'],
            ['name' => 'product_categories.create', 'display_name' => 'Create Category', 'description' => 'Can create new category', 'module' => 'products'],
            ['name' => 'product_categories.edit', 'display_name' => 'Edit Category', 'description' => 'Can edit category', 'module' => 'products'],
            ['name' => 'product_categories.delete', 'display_name' => 'Delete Category', 'description' => 'Can delete category', 'module' => 'products'],

            // Customers
            ['name' => 'customers.view', 'display_name' => 'View Customers', 'description' => 'Can view customer list', 'module' => 'customers'],
            ['name' => 'customers.create', 'display_name' => 'Create Customer', 'description' => 'Can create new customer', 'module' => 'customers'],
            ['name' => 'customers.edit', 'display_name' => 'Edit Customer', 'description' => 'Can edit customer', 'module' => 'customers'],
            ['name' => 'customers.delete', 'display_name' => 'Delete Customer', 'description' => 'Can delete customer', 'module' => 'customers'],
            ['name' => 'customers.toggle_status', 'display_name' => 'Toggle Customer Status', 'description' => 'Can activate/deactivate customer', 'module' => 'customers'],
            ['name' => 'customers.view_orders', 'display_name' => 'View Customer Orders', 'description' => 'Can view customer order history', 'module' => 'customers'],

            // Stock Opname
            ['name' => 'stock.view', 'display_name' => 'View Stock', 'description' => 'Can view stock opname list', 'module' => 'stock'],
            ['name' => 'stock.create', 'display_name' => 'Create Stock Opname', 'description' => 'Can create stock opname', 'module' => 'stock'],
            ['name' => 'stock.edit', 'display_name' => 'Edit Stock Opname', 'description' => 'Can edit stock opname', 'module' => 'stock'],
            ['name' => 'stock.delete', 'display_name' => 'Delete Stock Opname', 'description' => 'Can delete stock opname', 'module' => 'stock'],
            ['name' => 'stock.approve', 'display_name' => 'Approve Stock Opname', 'description' => 'Can approve stock opname', 'module' => 'stock'],

            // Vouchers
            ['name' => 'vouchers.view', 'display_name' => 'View Vouchers', 'description' => 'Can view voucher list', 'module' => 'vouchers'],
            ['name' => 'vouchers.create', 'display_name' => 'Create Voucher', 'description' => 'Can create new voucher', 'module' => 'vouchers'],
            ['name' => 'vouchers.edit', 'display_name' => 'Edit Voucher', 'description' => 'Can edit voucher', 'module' => 'vouchers'],
            ['name' => 'vouchers.delete', 'display_name' => 'Delete Voucher', 'description' => 'Can delete voucher', 'module' => 'vouchers'],
            ['name' => 'vouchers.toggle_status', 'display_name' => 'Toggle Voucher Status', 'description' => 'Can activate/deactivate voucher', 'module' => 'vouchers'],

            // Promotions
            ['name' => 'promotions.view', 'display_name' => 'View Promotions', 'description' => 'Can view promotion list', 'module' => 'promotions'],
            ['name' => 'promotions.create', 'display_name' => 'Create Promotion', 'description' => 'Can create new promotion', 'module' => 'promotions'],
            ['name' => 'promotions.edit', 'display_name' => 'Edit Promotion', 'description' => 'Can edit promotion', 'module' => 'promotions'],
            ['name' => 'promotions.delete', 'display_name' => 'Delete Promotion', 'description' => 'Can delete promotion', 'module' => 'promotions'],
            ['name' => 'promotions.toggle_status', 'display_name' => 'Toggle Promotion Status', 'description' => 'Can activate/deactivate promotion', 'module' => 'promotions'],
            ['name' => 'promotions.toggle_storefront', 'display_name' => 'Toggle Storefront', 'description' => 'Can show/hide promotion in storefront', 'module' => 'promotions'],

            // Expenses
            ['name' => 'expenses.view', 'display_name' => 'View Expenses', 'description' => 'Can view expense list', 'module' => 'expenses'],
            ['name' => 'expenses.create', 'display_name' => 'Create Expense', 'description' => 'Can create new expense', 'module' => 'expenses'],
            ['name' => 'expenses.edit', 'display_name' => 'Edit Expense', 'description' => 'Can edit expense', 'module' => 'expenses'],
            ['name' => 'expenses.delete', 'display_name' => 'Delete Expense', 'description' => 'Can delete expense', 'module' => 'expenses'],

            // Reports
            ['name' => 'reports.view', 'display_name' => 'View Reports', 'description' => 'Can view reports', 'module' => 'reports'],
            ['name' => 'reports.sales', 'display_name' => 'View Sales Report', 'description' => 'Can view sales report', 'module' => 'reports'],
            ['name' => 'reports.products', 'display_name' => 'View Product Report', 'description' => 'Can view product report', 'module' => 'reports'],
            ['name' => 'reports.customers', 'display_name' => 'View Customer Report', 'description' => 'Can view customer report', 'module' => 'reports'],
            ['name' => 'reports.stock', 'display_name' => 'View Stock Report', 'description' => 'Can view stock report', 'module' => 'reports'],
            ['name' => 'reports.export', 'display_name' => 'Export Reports', 'description' => 'Can export report data', 'module' => 'reports'],

            // Settings - General
            ['name' => 'settings.view', 'display_name' => 'View Settings', 'description' => 'Can view settings page', 'module' => 'settings'],
            ['name' => 'settings.edit', 'display_name' => 'Edit Settings', 'description' => 'Can edit general settings', 'module' => 'settings'],

            // Settings - Users
            ['name' => 'users.view', 'display_name' => 'View Users', 'description' => 'Can view user list', 'module' => 'settings'],
            ['name' => 'users.create', 'display_name' => 'Create User', 'description' => 'Can create new user', 'module' => 'settings'],
            ['name' => 'users.edit', 'display_name' => 'Edit User', 'description' => 'Can edit user', 'module' => 'settings'],
            ['name' => 'users.delete', 'display_name' => 'Delete User', 'description' => 'Can delete user', 'module' => 'settings'],
            ['name' => 'users.toggle_status', 'display_name' => 'Toggle User Status', 'description' => 'Can activate/deactivate user', 'module' => 'settings'],

            // Settings - Roles
            ['name' => 'roles.view', 'display_name' => 'View Roles', 'description' => 'Can view role list', 'module' => 'settings'],
            ['name' => 'roles.create', 'display_name' => 'Create Role', 'description' => 'Can create new role', 'module' => 'settings'],
            ['name' => 'roles.edit', 'display_name' => 'Edit Role', 'description' => 'Can edit role', 'module' => 'settings'],
            ['name' => 'roles.delete', 'display_name' => 'Delete Role', 'description' => 'Can delete role', 'module' => 'settings'],
            ['name' => 'roles.assign_permissions', 'display_name' => 'Assign Permissions', 'description' => 'Can assign permissions to role', 'module' => 'settings'],

            // Settings - Payment Banks
            ['name' => 'payment_banks.view', 'display_name' => 'View Payment Banks', 'description' => 'Can view payment bank list', 'module' => 'settings'],
            ['name' => 'payment_banks.create', 'display_name' => 'Create Payment Bank', 'description' => 'Can create payment bank', 'module' => 'settings'],
            ['name' => 'payment_banks.edit', 'display_name' => 'Edit Payment Bank', 'description' => 'Can edit payment bank', 'module' => 'settings'],
            ['name' => 'payment_banks.delete', 'display_name' => 'Delete Payment Bank', 'description' => 'Can delete payment bank', 'module' => 'settings'],

            // Settings - Couriers
            ['name' => 'couriers.view', 'display_name' => 'View Couriers', 'description' => 'Can view courier list', 'module' => 'settings'],
            ['name' => 'couriers.create', 'display_name' => 'Create Courier', 'description' => 'Can create courier', 'module' => 'settings'],
            ['name' => 'couriers.edit', 'display_name' => 'Edit Courier', 'description' => 'Can edit courier', 'module' => 'settings'],
            ['name' => 'couriers.delete', 'display_name' => 'Delete Courier', 'description' => 'Can delete courier', 'module' => 'settings'],

            // Settings - Sales Channels
            ['name' => 'sales_channels.view', 'display_name' => 'View Sales Channels', 'description' => 'Can view sales channel list', 'module' => 'settings'],
            ['name' => 'sales_channels.create', 'display_name' => 'Create Sales Channel', 'description' => 'Can create sales channel', 'module' => 'settings'],
            ['name' => 'sales_channels.edit', 'display_name' => 'Edit Sales Channel', 'description' => 'Can edit sales channel', 'module' => 'settings'],
            ['name' => 'sales_channels.delete', 'display_name' => 'Delete Sales Channel', 'description' => 'Can delete sales channel', 'module' => 'settings'],
        ];
    }
}
