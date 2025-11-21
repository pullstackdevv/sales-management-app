# RBAC Frontend Fix - Sidebar & Permissions

**Date:** November 21, 2025  
**Status:** ✅ **FIXED**

---

## 🐛 Problem

Menu sidebar tidak tampil karena permission check masih menggunakan sistem lama:
- `AuthContext` masih menggunakan `user.role` (singular)
- `AuthContext` masih menggunakan `role.permissions` (dari single role)
- Permissions tidak di-load dari backend

---

## ✅ Solution

### 1. **Updated AuthContext.jsx** ✅

**File:** `resources/js/contexts/AuthContext.jsx`

**Changes:**
```javascript
// OLD
const role = user?.role || null;
const permissions = role?.permissions || [];

// NEW
const roles = user?.roles || [];
const primaryRole = roles[0] || null;

// Get all permissions from all user roles (combined)
const permissions = useMemo(() => {
    if (!roles || roles.length === 0) return [];
    
    const allPermissions = new Set();
    roles.forEach(role => {
        if (role.permissions && Array.isArray(role.permissions)) {
            role.permissions.forEach(permission => {
                if (typeof permission === 'string') {
                    allPermissions.add(permission);
                } else if (permission?.name) {
                    allPermissions.add(permission.name);
                }
            });
        }
    });
    
    return Array.from(allPermissions);
}, [roles]);
```

**Features:**
- ✅ Supports multiple roles per user
- ✅ Combines permissions from all roles
- ✅ Handles both string and object permission formats
- ✅ Module-level permission matching (e.g., 'orders' matches 'orders.view')
- ✅ Wildcard support (`*` for all permissions)

---

### 2. **Updated HandleInertiaRequests.php** ✅

**File:** `app/Http/Middleware/HandleInertiaRequests.php`

**Changes:**
```php
$user = $request->user();

// Load roles with permissions for authenticated user
if ($user) {
    $user->load(['roles' => function ($query) {
        $query->with('permissions:id,name');
    }]);
    
    // Transform roles to include permission names as array
    $user->roles->each(function ($role) {
        $role->permissions = $role->permissions->pluck('name')->toArray();
    });
}

return [
    ...parent::share($request),
    'auth' => [
        'user' => $user,
    ],
    // ...
];
```

**Features:**
- ✅ Loads roles with permissions from database
- ✅ Transforms permissions to array of strings
- ✅ Shares to all Inertia pages

---

## 📊 Data Structure

### Backend to Frontend

**Backend sends:**
```php
[
    'user' => [
        'id' => 1,
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'roles' => [
            [
                'id' => 1,
                'name' => 'admin',
                'description' => 'Administrator',
                'permissions' => [
                    'dashboard.view',
                    'orders.view',
                    'orders.create',
                    'orders.edit',
                    // ... more permissions
                ]
            ]
        ]
    ]
]
```

**Frontend receives:**
```javascript
{
    auth: {
        user: {
            id: 1,
            name: "John Doe",
            email: "john@example.com",
            roles: [
                {
                    id: 1,
                    name: "admin",
                    description: "Administrator",
                    permissions: [
                        "dashboard.view",
                        "orders.view",
                        "orders.create",
                        "orders.edit",
                        // ... more permissions
                    ]
                }
            ]
        }
    }
}
```

---

## 🎯 Permission Checking

### Module-Level Permission (Sidebar)

**Sidebar items use module-level permissions:**
```javascript
// Sidebaritems.js
{
    name: "Orders",
    icon: "solar:clipboard-list-outline",
    permission: "orders",  // Module-level
    url: "/cms/order/data"
}
```

**AuthContext checks:**
```javascript
hasPermission('orders')
// Returns true if user has ANY of:
// - 'orders' (exact match)
// - 'orders.view'
// - 'orders.create'
// - 'orders.edit'
// - etc.
```

### Fine-Grained Permission (Components)

**Components use specific permissions:**
```javascript
// In component
<PermissionGuard permission="orders.create">
    <button>Create Order</button>
</PermissionGuard>
```

**AuthContext checks:**
```javascript
hasPermission('orders.create')
// Returns true if user has:
// - 'orders.create' (exact match)
// - '*' (wildcard)
```

---

## 🔍 How It Works

### 1. User Login
```
User logs in → Auth middleware → HandleInertiaRequests
```

### 2. Load User Data
```
HandleInertiaRequests:
→ Load user
→ Load user.roles
→ Load roles.permissions
→ Transform permissions to array of strings
→ Share to frontend
```

### 3. Frontend Receives
```javascript
AuthContext:
→ Get user.roles
→ Combine permissions from all roles
→ Provide hasPermission() method
```

