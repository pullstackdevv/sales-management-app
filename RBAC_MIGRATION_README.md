# RBAC Migration - Quick Start

## 🚀 Quick Migration Steps

### 1. Run Migrations
```bash
php artisan migrate
```

### 2. Migrate Data
```bash
php artisan db:seed --class=MigrateRbacDataSeeder
```

### 3. Verify
```bash
php artisan tinker
>>> $user = \App\Models\User::first()
>>> $user->roles->pluck('name')
>>> $user->getPermissionNames()
```

---

## 📋 What Changed?

### Database
- ✅ Added `permissions` table
- ✅ Added `role_has_permissions` pivot table
- ✅ Added `user_has_roles` pivot table
- ❌ Removed `users.role_id` column
- ❌ Removed `roles.permissions` JSON column

### Code
- ✅ New `Permission` model
- ✅ New `HasRoles` trait
- ✅ Updated `Role` model (pivot relationships)
- ✅ Updated `User` model (uses HasRoles trait)
- ✅ Updated `RoleController` (pivot table methods)
- ✅ Updated `UserController` (pivot table methods)

---

## 💻 New Usage

### User Methods
```php
// Assign roles
$user->assignRole('admin');
$user->syncRoles(['admin', 'staff']);

// Check roles
$user->hasRole('admin');
$user->hasAnyRole(['admin', 'staff']);

// Check permissions
$user->hasPermission('orders.view');
$user->getPermissionNames();
```

### Role Methods
```php
// Assign permissions
$role->givePermissionTo('orders.view');
$role->syncPermissions(['orders.view', 'orders.create']);

// Check permissions
$role->hasPermission('orders.view');
$role->getPermissionNames();
```

---

## 🔄 Migration Flow

```
OLD SYSTEM:
users.role_id → roles.id
roles.permissions (JSON) → ['orders.view', 'products.view']

NEW SYSTEM:
users ← user_has_roles → roles
roles ← role_has_permissions → permissions
```

---

## 📁 Files Created

```
database/migrations/
├── 2025_11_21_000001_create_permissions_table.php
├── 2025_11_21_000002_create_role_has_permissions_table.php
├── 2025_11_21_000003_create_user_has_roles_table.php
└── 2025_11_21_000004_remove_old_rbac_columns.php

app/Models/
└── Permission.php

app/Traits/
└── HasRoles.php

database/seeders/
└── MigrateRbacDataSeeder.php
```

---

## ✅ Verification Checklist

- [ ] Migrations ran successfully
- [ ] Data seeder completed
- [ ] Users have roles in pivot table
- [ ] Roles have permissions in pivot table
- [ ] Permission checks work: `$user->hasPermission('orders.view')`
- [ ] Frontend role/user management works
- [ ] API endpoints return correct data

---

## 🆘 Troubleshooting

### No permissions after migration?
```bash
php artisan db:seed --class=MigrateRbacDataSeeder
```

### User has no roles?
```php
$user->assignRole('admin');
```

### Permission check fails?
```php
// Debug
$user->roles; // Check roles
$user->getPermissionNames(); // Check permissions
```

---

## 📚 Full Documentation

See `RBAC_MIGRATION_GUIDE.md` for complete details.

---

**Status:** ✅ Ready to Migrate  
**Estimated Time:** 5 minutes  
**Rollback:** Supported via `migrate:rollback`
