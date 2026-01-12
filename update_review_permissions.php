<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Role;
use App\Models\Permission;

echo "Updating role permissions for reviews...\n\n";

// Get all permissions
$allPermissions = Permission::all()->pluck('name')->toArray();

// Update Owner role
$owner = Role::where('name', 'owner')->first();
if ($owner) {
    $owner->syncPermissions($allPermissions);
    echo "✓ Owner role updated with " . count($allPermissions) . " permissions\n";
}

// Update Admin role (add review permissions)
$admin = Role::where('name', 'admin')->first();
if ($admin) {
    $currentPerms = $admin->permissions()->pluck('name')->toArray();
    $reviewPerms = ['reviews.view', 'reviews.approve', 'reviews.reject', 'reviews.delete', 'reviews.statistics'];
    $newPerms = array_unique(array_merge($currentPerms, $reviewPerms));
    $admin->syncPermissions($newPerms);
    echo "✓ Admin role updated with review permissions\n";
}

// Update Staff role (add reviews.view only)
$staff = Role::where('name', 'staff')->first();
if ($staff) {
    $currentPerms = $staff->permissions()->pluck('name')->toArray();
    $newPerms = array_unique(array_merge($currentPerms, ['reviews.view']));
    $staff->syncPermissions($newPerms);
    echo "✓ Staff role updated with reviews.view permission\n";
}

echo "\n✅ All roles updated successfully!\n";
echo "Please refresh your browser to see the Review & Rating menu.\n";
