# RBAC Quick Commands Reference

**Quick reference for testing and managing the RBAC system**

---

## 🚀 Initial Setup

### Run Migrations & Seeders
```bash
# Run all migrations
php artisan migrate

# Seed permissions (77 permissions)
php artisan db:seed --class=PermissionSeeder

# Seed roles with permissions (3 roles)
php artisan db:seed --class=RoleSeeder

# Assign roles to existing users (choose one method)

# Method 1: Automatic assignment based on email patterns
php artisan db:seed --class=AssignUserRolesSeeder

# Method 2: Interactive assignment (recommended)
php artisan db:seed --class=InteractiveUserRoleSeeder
```

---

## 🔍 Verification Commands

### Check Database
```bash
# Open tinker
php artisan tinker

# Count permissions
\App\Models\Permission::count()
# Expected: 77

# Count roles
\App\Models\Role::count()
# Expected: 3 (or more if you added custom roles)

# List all permissions
\App\Models\Permission::pluck('name')

# List all roles
\App\Models\Role::pluck('name')

# Check role permissions
$owner = \App\Models\Role::where('name', 'owner')->first();
$owner->permissions()->count()
# Expected: 77

$admin = \App\Models\Role::where('name', 'admin')->first();
$admin->permissions()->count()
# Expected: 67

$staff = \App\Models\Role::where('name', 'staff')->first();
$staff->permissions()->count()
# Expected: 13
```

---

## 👤 User Management

### Assign Role to User
```bash
php artisan tinker

# Find user
$user = \App\Models\User::find(1);

# Assign single role
$user->assignRole('admin');

# Assign multiple roles
$user->assignRole(['admin', 'staff']);

# Sync roles (removes old, adds new)
$user->syncRoles(['admin']);

# Check user roles
$user->roles()->pluck('name')

# Check user permissions
$user->getAllPermissions()->pluck('name')
```

### Create User with Role
```bash
php artisan tinker

$user = \App\Models\User::create([
    'name' => 'Test Admin',
    'email' => 'admin@test.com',
    'password' => bcrypt('password'),
    'is_active' => true
]);

$user->assignRole('admin');
```

---

## 🔐 Permission Management

### Check User Permissions
```bash
php artisan tinker

$user = \App\Models\User::find(1);

# Check single permission
$user->hasPermission('orders.create')
# Returns: true or false

# Check any permission
$user->hasAnyPermission(['orders.create', 'orders.edit'])
# Returns: true if has any

# Check all permissions
$user->hasAllPermissions(['orders.create', 'orders.edit'])
# Returns: true if has all

# Get all permission names
$user->getPermissionNames()
```

### Manage Role Permissions
```bash
php artisan tinker

$role = \App\Models\Role::where('name', 'staff')->first();

# Give single permission
$role->givePermissionTo('orders.delete');

# Give multiple permissions
$role->givePermissionTo(['orders.delete', 'products.edit']);

# Revoke permission
$role->revokePermissionTo('orders.delete');

# Sync permissions (replace all)
$role->syncPermissions(['orders.view', 'orders.create']);

# Get all permissions
$role->getPermissionNames()
```

---

## 🧪 Testing Commands

### Test Permission Checks
```bash
php artisan tinker

# Get user
$user = \App\Models\User::find(1);

# Test as Owner
$user->assignRole('owner');
$user->hasPermission('orders.create')  // Should be true
$user->hasPermission('users.create')   // Should be true

# Test as Admin
$user->syncRoles(['admin']);
$user->hasPermission('orders.create')  // Should be true
$user->hasPermission('users.create')   // Should be false

# Test as Staff
$user->syncRoles(['staff']);
$user->hasPermission('orders.view')    // Should be true
$user->hasPermission('orders.create')  // Should be true
$user->hasPermission('orders.delete')  // Should be false
```

### Test API Endpoints
```bash
# Test with curl (replace TOKEN with actual token)

# Should work for admin
curl -X POST http://localhost:8000/api/orders \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customer_id": 1, ...}'

# Should fail for staff (403)
curl -X DELETE http://localhost:8000/api/orders/1 \
  -H "Authorization: Bearer TOKEN"
```

---

## 📊 Reporting Commands

