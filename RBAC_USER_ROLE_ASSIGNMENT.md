# User Role Assignment Guide

**How to assign roles to existing users**

---

## 📋 Overview

After running migrations and seeders for permissions and roles, you need to assign roles to your existing users. There are multiple ways to do this.

---

## 🎯 Available Methods

### Method 1: Automatic Seeder ⚡
**Best for:** Quick setup with predictable patterns

```bash
php artisan db:seed --class=AssignUserRolesSeeder
```

**How it works:**
- Automatically assigns roles based on email patterns
- First user (ID=1) gets 'owner' role
- Emails containing 'owner@', 'ceo@' → owner
- Emails containing 'admin@', 'manager@' → admin
- All others → staff
- Skips users who already have roles

**Customize:**
Edit `database/seeders/AssignUserRolesSeeder.php` to modify the logic in `isOwner()` and `isAdmin()` methods.

---

### Method 2: Interactive Seeder 🎮
**Best for:** Manual control over each assignment

```bash
php artisan db:seed --class=InteractiveUserRoleSeeder
```

**How it works:**
- Shows each user without a role
- Suggests a role based on email pattern
- Lets you choose the role for each user
- Option to skip users
- Shows summary at the end

**Example output:**
```
Found 3 user(s) without roles.
Available roles:
  [1] owner - Full system access (77 permissions)
  [2] admin - All except user management (67 permissions)
  [3] staff - Limited access (13 permissions)

User: John Doe (john@example.com)
  Suggested role: staff
Select role for this user:
  [0] Skip
  [1] owner
  [2] admin
  [3] staff
 > 3
  ✓ Assigned 'staff' role
```

---

### Method 3: Manual via Tinker 🔧
**Best for:** One-off assignments or specific cases

```bash
php artisan tinker

# Assign single role
$user = \App\Models\User::find(1);
$user->assignRole('owner');

# Assign to multiple users
$users = \App\Models\User::whereIn('id', [1, 2, 3])->get();
foreach ($users as $user) {
    $user->assignRole('admin');
}

# Assign by email pattern
$staffUsers = \App\Models\User::where('email', 'like', '%@staff.com')->get();
foreach ($staffUsers as $user) {
    $user->assignRole('staff');
}
```

---

### Method 4: Bulk Assignment Script 📝
**Best for:** Large number of users with CSV or specific rules

Create a custom seeder or script:

```php
<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class BulkUserRoleSeeder extends Seeder
{
    public function run(): void
    {
        // Example: Assign based on user IDs
        $assignments = [
            'owner' => [1],
            'admin' => [2, 3, 4],
            'staff' => [5, 6, 7, 8, 9, 10]
        ];

        foreach ($assignments as $role => $userIds) {
            $users = User::whereIn('id', $userIds)->get();
            foreach ($users as $user) {
                $user->assignRole($role);
            }
        }
    }
}
```

---

## 🔍 Verification

### Check User Roles
```bash
php artisan tinker

# Check specific user
$user = \App\Models\User::find(1);
$user->roles()->pluck('name')

# Check all users
\App\Models\User::with('roles')->get()->map(function($u) {
    return [
        'name' => $u->name,
        'email' => $u->email,
        'roles' => $u->roles->pluck('name')->toArray()
    ];
})

# Count users per role
\App\Models\Role::withCount('users')->get()->pluck('users_count', 'name')

# Find users without roles
\App\Models\User::doesntHave('roles')->get()
```

---

## 🔄 Re-assignment

### Change User Role
```bash
php artisan tinker

$user = \App\Models\User::find(1);

# Remove all roles and assign new one
$user->syncRoles(['admin']);

# Add additional role (multiple roles)
$user->assignRole('staff');

# Remove specific role
$user->removeRole('staff');
```

---

## 📊 Summary Commands

### Show Current Assignments
```bash
php artisan tinker

echo "=== User Role Summary ===\n";
$roles = \App\Models\Role::withCount('users')->get();
foreach ($roles as $role) {
    echo sprintf("%s: %d users\n", ucfirst($role->name), $role->users_count);
}
$noRole = \App\Models\User::doesntHave('roles')->count();
if ($noRole > 0) {
    echo "No Role: {$noRole} users\n";
}
```

---

## ⚠️ Important Notes

### Before Running Seeders
1. ✅ Make sure migrations are run
2. ✅ Make sure PermissionSeeder is run
3. ✅ Make sure RoleSeeder is run
4. ✅ Backup your database (optional but recommended)

### Seeder Behavior
- **AssignUserRolesSeeder:** Skips users who already have roles
- **InteractiveUserRoleSeeder:** Skips users who already have roles
- **Both:** Safe to run multiple times

### Multiple Roles
- Users can have multiple roles
- Use `assignRole()` to add roles
- Use `syncRoles()` to replace all roles
- Permissions are combined from all roles

---

## 🎯 Recommended Workflow

### For New Installation
```bash
# 1. Run migrations
php artisan migrate

# 2. Seed permissions
php artisan db:seed --class=PermissionSeeder

# 3. Seed roles
php artisan db:seed --class=RoleSeeder

# 4. Assign roles (choose one)
php artisan db:seed --class=InteractiveUserRoleSeeder  # Recommended
# OR
php artisan db:seed --class=AssignUserRolesSeeder
```

### For Existing Installation
```bash
# 1. Check current state
php artisan tinker
\App\Models\User::doesntHave('roles')->count()

# 2. If users need roles, run seeder
php artisan db:seed --class=InteractiveUserRoleSeeder

# 3. Verify
\App\Models\User::doesntHave('roles')->count()  # Should be 0
```

---

## 🐛 Troubleshooting

### Issue: "No users found"
**Solution:** Create users first before assigning roles

### Issue: "Roles not found"
**Solution:** Run RoleSeeder first
```bash
php artisan db:seed --class=RoleSeeder
```

### Issue: "User already has role"
**Solution:** This is normal. Seeders skip users with existing roles. To reassign:
```bash
php artisan tinker
$user = \App\Models\User::find(1);
$user->syncRoles(['admin']);  # Replace with new role
```

### Issue: "Permission denied"
**Solution:** Make sure user has been assigned a role with appropriate permissions

---

## 📝 Customization Examples

### Custom Assignment Logic
Edit `AssignUserRolesSeeder.php`:

```php
protected function isOwner(User $user): bool
{
    // Example 1: By specific email
    return $user->email === 'boss@company.com';
    
    // Example 2: By user ID
    return in_array($user->id, [1, 2]);
    
    // Example 3: By email domain
    return str_ends_with($user->email, '@executives.com');
}

protected function isAdmin(User $user): bool
{
    // Example: By department (if you have a department field)
    return in_array($user->department, ['IT', 'Management']);
}
```

---

## ✅ Checklist

After assigning roles, verify:

- [ ] All active users have at least one role
- [ ] Owner role assigned to appropriate user(s)
- [ ] Admin roles assigned correctly
- [ ] Staff roles assigned to regular users
- [ ] No users without roles (unless intentional)
- [ ] Test login with different roles
- [ ] Verify permissions work correctly

---

**Last Updated:** November 21, 2025  
**Version:** 1.0
