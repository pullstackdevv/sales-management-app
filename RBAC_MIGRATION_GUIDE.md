# RBAC Migration Guide - JSON to Pivot Tables

**Migration Date:** November 21, 2025  
**From:** JSON-based RBAC (users.role_id + roles.permissions)  
**To:** Modern RBAC with Pivot Tables (many-to-many relationships)

---

## 📋 Overview

Migrasi ini mengubah sistem RBAC dari:
- **Old System:** Single role per user dengan permissions dalam JSON
- **New System:** Multiple roles per user dengan permissions dalam pivot tables

### Benefits
✅ **Scalable** - Support multiple roles per user  
✅ **Flexible** - Easy to add/remove permissions  
✅ **Performant** - Indexed pivot tables vs JSON parsing  
✅ **Standard** - Follows Laravel best practices  
✅ **Maintainable** - Clean code structure  

---

## 🗄️ Database Changes

### New Tables

#### 1. `permissions`
```sql
CREATE TABLE permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) UNIQUE,           -- e.g., 'orders.view'
    display_name VARCHAR(255),          -- e.g., 'View Orders'
    description TEXT,
    module VARCHAR(255),                -- e.g., 'orders'
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    INDEX(module)
);
```

#### 2. `role_has_permissions`
```sql
CREATE TABLE role_has_permissions (
    role_id BIGINT,
    permission_id BIGINT,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);
```

#### 3. `user_has_roles`
```sql
CREATE TABLE user_has_roles (
    user_id BIGINT,
    role_id BIGINT,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
```

### Removed Columns
- `users.role_id` (foreign key)
- `roles.permissions` (JSON column)

---

## 📁 New Files Created

### 1. Migrations
```
database/migrations/
├── 2025_11_21_000001_create_permissions_table.php
├── 2025_11_21_000002_create_role_has_permissions_table.php
├── 2025_11_21_000003_create_user_has_roles_table.php
└── 2025_11_21_000004_remove_old_rbac_columns.php
```

### 2. Models
```
app/Models/
└── Permission.php (NEW)
```

### 3. Traits
```
app/Traits/
└── HasRoles.php (NEW)
```

### 4. Seeders
```
database/seeders/
└── MigrateRbacDataSeeder.php (NEW)
```

---

## 🔄 Migration Steps

### Step 1: Run Migrations
```bash
# Create new tables
php artisan migrate

# This will create:
# - permissions table
# - role_has_permissions pivot table
# - user_has_roles pivot table
# - Remove old columns (role_id, permissions)
```

### Step 2: Migrate Data
```bash
# Run data migration seeder
php artisan db:seed --class=MigrateRbacDataSeeder

# This will:
# 1. Extract all permissions from old JSON data
# 2. Create permission records
# 3. Migrate user-role relationships to pivot table
# 4. Assign permissions to roles via pivot table
```

### Step 3: Verify Migration
```bash
# Check permissions table
php artisan tinker
>>> \App\Models\Permission::count()
>>> \App\Models\Permission::all()->pluck('name')

# Check role permissions
>>> $role = \App\Models\Role::first()
>>> $role->getPermissionNames()

# Check user roles
>>> $user = \App\Models\User::first()
>>> $user->roles->pluck('name')
>>> $user->getPermissionNames()
```

---

## 💻 Code Changes

### Model Updates

#### Role Model (Before)
```php
class Role extends Model
{
    protected $fillable = ['name', 'description', 'permissions', 'is_active'];
    protected $casts = ['permissions' => 'array'];
    
    public function users() {
        return $this->hasMany(User::class, 'role_id');
    }
    
    public function hasPermission(string $permission): bool {
        $permissions = $this->permissions ?? [];
        return in_array($permission, $permissions);
    }
}
```