### Get System Statistics
```bash
php artisan tinker

# Total permissions
echo "Total Permissions: " . \App\Models\Permission::count();

# Permissions by module
\App\Models\Permission::select('module', \DB::raw('count(*) as total'))
    ->groupBy('module')
    ->get();

# Total roles
echo "Total Roles: " . \App\Models\Role::count();

# Users per role
\App\Models\Role::withCount('users')->get()->pluck('users_count', 'name');

# Active vs inactive users
echo "Active Users: " . \App\Models\User::where('is_active', true)->count();
echo "Inactive Users: " . \App\Models\User::where('is_active', false)->count();
```

### List All Permissions by Module
```bash
php artisan tinker

$permissions = \App\Models\Permission::orderBy('module')->orderBy('name')->get();

foreach ($permissions as $p) {
    echo sprintf("[%s] %s - %s\n", $p->module, $p->name, $p->display_name);
}
```

---

## 🔄 Reset & Reseed

### Reset Permissions
```bash
# Clear all role-permission assignments
php artisan tinker
\DB::table('role_has_permissions')->truncate();

# Reseed roles with permissions
php artisan db:seed --class=RoleSeeder
```

### Reset Everything
```bash
# WARNING: This will delete all data!

# Rollback migrations
php artisan migrate:rollback --step=4

# Run migrations again
php artisan migrate

# Reseed
php artisan db:seed --class=PermissionSeeder
php artisan db:seed --class=RoleSeeder
```

---

## 🐛 Debugging Commands

### Check for Issues
```bash
php artisan tinker

# Check if user has roles
$user = \App\Models\User::find(1);
$user->roles()->count()  // Should be > 0

# Check if role has permissions
$role = \App\Models\Role::where('name', 'admin')->first();
$role->permissions()->count()  // Should be > 0

# Check pivot table data
\DB::table('user_has_roles')->count()
\DB::table('role_has_permissions')->count()

# Check for orphaned records
\App\Models\User::doesntHave('roles')->count()  // Should be 0 for active users
```

### View Logs
```bash
# View Laravel logs
tail -f storage/logs/laravel.log

# Search for permission errors
grep "permission" storage/logs/laravel.log
grep "403" storage/logs/laravel.log
grep "Unauthorized" storage/logs/laravel.log
```

---

## 🔧 Maintenance Commands

### Clean Up
```bash
php artisan tinker

# Remove users without roles
\App\Models\User::doesntHave('roles')->delete();

# Remove inactive roles
\App\Models\Role::where('is_active', false)
    ->where('is_system', false)
    ->delete();
```

### Backup
```bash
# Backup database
php artisan db:backup

# Or manually
mysqldump -u username -p database_name > backup.sql
```

---

## 📝 Quick Snippets

### Create Custom Role
```php
$role = \App\Models\Role::create([
    'name' => 'warehouse',
    'description' => 'Warehouse staff with stock management access',
    'is_active' => true,
    'is_system' => false
]);

$role->givePermissionTo([
    'dashboard.view',
    'stock.view',
    'stock.create',
    'stock.edit',
    'products.view'
]);
```

### Bulk Assign Roles
```php
$users = \App\Models\User::where('email', 'like', '%@staff.com')->get();
foreach ($users as $user) {
    $user->assignRole('staff');
}
```

### Check Permission in Code
```php
// In Controller
if (!Auth::user()->hasPermission('orders.create')) {
    abort(403, 'Unauthorized');
}

// In Blade
@if(Auth::user()->hasPermission('orders.create'))
    <button>Create Order</button>
@endif

// In Inertia/React
const canCreate = auth.user?.roles?.[0]?.permissions?.includes('orders.create');
```

---

## 🎯 Common Tasks

### Task 1: Add New Permission
```bash
php artisan tinker

\App\Models\Permission::create([
    'name' => 'reports.advanced',
    'display_name' => 'View Advanced Reports',
    'description' => 'Can view advanced analytics reports',
    'module' => 'reports'
]);

# Assign to role
$role = \App\Models\Role::where('name', 'admin')->first();
$role->givePermissionTo('reports.advanced');
```

### Task 2: Create New Role
```bash
php artisan tinker

$role = \App\Models\Role::create([
    'name' => 'accountant',
    'description' => 'Accountant with financial access',
    'is_active' => true,
    'is_system' => false
]);

$role->syncPermissions([
    'dashboard.view',
    'orders.view',
    'reports.view',
    'reports.sales',
    'expenses.view'
]);
```

### Task 3: Migrate User to New Role
```bash
php artisan tinker

$user = \App\Models\User::where('email', 'john@example.com')->first();
$user->syncRoles(['admin']);  // Remove old, assign new
```

---

**Quick Reference Version:** 1.0  
**Last Updated:** November 21, 2025
