<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get roles
        $ownerRole = Role::where('name', 'owner')->first();
        $adminRole = Role::where('name', 'admin')->first();
        $staffRole = Role::where('name', 'staff')->first();
        
        $users = [
            [
                'name' => 'Owner Bisnis',
                'email' => 'owner@mystock.com',
                'password' => Hash::make('12345678'),
                'is_active' => true,
                'role' => 'owner',
            ],
            
            [
                'name' => 'Administrator',
                'email' => 'administrator@mystock.com',
                'password' => Hash::make('12345678'),
                'is_active' => true,
                'role' => 'admin',
            ],
        ];

        foreach ($users as $userData) {
            $roleName = $userData['role'];
            unset($userData['role']);
            
            DB::beginTransaction();
            try {
                $user = User::updateOrCreate(
                    ['email' => $userData['email']],
                    $userData
                );
                
                // Assign role using many-to-many
                $role = Role::where('name', $roleName)->first();
                if ($role) {
                    // Remove existing roles first
                    $user->roles()->detach();
                    // Assign new role
                    $user->roles()->attach($role->id);
                }
                
                DB::commit();
                $this->command->info("✓ User created/updated: {$user->email} with role: {$roleName}");
            } catch (\Exception $e) {
                DB::rollBack();
                $this->command->error("✗ Failed to create user: {$userData['email']} - " . $e->getMessage());
            }
        }
    }
}
