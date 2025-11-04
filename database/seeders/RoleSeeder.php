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
                    'dashboard',
                    'orders',
                    'products',
                    'customers',
                    'stock',
                    'vouchers',
                    'expenses',
                    'reports',
                    'settings'
                ],
                'is_active' => true,
                'is_system' => true
            ],
            [
                'name' => 'staff',
                'description' => 'Akses ke orders, products, dan customers',
                'permissions' => [
                    'dashboard',
                    'orders',
                    'products',
                    'customers',
                    'reports'
                ],
                'is_active' => true,
                'is_system' => true
            ],
            
        ];

        foreach ($roles as $roleData) {
            Role::updateOrCreate(
                ['name' => $roleData['name']],
                $roleData
            );
        }
    }
}