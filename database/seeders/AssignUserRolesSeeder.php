<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AssignUserRolesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * This seeder assigns roles to existing users.
     * Modify the logic based on your needs.
     */
    public function run(): void
    {
        DB::beginTransaction();

        try {
            $this->command->info('Assigning roles to users...');

            // Get all users
            $users = User::all();

            if ($users->isEmpty()) {
                $this->command->warn('No users found in database.');
                DB::commit();
                return;
            }

            // Get roles
            $ownerRole = Role::where('name', 'owner')->first();
            $adminRole = Role::where('name', 'admin')->first();
            $staffRole = Role::where('name', 'staff')->first();

            if (!$ownerRole || !$adminRole || !$staffRole) {
                $this->command->error('Roles not found. Please run RoleSeeder first.');
                DB::rollBack();
                return;
            }

            $assignedCount = 0;
            $skippedCount = 0;

            foreach ($users as $user) {
                // Skip if user already has roles
                if ($user->roles()->exists()) {
                    $this->command->info("User '{$user->name}' already has role(s). Skipping...");
                    $skippedCount++;
                    continue;
                }

                // Assign role based on email or other criteria
                // Modify this logic based on your needs
                
                if ($this->isOwner($user)) {
                    $user->assignRole('owner');
                    $this->command->info("✓ Assigned 'owner' role to: {$user->name} ({$user->email})");
                } elseif ($this->isAdmin($user)) {
                    $user->assignRole('admin');
                    $this->command->info("✓ Assigned 'admin' role to: {$user->name} ({$user->email})");
                } else {
                    // Default to staff
                    $user->assignRole('staff');
                    $this->command->info("✓ Assigned 'staff' role to: {$user->name} ({$user->email})");
                }

                $assignedCount++;
            }

            DB::commit();
            
            $this->command->info('');
            $this->command->info("Role assignment completed!");
            $this->command->info("- Assigned: {$assignedCount} users");
            $this->command->info("- Skipped: {$skippedCount} users (already have roles)");
            $this->command->info("- Total: " . ($assignedCount + $skippedCount) . " users");

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Role assignment failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Determine if user should be owner.
     * Modify this logic based on your needs.
     */
    protected function isOwner(User $user): bool
    {
        // Example: First user is owner
        // Or check by email domain, or specific email
        return $user->id === 1 
            || str_contains($user->email, 'owner@')
            || str_contains($user->email, 'ceo@');
    }

    /**
     * Determine if user should be admin.
     * Modify this logic based on your needs.
     */
    protected function isAdmin(User $user): bool
    {
        // Example: Check by email domain or pattern
        return str_contains($user->email, 'admin@')
            || str_contains($user->email, 'manager@');
    }
}
