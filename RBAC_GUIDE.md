# RBAC System - Complete Implementation Guide

## 📊 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER REQUEST                              │
│                   (e.g., GET /cms/orders)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              MIDDLEWARE: EnsureModulePermission                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. Extract path segment: 'orders' from '/cms/orders'   │   │
│  │ 2. Map to permission: 'orders' → 'orders'             │   │
│  │ 3. Check: $user->hasPermission('orders')              │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
            ✅ HAS PERMISSION    ❌ NO PERMISSION
                    │                 │
                    ▼                 ▼
            Continue to Route   Return 403 Forbidden
                                (Inertia Error Page)
```

---

## 🗄️ Database Schema

### Roles Table
```sql
CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL,           -- 'owner', 'admin', 'staff', 'warehouse'
    description VARCHAR(255),
    permissions JSON,                             -- Array of permission strings
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,              -- System roles cannot be deleted
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Users Table (Modified)
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    role_id BIGINT,                               -- Foreign key to roles table
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,                         -- Soft delete
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
);
```

### Relationship
```
User (many) ──→ (one) Role
```

---

## 🔐 Permission Hierarchy

### Level 1: Coarse-Grained (Module Level)
Used by middleware for route protection:
```
dashboard
orders
products
customers
stock
vouchers
expenses
reports
settings
```

### Level 2: Fine-Grained (Action Level)
Used for granular control in components:
```
orders.view
orders.create
orders.edit
orders.delete
orders.print
orders.invoice
orders.shipping-label

products.view
products.create
products.edit
products.delete
products.variants.*

customers.view
customers.create
customers.edit
customers.delete
customers.addresses.*

stock.*
stock-movements.*
stock-opnames.*

vouchers.*
expenses.*
reports.*
settings.*
```

### Wildcard Patterns
```
*                    → All permissions (Owner only)
module.*             → All actions in module
module.action        → Specific action
```

---

## 👥 Default Roles & Permissions

### Owner
- **Description:** Akses penuh ke semua fitur sistem
- **Permissions:** `['*']` (all permissions)
- **System Role:** Yes (cannot be deleted)
- **Features:** Full access to everything

### Admin
- **Description:** Akses ke semua fitur kecuali management user
- **Permissions:**
  ```javascript
  [
    'dashboard',
    'orders',
    'products',
    'customers',
    'stock',
    'vouchers',
    'promotions',
    'expenses',
    'reports',
    'settings'
  ]
  ```
- **System Role:** Yes (cannot be deleted)
- **Features:** All features except user/role management

### Staff
- **Description:** Akses ke orders, products, dan customers
- **Permissions:**
  ```javascript
  [
    'dashboard',
    'orders',
    'products',
    'customers',
    'reports'
  ]
  ```
- **System Role:** Yes (cannot be deleted)
- **Features:** Limited to core business operations

---

## 🔄 Permission Check Flow

### User Model: `hasPermission(string $permission): bool`

```
1. Is user inactive?
   └─ YES → return false
   
2. Is user owner?
   └─ YES → return true (all permissions)
   
3. Get role permissions
   └─ For each role permission:
      ├─ Is exact match? → return true
      ├─ Is wildcard '*'? → return true
      ├─ Is pattern match (e.g., 'orders.*')? → return true
      └─ Continue to next permission
      
4. No match found → return false
```

### Role Model: `hasPermission(string $permission): bool`

```
1. Is role inactive?
   └─ YES → return false
   
2. Check permissions array:
   ├─ Is exact match? → return true
   ├─ Is wildcard '*'? → return true
   ├─ Is pattern match (e.g., 'orders.*')? → return true
   └─ Continue to next permission
   
