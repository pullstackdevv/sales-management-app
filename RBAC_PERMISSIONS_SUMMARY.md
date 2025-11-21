# RBAC Permissions Summary

**Last Updated:** November 21, 2025

---

## 📊 Overview

- **Total Permissions:** 77
- **Total Modules:** 10
- **Total Roles:** 3 (Owner, Admin, Staff)

---

## 👥 Default Roles & Permissions

### 1. **Owner** (77 permissions - ALL)
**Description:** Akses penuh ke semua fitur sistem

**Permissions:** `*` (Wildcard - All permissions)

**Access Level:** Full access to everything including user and role management

---

### 2. **Admin** (67 permissions)
**Description:** Akses ke semua fitur kecuali management user dan role

**Modules with Full Access:**
- ✅ Dashboard (view, analytics)
- ✅ Orders (view, create, edit, delete, update_status, print, export)
- ✅ Products (view, create, edit, delete, import, export, toggle_status, toggle_storefront)
- ✅ Product Categories (view, create, edit, delete)
- ✅ Customers (view, create, edit, delete, toggle_status, view_orders)
- ✅ Stock Opname (view, create, edit, delete, approve)
- ✅ Vouchers (view, create, edit, delete, toggle_status)
- ✅ Promotions (view, create, edit, delete, toggle_status, toggle_storefront)
- ✅ Expenses (view, create, edit, delete)
- ✅ Reports (view, sales, products, customers, stock, export)

**Settings Access (Limited):**
- ✅ General Settings (view, edit)
- ✅ Payment Banks (view, create, edit, delete)
- ✅ Couriers (view, create, edit, delete)
- ✅ Sales Channels (view, create, edit, delete)
- ❌ **NO** User Management
- ❌ **NO** Role Management

---

### 3. **Staff** (13 permissions)
**Description:** Akses ke orders, products, dan customers (view & create only)

**Permissions:**
- ✅ Dashboard (view only)
- ✅ Orders (view, create, print) - **NO edit/delete**
- ✅ Products (view only) - **NO create/edit/delete**
- ✅ Product Categories (view only)
- ✅ Customers (view, create, view_orders) - **NO edit/delete**
- ✅ Reports (view, sales, products, customers) - **NO export**
- ❌ **NO** Stock Opname
- ❌ **NO** Vouchers
- ❌ **NO** Promotions
- ❌ **NO** Expenses
- ❌ **NO** Settings

---

## 📋 Complete Permission List (77 Total)

### Dashboard (2)
- `dashboard.view`
- `dashboard.analytics`

### Orders (9)
- `orders.view`
- `orders.create`
- `orders.edit`
- `orders.delete`
- `orders.update_status`
- `orders.print`
- `orders.export`

### Products (12)
- `products.view`
- `products.create`
- `products.edit`
- `products.delete`
- `products.import`
- `products.export`
- `products.toggle_status`
- `products.toggle_storefront`
- `product_categories.view`
- `product_categories.create`
- `product_categories.edit`
- `product_categories.delete`

### Customers (6)
- `customers.view`
- `customers.create`
- `customers.edit`
- `customers.delete`
- `customers.toggle_status`
- `customers.view_orders`

### Stock Opname (5)
- `stock.view`
- `stock.create`
- `stock.edit`
- `stock.delete`
- `stock.approve`

### Vouchers (5)
- `vouchers.view`
- `vouchers.create`
- `vouchers.edit`
- `vouchers.delete`
- `vouchers.toggle_status`

### Promotions (6)
- `promotions.view`
- `promotions.create`
- `promotions.edit`
- `promotions.delete`
- `promotions.toggle_status`
- `promotions.toggle_storefront`

### Expenses (4)
- `expenses.view`
- `expenses.create`
- `expenses.edit`
- `expenses.delete`

### Reports (6)
- `reports.view`
- `reports.sales`
- `reports.products`
- `reports.customers`
- `reports.stock`
- `reports.export`

### Settings (22)
#### General
- `settings.view`
- `settings.edit`

#### Users
- `users.view`
- `users.create`
- `users.edit`
- `users.delete`
- `users.toggle_status`

#### Roles
- `roles.view`
- `roles.create`
- `roles.edit`
- `roles.delete`
- `roles.assign_permissions`

#### Payment Banks
- `payment_banks.view`
- `payment_banks.create`
- `payment_banks.edit`
- `payment_banks.delete`

#### Couriers
- `couriers.view`
- `couriers.create`
- `couriers.edit`
- `couriers.delete`

#### Sales Channels
- `sales_channels.view`
- `sales_channels.create`
- `sales_channels.edit`
- `sales_channels.delete`

---

## 🔄 How to Use

### Check User Permission
```php
// In Controller
if (!$user->hasPermission('orders.create')) {
    abort(403, 'Unauthorized');
}

// In Blade/Inertia
@if($user->hasPermission('products.edit'))
    <button>Edit Product</button>
@endif
```

### Check Role
```php
if ($user->hasRole('admin')) {
    // Admin-specific logic
}
```

### Assign Role to User
```php
$user->assignRole('staff');
```

### Assign Permission to Role
```php
$role = Role::find(1);
$role->givePermissionTo('orders.create');
```

---

## 📁 Related Files

- **Seeder:** `database/seeders/PermissionSeeder.php`
- **Seeder:** `database/seeders/RoleSeeder.php`
- **Model:** `app/Models/Permission.php`
- **Model:** `app/Models/Role.php`
- **Model:** `app/Models/User.php`
- **Trait:** `app/Traits/HasRoles.php`

---

## ✅ Status

**All permissions and roles have been seeded successfully!**

Next steps:
1. ✅ Permissions created (77 total)
2. ✅ Roles created with permissions assigned
3. ⏳ Implement permission checks in controllers
4. ⏳ Update frontend to show/hide based on permissions

---

**Generated:** November 21, 2025