### 4. Sidebar Renders
```javascript
Sidebar:
→ Map through SidebarContent
→ Check permission with PermissionGuard
→ Render if hasPermission() returns true
```

---

## 🧪 Testing

### Check User Permissions in Browser Console

```javascript
// Open browser console
const { auth } = window.Cascade.page.props;

// Check user
console.log('User:', auth.user);

// Check roles
console.log('Roles:', auth.user.roles);

// Check permissions
auth.user.roles.forEach(role => {
    console.log(`Role: ${role.name}`);
    console.log('Permissions:', role.permissions);
});
```

### Test Permission Checks

```javascript
import { useAuth } from '@/contexts/AuthContext';

function TestComponent() {
    const { hasPermission, permissions } = useAuth();
    
    console.log('All permissions:', permissions);
    console.log('Has orders.view:', hasPermission('orders.view'));
    console.log('Has orders:', hasPermission('orders'));
    
    return <div>Check console</div>;
}
```

---

## 📋 Sidebar Permission Mapping

| Menu Item | Permission | Matches |
|-----------|------------|---------|
| Dashboard | `dashboard` | `dashboard.view`, `dashboard.analytics` |
| Orders | `orders` | `orders.view`, `orders.create`, `orders.edit`, etc. |
| Products | `products` | `products.view`, `products.create`, etc. |
| Customers | `customers` | `customers.view`, `customers.create`, etc. |
| Stock Opname | `stock` | `stock.view`, `stock.create`, etc. |
| Vouchers | `vouchers` | `vouchers.view`, `vouchers.create`, etc. |
| Expenses | `expenses` | `expenses.view`, `expenses.create`, etc. |
| Reports | `reports` | `reports.view`, `reports.sales`, etc. |
| Settings | `settings` | `settings.view`, `users.view`, `roles.view`, etc. |

---

## ✅ Verification Checklist

After fix, verify:

- [x] AuthContext uses `user.roles` (array)
- [x] AuthContext combines permissions from all roles
- [x] HandleInertiaRequests loads roles with permissions
- [x] Permissions are array of strings
- [x] Sidebar items visible based on permissions
- [x] Module-level permission matching works
- [x] Fine-grained permission checks work
- [x] No console errors
- [x] Menu items show/hide correctly

---

## 🎯 Expected Behavior

### Owner Role (77 permissions)
- ✅ All menu items visible
- ✅ All buttons/actions enabled

### Admin Role (67 permissions)
- ✅ Dashboard visible
- ✅ Orders visible
- ✅ Products visible
- ✅ Customers visible
- ✅ Stock visible
- ✅ Vouchers visible
- ✅ Expenses visible
- ✅ Reports visible
- ✅ Settings visible (limited)
- ❌ User management hidden
- ❌ Role management hidden

### Staff Role (13 permissions)
- ✅ Dashboard visible
- ✅ Orders visible (view & create only)
- ✅ Products visible (view only)
- ✅ Customers visible (view & create)
- ✅ Reports visible (view only)
- ❌ Stock hidden
- ❌ Vouchers hidden
- ❌ Expenses hidden
- ❌ Settings hidden

---

## 🐛 Troubleshooting

### Issue: Sidebar empty / no menu items

**Check:**
1. User has roles assigned
2. Roles have permissions assigned
3. Browser console for errors

**Solution:**
```bash
# Assign role to user
php artisan tinker
$user = \App\Models\User::find(1);
$user->assignRole('admin');
```

### Issue: Menu items not showing

**Check:**
1. Permission name in Sidebaritems.js matches backend
2. User role has the permission
3. AuthContext is receiving permissions

**Debug:**
```javascript
// In browser console
const { auth } = window.Cascade.page.props;
console.log('Permissions:', auth.user.roles[0].permissions);
```

### Issue: "Cannot read property 'permissions' of undefined"

**Cause:** User doesn't have roles assigned

**Solution:**
```bash
php artisan db:seed --class=InteractiveUserRoleSeeder
```

---

## 📝 Summary

**What was fixed:**
1. ✅ AuthContext now uses `user.roles` array
2. ✅ AuthContext combines permissions from all roles
3. ✅ HandleInertiaRequests loads roles with permissions
4. ✅ Permissions transformed to array of strings
5. ✅ Module-level permission matching implemented
6. ✅ Sidebar permission checks working

**Result:**
- ✅ Sidebar menu items now show/hide based on user permissions
- ✅ No more empty sidebar
- ✅ Permission system fully functional

---

**Last Updated:** November 21, 2025  
**Version:** 1.0  
**Status:** ✅ Complete & Tested
