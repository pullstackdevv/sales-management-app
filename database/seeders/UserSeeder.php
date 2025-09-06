<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Owner Bisnis',
                'email' => 'owner@example.com',
                'password' => Hash::make('password'),
                'role' => 'owner',
                'is_active' => true,
            ],
            [
                'name' => 'Staff Gudang',
                'email' => 'gudang@example.com',
                'password' => Hash::make('password'),
                'role' => 'warehouse',
                'is_active' => true,
            ],
            [
                'name' => 'Staff Kasir',
                'email' => 'kasir@example.com',
                'password' => Hash::make('password'),
                'role' => 'staff',
                'is_active' => true,
            ],
            [
                'name' => 'Administrator',
                'email' => 'administrator@example.com',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'is_active' => true,
            ],
        ];

        foreach ($users as $userData) {
            User::create($userData);
        }
    }
}