#### Role Model (After)
```php
class Role extends Model
{
    protected $fillable = ['name', 'description', 'is_active'];
    
    public function users(): BelongsToMany {
        return $this->belongsToMany(User::class, 'user_has_roles');
    }
    
    public function permissions(): BelongsToMany {
        return $this->belongsToMany(Permission::class, 'role_has_permissions');
    }
    
    public function hasPermission(string $permission): bool {
        $permissions = $this->permissions()->pluck('name');
        return $permissions->contains($permission);
    }
    
    // New helper methods
    public function givePermissionTo($permissions): self
    public function revokePermissionTo($permissions): self
    public function syncPermissions(array $permissions): self
    public function getPermissionNames(): array
}
```

#### User Model (Before)
```php
class User extends Authenticatable
{
    protected $fillable = ['name', 'email', 'password', 'role_id'];
    
    public function role() {
        return $this->belongsTo(Role::class);
    }
    
    public function hasPermission(string $permission): bool {
        return $this->role?->hasPermission($permission) ?? false;
    }
}
```

#### User Model (After)
```php
class User extends Authenticatable
{
    use HasRoles; // NEW TRAIT
    
    protected $fillable = ['name', 'email', 'password'];
    
    // Relationships now in HasRoles trait
    // public function roles(): BelongsToMany
    
    // All permission methods now in HasRoles trait:
    // - hasRole($roles): bool
    // - hasAnyRole(array $roles): bool
    // - hasAllRoles(array $roles): bool
    // - assignRole($roles): self
    // - removeRole($roles): self
    // - syncRoles(array $roles): self
    // - hasPermission(string $permission): bool
    // - hasAnyPermission(array $permissions): bool
    // - hasAllPermissions(array $permissions): bool
    // - getAllPermissions(): Collection
    // - getPermissionNames(): array
}
```

### Controller Updates

#### RoleController
```php
// OLD: Direct JSON manipulation
$role->update(['permissions' => $validated['permissions']]);

// NEW: Use pivot table methods
$role->syncPermissions($validated['permissions']);

// OLD: Return JSON permissions
'permissions' => $role->permissions ?? []

// NEW: Get from pivot table
'permissions' => $role->getPermissionNames()
```

#### UserController
```php
// OLD: Single role via foreign key
$user->create(['role_id' => $roleId]);
$user->with('role');

// NEW: Multiple roles via pivot table
$user->create([...]); // No role_id
$user->assignRole($role);
$user->with('roles');

// OLD: Filter by role_id
->where('role_id', $roleId)

// NEW: Filter via pivot table
->whereHas('roles', function ($q) use ($roleId) {
    $q->where('roles.id', $roleId);
})
```

---

## 🎯 New API Methods

### User Methods (via HasRoles Trait)

```php
// Role Management
$user->assignRole('admin');
$user->assignRole(['admin', 'staff']);
$user->removeRole('staff');
$user->syncRoles(['admin']); // Replace all roles

// Role Checking
$user->hasRole('admin');                    // true/false
$user->hasAnyRole(['admin', 'staff']);      // true if has any
$user->hasAllRoles(['admin', 'staff']);     // true if has all

// Permission Checking
$user->hasPermission('orders.view');        // true/false
$user->hasAnyPermission(['orders.view', 'products.view']);
$user->hasAllPermissions(['orders.view', 'orders.create']);

// Get Data
$user->getAllPermissions();                 // Collection of Permission models
$user->getPermissionNames();                // Array of permission names
$user->roles;                               // Collection of Role models
```

### Role Methods

```php
// Permission Management
$role->givePermissionTo('orders.view');
$role->givePermissionTo(['orders.view', 'orders.create']);
$role->revokePermissionTo('orders.delete');
$role->syncPermissions(['orders.view', 'orders.create']); // Replace all

// Permission Checking
$role->hasPermission('orders.view');        // true/false
$role->hasAnyPermission(['orders.view', 'products.view']);
$role->hasAllPermissions(['orders.view', 'orders.create']);

// Get Data
$role->permissions;                         // Collection of Permission models
$role->getPermissionNames();                // Array of permission names
$role->users;                               // Collection of User models
```

### Permission Methods

```php
// Get Relationships
$permission->roles;                         // Roles that have this permission
$permission->users;                         // Users that have this permission (via roles)
```

---

## 🧪 Testing

