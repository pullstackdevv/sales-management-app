<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use App\Models\Permission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MigrateRbacDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * This seeder migrates data from the old RBAC system (JSON-based)
     * to the new modern RBAC system (pivot tables).
     */
    public function run(): void
    {
        DB::beginTransaction();

        try {
            $this->command->info('Starting RBAC data migration...');

            // Step 1: Create all permissions from old role data
            $this->createPermissionsFromOldRoles();

            // Step 2: Migrate user-role relationships
            $this->migrateUserRoleRelationships();

            // Step 3: Assign permissions to roles
            $this->assignPermissionsToRoles();

            DB::commit();
            $this->command->info('RBAC data migration completed successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Migration failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Create permissions table from old JSON permissions in roles.
     */
    protected function createPermissionsFromOldRoles(): void
    {
        $this->command->info('Creating permissions from old role data...');

        // Check if old permissions column still exists
        if (!Schema::hasColumn('roles', 'permissions')) {
            $this->command->warn('Old permissions column not found. Skipping permission creation.');
            return;
        }

        // Get all unique permissions from old roles
        $oldRoles = DB::table('roles')->get();
        $allPermissions = collect();

        foreach ($oldRoles as $role) {
            $permissions = json_decode($role->permissions, true) ?? [];
            $allPermissions = $allPermissions->merge($permissions);
        }

        $uniquePermissions = $allPermissions->unique()->filter()->values();

        $this->command->info("Found {$uniquePermissions->count()} unique permissions");

        // Create permission records
        foreach ($uniquePermissions as $permissionName) {
            $module = $this->extractModule($permissionName);
            $displayName = $this->generateDisplayName($permissionName);

            Permission::firstOrCreate(
                ['name' => $permissionName],
                [
                    'display_name' => $displayName,
                    'description' => "Permission for {$displayName}",
                    'module' => $module,
                ]
            );
        }

        $this->command->info('Permissions created successfully');
    }

    /**
     * Migrate user-role relationships from old system.
     */
    protected function migrateUserRoleRelationships(): void
    {
        $this->command->info('Migrating user-role relationships...');

        // Check if old role_id column still exists
        if (!Schema::hasColumn('users', 'role_id')) {
            $this->command->warn('Old role_id column not found. Skipping user-role migration.');
            return;
        }

        // Get all users with their old role_id
        $users = DB::table('users')
            ->whereNotNull('role_id')
            ->whereNull('deleted_at')
            ->get();

        $this->command->info("Migrating {$users->count()} users");

        foreach ($users as $user) {
            // Insert into pivot table
            DB::table('user_has_roles')->updateOrInsert(
                [
                    'user_id' => $user->id,
                    'role_id' => $user->role_id,
                ],
                []
            );
        }

        $this->command->info('User-role relationships migrated successfully');
    }

    /**
     * Assign permissions to roles based on old JSON data.
     */
    protected function assignPermissionsToRoles(): void
    {
        $this->command->info('Assigning permissions to roles...');

        // Check if old permissions column still exists
        if (!Schema::hasColumn('roles', 'permissions')) {
            $this->command->warn('Old permissions column not found. Skipping permission assignment.');
            return;
        }

        $roles = DB::table('roles')->get();

        foreach ($roles as $role) {
            $this->command->info("Processing role: {$role->name}");

            $oldPermissions = json_decode($role->permissions, true) ?? [];

            foreach ($oldPermissions as $permissionName) {
                $permission = Permission::where('name', $permissionName)->first();

                if ($permission) {
                    // Insert into pivot table
                    DB::table('role_has_permissions')->updateOrInsert(
                        [
                            'role_id' => $role->id,
                            'permission_id' => $permission->id,
                        ],
                        []
                    );
                }
            }

            $this->command->info("Assigned " . count($oldPermissions) . " permissions to {$role->name}");
        }

        $this->command->info('Permissions assigned to roles successfully');
    }

    /**
     * Extract module name from permission string.
     */
    protected function extractModule(string $permission): string
    {
        // Handle wildcard
        if ($permission === '*') {
            return 'all';
        }

        // Extract module from permission (e.g., 'orders.view' -> 'orders')
        $parts = explode('.', $permission);
        return $parts[0] ?? 'general';
    }

    /**
     * Generate display name from permission string.
     */
    protected function generateDisplayName(string $permission): string
    {
        // Handle wildcard
        if ($permission === '*') {
            return 'All Permissions';
        }

        // Convert 'orders.view' to 'View Orders'
        $parts = explode('.', $permission);
        
        if (count($parts) === 1) {
            // Module-level permission (e.g., 'orders')
            return ucfirst($parts[0]);
        }

        // Action-level permission (e.g., 'orders.view')
        $module = ucfirst($parts[0]);
        $action = ucfirst(str_replace('-', ' ', $parts[1]));
        
        return "{$action} {$module}";
    }
}
