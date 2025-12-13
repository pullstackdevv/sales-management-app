<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InteractiveUserRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * This seeder allows you to interactively assign roles to users.
     * Run with: php artisan db:seed --class=InteractiveUserRoleSeeder
     */
    public function run(): void
    {
        $this->command->info('===========================================');
        $this->command->info('  Interactive User Role Assignment');
        $this->command->info('===========================================');
        $this->command->info('');

        // Get all users without roles
        $usersWithoutRoles = User::doesntHave('roles')->get();
        $usersWithRoles = User::has('roles')->get();

        if ($usersWithoutRoles->isEmpty()) {
            $this->command->info('✓ All users already have roles assigned!');
            $this->command->info('');
            $this->showUserRoleSummary();
            return;
        }

        $this->command->info("Found {$usersWithoutRoles->count()} user(s) without roles.");
        $this->command->info("Found {$usersWithRoles->count()} user(s) with roles (will be skipped).");
        $this->command->info('');

        // Get available roles
        $roles = Role::where('is_active', true)->get();
        
        $this->command->info('Available roles:');
        foreach ($roles as $index => $role) {
            $this->command->info(sprintf(
                "  [%d] %s - %s (%d permissions)",
                $index + 1,
                $role->name,
                $role->description,
                $role->permissions()->count()
            ));
        }
        $this->command->info('');

        // Assign roles
        foreach ($usersWithoutRoles as $user) {
            $this->assignRoleToUser($user, $roles);
        }

        $this->command->info('');
        $this->command->info('✓ Role assignment completed!');
        $this->command->info('');
        $this->showUserRoleSummary();
    }

    /**
     * Assign role to a specific user.
     */
    protected function assignRoleToUser(User $user, $roles): void
    {
        $this->command->info("User: {$user->name} ({$user->email})");
        
        // Auto-assign based on email pattern
        $suggestedRole = $this->suggestRole($user);
        
        if ($suggestedRole) {
            $this->command->info("  Suggested role: {$suggestedRole}");
        }

        $choice = $this->command->choice(
            'Select role for this user',
            array_merge(['Skip'], $roles->pluck('name')->toArray()),
            $suggestedRole ? array_search($suggestedRole, $roles->pluck('name')->toArray()) + 1 : 0
        );

        if ($choice === 'Skip') {
            $this->command->warn("  ⊘ Skipped");
            $this->command->info('');
            return;
        }

        try {
            DB::beginTransaction();
            $user->assignRole($choice);
            DB::commit();
            $this->command->info("  ✓ Assigned '{$choice}' role");
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error("  ✗ Failed: " . $e->getMessage());
        }

        $this->command->info('');
    }

    /**
     * Suggest role based on user email.
     */
    protected function suggestRole(User $user): ?string
    {
        $email = strtolower($user->email);

        if (str_contains($email, 'owner') || str_contains($email, 'ceo') || $user->id === 1) {
            return 'owner';
        }

        if (str_contains($email, 'admin') || str_contains($email, 'manager')) {
            return 'admin';
        }

        return 'staff';
    }

    /**
     * Show summary of user roles.
     */
    protected function showUserRoleSummary(): void
    {
        $this->command->info('Current User-Role Summary:');
        $this->command->info('─────────────────────────────────────────');

        $roles = Role::withCount('users')->get();

        foreach ($roles as $role) {
            $this->command->info(sprintf(
                "  %s: %d user(s)",
                ucfirst($role->name),
                $role->users_count
            ));
        }

        $usersWithoutRoles = User::doesntHave('roles')->count();
        if ($usersWithoutRoles > 0) {
            $this->command->warn("  No Role: {$usersWithoutRoles} user(s)");
        }

        $this->command->info('─────────────────────────────────────────');
    }
}