3. No match found → return false
```

---

## 🛣️ Route Protection

### Web Routes (CMS Area)
```php
Route::middleware([
    Authenticate::class,
    HandleInertiaRequests::class,
    EnsureModulePermission::class  // ← RBAC Protection
])
->prefix('cms')
->group(function () {
    Route::get('/dashboard', ...);
    Route::get('/order/data', ...);
    Route::get('/product/data', ...);
    // ... more routes
});
```

### API Routes
```php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index']);
    Route::apiResource('products', ProductController::class);
    Route::apiResource('users', UserController::class);
    // ... more routes
});
```

---

## 🎯 Path to Permission Mapping

| URL Path | Extracted | Mapped Permission | Required Permission |
|----------|-----------|-------------------|-------------------|
| `/cms/dashboard` | dashboard | dashboard | dashboard |
| `/cms/order/data` | order | orders | orders |
| `/cms/product/data` | product | products | products |
| `/cms/customer/data` | customer | customers | customers |
| `/cms/stock-opname/data` | stock-opname | stock | stock |
| `/cms/voucher/data` | voucher | vouchers | vouchers |
| `/cms/expense` | expense | expenses | expenses |
| `/cms/report/data` | report | reports | reports |
| `/cms/settings/user` | settings | settings | settings |

---

## 📋 API Endpoints

### Role Management
```
GET    /api/roles                          → List all roles
POST   /api/roles                          → Create role
GET    /api/roles/{role}                   → Get role details
PUT    /api/roles/{roleName}               → Update role
DELETE /api/roles/{role}                   → Delete role
PATCH  /api/roles/{role}/status            → Toggle role status
GET    /api/roles/permissions              → Get all available permissions
```

### User Management
```
GET    /api/users                          → List all users
POST   /api/users                          → Create user
GET    /api/users/{id}                     → Get user details
PUT    /api/users/{id}                     → Update user
DELETE /api/users/{id}                     → Delete user
GET    /api/users/role-permissions         → Get roles with permissions
```

---

## 🎨 Frontend Components

### RoleSettings.jsx
**Location:** `/resources/js/Pages/Settings/RoleSettings.jsx`

**Features:**
- Display all roles in table format
- Edit role permissions via modal
- Checkbox grid for permission selection
- Show first 3 permissions, "+N more" if more exist
- Error handling and loading states

**Key Functions:**
```javascript
fetchRoles()                    // GET /api/roles
updateRole()                    // PUT /api/roles/{roleName}
handlePermissionChange()        // Toggle permission checkbox
```

### UserSettings.jsx
**Location:** `/resources/js/Pages/Settings/UserSettings.jsx`

**Features:**
- Display all users in table format
- Create/Edit user modal
- Role dropdown with description display
- Show permissions for selected role
- Stats cards (total, active, inactive users)

**Key Functions:**
```javascript
fetchUsers()                    // GET /api/users
fetchRoles()                    // GET /api/roles
fetchRoleDescriptions()         // GET /api/users/role-permissions
createUser()                    // POST /api/users
updateUser()                    // PUT /api/users/{id}
deleteUser()                    // DELETE /api/users/{id}
```

### Settings Index
**Location:** `/resources/js/Pages/Settings/index.jsx`

**Features:**
- Tab-based navigation
- Routes to different settings components
- Menu items: General, Order, Product, Payment, Courier, Origin, User, Role Settings

---

## 🔍 How Permission Checking Works in Components

### Example 1: Checking if User Can View Orders
```javascript
// In component
const user = useAuth(); // Get authenticated user

if (user.hasPermission('orders.view')) {
    // Show orders
} else {
    // Show "Access Denied"
}
```

### Example 2: Checking if User Can Edit Products
```javascript
// In component
const canEdit = user.hasPermission('products.edit');

return (
    <button disabled={!canEdit}>
        Edit Product
    </button>
);
```

### Example 3: Using Wildcard Permissions
```javascript
// If user has 'orders.*' permission
user.hasPermission('orders.view')      // ✅ true
user.hasPermission('orders.create')    // ✅ true
user.hasPermission('orders.edit')      // ✅ true
user.hasPermission('products.view')    // ❌ false
```

---

## 🚀 Common Use Cases

### Creating a New Role
1. Admin navigates to Settings → Role Settings
2. Clicks "Edit" on a role
3. Modal opens with permission checkboxes
4. Admin selects desired permissions
5. Clicks "Simpan"
6. Frontend sends `PUT /api/roles/{roleName}` with updated permissions
7. Backend validates and updates role
8. Frontend refetches roles

### Assigning Role to User
1. Admin navigates to Settings → User
2. Clicks "Tambah User" or "Edit" on existing user
3. Modal opens with form
4. Admin selects role from dropdown
5. Frontend fetches role description & permissions
6. Shows role details in blue box
7. Admin fills other fields and submits
8. Backend creates/updates user with role_id
9. User now inherits all permissions from role

### Checking User Permissions in Middleware
1. User requests `/cms/orders/123`
2. EnsureModulePermission middleware intercepts
3. Extracts 'orders' from path
4. Calls `$user->hasPermission('orders')`
5. User checks role permissions
6. If has 'orders' permission → allow
7. If not → return 403 Forbidden

---

## 🛡️ Security Features

### Protection Mechanisms
- ✅ Passwords hashed using Laravel's default hasher
- ✅ Soft deletes for user audit trail
- ✅ Foreign key constraints on role_id
- ✅ System roles protected from deletion/modification
- ✅ Middleware prevents unauthorized access to CMS
- ✅ Permission checks on both frontend and backend
- ✅ Role-based permission inheritance (not individual user permissions)
- ✅ Inactive users/roles have no permissions

### System Role Protection
```php
// Cannot delete system roles
if ($role->is_system) {
    throw ValidationException::withMessages([
        'role' => ['Cannot delete system role.']
    ]);
}