### Test User Permissions
```php
$user = User::find(1);

// Check role
$user->hasRole('admin'); // true

// Check permissions
$user->hasPermission('orders.view'); // true
$user->hasPermission('orders.create'); // true

// Get all permissions
$user->getPermissionNames();
// ['dashboard.view', 'orders.view', 'orders.create', ...]
```

### Test Role Permissions
```php
$role = Role::where('name', 'admin')->first();

// Get permissions
$role->getPermissionNames();

// Check permission
$role->hasPermission('orders.view'); // true

// Add permission
$role->givePermissionTo('new.permission');

// Remove permission
$role->revokePermissionTo('old.permission');
```

### Test Permission Assignment
```php
// Create permission
$permission = Permission::create([
    'name' => 'reports.export',
    'display_name' => 'Export Reports',
    'module' => 'reports',
]);

// Assign to role
$role->givePermissionTo($permission);

// Check user has it
$user->hasPermission('reports.export'); // true (via role)
```

---

## 🔍 Troubleshooting

### Issue: User has no permissions after migration
```php
// Check if user has roles
$user->roles; // Should not be empty

// Check if roles have permissions
$user->roles->first()->permissions; // Should not be empty

// Re-run data migration
php artisan db:seed --class=MigrateRbacDataSeeder
```

### Issue: Permission check returns false
```php
// Debug permission check
$user = User::find(1);
$user->roles->pluck('name'); // Check roles
$user->getPermissionNames(); // Check permissions

// Check if permission exists
Permission::where('name', 'orders.view')->exists();

// Check role-permission pivot
DB::table('role_has_permissions')
    ->where('role_id', $roleId)
    ->get();
```

### Issue: Frontend shows no roles
```php
// Make sure to load roles relationship
User::with('roles')->find(1);

// In controller, use:
$user->load('roles');
// or
$users = User::with('roles')->get();
```

---

## 📊 Performance Comparison

### Old System (JSON)
```php
// Query: 1 (user with role)
$user = User::with('role')->find(1);

// Permission check: JSON parsing
$hasPermission = in_array('orders.view', $user->role->permissions ?? []);
```

### New System (Pivot Tables)
```php
// Query: 1 (user with roles and permissions)
$user = User::with('roles.permissions')->find(1);

// Permission check: Collection contains (faster)
$hasPermission = $user->hasPermission('orders.view');
```

**Benefits:**
- ✅ Indexed pivot tables (faster queries)
- ✅ No JSON parsing overhead
- ✅ Better query optimization
- ✅ Support for eager loading

---

## 🚀 Rollback Plan

If you need to rollback:

```bash
# 1. Rollback migrations (in reverse order)
php artisan migrate:rollback --step=4

# 2. This will:
#    - Restore users.role_id column
#    - Restore roles.permissions column
#    - Drop user_has_roles table
#    - Drop role_has_permissions table
#    - Drop permissions table

# 3. Restore old model code from git
git checkout HEAD~1 app/Models/Role.php
git checkout HEAD~1 app/Models/User.php

# 4. Remove new files
rm app/Models/Permission.php
rm app/Traits/HasRoles.php
rm database/seeders/MigrateRbacDataSeeder.php
```

---

## ✅ Migration Checklist

- [ ] Backup database before migration
- [ ] Run new migrations
- [ ] Run data migration seeder
- [ ] Verify permissions table populated
- [ ] Verify user_has_roles pivot table populated
- [ ] Verify role_has_permissions pivot table populated
- [ ] Test user permission checks
- [ ] Test role permission checks
- [ ] Test frontend role/user management
- [ ] Test API endpoints
- [ ] Update frontend if needed (should work automatically)
- [ ] Monitor logs for errors
- [ ] Update documentation

---

## 📚 Additional Resources

- Laravel Relationships: https://laravel.com/docs/12.x/eloquent-relationships
- Pivot Tables: https://laravel.com/docs/12.x/eloquent-relationships#many-to-many
- Spatie Permission Package (reference): https://spatie.be/docs/laravel-permission

---

**Status:** ✅ Migration Complete  
**Last Updated:** November 21, 2025  
**Version:** 2.0 (Pivot Tables)
