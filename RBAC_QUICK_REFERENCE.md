# RBAC Quick Reference Card

## 🎯 Quick Facts

| Aspect | Details |
|--------|---------|
| **Type** | Coarse-grained + Fine-grained RBAC |
| **Permission Model** | Role-based (not individual user permissions) |
| **Wildcard Support** | Yes (`*`, `module.*`) |
| **Default Roles** | Owner, Admin, Staff |
| **System Roles** | Owner, Admin, Staff (cannot be deleted) |
| **Protection Method** | Middleware + Model methods |
| **Database** | roles table + role_id on users |

---

## 🔐 Permission Levels

### Coarse-Grained (Middleware)
```
dashboard, orders, products, customers, stock, 
vouchers, expenses, reports, settings
```

### Fine-Grained (Components)
```
module.view, module.create, module.edit, module.delete
module.print, module.invoice, module.shipping-label
module.variants.*, module.addresses.*
```

---

## 👥 Default Roles Quick View

```
┌─────────────────────────────────────────────────────────┐
│ OWNER                                                   │
├─────────────────────────────────────────────────────────┤
│ Permissions: * (all)                                    │
│ System Role: Yes (protected)                            │
│ Can Delete: No                                          │
│ Can Modify: No                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ADMIN                                                   │
├─────────────────────────────────────────────────────────┤
│ Permissions: All modules except user/role management   │
│ System Role: Yes (protected)                            │
│ Can Delete: No                                          │
│ Can Modify: No                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ STAFF                                                   │
├─────────────────────────────────────────────────────────┤
│ Permissions: dashboard, orders, products, customers,   │
│             reports                                     │
│ System Role: Yes (protected)                            │
│ Can Delete: No                                          │
│ Can Modify: No                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Permission Check Methods

### User Model
```php
$user->hasPermission('orders.view')        // Check single permission
$user->getRolePermissions()                // Get all role permissions
$user->isOwner()                           // Check if owner
$user->isAdmin()                           // Check if admin
$user->isStaff()                           // Check if staff
$user->isWarehouse()                       // Check if warehouse
```

### Role Model
```php
$role->hasPermission('orders.view')        // Check single permission
$role->hasAnyPermission([...])             // Check any of permissions
$role->hasAllPermissions([...])            // Check all permissions
Role::getAllPermissions()                  // Get all available permissions
```

---

## 🛣️ Route Protection

### Web Routes (CMS)
```php
// Protected by EnsureModulePermission middleware
Route::middleware([..., EnsureModulePermission::class])
    ->prefix('cms')
    ->group(function () {
        Route::get('/orders', ...);        // Requires 'orders' permission
        Route::get('/products', ...);      // Requires 'products' permission
    });
