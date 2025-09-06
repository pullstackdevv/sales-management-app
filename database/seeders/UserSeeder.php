<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get role IDs
        $ownerRole = Role::where('name', 'owner')->first();
        $adminRole = Role::where('name', 'admin')->first();
        $staffRole = Role::where('name', 'staff')->first();
        $warehouseRole = Role::where('name', 'warehouse')->first();

        $users = [
            [
                'name' => 'Owner Bisnis',
                'email' => 'owner@example.com',
                'password' => Hash::make('password'),
                'role_id' => $ownerRole?->id,
                'is_active' => true,
            ],
            [
                'name' => 'Staff Gudang',
                'email' => 'gudang@example.com',
                'password' => Hash::make('password'),
                'role_id' => $warehouseRole?->id,
                'is_active' => true,
            ],
            [
                'name' => 'Staff Kasir',
                'email' => 'kasir@example.com',
                'password' => Hash::make('password'),
                'role_id' => $staffRole?->id,
                'is_active' => true,
            ],
            [
                'name' => 'Administrator',
                'email' => 'administrator@example.com',
                'password' => Hash::make('password'),
                'role_id' => $adminRole?->id,
                'is_active' => true,
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }
    }
}