// Cannot modify status of system roles
if ($role->is_system) {
    throw ValidationException::withMessages([
        'role' => ['Cannot change status of system role.']
    ]);
}
```

---

## 📝 Seeder Data

### RoleSeeder.php
```php
$roles = [
    [
        'name' => 'owner',
        'description' => 'Akses penuh ke semua fitur sistem',
        'permissions' => ['*'],
        'is_active' => true,
        'is_system' => true
    ],
    [
        'name' => 'admin',
        'description' => 'Akses ke semua fitur kecuali management user',
        'permissions' => ['dashboard', 'orders', 'products', ...],
        'is_active' => true,
        'is_system' => true
    ],
    [
        'name' => 'staff',
        'description' => 'Akses ke orders, products, dan customers',
        'permissions' => ['dashboard', 'orders', 'products', ...],
        'is_active' => true,
        'is_system' => true
    ]
];
```

---

## 🔧 Implementation Checklist

- [x] Database migrations (roles table, role_id on users)
- [x] Role model with permission checking
- [x] User model with role relationship
- [x] EnsureModulePermission middleware
- [x] RoleController for CRUD operations
- [x] UserController with role assignment
- [x] RoleSettings.jsx for role management
- [x] UserSettings.jsx for user management
- [x] Route protection on web routes
- [x] API authentication with Sanctum
- [x] Seeder with default roles
- [x] Permission inheritance
- [x] Wildcard permission support
- [x] System role protection

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `app/Models/Role.php` | Role model with permission methods |
| `app/Models/User.php` | User model with role relationship |
| `app/Http/Middleware/EnsureModulePermission.php` | Route protection middleware |
| `app/Http/Controllers/RoleController.php` | Role CRUD operations |
| `app/Http/Controllers/UserController.php` | User management |
| `resources/js/Pages/Settings/RoleSettings.jsx` | Role management UI |
| `resources/js/Pages/Settings/UserSettings.jsx` | User management UI |
| `database/migrations/2025_09_07_000000_create_roles_table.php` | Roles table migration |
| `database/migrations/2025_09_07_000001_alter_users_table_add_role_id.php` | Users table modification |
| `database/seeders/RoleSeeder.php` | Default roles seeder |
| `routes/web.php` | Web routes with RBAC middleware |
| `routes/api.php` | API routes with authentication |

---

## 🎓 Learning Path

1. **Understand the basics:**
   - Read Role model (`hasPermission` method)
   - Read User model (role relationship)
   - Understand permission patterns

2. **Learn the flow:**
   - Study EnsureModulePermission middleware
   - Understand path-to-permission mapping
   - Learn permission checking logic

3. **Explore the UI:**
   - Check RoleSettings.jsx
   - Check UserSettings.jsx
   - Understand role/user management flow

4. **Implement features:**
   - Add new permissions to Role::getAllPermissions()
   - Create new roles via RoleSettings UI
   - Assign roles to users via UserSettings UI
   - Check permissions in components

---

## 🐛 Troubleshooting

### User cannot access route (403 Forbidden)
1. Check if user is active (`is_active = true`)
2. Check if user has role assigned (`role_id` is not null)
3. Check if role is active (`is_active = true`)
4. Check if role has required permission
5. Verify path-to-permission mapping in middleware

### Permission not working in component
1. Verify permission name is correct
2. Check if user has role assigned
3. Check if role has permission
4. Verify permission pattern matching (wildcard)

### Cannot delete role
1. Check if role is system role (`is_system = true`)
2. Check if role has users assigned
3. Remove all users from role first, then delete

---

## 📞 Support

For questions about RBAC implementation:
1. Check this guide first
2. Review the code comments in models/controllers
3. Check the RoleSeeder for default role setup
4. Review the middleware logic for route protection