```

### API Routes
```php
// Protected by Sanctum authentication
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('users', UserController::class);
    Route::apiResource('roles', RoleController::class);
});
```

---

## 📊 Path Mapping

```
URL Path                    → Permission Required
/cms/dashboard             → dashboard
/cms/order/*               → orders
/cms/product/*             → products
/cms/customer/*            → customers
/cms/stock-opname/*        → stock
/cms/voucher/*             → vouchers
/cms/expense/*             → expenses
/cms/report/*              → reports
/cms/settings/*            → settings
```

---

## 🎯 Common Tasks

### Check if User Can Access Feature
```javascript
// In React component
const canViewOrders = user.hasPermission('orders.view');
const canEditProducts = user.hasPermission('products.edit');
const canManageUsers = user.hasPermission('settings.users');

if (canViewOrders) {
    // Show orders
}
```

### Check Multiple Permissions
```javascript
// Check if user has any permission
const canManage = user.hasPermission('orders.create') || 
                  user.hasPermission('orders.edit');

// Check with wildcard
const canDoAnything = user.hasPermission('orders.*');
```

### Conditional Rendering
```jsx
{user.hasPermission('products.edit') && (
    <button onClick={handleEdit}>Edit Product</button>
)}

{user.hasPermission('products.delete') && (
    <button onClick={handleDelete} className="text-red-600">
        Delete Product
    </button>
)}
```

---

## 🔧 API Endpoints Summary

### Roles
```
GET    /api/roles                    List all roles
POST   /api/roles                    Create role
GET    /api/roles/{role}             Get role details
PUT    /api/roles/{roleName}         Update role
DELETE /api/roles/{role}             Delete role
PATCH  /api/roles/{role}/status      Toggle status
GET    /api/roles/permissions        Get all permissions
```

### Users
```
GET    /api/users                    List all users
POST   /api/users                    Create user
GET    /api/users/{id}               Get user details
PUT    /api/users/{id}               Update user
DELETE /api/users/{id}               Delete user
GET    /api/users/role-permissions   Get roles with permissions
```

---

## 📋 Permission List (All Available)

### Dashboard
- `dashboard.view`

### Orders (7 permissions)
- `orders.view`, `orders.create`, `orders.edit`, `orders.delete`
- `orders.print`, `orders.invoice`, `orders.shipping-label`

### Products (8 permissions)
- `products.view`, `products.create`, `products.edit`, `products.delete`
- `products.variants.view`, `products.variants.create`, `products.variants.edit`, `products.variants.delete`

### Customers (8 permissions)
- `customers.view`, `customers.create`, `customers.edit`, `customers.delete`
- `customers.addresses.view`, `customers.addresses.create`, `customers.addresses.edit`, `customers.addresses.delete`

### Stock (12 permissions)
- `stock.view`, `stock.create`, `stock.edit`, `stock.delete`
- `stock-movements.view`, `stock-movements.create`, `stock-movements.edit`, `stock-movements.delete`
- `stock-opnames.view`, `stock-opnames.create`, `stock-opnames.edit`, `stock-opnames.delete`

### Vouchers (4 permissions)
- `vouchers.view`, `vouchers.create`, `vouchers.edit`, `vouchers.delete`

### Expenses (4 permissions)
- `expenses.view`, `expenses.create`, `expenses.edit`, `expenses.delete`

### Reports (7 permissions)
- `reports.view`, `reports.sales`, `reports.stock`, `reports.user-performance`, `reports.payments`
- `reports.export`, `reports.analyzer`

### Settings (13 permissions)
- `settings.general`, `settings.order`, `settings.product`, `settings.customer`
- `settings.payment`, `settings.courier`, `settings.courier-rates`, `settings.origin`
- `settings.template`, `settings.dashboard`, `settings.api`
- `settings.users`, `settings.roles`

**Total: 63 fine-grained permissions**

---

## 🚨 Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| 403 Forbidden | User lacks permission | Check role permissions in Settings |
| User can't login | User is inactive | Set `is_active = true` in users table |
| Permission not working | Role is inactive | Set `is_active = true` in roles table |
| Can't delete role | Role is system role | System roles cannot be deleted |
| Can't delete role | Role has users | Remove all users from role first |

---

## 🔍 Debug Checklist

When permission not working:
- [ ] Is user active? (`users.is_active = true`)
- [ ] Does user have role? (`users.role_id` is not null)
- [ ] Is role active? (`roles.is_active = true`)
- [ ] Does role have permission? (Check `roles.permissions` JSON)
- [ ] Is permission name correct? (Check spelling)
- [ ] Is wildcard pattern correct? (e.g., `orders.*`)

---

## 📱 Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| RoleSettings | `/Settings/RoleSettings.jsx` | Manage roles & permissions |
| UserSettings | `/Settings/UserSettings.jsx` | Manage users & role assignment |
| Settings Index | `/Settings/index.jsx` | Settings navigation |

---

## 🔐 Security Highlights

✅ Passwords hashed
✅ Soft deletes for audit trail
✅ System roles protected
✅ Middleware protection on routes
✅ Foreign key constraints
✅ Inactive users/roles blocked
✅ Role-based inheritance (not individual permissions)
✅ Permission checks on backend + frontend

---

## 📞 Quick Links

- **Role Model:** `app/Models/Role.php`
- **User Model:** `app/Models/User.php`
- **Middleware:** `app/Http/Middleware/EnsureModulePermission.php`
- **RoleController:** `app/Http/Controllers/RoleController.php`
- **UserController:** `app/Http/Controllers/UserController.php`
- **RoleSettings UI:** `resources/js/Pages/Settings/RoleSettings.jsx`
- **UserSettings UI:** `resources/js/Pages/Settings/UserSettings.jsx`
- **Full Guide:** `RBAC_GUIDE.md`

---

## 🎓 Learning Tips

1. **Start with models** - Understand `hasPermission()` logic
2. **Learn the middleware** - See how routes are protected
3. **Explore the UI** - Check RoleSettings and UserSettings
4. **Test it** - Create a new role and assign to user
5. **Debug** - Use the debug checklist when something doesn't work

---

**Last Updated:** November 21, 2025
**Version:** 1.0
**Status:** Production Ready ✅
