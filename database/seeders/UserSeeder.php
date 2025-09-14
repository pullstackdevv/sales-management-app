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
        
        $users = [
            [
                'name' => 'Owner Bisnis',
                'email' => 'owner@mystock.com',
                'password' => Hash::make('12345678'),
                'role_id' => $ownerRole?->id,
                'is_active' => true,
            ],
            
            [
                'name' => 'Administrator',
                'email' => 'administrator@mystock.com',
                'password' => Hash::make('12345678'),
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
